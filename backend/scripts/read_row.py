"""Direct DB read to confirm the API actually wrote to SQL Server."""
import pyodbc

CONN_STR = (
    "Driver={ODBC Driver 18 for SQL Server};"
    "Server=localhost\\SQLEXPRESS;"
    "Database=venturelab;"
    "Trusted_Connection=yes;"
    "TrustServerCertificate=yes;"
)

conn = pyodbc.connect(CONN_STR)
cur = conn.cursor()

cur.execute("SELECT COUNT(*) FROM ideas")
print("Total ideas in DB:", cur.fetchone()[0])

cur.execute("SELECT id, title, created_by FROM ideas WHERE title = 'DB Smoke Test'")
for row in cur.fetchall():
    print("Row from SQL Server:", row.id, "|", row.title, "|", row.created_by)

conn.close()
