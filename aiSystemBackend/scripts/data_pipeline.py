import pandas as pd
import sqlite3
import json
import os
import time
import hashlib # <-- NEW: For generating file fingerprints
from pathlib import Path
import google.generativeai as genai
from dotenv import load_dotenv

# --- Setup ---
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
DB_PATH = DATA_DIR / "finance.db"

load_dotenv(BASE_DIR / '.env')
API_KEY = os.getenv("GEMINI_API_KEY")

if API_KEY:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')

def table_exists(conn, table_name):
    cursor = conn.cursor()
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}'")
    return cursor.fetchone() is not None

# ✅ NEW: Helper function to generate a unique fingerprint based on FILE CONTENTS
def calculate_file_hash(filepath: Path):
    """Calculates the MD5 hash of a file's contents."""
    hasher = hashlib.md5()
    with open(filepath, 'rb') as f:
        hasher.update(f.read())
    return hasher.hexdigest()

def ask_ai_to_categorize(merchants_list):
    prompt = f"""
    You are a financial AI assistant. For each merchant name/description, determine:
    1. category (e.g., Food & Dining, Shopping, Entertainment, Travel, Income, Utilities, etc.)
    2. is_recurring (True/False)
    3. is_online (True/False)
    
    You MUST return ONLY a single JSON DICTIONARY (not a list). 
    The keys MUST be the exact merchant strings provided.

    EXAMPLE FORMAT:
    {{
        "Netflix (Netflix monthly subscription)": {{"category": "Entertainment", "is_recurring": true, "is_online": true}}
    }}

    Merchants to analyze: 
    {json.dumps(merchants_list)}
    """

    if not API_KEY: return {m: {"category": "Mock", "is_recurring": False, "is_online": True} for m in merchants_list}

    print(f"🤖 Asking AI to analyze {len(merchants_list)} unique merchants...")

    for attempt in range(3):
        try:
            response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            result = json.loads(response.text)
            if not isinstance(result, dict): return {}
            return result
        except Exception as e:
            if "429" in str(e):
                print(f"⏳ Rate limit hit. Waiting 40 seconds... (Attempt {attempt+1})")
                time.sleep(40)
            else: return {}
    return {}

def process_file(csv_path: Path, conn, file_hash: str):
    print(f"\n📄 Processing file: {csv_path.name} (Hash: {file_hash[:8]}...)")

    df_raw = pd.read_csv(csv_path)
    df_raw['transaction_date'] = pd.to_datetime(df_raw['transaction_date'], errors='coerce')
    df_raw['posting_date'] = pd.to_datetime(df_raw['posting_date'], errors='coerce')

    df_enriched = df_raw.copy()

    # ✅ FIXED: Now using the secure content hash as the source_file_id
    df_enriched['user_id'] = 'USER_001'
    df_enriched['source_file_id'] = file_hash 
    df_enriched['billing_cycle_month'] = df_enriched['transaction_date'].dt.month_name()
    df_enriched['billing_cycle_year'] = df_enriched['transaction_date'].dt.year

    unique_txns = df_enriched[['merchant_name', 'description']].drop_duplicates()
    merchants_to_analyze = [f"{row['merchant_name']} ({row['description']})" for _, row in unique_txns.iterrows()]

    ai_mapping = ask_ai_to_categorize(merchants_to_analyze)
    if not isinstance(ai_mapping, dict): ai_mapping = {}

    def apply_ai_mapping(row):
        key = f"{row['merchant_name']} ({row['description']})"
        ai_data = ai_mapping.get(key, {"category": "Other", "is_recurring": False, "is_online": True})
        return pd.Series([ai_data.get('category', 'Other'), ai_data.get('is_recurring', False), ai_data.get('is_online', True)])

    df_enriched[['merchant_category', 'is_recurring', 'is_online']] = df_enriched.apply(apply_ai_mapping, axis=1)

    df_enriched['transaction_date'] = df_enriched['transaction_date'].dt.strftime('%Y-%m-%d')
    df_enriched['posting_date'] = df_enriched['posting_date'].dt.strftime('%Y-%m-%d')
    df_raw['transaction_date'] = df_raw['transaction_date'].dt.strftime('%Y-%m-%d')
    df_raw['posting_date'] = df_raw['posting_date'].dt.strftime('%Y-%m-%d')

    # Also save the hash in the raw table so everything is linked securely!
    df_raw['source_file_id'] = file_hash 

    df_raw.to_sql('transactions_raw', conn, if_exists='append', index=False)
    df_enriched.to_sql('transactions', conn, if_exists='append', index=False)
    print(f"✅ Finished {csv_path.name}")


def main():
    csv_files = list(RAW_DIR.glob('*.csv'))
    if not csv_files: return print("No CSV files found!")

    conn = sqlite3.connect(DB_PATH)
    processed_files = []

    try:
        if table_exists(conn, "transactions"):
            df_processed = pd.read_sql("SELECT DISTINCT source_file_id FROM transactions", conn)
            processed_files = df_processed['source_file_id'].tolist()
    except Exception as e: print("⚠️ Skipping processed file check:", e)

    files_processed_count = 0

    for file in csv_files:
        # ✅ NEW: Calculate the fingerprint first!
        file_hash = calculate_file_hash(file)
        
        # Check if the fingerprint is already in the database
        if file_hash in processed_files:
            print(f"⏭️ Skipping {file.name} (File content already in database)")
            continue

        process_file(file, conn, file_hash)
        files_processed_count += 1
        time.sleep(2)

    conn.close()

    if files_processed_count == 0: print("\n✅ Already up to date")
    else: print(f"\n🎉 Added {files_processed_count} new file(s) to the database")

if __name__ == "__main__":
    main()