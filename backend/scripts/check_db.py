"""Inspect what migration state was actually committed to venturelab."""
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

print("== alembic_version ==")
try:
    cur.execute("SELECT version_num FROM alembic_version")
    for row in cur.fetchall():
        print(" ", row.version_num)
except pyodbc.Error as e:
    print("  (no alembic_version table:", e, ")")

print("\n== Tables ==")
cur.execute(
    "SELECT name FROM sys.tables ORDER BY name"
)
for row in cur.fetchall():
    print(" -", row.name)

print("\n== Stored procedures ==")
cur.execute(
    "SELECT name FROM sys.procedures ORDER BY name"
)
for row in cur.fetchall():
    print(" -", row.name)

print("\n== Triggers ==")
cur.execute(
    "SELECT name FROM sys.triggers WHERE is_ms_shipped = 0 ORDER BY name"
)
for row in cur.fetchall():
    print(" -", row.name)

conn.close()
