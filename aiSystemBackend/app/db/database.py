import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE_DIR / "data" / "finance.db"

def execute_sql(sql_query: str):
    """Safely runs SQL against the SQLite database and returns dictionary results."""
    try:
        if not DB_PATH.exists():
            return {"error": "Database file not found."}
            
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row 
        cursor = conn.cursor()
        cursor.execute(sql_query)
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        return {"error": str(e)}