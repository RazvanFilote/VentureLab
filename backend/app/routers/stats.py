from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db.session import get_db
from app.store.ideas_store import idea_store
from app.store.offers_store import offer_store
from app.store.feedback_store import feedback_store
from app.store.milestone_store import milestone_store

router = APIRouter(
    prefix="/api/stats",
    tags=["Stats"],
    dependencies=[Depends(get_current_user)],
)


def _is_mssql(db: Session) -> bool:
    return db.bind.dialect.name == "mssql"


@router.get("")
def global_stats(db: Session = Depends(get_db)):
    """Aggregate counters. Backed by stored procedure `sp_global_stats` on SQL
    Server; on SQLite (used by unit tests) we fall back to ORM aggregation."""
    if _is_mssql(db):
        row = db.execute(text("EXEC sp_global_stats")).mappings().first()
        total_milestones = row["total_milestones"] or 0
        done_milestones = row["done_milestones"] or 0
        return {
            "total_ideas": row["total_ideas"],
            "total_offers": row["total_offers"],
            "accepted_offers": row["accepted_offers"],
            "pending_offers": row["pending_offers"],
            "rejected_offers": row["rejected_offers"],
            "total_feedback": row["total_feedback"],
            "avg_rating": round(float(row["avg_rating"]), 2),
            "total_milestones": total_milestones,
            "done_milestones": done_milestones,
            "milestone_completion_rate": (
                round(done_milestones / total_milestones * 100, 1)
                if total_milestones else 0.0
            ),
        }

    # ── SQLite / fallback path ──
    ideas = idea_store.all(db)
    offers = offer_store.all(db)
    feedback = feedback_store.all(db)
    milestones = milestone_store.all(db)

    accepted = [o for o in offers if o["status"] == "Accepted"]
    pending = [o for o in offers if o["status"] == "Pending"]
    rejected = [o for o in offers if o["status"] == "Rejected"]
    ratings = [f["rating"] for f in feedback]
    done = sum(1 for m in milestones if m["status"] == "Done")

    return {
        "total_ideas": len(ideas),
        "total_offers": len(offers),
        "accepted_offers": len(accepted),
        "pending_offers": len(pending),
        "rejected_offers": len(rejected),
        "total_feedback": len(feedback),
        "avg_rating": round(sum(ratings) / len(ratings), 2) if ratings else 0.0,
        "total_milestones": len(milestones),
        "done_milestones": done,
        "milestone_completion_rate": (
            round(done / len(milestones) * 100, 1) if milestones else 0.0
        ),
    }


@router.get("/ideas/{idea_id}")
def idea_stats(idea_id: str, db: Session = Depends(get_db)):
    idea = idea_store.get(idea_id, db)
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    if _is_mssql(db):
        row = db.execute(
            text("EXEC sp_idea_stats :idea_id"),
            {"idea_id": idea_id},
        ).mappings().first()
        owner_pct = float(row["owner_percent"])
        avg_rating = round(float(row["avg_rating"]), 2)
        total_offers = row["total_offers"]
        accepted_offers = row["accepted_offers"]
        pending_offers = row["pending_offers"]
        total_milestones = row["total_milestones"] or 0
        done_milestones = row["done_milestones"] or 0
    else:
        idea_offers = offer_store.by_idea(idea_id, db)
        accepted = [o for o in idea_offers if o["status"] == "Accepted"]
        pending = [o for o in idea_offers if o["status"] == "Pending"]
        owner_pct = offer_store.owner_percent(idea_id, db)
        avg_rating = round(feedback_store.avg_rating(idea_id, db), 2)
        total_offers = len(idea_offers)
        accepted_offers = len(accepted)
        pending_offers = len(pending)
        ms = milestone_store.by_idea(idea_id, db)
        total_milestones = len(ms)
        done_milestones = sum(1 for m in ms if m["status"] == "Done")

    accepted = [o for o in offer_store.by_idea(idea_id, db) if o["status"] == "Accepted"]
    pending = [o for o in offer_store.by_idea(idea_id, db) if o["status"] == "Pending"]
    shareholders = [{"name": idea["created_by"], "percent": owner_pct, "is_owner": True}]
    for o in accepted:
        shareholders.append({"name": o["investor_name"], "percent": o["equity"], "is_owner": False})
    top_pending = sorted(pending, key=lambda o: o["amount"], reverse=True)[:5]
    completion_rate = (
        round(done_milestones / total_milestones * 100, 1) if total_milestones else 0.0
    )

    return {
        "idea_id": idea_id,
        "title": idea["title"],
        "total_offers": total_offers,
        "accepted_offers": accepted_offers,
        "pending_offers": pending_offers,
        "owner_percent": owner_pct,
        "avg_rating": avg_rating,
        "shareholders": shareholders,
        "top_pending_offers": top_pending,
        "total_milestones": total_milestones,
        "done_milestones": done_milestones,
        "milestone_completion_rate": completion_rate,
    }
