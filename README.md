# 💳 MoneyLens — AI-Powered Credit Card Intelligence Assistant

> Ask questions about your money in plain English. Get answers you can trust.

---

## 📌 Overview

MoneyLens is an AI-powered financial assistant that lets users ask natural language questions about their credit card transactions and receive accurate, explainable insights — without needing SQL knowledge or Excel skills.

Users upload their bank statement CSV, then chat with their data via a web dashboard or WhatsApp. MoneyLens converts every question into a validated SQL query, runs it against a local SQLite database, and returns a transparent answer with the SQL used, raw data rows, and a confidence score. WhatsApp integration (Meta Business API) brings the same intelligence to a platform users already use daily.

**Intended users:** Any credit card holder who wants to understand their spending, track merchants, or get proactive reminders — without switching to a complex financial app.

---

## ❗ Problem Statement

People generate significant credit card transaction data every month but face real barriers:

- **Data is hard to understand** — statements arrive as CSV or PDF with no insight layer.
- **No natural language interface** — answering *"How much did I spend on food this month?"* requires SQL or manual Excel analysis.
- **No conversational access** — users cannot simply chat with their financial data.
- **Financial tools are fragmented** — they exist as separate apps, away from platforms users already use daily like WhatsApp.
- **No proactive reminders** — users forget credit card due dates and recurring subscription charges.

**Final problem statement:** Users need a system that allows them to ask natural language questions about their credit card transactions and get accurate, fast, and trustworthy insights — without technical knowledge — on platforms they already use.

---

## ✅ Features

- **Natural Language Query Engine** — Ask questions like *"Which merchant charged me the most?"* and get direct answers.
- **AI → SQL Conversion** — Questions are converted to safe SQL using Google Gemini with schema-aware prompting and semantic word mapping (e.g., "spending" → debit transactions, "total" → `SUM(amount)`).
- **SQL Security Layer** — Only `SELECT` queries on the allowed schema are permitted; all destructive operations are blocked (`security.py`).
- **Trust Graph + Confidence Score** — Every answer includes the SQL query, raw data rows, execution plan, and a visual trust score (`TrustGraph.jsx`).
- **Semantic Cache** — Similar queries are matched and reused without a new AI call, reducing latency and cost.
- **Credit Card Data Pipeline** — CSV files are cleaned, normalised, AI-enriched (category, recurring detection), and loaded into SQLite via `data_pipeline.py`.
- **Chat-Based Dashboard** — Web interface with persistent chat history, sidebar navigation, and detailed answer cards (`ChatMessage.jsx`, `Sidebar.jsx`, `Dashboard.jsx`).
- **WhatsApp Integration** — Users send questions via WhatsApp (Meta Business API) and receive short, instant answers. Conversations are stored in PostgreSQL via Prisma.
- **Google Calendar Integration** — Automatically creates reminders for credit card due dates and detected subscription renewals.
- **PII Protection** — Sensitive data is stripped before reaching the AI model (`security.py`).

---

## 🗂️ Project Structure

```
MoneyLens-Chat/
├── aiSystemBackend/              # Python + FastAPI + Gemini + SQLite
│   ├── app/
│   │   ├── ai/                   # agents.py, prompts.py, security.py
│   │   ├── core/                 # config.py
│   │   ├── db/                   # database.py
│   │   └── services/             # query_service.py
│   ├── data/
│   │   ├── raw/                  # Uploaded CSVs (gitignored)
│   │   └── finance.db            # SQLite database (gitignored)
│   ├── scripts/
│   ├── data_pipeline.py          # CSV → SQLite ingestion script
│   ├── requirements.txt
│   ├── runtime.txt
│   └── render.yaml
│
├── frontEnd/                     # React + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── components/           # ChatCards, ChatMessage, Sidebar, TrustGraph etc.
│   │   └── pages/                # Dashboard.jsx
│   ├── package.json
│   └── vite.config.ts
│
├── whatsapp_bot/                 # Node.js + TypeScript + Meta API + PostgreSQL
│   ├── src/
│   │   ├── lib/                  # prisma.ts
│   │   ├── routes/               # whatsapp.routes.ts
│   │   └── services/             # ai.service.ts, whatsapp.service.ts
│   ├── prisma/
│   ├── config.ts
│   ├── index.ts
│   └── package.json
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🏗️ System Architecture

```
User Input (Dashboard / WhatsApp)
         │
         ▼
  PII Filter  ──────────────────── security.py
         │
         ▼
  Semantic Cache Check ──► Hit → Return cached answer
         │ Miss
         ▼
  Google Gemini AI  ─────────────── agents.py + prompts.py
  Converts NL question → SQL
         │
         ▼
  SQL Security Validator  ──────── security.py
  Only SELECT allowed
         │
         ▼
  SQLite Execution  ─────────────── database.py / finance.db
         │
         ▼
  Query Service  ────────────────── query_service.py
  Builds trust graph + explanation + confidence score
         │
         ▼
  Response
  ├── Dashboard → Full detail  (SQL + rows + execution_plan + trustGraph)
  └── WhatsApp  → Short answer  (whatsapp.service.ts → Meta API)
```

**Why Google Gemini for NL → SQL:** Keyword-based matching fails on varied phrasing. Gemini generalises across synonyms and sentence structures, providing accurate SQL generation without users needing technical knowledge. The semantic cache avoids redundant Gemini calls and reduces response latency.

---

## 📦 Module READMEs

Each module has its own detailed setup guide:

| Module | README | Stack |
|---|---|---|
| AI Backend | [`aiSystemBackend/README.md`](./aiSystemBackend/README.md) | Python, FastAPI, SQLite, Google Gemini |
| Dashboard | [`frontEnd/README.md`](./frontEnd/README.md) | React, TypeScript, Vite, Tailwind CSS |
| WhatsApp Bot | [`whatsapp_bot/README.md`](./whatsapp_bot/README.md) | Node.js, TypeScript, Prisma, PostgreSQL, Meta API |

---

## 🚀 Quickstart — Run All Three Together

**Terminal 1 — AI Backend:**
```bash
cd aiSystemBackend
python -m venv venv
# Mac/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

pip install -r requirements.txt
# Add GEMINI_API_KEY to .env, place CSV in data/raw/, then:
python data_pipeline.py
uvicorn app.main:app --reload
# API: http://localhost:8000
```

**Terminal 2 — Frontend Dashboard:**
```bash
cd frontEnd
npm install
npm run dev
# Dashboard: http://localhost:5173
```

**Terminal 3 — WhatsApp Bot:**
```bash
cd whatsapp_bot
npm install
cp .env.example .env    # Fill in Meta + PostgreSQL + AI_API_URL
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
# Bot: http://localhost:3001
```

---

## 🧪 Usage Examples

### Dashboard — Natural Language Query

Type a question in the chat interface:

```
You:        How much did I spend on food last month?

MoneyLens:  ₹4,280 on food in March 2025
            SQL:    SELECT SUM(amount) FROM transactions
                    WHERE category = 'Food'
                    AND strftime('%Y-%m', date) = '2025-03'
            Source: 12 transactions matched
            Trust:  94% confidence
```

### WhatsApp — Quick Query

Send a message to the connected WhatsApp number:

```
You:        Which merchant charged me the most this month?
MoneyLens:  Swiggy — ₹3,150 across 14 orders in April.
```

### API — Direct Query

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How much did I spend last month?"}'
```

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

---

## ⚠️ Limitations

- Google Gemini API requires a valid key from Google AI Studio; free tier has rate limits.
- Meta WhatsApp Business API requires an approved Meta Developer app; not available instantly.
- `finance.db` is a local SQLite file — it resets on redeployment unless a persistent disk is attached on Render.
- CSV ingestion is tested against HDFC and ICICI statement formats; other banks may need column mapping.
- The AI query engine handles single-table queries; complex multi-table joins are not yet supported.
- Semantic cache is in-memory and resets on server restart.
- The WhatsApp bot does not support CSV uploads; statement ingestion must be done via the dashboard.

---

## 🚀 Future Improvements

- Multi-bank CSV auto-detection (SBI, Axis, Kotak, Yes Bank).
- Redis-backed persistent semantic cache surviving server restarts.
- Budget alerts — notify when spending in a category exceeds a user-set threshold.
- Monthly trend reports and projected end-of-month spend forecasting.
- Voice message support on WhatsApp (speech-to-text → query pipeline).
- Multi-card management under one account.
- UPI and debit transaction ingestion support.

---

## 🔐 Security & Compliance

- All API keys and credentials are loaded via environment variables. See `.env.example` in each module.
- No real credentials are committed to the repository.
- SQL validator (`security.py`) enforces a strict allowlist — only `SELECT` on permitted tables is executed.
- PII is stripped before data reaches the LLM.

---

## 📄 License

Apache License 2.0 — see [`LICENSE`](./LICENSE).

All commits signed off per DCO:
```bash
git commit -s -m "your commit message"
```

*Built for NatWest Group — Code for Purpose India Hackathon.*