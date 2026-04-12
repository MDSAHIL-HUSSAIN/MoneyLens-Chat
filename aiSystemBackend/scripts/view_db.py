import sqlite3
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH  = BASE_DIR / "data" / "finance.db"

conn = sqlite3.connect(DB_PATH)

print("\n✅ --- SCHEMA ---")
schema = pd.read_sql("PRAGMA table_info(transactions);", conn)
print(schema[['name', 'type']].to_string(index=False))

print("\n✨ --- ONE FULL ROW ---")
row = pd.read_sql("SELECT * FROM transactions LIMIT 1", conn)
print(row.T.to_string(header=False))

print("\n📊 --- TOTAL ROW COUNT ---")
count = pd.read_sql("SELECT COUNT(*) as total_rows FROM transactions", conn)
print(count.to_string(index=False))

print("\n📅 --- ROWS PER YEAR ---")
per_year = pd.read_sql("""
    SELECT billing_cycle_year AS year,
           COUNT(*)           AS transactions,
           SUM(CASE WHEN transaction_type='debit'  THEN amount ELSE 0 END) AS total_spent,
           SUM(CASE WHEN transaction_type='credit' THEN amount ELSE 0 END) AS total_income
    FROM transactions
    GROUP BY billing_cycle_year
    ORDER BY billing_cycle_year
""", conn)
print(per_year.to_string(index=False))

print("\n🏷️  --- ROWS PER CATEGORY ---")
per_cat = pd.read_sql("""
    SELECT merchant_category   AS category,
           COUNT(*)            AS transactions,
           ROUND(SUM(amount),2) AS total_amount
    FROM transactions
    WHERE transaction_type = 'debit'
    GROUP BY merchant_category
    ORDER BY total_amount DESC
""", conn)
print(per_cat.to_string(index=False))

print("\n🔁 --- RECURRING vs ONE-OFF ---")
recur = pd.read_sql("""
    SELECT is_recurring,
           COUNT(*) AS count
    FROM transactions
    GROUP BY is_recurring
""", conn)
print(recur.to_string(index=False))

print("\n📆 --- DATE RANGE ---")
dates = pd.read_sql("""
    SELECT MIN(transaction_date) AS earliest,
           MAX(transaction_date) AS latest
    FROM transactions
""", conn)
print(dates.to_string(index=False))

conn.close()