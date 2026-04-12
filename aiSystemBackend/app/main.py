from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import re
import time
import difflib

from app.ai.security import scrub_pii, validate_sql
from app.ai.agents import generate_sql_with_plan, generate_explanation
from app.db.database import execute_sql 

app = FastAPI(title="MoneyLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

# --- THE SEMANTIC CACHE ---
QUERY_CACHE = []

def get_cached_query(query: str):
    query_lower = query.lower().strip()
    
    # Strip conversational filler words to compare the "meat" of the question
    fillers = {"what", "is", "my", "the", "which", "had", "did", "i", "show", "me", "tell", "on", "in", "for", "of", "to", "a"}
    q1_words = set(re.findall(r'\w+', query_lower)) - fillers
    
    for item in QUERY_CACHE:
        q2_words = set(re.findall(r'\w+', item["query"])) - fillers
        if not q1_words or not q2_words:
            continue
        # Calculate Keyword Overlap (Jaccard Similarity)
        overlap = len(q1_words.intersection(q2_words)) / len(q1_words.union(q2_words))
        # If 70% of the core keywords match, it's a hit!
        if overlap >= 0.70:
            return item
    return None

def generate_trust_graph_payload(db_result, raw_sql):
    if not db_result or "error" in str(db_result).lower():
         return {"nodes": [], "edges": []}
    nodes, edges = [], []
    sql_upper = raw_sql.upper()
    ai_features_used = []
    if "MERCHANT_CATEGORY" in sql_upper: ai_features_used.append("merchant_category")
    if "IS_RECURRING" in sql_upper: ai_features_used.append("is_recurring")
    if "IS_ONLINE" in sql_upper: ai_features_used.append("is_online")

    row_count = len(db_result)
    data_preview = f"Aggregated {row_count} row(s) from Database.\n\n"
    if row_count == 1:
        for key, value in db_result[0].items(): data_preview += f"• {key}: {value}\n"
    elif row_count > 1:
        data_preview += "Top results extracted:\n"
        for i, row in enumerate(db_result[:2]):
            data_preview += f"{i+1}. {list(row.keys())[0]}: {list(row.values())[0]}\n"
            
    trust = 100
    if ai_features_used: trust -= (len(ai_features_used) * 3) 
    if "LIKE" in sql_upper: trust -= 2 

    nodes.append({"id": "source-db", "position": { "x": 50, "y": 50 }, "type": "sourceNode", "data": { "label": "Local SQLite: transactions", "score": 100 if not ai_features_used else 70, "details": "Query executed successfully." }})
    if ai_features_used: nodes.append({"id": "source-ai", "position": { "x": 50, "y": 180 }, "type": "sourceNode", "data": { "label": "AI Enrichment Layer", "score": 30, "details": f"Probabilistic columns used:\n{', '.join(ai_features_used)}"}})
    nodes.append({"id": "final-answer", "position": { "x": 400, "y": 115 if ai_features_used else 50 }, "type": "finalNode", "data": { "label": "Analyzed Insight", "trustScore": trust, "details": data_preview }})
    
    edges.append({ "id": "e1", "source": "source-db", "target": "final-answer", "animated": True, "style": { "stroke": "#a855f7", "strokeWidth": 2 } })
    if ai_features_used: edges.append({ "id": "e2", "source": "source-ai", "target": "final-answer", "animated": True, "style": { "stroke": "#a855f7", "strokeWidth": 2 } })

    return { "nodes": nodes, "edges": edges }

def process_user_query(user_question: str):
    start_time = time.time()
    print(f"\n==================================================")
    print(f"🗣️ User Asked: {user_question}")
    safe_query = scrub_pii(user_question)
    
    # --- FIX 1: SEMANTIC CACHING ---
    cached = get_cached_query(safe_query)
    if cached:
        print("⚡ CACHE HIT! Skipped Gemini generation (0.1s plan).")
        plan_and_sql = cached["data"]
    else:
        print("🧠 CACHE MISS. Generating new SQL via Gemini...")
        plan_and_sql = generate_sql_with_plan(safe_query)
        if plan_and_sql.get("requires_data", True) and plan_and_sql.get("sql_query"):
            QUERY_CACHE.append({"query": safe_query.lower().strip(), "data": plan_and_sql})
    
    if not plan_and_sql.get("requires_data", True):
        return {
            "question": user_question,
            "level_1_simple_answer": plan_and_sql.get("direct_answer", "Hello! I am MoneyLens. How can I help you analyze your finances today?"),
            "level_2_sql_query": None,
            "level_3_raw_data": None,
            "execution_plan": None,
            "trustGraph": None
        }
    
    raw_sql = plan_and_sql.get("sql_query", "")
    execution_plan = {"analytical_goal": plan_and_sql.get("analytical_goal", ""), "logical_steps": plan_and_sql.get("logical_steps", [])}
    
    if not validate_sql(raw_sql):
        return {
            "level_1_simple_answer": "Security check blocked this query.",
            "level_2_sql_query": raw_sql,
            "level_3_raw_data": None,
            "execution_plan": execution_plan,
            "trustGraph": None
        }
    
    print("⚙️ Execution Engine running SQL...")
    db_result = execute_sql(raw_sql)
    graph_payload = generate_trust_graph_payload(db_result, raw_sql)

    # We must still generate an explanation because the data might have changed 
    # even if the SQL query was cached!
    print("🗣️ Final Explainer is generating insights...")
    final_answer = generate_explanation(safe_query, db_result)
        
    print(f"🚀 TOTAL LATENCY: {round(time.time() - start_time, 2)} seconds")
    print(f"==================================================")
    
    return {
        "question": user_question,
        "level_1_simple_answer": final_answer,
        "level_2_sql_query": raw_sql.strip(),
        "level_3_raw_data": db_result,
        "execution_plan": execution_plan,
        "trustGraph": graph_payload
    }

@app.post("/api/chat")
def chat_endpoint(request: ChatRequest):
    try:
        return process_user_query(request.message)
    except Exception as e:
        print(f"❌ Error processing query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("🚀 Starting MoneyLens API Server (with Cache)...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)