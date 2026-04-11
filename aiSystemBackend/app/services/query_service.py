
import time
from app.ai.security import scrub_pii, validate_sql
from app.ai.agents import generate_query_plan, generate_sql, generate_explanation
from app.db.database import execute_sql

def process_user_query(user_question: str):
    """The Master Orchestrator (The 5-Layer Pipeline)"""
    print(f"\n==================================================")
    print(f"🗣️ User Asked: {user_question}")
    print(f"==================================================")
    
    safe_query = scrub_pii(user_question)
    
    print("🧠 Query Planner (Gemini 2.5 Flash) is mapping the logic...")
    plan = generate_query_plan(safe_query)
    print(f"   📋 Goal: {plan.get('analytical_goal')}")
    
    print("👨‍💻 SQL Generator (Gemini 2.5 Flash) is writing dynamic code...")
    raw_sql = generate_sql(safe_query, plan)
    
    if not validate_sql(raw_sql):
        return {
            "level_1_simple_answer": "Security check blocked this query or the AI servers are currently busy.", 
            "level_2_sql_query": raw_sql, 
            "level_3_raw_data": None,
            "execution_plan": plan 
        }
    
    print("⚙️ Execution Engine running SQL...")
    db_result = execute_sql(raw_sql)
    
    print("🗣️ Final Explainer (Gemini 2.5 Flash) is generating insights...")
    final_answer = generate_explanation(safe_query, db_result)
    
    return {
        "question": user_question,
        "level_1_simple_answer": final_answer,
        "level_2_sql_query": raw_sql.strip(),
        "level_3_raw_data": db_result,
        "execution_plan": plan
    }

# --- ADVANCED STRESS TEST SUITE ---
if __name__ == "__main__":
    print("\n🚀 Starting Enterprise Stress Test...")
    
    complex_queries = [
        # 1. Driver Analysis (Requires subqueries or conditional aggregation)
        "Why did my spending change between January and February? Which specific category caused the biggest increase?",
        
        # 2. Simulation / Actionable Insight (Requires filtering by boolean flags)
        "If I cancel all my recurring online subscriptions, exactly how much money will I save?",
        
        # 3. Anomaly Detection / Averages
        "What is my average transaction amount, and did I have any single transaction that was unusually high?",
        
        # 4. Compound Grouping
        "Show me a breakdown of my online spending versus in-person offline spending."
    ]
    
    for q in complex_queries:
        result = process_user_query(q)
        print(f"\n🤖 Answer: {result['level_1_simple_answer']}")
        print(f"🔍 SQL Generated:\n{result['level_2_sql_query']}")
        
        print("\n⏳ Pausing for 5 seconds to respect Gemini API rate limits...\n")
        time.sleep(5)