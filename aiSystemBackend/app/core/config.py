import os
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / '.env')

# Initialize OpenRouter Client
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
llm_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

# Use the proven, massive 120B model for both planning and reasoning!
FAST_MODEL = "openai/gpt-oss-120b:free"
REASONING_MODEL = "openai/gpt-oss-120b:free"


def call_llm(prompt: str, model: str = FAST_MODEL) -> str:
    response = llm_client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a precise and strict AI assistant."},
            {"role": "user", "content": prompt}
        ],
        temperature=0
    )
    return response.choices[0].message.content

# import os
# import google.generativeai as genai
# from dotenv import load_dotenv
# from pathlib import Path

# # Load environment variables
# BASE_DIR = Path(__file__).resolve().parent.parent.parent
# load_dotenv(BASE_DIR / '.env')

# # Initialize Google Gemini
# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# if GEMINI_API_KEY:
#     genai.configure(api_key=GEMINI_API_KEY)
# else:
#     print("⚠️ WARNING: GEMINI_API_KEY not found in .env")

# # We use Gemini 2.5 Flash for the entire pipeline. 
# # Because our architecture/prompts are so strong, it will perform like a massive model!
# llm_model = genai.GenerativeModel('gemini-2.5-flash')