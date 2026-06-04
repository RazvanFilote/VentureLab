"""Rename users.password -> users.password_hash.

Plain-text seed passwords can't be migrated to bcrypt one-to-one, so we
just rebuild the users table. The auto-seed on app startup repopulates it
with bcrypt-hashed demo credentials.

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-21
"""
from alembic import op
import sqlalchemy as sa


revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    # Wipe existing rows so the seeder reinserts fresh bcrypt hashes on next
    # startup. (Idempotent — empty table just stays empty.)
    op.execute("DELETE FROM users")

    if dialect == "mssql":
        # SQL Server can't drop a NOT NULL column directly; rename via sp_rename
        # is the cleanest in-place rename and preserves the column constraints.
        op.execute("EXEC sp_rename 'users.password', 'password_hash', 'COLUMN'")
    else:
        # SQLite + Postgres: rename via batch mode (handles SQLite limitation).
        with op.batch_alter_table("users") as batch:
            batch.alter_column("password", new_column_name="password_hash")


def downgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name
    op.execute("DELETE FROM users")
    if dialect == "mssql":
        op.execute("EXEC sp_rename 'users.password_hash', 'password', 'COLUMN'")
    else:
        with op.batch_alter_table("users") as batch:
            batch.alter_column("password_hash", new_column_name="password")
