# 📱 MoneyLens — WhatsApp Bot

The WhatsApp integration for MoneyLens. Built with Node.js + TypeScript + Prisma + PostgreSQL + Meta Business API. Users send natural language questions about their credit card transactions directly on WhatsApp and receive instant, accurate answers powered by the MoneyLens AI backend.

---

## 📌 What This Module Does

- Receives incoming WhatsApp messages via the Meta Business API webhook (`POST /webhook`).
- Forwards user questions to the MoneyLens AI backend (`/api/chat`) via HTTP.
- Returns the plain English (Level 1) insight back to the user on WhatsApp.
- Stores all conversation messages in PostgreSQL via Prisma for history and audit.
- Sends outgoing replies via the WhatsApp Platform (Meta Cloud API).

---

## 🏗️ Architecture

### WhatsApp Bot Architecture

![WhatsApp Bot Architecture](../utility/whatsappBotArchitrecture.png)

### WhatsApp Features — Live Demo

![WhatsApp Features Demo](../utility/whatsapp%20features%20visulaization.png)

---

## 🗂️ Folder Structure

```
whatsapp_bot/
├── src/
│   ├── lib/
│   │   └── prisma.ts               # Prisma client singleton
│   ├── routes/
│   │   └── whatsapp.routes.ts      # Webhook GET (verification) + POST (message handler)
│   └── services/
│       ├── ai.service.ts           # HTTP client — calls MoneyLens AI backend
│       └── whatsapp.service.ts     # Meta Cloud API — sends outgoing messages
├── prisma/
│   ├── migrations/                 # Prisma migration history
│   └── schema.prisma               # PostgreSQL schema — Message model
├── dist/                           # Compiled JS output (gitignored)
├── config.ts                       # Environment variable loading
├── index.ts                        # Express app entry point
├── .env                            # Environment variables — NOT committed to repo
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Runtime | Node.js |
| Framework | Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Messaging API | Meta Cloud API (WhatsApp Business) |
| Build | tsc (TypeScript compiler) |

---

## 🧾 Prerequisites

- **Node.js v18 or higher** — [https://nodejs.org](https://nodejs.org)
- **PostgreSQL** — local instance or a hosted service (e.g., Supabase, Railway, Render)
- **Meta Developer Account** with a WhatsApp Business app approved and a test phone number
- **MoneyLens AI Backend** running and accessible (locally or deployed)
- `git`

---

## ⚙️ Install & Run

### Step 1 — Navigate to This Folder

**Mac / Linux:**
```bash
cd whatsapp_bot
```

**Windows:**
```cmd
cd whatsapp_bot
```

---

### Step 2 — Install Dependencies

```bash
npm install
```

---

### Step 3 — Configure Environment Variables

Copy the example and fill in all required values:

```bash
# Mac / Linux
cp .env.example .env
```

```cmd
# Windows
copy .env.example .env
```

Open `.env` and fill in:

```properties
# Meta WhatsApp Business API
WHATSAPP_TOKEN=your_meta_whatsapp_access_token
VERIFY_TOKEN=your_custom_webhook_verify_token
PHONE_NUMBER_ID=your_whatsapp_phone_number_id

# PostgreSQL (Prisma)
DATABASE_URL=postgresql://user:password@localhost:5432/moneylens

# MoneyLens AI Backend
AI_API_URL=http://localhost:8000
```

> **`VERIFY_TOKEN`** — set this to any string you choose. You will enter the same string in the Meta Developer Console when configuring the webhook.

---

### Step 4 — Set Up the Database

Generate the Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

---

### Step 5 — Build and Start

**Build:**
```bash
npm run build
```

**Start:**
```bash
npm start
```

**Expected output:**
```
Server running on port 3001
```

---

### Step 6 — Expose the Webhook (Local Development)

Meta requires a publicly accessible HTTPS URL for the webhook. Use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3001
```

Copy the HTTPS forwarding URL (e.g., `https://abc123.ngrok.io`).

---

### Step 7 — Configure the Meta Webhook

1. Go to [Meta Developer Console](https://developers.facebook.com) → Your App → WhatsApp → Configuration.
2. Set **Webhook URL** to:
   ```
   https://abc123.ngrok.io/webhook
   ```
3. Set **Verify Token** to the same value as `VERIFY_TOKEN` in your `.env`.
4. Subscribe to the **messages** webhook field.
5. Click **Verify and Save**.

---

## 🧪 Usage

Once running, send a WhatsApp message to your Meta test phone number:

```
You:        Which merchant charged me the most this month?
MoneyLens:  It looks like Airbnb charged you the most this month, with a total of ₹5000 spent.
```

```
You:        Suggest me ways to decrease my credit card interest
MoneyLens:  To help decrease your credit card interest, consider reviewing your recurring
            spending, which totals ₹2,296. By reducing these regular expenses, you can
            free up funds to pay down your credit card balance faster and save on interest.
```

> The bot returns the **Level 1 plain English answer only**. Full SQL, execution plan, and trust graph are available on the web dashboard at [https://money-lens-chat.vercel.app/](https://money-lens-chat.vercel.app/).

---

## 📡 API Reference

### `GET /webhook`

Handles Meta webhook verification. Meta sends a `hub.challenge` parameter; the bot echoes it back if the `hub.verify_token` matches `VERIFY_TOKEN`.

### `POST /webhook`

Receives incoming WhatsApp messages. For each message:
1. Stores the incoming message in PostgreSQL via Prisma.
2. Calls `AI_API_URL/api/chat` with the message text.
3. Extracts `level_1_simple_answer` from the AI response.
4. Sends the answer back to the user via the Meta Cloud API.
5. Stores the outgoing reply in PostgreSQL.

---

## 🔐 Security Notes

- All credentials are loaded from environment variables — no hardcoded tokens.
- `VERIFY_TOKEN` is used to validate that webhook requests originate from Meta.
- `WHATSAPP_TOKEN` is a Meta-issued access token — keep it secret and never commit it.
- `DATABASE_URL` contains credentials — never commit `.env` to the repository.

---

## 🛠️ Common Issues

| Problem | Fix |
|---|---|
| `Cannot find module` errors | Run `npm install` and `npm run build` before `npm start` |
| `DATABASE_URL` connection error | Check PostgreSQL is running and the URL in `.env` is correct |
| Webhook verification fails | Ensure `VERIFY_TOKEN` in `.env` matches what you entered in the Meta console |
| Bot receives messages but does not reply | Check `AI_API_URL` is reachable and the backend is running |
| `WHATSAPP_TOKEN` invalid | Regenerate the token in the Meta Developer Console |
| Port 3001 already in use | Change the port in `index.ts` and update the ngrok command |
| Prisma migration error | Run `npx prisma migrate dev` for local development environments |

---

## ⚠️ Limitations

- The WhatsApp bot returns the Level 1 plain English answer only — full SQL, execution plan, and trust graph require the web dashboard.
- Meta WhatsApp Business API requires an approved Meta Developer app; sandbox testing is limited to verified phone numbers.
- The bot processes one message at a time; concurrent high-volume messaging may require a queue-based architecture.