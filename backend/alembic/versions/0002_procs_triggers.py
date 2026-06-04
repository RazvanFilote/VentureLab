"""Stored procedures and triggers (SQL Server / T-SQL).

Skipped on non-mssql backends so the same migration set works against
SQLite during fast unit tests.

Procedures:
  sp_global_stats          — aggregated stats across all entities
  sp_idea_stats(@idea_id)  — per-idea aggregated stats incl. owner_percent
  sp_owner_percent(@idea_id, @pct OUT)
                           — returns 100 - sum(equity of accepted offers)

Triggers (on offers):
  trg_offers_validate_equity   INSTEAD OF INSERT —
        rejects offer where accepted equity would exceed 100%
  trg_offers_status_audit      AFTER UPDATE —
        writes (offer_id, old_status, new_status) into offer_status_audit
  trg_offers_block_accepted_delete  AFTER DELETE —
        prevents deletion of Accepted offers (uses ROLLBACK; INSTEAD OF DELETE
        is not allowed here because offers participates in a cascading FK chain)

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-07
"""
from alembic import op


revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


SP_GLOBAL_STATS = """
CREATE PROCEDURE sp_global_stats
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        (SELECT COUNT(*) FROM ideas)                                            AS total_ideas,
        (SELECT COUNT(*) FROM offers)                                           AS total_offers,
        (SELECT COUNT(*) FROM offers WHERE status = 'Accepted')                 AS accepted_offers,
        (SELECT COUNT(*) FROM offers WHERE status = 'Pending')                  AS pending_offers,
        (SELECT COUNT(*) FROM offers WHERE status = 'Rejected')                 AS rejected_offers,
        (SELECT COUNT(*) FROM feedback)                                         AS total_feedback,
        (SELECT ISNULL(AVG(CAST(rating AS FLOAT)), 0) FROM feedback)            AS avg_rating,
        (SELECT COUNT(*) FROM milestones)                                       AS total_milestones,
        (SELECT COUNT(*) FROM milestones WHERE status = 'Done')                 AS done_milestones;
END
"""

SP_OWNER_PERCENT = """
CREATE PROCEDURE sp_owner_percent
    @idea_id NVARCHAR(36),
    @pct FLOAT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @sold FLOAT;
    SELECT @sold = ISNULL(SUM(equity), 0)
      FROM offers
     WHERE idea_id = @idea_id AND status = 'Accepted';
    SET @pct = 100.0 - @sold;
    IF @pct < 0 SET @pct = 0;
END
"""

SP_IDEA_STATS = """
CREATE PROCEDURE sp_idea_stats
    @idea_id NVARCHAR(36)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @owner_pct FLOAT;
    EXEC sp_owner_percent @idea_id, @owner_pct OUTPUT;

    SELECT
        @idea_id                                                                       AS idea_id,
        (SELECT COUNT(*) FROM offers   WHERE idea_id = @idea_id)                       AS total_offers,
        (SELECT COUNT(*) FROM offers   WHERE idea_id = @idea_id AND status='Accepted') AS accepted_offers,
        (SELECT COUNT(*) FROM offers   WHERE idea_id = @idea_id AND status='Pending')  AS pending_offers,
        (SELECT COUNT(*) FROM offers   WHERE idea_id = @idea_id AND status='Rejected') AS rejected_offers,
        @owner_pct                                                                     AS owner_percent,
        (SELECT ISNULL(AVG(CAST(rating AS FLOAT)), 0)
           FROM feedback WHERE idea_id = @idea_id)                                     AS avg_rating,
        (SELECT COUNT(*) FROM milestones WHERE idea_id = @idea_id)                     AS total_milestones,
        (SELECT COUNT(*) FROM milestones WHERE idea_id = @idea_id AND status='Done')   AS done_milestones;
END
"""

TRG_OFFERS_VALIDATE_EQUITY = """
CREATE TRIGGER trg_offers_validate_equity
ON offers
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- For each new row, check that equity does not exceed the owner's
    -- remaining share. We sum already-accepted equity per idea and reject
    -- the insert if any incoming row would push the total over 100%.
    IF EXISTS (
        SELECT 1
          FROM inserted i
         CROSS APPLY (
            SELECT ISNULL(SUM(equity), 0) AS sold
              FROM offers
             WHERE idea_id = i.idea_id AND status = 'Accepted'
         ) o
         WHERE i.equity > (100.0 - o.sold)
    )
    BEGIN
        RAISERROR ('Equity exceeds owner''s available share', 16, 1);
        RETURN;
    END

    INSERT INTO offers (id, idea_id, investor_name, amount, equity, message, status, created_at)
    SELECT id, idea_id, investor_name, amount, equity, message, status, created_at
      FROM inserted;
END
"""

TRG_OFFERS_STATUS_AUDIT = """
CREATE TRIGGER trg_offers_status_audit
ON offers
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT UPDATE(status) RETURN;

    INSERT INTO offer_status_audit (offer_id, old_status, new_status, changed_at)
    SELECT d.id, d.status, i.status, CAST(GETDATE() AS DATE)
      FROM inserted i
      JOIN deleted  d ON d.id = i.id
     WHERE d.status <> i.status;
END
"""

TRG_OFFERS_BLOCK_ACCEPTED_DELETE = """
CREATE TRIGGER trg_offers_block_accepted_delete
ON offers
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    -- INSTEAD OF DELETE is not allowed on this table because the offers.idea_id
    -- FK uses ON DELETE CASCADE. We use AFTER DELETE with ROLLBACK instead:
    -- if any of the rows being deleted was Accepted, abort the whole delete.
    IF EXISTS (SELECT 1 FROM deleted WHERE status = 'Accepted')
    BEGIN
        RAISERROR ('Accepted offers cannot be deleted', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END
"""


def _is_mssql() -> bool:
    return op.get_bind().dialect.name == "mssql"


def upgrade() -> None:
    if not _is_mssql():
        return  # SQLite / others skip — schema-extension features are SQL-Server-specific
    op.execute(SP_GLOBAL_STATS)
    op.execute(SP_OWNER_PERCENT)
    op.execute(SP_IDEA_STATS)
    op.execute(TRG_OFFERS_VALIDATE_EQUITY)
    op.execute(TRG_OFFERS_STATUS_AUDIT)
    op.execute(TRG_OFFERS_BLOCK_ACCEPTED_DELETE)


def downgrade() -> None:
    if not _is_mssql():
        return
    for name in (
        "trg_offers_block_accepted_delete",
        "trg_offers_status_audit",
        "trg_offers_validate_equity",
    ):
        op.execute(f"IF OBJECT_ID('{name}', 'TR') IS NOT NULL DROP TRIGGER {name}")
    for name in ("sp_idea_stats", "sp_owner_percent", "sp_global_stats"):
        op.execute(f"IF OBJECT_ID('{name}', 'P') IS NOT NULL DROP PROCEDURE {name}")
