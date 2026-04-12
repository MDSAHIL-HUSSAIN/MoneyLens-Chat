# 📱 MoneyLens — WhatsApp Bot

The WhatsApp integration for MoneyLens. A Node.js + TypeScript server that receives messages from users on WhatsApp, forwards them to the AI backend, and returns short, instant answers — making financial queries accessible without opening a browser.

---

## 📌 What This Module Does

- Listens for incoming WhatsApp messages via Twilio webhook.
- Passes the user's question to the MoneyLens AI backend (`ai.service.ts`).
- Returns a concise, conversational answer back to the user on WhatsApp (`whatsapp.service.ts`).
- Stores conversation context using Prisma ORM so follow-up questions are handled correctly.
- Runs as a standalone Express server, independent of the frontend dashboard.

---

## 🗂️ Folder Structure

```
whatsapp_bot/
├── src/
│   ├── lib/
│   │   └── prisma.ts               # Prisma client singleton
│   ├── routes/
│   │   └── whatsapp.routes.ts      # POST /webhook — Twilio inbound message handler
│   └── services/
│       ├── ai.service.ts           # Calls aiSystemBackend API, formats response
│       └── whatsapp.service.ts     # Sends reply back via Twilio WhatsApp API
├── config.ts                       # Environment variable loading
├── index.ts                        # Express app entry point
├── prisma/                         # Prisma schema + migrations
├── .env.example
├── package.json
└── tsconfig.json
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Runtime | Node.js 18 |
| Framework | Express.js |
| ORM | Prisma |
| WhatsApp API | Twilio WhatsApp API |
| AI Bridge | HTTP calls to `aiSystemBackend` |

---

## 🔧 Install & Run

### Prerequisites
- Node.js 18 or higher
- A Twilio account with a WhatsApp-enabled sandbox or number
- AI backend running (see `aiSystemBackend/README.md`)
- A public URL for the Twilio webhook (use [ngrok](https://ngrok.com) for local dev)

### 1. Navigate to this folder
```bash
cd whatsapp_bot
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Fill in:
# TWILIO_ACCOUNT_SID=...
# TWILIO_AUTH_TOKEN=...
# TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
# AI_BACKEND_URL=http://localhost:8000
# DATABASE_URL=file:./dev.db
```

### 3. Install dependencies
```bash
npm install
```

### 4. Set up the Prisma database
```bash
npx prisma migrate dev --name init
```

### 5. Start the server
```bash
npm run dev
# Bot server: http://localhost:3001
```

### 6. Expose to Twilio using ngrok (local dev only)
```bash
ngrok http 3001
# Copy the HTTPS URL and set it as your Twilio webhook:
# https://<your-ngrok-id>.ngrok.io/webhook
```

In your Twilio Console → WhatsApp Sandbox → set the webhook to:
```
https://<your-ngrok-id>.ngrok.io/webhook
```

---

## 📡 Webhook

### `POST /webhook`
Twilio calls this endpoint when a WhatsApp message is received.

Twilio sends:
```
Body=How+much+did+I+spend+this+month%3F
From=whatsapp:+919876543210
```

Bot replies via Twilio API:
```
You spent ₹18,750 this month across 43 transactions.
```

---

## 🧪 Usage Example

1. Save the Twilio sandbox WhatsApp number in your contacts.
2. Send the sandbox join keyword (e.g. *join galaxy-planet*) to activate.
3. Ask any financial question:

```
You:        Show my top 3 merchants this month
MoneyLens:  1. Swiggy — ₹3,150
            2. Amazon — ₹2,840
            3. Zomato — ₹1,920
```

```
You:        When is my credit card due?
MoneyLens:  Your HDFC card is due on April 28. Minimum due: ₹2,400.
            I've added a reminder to your Google Calendar.
```

---

## 🔐 Notes

- Twilio credentials are loaded from `.env` only — never hardcoded.
- The bot sends only short summary answers, not full SQL or raw data (that is reserved for the dashboard).
- Message history per user is stored in Prisma DB to support follow-up questions within a session.

---

## ⚠️ Limitations

- The Twilio WhatsApp sandbox allows messages only to/from numbers that have joined it; production requires a Twilio-approved WhatsApp Business number.
- Free Twilio sandbox has a 24-hour messaging window limit per user.
- Google Calendar reminder creation requires the user to have completed the OAuth flow via the dashboard first.
- The bot does not support image or document uploads; CSV ingestion must be done via the dashboard.