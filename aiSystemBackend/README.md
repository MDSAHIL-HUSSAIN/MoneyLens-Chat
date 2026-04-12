# 🧠 MoneyLens — AI System Backend

The core intelligence engine of MoneyLens. A Python FastAPI server that receives natural language questions, converts them to validated SQL using Google Gemini, executes them against a SQLite transaction database, and returns explainable, multi-level answers with a trust score.

---

## 📌 What This Module Does

- Accepts natural language queries from the Dashboard and WhatsApp Bot via `POST /api/chat`.
- Uses Google Gemini (`agents.py`) with schema-aware prompts (`prompts.py`) to generate SQL.
- Validates every generated SQL query through a security layer (`security.py`) before execution.
- Executes validated queries on `finance.db` (SQLite) via `database.py`.
- Returns structured 3-level responses: plain answer, SQL query, raw data rows, execution plan, and trust graph.
- Ingests credit card CSV files via `data_pipeline.py`, categorises transactions using AI, and detects recurring charges.

---

## 🗂️ Folder Structure

```
aiSystemBackend/
├── app/
│   ├── ai/
│   │   ├── agents.py           # Core AI agent — NL → SQL + semantic cache
│   │   ├── prompts.py          # Schema-aware system prompts + semantic word maps
│   │   └── security.py         # SQL allowlist validator + PII filter
│   ├── core/
│   │   └── config.py           # Environment variable loading
│   ├── db/
│   │   └── database.py         # SQLite connection and query execution
│   ├── services/
│   │   └── query_service.py    # Full pipeline orchestration + trust score builder
│   ├── __init__.py
│   └── main.py                 # FastAPI app entry point, routes, CORS
├── data/
│   ├── raw/                    # Place your CSV files here before running pipeline
│   └── finance.db              # Auto-generated SQLite database (do not commit)
├── scripts/                    # Helper and utility scripts
├── data_pipeline.py            # CSV ingestion, AI enrichment, SQLite loader
├── .env.example
├── requirements.txt
├── runtime.txt                 # Python version for Render.com
└── render.yaml                 # Render.com deployment configuration
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3.10+ |
| Framework | FastAPI |
| Database | SQLite (`finance.db`) |
| AI / LLM | Google Gemini (via `GEMINI_API_KEY`) |
| DB Access | Python `sqlite3` module |
| Deployment | Render.com (`render.yaml`) |

---

## 🧾 Prerequisites

Ensure you have:

- Python **3.10 or higher**
- `pip` (comes with Python)
- `git`
- A **Google Gemini API Key** — get one free at [https://aistudio.google.com](https://aistudio.google.com)

---

## ⚙️ Install & Run

### Step 1 — Clone the Repository

**Mac / Linux:**
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO/aiSystemBackend
```

**Windows (Command Prompt or PowerShell):**
```cmd
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO\aiSystemBackend
```

---

### Step 2 — Create a Virtual Environment

**Mac / Linux:**
```bash
python -m venv venv
source venv/bin/activate
```

**Windows:**
```cmd
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` appear at the start of your terminal prompt.

---

### Step 3 — Install Dependencies

**Mac / Windows (same command):**
```bash
pip install -r requirements.txt
```

---

### Step 4 — Configure Environment Variables

**Mac / Linux:**
```bash
cp .env.example .env
```

**Windows:**
```cmd
copy .env.example .env
```

Open `.env` in any text editor and fill in:

```properties
GEMINI_API_KEY=your_google_gemini_api_key
```

> This key is required for SQL generation, insight explanation, and AI enrichment in the data pipeline.

---

### Step 5 — Set Up the Database

The backend requires a populated SQLite database. This is a two-step process.

**Step 5.1 — Add your CSV files**

Place your credit card transaction CSV files inside:
```
aiSystemBackend/data/raw/
```

**Step 5.2 — Run the data pipeline**

```bash
python data_pipeline.py
```

**What this does:**
- Reads all CSV files from `data/raw/`
- Cleans and normalises transaction data
- Generates `billing_cycle_month` and `billing_cycle_year` fields
- Uses Google Gemini AI to enrich each transaction with:
  - `merchant_category`
  - `is_recurring` (subscription detection)
  - `is_online`
- Prevents duplicate uploads using file hashing
- Stores all results in `data/finance.db`

---

### Step 6 — Start the Backend Server

```bash
uvicorn app.main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

API is live at: `http://localhost:8000`

---

### Step 7 — Test the API

**Mac / Linux:**
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How much did I spend last month?"}'
```

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri http://localhost:8000/api/chat `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"message": "How much did I spend last month?"}'
```

**Expected response:**
```json
{
  "question": "How much did I spend last month?",
  "level_1_simple_answer": "You spent ₹18,750 in March 2025.",
  "level_2_sql_query": "SELECT SUM(amount) FROM transactions WHERE strftime('%Y-%m', date) = '2025-03'",
  "level_3_raw_data": [{ "SUM(amount)": 18750 }],
  "execution_plan": { "steps": ["parse intent", "generate SQL", "validate", "execute"] },
  "trustGraph": { "confidence": 94, "reasoning": "Direct aggregate on filtered date range" }
}
```

**Health check:**
```bash
curl http://localhost:8000/health
# Expected: { "status": "ok" }
```

---

## 🔐 Security Notes

- `security.py` validates every AI-generated SQL before execution. Only `SELECT` statements on the `transactions` table are permitted; all destructive operations (`DROP`, `INSERT`, `UPDATE`, `DELETE`) are blocked.
- PII (card numbers, names, contact details) is stripped from query context before being sent to Gemini.
- No API keys or secrets are hardcoded. All config is loaded via environment variables in `config.py`.
- Do not commit `data/finance.db` or any CSV files — both are listed in `.gitignore`.

---

## 🛠️ Common Issues

| Problem | Fix |
|---|---|
| `python` not found | Use `python3` instead, or install Python from https://python.org |
| `pip` not found | Run `python -m pip install -r requirements.txt` |
| `GEMINI_API_KEY` error | Check your `.env` file exists and has the correct key |
| `finance.db` not found | You must run `python data_pipeline.py` before starting the server |
| Port 8000 in use | Add `--port 8001` to the uvicorn command |
| Virtual env not activating (Windows) | Run `Set-ExecutionPolicy RemoteSigned` in PowerShell first |

---

## ⚠️ Limitations

- SQLite is used for simplicity and portability; not suitable for concurrent write-heavy production loads.
- The AI query engine handles single-table queries only; multi-table joins are not yet supported.
- CSV ingestion is tested against HDFC and ICICI statement formats; other banks may require column mapping adjustments.
- `finance.db` is a local file — it resets on Render.com redeployment unless a persistent disk is attached.
- Google Gemini free tier has rate limits; high-volume usage may require a paid plan.