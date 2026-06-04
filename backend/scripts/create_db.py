"""Create the venturelab database on the local SQLEXPRESS instance.

Uses ODBC Driver 18 (the only one installed on this machine) with
TrustServerCertificate=yes so we don't need a real TLS cert for dev.
"""
import pyodbc

CONN_STR = (
    "Driver={ODBC Driver 18 for SQL Server};"
    "Server=localhost\\SQLEXPRESS;"
    "Database=master;"
    "Trusted_Connection=yes;"
    "TrustServerCertificate=yes;"
)

conn = pyodbc.connect(CONN_STR, autocommit=True)
cur = conn.cursor()

cur.execute("SELECT name FROM sys.databases WHERE name = 'venturelab'")
exists = cur.fetchone() is not None

if exists:
    print("Database 'venturelab' already exists.")
else:
    cur.execute("CREATE DATABASE venturelab")
    print("Database 'venturelab' created.")

cur.execute("SELECT name FROM sys.databases ORDER BY name")
print("All databases:")
for row in cur.fetchall():
    print(" -", row.name)

conn.close()
