import sqlite3
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "finance.db"

conn = sqlite3.connect(DB_PATH)

print("\n✅ --- ENRICHED TABLE SCHEMA (All your columns) ---")
# PRAGMA table_info is the SQLite command to show the table structure
schema_df = pd.read_sql("PRAGMA table_info(transactions);", conn)
print(schema_df[['name']].to_string(index=False))

print("\n✨ --- ONE FULL ROW (Showing all data combined) ---")
# SELECT * gets everything
full_row_df = pd.read_sql("SELECT * FROM transactions LIMIT 1", conn)
# We transpose (.T) it so it prints vertically, making it easy to read
print(full_row_df.T.to_string(header=False))

conn.close()