import json
import time
import re
from app.core.config import call_llm
from app.ai.prompts import DB_SCHEMA, SEMANTIC_DICTIONARY 

def extract_json_from_text(text: str) -> dict:
    try:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(text)
    except Exception as e:
        print(f"   [JSON Parser Error]: Could not extract JSON. Raw text: {text[:50]}...")
        raise e

def generate_sql_with_plan(safe_query: str) -> dict:
    prompt = f"""
    You are a Master Data Architect, Financial Assistant, and SQLite Expert.
    Analyze this user query: "{safe_query}"
    
    INTENT ROUTING RULE (CRITICAL):
    - Set "requires_data": false ONLY IF the user is making pure small talk (e.g., "Hi", "Who are you?").
    - Set "requires_data": true IF the user asks ANY question about their finances, spending, habits, interest, or saving money.
    
    Database Schema: {DB_SCHEMA}
    Semantic Rules: {SEMANTIC_DICTIONARY}
    
    CRITICAL SQL RULES (If requires_data is true):
    1. Always include the `currency` column in your SELECT statement if aggregating amounts.
    2. Use LIMIT 10 if returning raw transaction rows.
    3. If you calculate a SUM, MIN, or MAX, you MUST include it in the SELECT clause.
    4. Output EXACTLY ONE single executable SQL statement. Use CTEs (WITH clause) if you need multiple steps.
    5. DO NOT use SQL comments (-- or /* */) inside the query.
    
    Return ONLY a highly-valid JSON dictionary with these exact keys. Escape newlines in the SQL with \\n.
    {{
        "requires_data": true,
        "direct_answer": "If requires_data is false, put friendly response here. Otherwise empty string.",
        "analytical_goal": "Short string describing the objective",
        "logical_steps": ["Step 1...", "Step 2..."],
        "sql_query": "SELECT ... FROM ... "
    }}
    """
    for attempt in range(3):
        try:
            response_text = call_llm(prompt)
            return extract_json_from_text(response_text)
        except Exception as e:
            time.sleep(1) 
    return {"requires_data": True, "analytical_goal": "Fallback execution", "logical_steps": [], "sql_query": ""}

def generate_explanation(user_question: str, db_result: list) -> str:
    """Standard block response explanation."""
    if not db_result or "error" in str(db_result).lower():
        return "I couldn't find any data for that request."
        
    prompt = f"""
    You are an empathetic Financial AI Assistant.
    Question: "{user_question}"
    Database Result: {db_result}
    
    RULES:
    1. Provide a clear, simple, 1-2 sentence explanation. 
    2. CRITICAL: explicitly include the actual numeric values from the Database Result in your answer.
    3. Determine the correct currency symbol from the data.
    4. Remove technical jargon. Do not mention SQL.
    """
    for attempt in range(3):
        try:
            response_text = call_llm(prompt)
            return response_text.strip()
        except Exception as e:
            time.sleep(1)
    return "Data retrieved successfully, but I encountered an error explaining it."