import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / '.env')

# Initialize Google Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("⚠️ WARNING: GEMINI_API_KEY not found in .env")

# Reusable LLM caller using Gemini Flash for blazing fast speeds!
def call_llm(prompt: str) -> str:
    # You can use 'gemini-1.5-flash' or 'gemini-2.5-flash' depending on what is available in your region
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.0, # Keep it strict for SQL generation
        )
    )
    return response.text