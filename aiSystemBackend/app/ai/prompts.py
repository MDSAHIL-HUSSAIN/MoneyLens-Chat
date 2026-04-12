DB_SCHEMA = """
================================================================================
TABLE: transactions
================================================================================
COLUMN REFERENCE:
  transaction_id      TEXT        — Unique row identifier. Never filter or group on this.
  transaction_date    DATE        — Format: YYYY-MM-DD. Use for day-level precision only.
  amount              FLOAT       — Always positive. Direction is encoded in transaction_type.
  currency            TEXT        — ISO codes: 'INR', 'USD', 'EUR', etc.
                                    ⚠ One user can have transactions in MULTIPLE currencies.
  transaction_type    TEXT        — Exactly two values: 'debit' | 'credit'
  merchant_name       TEXT NULL   — May be NULL, empty string, or inconsistently cased.
  billing_cycle_month TEXT        — Full English month name: 'January'…'December'.
                                    ⚠ NOT sortable alphabetically. Use CASE mapping (see Rule 4).
  billing_cycle_year  INT         — Four-digit year: 2023, 2024, 2025…
  merchant_category   TEXT NULL   — May be NULL. Examples: 'Food & Dining', 'Travel', 'Utilities'.
                                    ⚠ No enforced vocabulary. Always use LIKE, never exact match.
  is_recurring        INT         — Boolean flag: 1 = recurring/subscription, 0 = one-time.
  is_online           INT         — Boolean flag: 1 = online/card-not-present, 0 = in-person.
================================================================================
"""

SEMANTIC_DICTIONARY = """
================================================================================
SEMANTIC RULES — FOLLOW ALL OF THESE. NO EXCEPTIONS. NO SHORTCUTS.
These rules override any default SQL behaviour you might assume.
================================================================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 1 — INTENT MAPPING (what words mean)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"spending" / "expenses" / "cost" / "paid" / "spent"
    → SUM(amount) WHERE transaction_type = 'debit'

"income" / "salary" / "earnings" / "received" / "credited"
    → SUM(amount) WHERE transaction_type = 'credit'

"net" / "balance" / "cash flow"
    → SUM(CASE WHEN transaction_type='credit' THEN amount ELSE -amount END)

"savings" (in context of cancelling subscriptions)
    → SUM(amount) WHERE transaction_type='debit' AND is_recurring=1

"subscriptions" / "recurring" / "expiring" / "subscriptions expiring"
    → RETURN FULL SUBSCRIPTION RECORDS: SELECT merchant_name, amount, currency, 
      billing_cycle_month, billing_cycle_year FROM transactions WHERE is_recurring=1 
      AND transaction_type='debit'. DO NOT use COUNT() or GROUP BY. Return individual rows 
      so the system can extract expiry dates and create calendar reminders.

"transactions" (unqualified, e.g. "show my transactions")
    → Return both debit and credit rows. Do NOT filter by type unless the user specifies.

"budget used" / "how much left"
    → This requires knowing a budget limit. If no limit is provided in the question, return
      total debit spending and note you do not have a budget figure to compare against.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 2 — CURRENCY (CRITICAL — NEVER SKIP)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- NEVER aggregate amounts across different currencies in a single SUM.
  Mixing INR and USD produces a meaningless number.
- EVERY query that calls SUM(amount), AVG(amount), MIN(amount), or MAX(amount)
  MUST include currency in both SELECT and GROUP BY.
- Correct pattern:
    SELECT currency, SUM(amount) AS total
    FROM transactions
    WHERE transaction_type = 'debit'
    GROUP BY currency
- If the user asks "total spending" and data contains multiple currencies,
  return one row per currency. The explainer will format this correctly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 3 — STRING MATCHING (NEVER USE EXACT MATCH)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- merchant_category and merchant_name have no enforced vocabulary.
  Real values include 'food & dining', 'Food&Dining', 'FOOD', 'food delivery', etc.
- ALWAYS use: column LIKE '%keyword%'
- NEVER use: column = 'Food'
- For multi-word concepts, use OR across likely variants:
    WHERE (merchant_category LIKE '%food%' OR merchant_category LIKE '%dining%'
           OR merchant_category LIKE '%restaurant%')
- merchant_name search example:
    WHERE merchant_name LIKE '%Netflix%'
- SQLite LIKE is case-insensitive for ASCII by default. Rely on this.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 4 — NULL HANDLING (ALWAYS EXPLICIT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- merchant_category and merchant_name are NULLABLE.
- Any WHERE or GROUP BY on these columns MUST guard against NULL:
    WHERE merchant_category IS NOT NULL AND merchant_category LIKE '%food%'
- When grouping by merchant_category, exclude NULLs unless the user asks
  "what are uncategorised transactions":
    GROUP BY merchant_category HAVING merchant_category IS NOT NULL
- Empty string ('') is NOT the same as NULL. Treat both as missing:
    WHERE merchant_category IS NOT NULL AND merchant_category != ''

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 5 — TIME (NEVER HARDCODE DATES OR YEARS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Absolute references:
  "in January"           → WHERE billing_cycle_month = 'January'
  "in 2024"              → WHERE billing_cycle_year = 2024
  "in January 2024"      → WHERE billing_cycle_month='January' AND billing_cycle_year=2024

Relative references — derive dynamically, NEVER hardcode a year:
  "this year"    → WHERE billing_cycle_year = (SELECT MAX(billing_cycle_year) FROM transactions)
  "last year"    → WHERE billing_cycle_year = (SELECT MAX(billing_cycle_year) FROM transactions) - 1
  "this month"   → Use MAX(billing_cycle_year) and the MAX month number within that year:
                   WITH latest AS (
                     SELECT MAX(billing_cycle_year) AS y,
                            MAX(CASE billing_cycle_month
                                  WHEN 'January' THEN 1 WHEN 'February' THEN 2
                                  WHEN 'March' THEN 3 WHEN 'April' THEN 4
                                  WHEN 'May' THEN 5 WHEN 'June' THEN 6
                                  WHEN 'July' THEN 7 WHEN 'August' THEN 8
                                  WHEN 'September' THEN 9 WHEN 'October' THEN 10
                                  WHEN 'November' THEN 11 WHEN 'December' THEN 12
                                END) AS m
                     FROM transactions
                   )
                   ...WHERE billing_cycle_year = latest.y AND <month CASE> = latest.m
  "last month"   → Same CTE, subtract 1 from m (handle January → December rollover with year -1)
  "last 3 months"→ Use the same CASE mapping; filter WHERE month_num >= (latest_m - 2),
                   handling year boundary if latest_m < 3.
  "recent" / "latest" → equivalent to "this month" logic above.
  "last N months" → Always compute dynamically. Do not assume the current calendar month.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 6 — MONTH ORDERING (billing_cycle_month IS TEXT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
billing_cycle_month stores full English month names. They do NOT sort correctly
as strings ('August' < 'February' alphabetically is wrong).

ALWAYS sort chronologically using this CASE expression:
  ORDER BY
    billing_cycle_year ASC,
    CASE billing_cycle_month
      WHEN 'January'   THEN 1  WHEN 'February'  THEN 2  WHEN 'March'     THEN 3
      WHEN 'April'     THEN 4  WHEN 'May'        THEN 5  WHEN 'June'      THEN 6
      WHEN 'July'      THEN 7  WHEN 'August'     THEN 8  WHEN 'September' THEN 9
      WHEN 'October'   THEN 10 WHEN 'November'   THEN 11 WHEN 'December'  THEN 12
    END ASC

Use DESC on both for "most recent first".
This same CASE block doubles as a month_num column in CTEs when you need arithmetic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 7 — RANKING & TOP-N
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- "most" / "highest" / "biggest" / "top" → ORDER BY metric DESC LIMIT 1
- "least" / "lowest" / "cheapest"        → ORDER BY metric ASC  LIMIT 1
- "top 5 categories"                     → LIMIT 5
- Always add a tie-breaking secondary sort. Prefer billing_cycle_year DESC, then month DESC.
- For "which month had the most X": group by (billing_cycle_month, billing_cycle_year, currency),
  order by the aggregate DESC, LIMIT 1 per currency if multi-currency.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 8 — RECURRING & ONLINE FLAGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"subscriptions" / "recurring"          → WHERE is_recurring = 1
"one-time" / "non-recurring"           → WHERE is_recurring = 0
"online" / "e-commerce" / "digital"    → WHERE is_online = 1
"in-store" / "offline" / "in-person"   → WHERE is_online = 0
"online subscriptions"                 → WHERE is_recurring = 1 AND is_online = 1
"cancel savings" / "if I cancel all"   → SUM(amount) WHERE is_recurring=1 AND
                                         transaction_type='debit' GROUP BY currency

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 9 — COMPARISON & CHANGE QUERIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"Did my spending increase?" / "Compare Jan vs Feb":
- Use conditional aggregation (not two separate queries joined):
    SELECT
      currency,
      SUM(CASE WHEN billing_cycle_month='January'  THEN amount ELSE 0 END) AS jan_total,
      SUM(CASE WHEN billing_cycle_month='February' THEN amount ELSE 0 END) AS feb_total,
      SUM(CASE WHEN billing_cycle_month='February' THEN amount ELSE 0 END) -
      SUM(CASE WHEN billing_cycle_month='January'  THEN amount ELSE 0 END) AS change
    FROM transactions
    WHERE transaction_type='debit'
      AND billing_cycle_year = (SELECT MAX(billing_cycle_year) FROM transactions)
    GROUP BY currency
- "Which category caused the biggest increase" → add GROUP BY merchant_category to the above
  pattern, ORDER BY change DESC LIMIT 1.
- Always filter by the same billing_cycle_year on both sides of a comparison.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 10 — ANOMALY & AVERAGE QUERIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"Average transaction" / "unusual spend" / "outliers":
- Compute average and stddev in a CTE, then filter in the main query:
    WITH stats AS (
      SELECT currency,
             AVG(amount)                        AS avg_amount,
             AVG(amount * amount) - AVG(amount) * AVG(amount) AS variance
      FROM transactions WHERE transaction_type='debit'
      GROUP BY currency
    )
    SELECT t.*, s.avg_amount
    FROM transactions t
    JOIN stats s ON t.currency = s.currency
    WHERE t.transaction_type = 'debit'
      AND t.amount > s.avg_amount + 2 * SQRT(s.variance)
    ORDER BY t.amount DESC
    LIMIT 10
- SQLite has no STDDEV() function. Use the manual variance formula above.
- "Unusually high" threshold = mean + 2× standard deviation (roughly top 2.5%).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 11 — ROW vs AGGREGATE QUERIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- "Show me transactions" / "list" / "what did I buy"
    → Return raw rows. SELECT all meaningful columns. LIMIT 10 unless user says otherwise.
- "How much" / "total" / "sum" / "average"
    → Return aggregated rows. Do NOT return raw transaction rows.
- "How many transactions"
    → SELECT currency, COUNT(*) — always group by currency.
- Never mix raw rows and aggregates in the same SELECT.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RULE 12 — OUTPUT COLUMN NAMING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Always alias computed columns with readable names:
    SUM(amount) AS total_spending
    AVG(amount) AS avg_transaction
    COUNT(*)    AS transaction_count
    (feb - jan) AS monthly_change
- The explainer agent reads column names to build the answer. Unclear names
  like "col1" or bare "SUM(amount)" will produce vague explanations.
================================================================================
"""