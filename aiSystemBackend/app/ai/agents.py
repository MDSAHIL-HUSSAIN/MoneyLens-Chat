import json
import time
import re
from app.core.config import call_llm, FAST_MODEL, REASONING_MODEL
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

def generate_query_plan(safe_query: str) -> dict:
    prompt = f"""
    You are a Master Data Architect and Financial Assistant. 
    Analyze this user query: "{safe_query}"
    
    INTENT ROUTING RULE:
    - If the user is just saying hello, asking who you are, or making small talk, you DO NOT need data. Set "requires_data" to false and provide a friendly "direct_answer".
    - If the user is asking about spending, transactions, or finances, you DO need data. Set "requires_data" to true.
    
    Database Schema: {DB_SCHEMA}
    Semantic Rules: {SEMANTIC_DICTIONARY}
    
    Return ONLY a JSON dictionary with these exact keys. Do not add any conversational text outside the JSON.
    {{
        "requires_data": true,
        "direct_answer": "If requires_data is false, put your friendly response here (e.g., 'Hello! I am MoneyLens, your AI financial assistant...'). Otherwise leave empty.",
        "analytical_goal": "A short string describing the objective (if data is needed)",
        "logical_steps": ["Step 1...", "Step 2..."]
    }}
    """
    for attempt in range(3):
        try:
            response_text = call_llm(prompt, FAST_MODEL)
            return extract_json_from_text(response_text)
        except Exception as e:
            print(f"   ⚠️ [Planner API Error Attempt {attempt+1}]: {e}")
            time.sleep(4) 
                
    return {"requires_data": True, "analytical_goal": "Fallback execution", "logical_steps": ["Analyze the query and write direct SQL"]}

def generate_sql(safe_query: str, plan: dict) -> str:
    prompt = f"""
    You are an expert SQL Developer for SQLite. 
    User Question: "{safe_query}"
    Schema: {DB_SCHEMA}
    Semantic Rules: {SEMANTIC_DICTIONARY}
    
    EXECUTION PLAN TO FOLLOW:
    Goal: {plan.get('analytical_goal')}
    Steps: {json.dumps(plan.get('logical_steps'))}
    
    Rules:
    1. Output ONLY the raw SQL query string. No markdown (```sql).
    2. CRITICAL: You MUST follow the Execution Plan exactly.
    3. Always include the `currency` column in your SELECT statement if aggregating amounts.
    4. Use LIMIT 10 if returning raw transaction rows.
    5. CRITICAL: If you calculate a SUM, MIN, or MAX, you MUST include it in the SELECT clause.
    6. CRITICAL RULE: Output EXACTLY ONE single executable SQL statement. You must NOT output multiple queries separated by semicolons. If you need multiple steps, use CTEs (WITH clause), but they MUST culminate in ONE final SELECT statement.
    """
    for attempt in range(3):
        try:
            response_text = call_llm(prompt, REASONING_MODEL)
            
            cleaned = response_text.replace('```sql', '').replace('```', '').strip()
            
            # Look for SELECT/WITH and grab everything up to the very last semicolon
            sql_match = re.search(r'(?i)(SELECT|WITH)[\s\S]*;', cleaned)
            
            if sql_match:
                return sql_match.group(0).strip()
            
            # Fallback just in case the AI forgot a semicolon
            fallback_match = re.search(r'(?i)(SELECT|WITH)[\s\S]*', cleaned)
            if fallback_match:
                return fallback_match.group(0).strip()
            
            return cleaned
        except Exception as e:
            print(f"   ⚠️ [SQL Generator API Error Attempt {attempt+1}]: {e}")
            time.sleep(4)
    return ""

def generate_explanation(user_question: str, db_result: list) -> str:
    if not db_result or "error" in str(db_result).lower():
        return "I couldn't find any data for that request."
        
    prompt = f"""
    You are an empathetic Financial AI Assistant.
    Question: "{user_question}"
    Database Result: {db_result}
    
    RULES:
    1. Provide a clear, simple, 1-2 sentence explanation. 
    2. CRITICAL: You MUST explicitly include the actual numeric values from the Database Result in your answer. Do not just say "You spent the most", say "You spent X amount".
    3. Look at the database result to determine the correct currency symbol (e.g., if you see 'INR', use ₹. If 'USD', use $).
    4. Remove all technical jargon. Act like a helpful human advisor.
    5. Do not mention SQL or how the data was retrieved.
    """
    for attempt in range(3):
        try:
            response_text = call_llm(prompt, FAST_MODEL)
            return response_text.strip()
        except Exception as e:
            print(f"   ⚠️ [Explainer API Error Attempt {attempt+1}]: {e}")
            time.sleep(4)
    return "Data retrieved successfully, but I encountered an error explaining it."