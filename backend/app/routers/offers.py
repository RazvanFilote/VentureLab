from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db.session import get_db
from app.models.offer import OfferCreate, OfferStatusUpdate, OfferOut, OfferStatus
from app.schemas.pagination import PaginatedResponse, paginate
from app.store.offers_store import offer_store

router = APIRouter(
    prefix="/api/offers",
    tags=["Offers"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=PaginatedResponse[OfferOut])
def list_offers(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: str = Query(None),
    db: Session = Depends(get_db),
):
    items = offer_store.by_status(status, db) if status else offer_store.all(db)
    return paginate(items, page, page_size)


@router.get("/{offer_id}", response_model=OfferOut)
def get_offer(offer_id: str, db: Session = Depends(get_db)):
    offer = offer_store.get(offer_id, db)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    return offer


@router.post("", response_model=OfferOut, status_code=201)
def create_offer(body: OfferCreate, db: Session = Depends(get_db)):
    owner_pct = offer_store.owner_percent(body.idea_id, db)
    if body.equity > owner_pct:
        raise HTTPException(
            status_code=422,
            detail=f"Equity {body.equity}% exceeds owner's available share of {owner_pct}%",
        )
    data = body.model_dump()
    data["status"] = OfferStatus.Pending.value
    return offer_store.create(data, db)


@router.patch("/{offer_id}/status", response_model=OfferOut)
def update_offer_status(offer_id: str, body: OfferStatusUpdate, db: Session = Depends(get_db)):
    offer = offer_store.get(offer_id, db)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if offer["status"] != OfferStatus.Pending.value:
        raise HTTPException(status_code=409, detail="Only pending offers can be updated")
    if body.status == OfferStatus.Accepted:
        owner_pct = offer_store.owner_percent(offer["idea_id"], db)
        after = owner_pct - offer["equity"]
        if after < 10:
            raise HTTPException(
                status_code=422,
                detail=f"Accepting would drop ownership to {after:.1f}% (minimum 10%)",
            )
    return offer_store.update_status(offer_id, body.status.value, db)


@router.delete("/{offer_id}", status_code=204)
def delete_offer(offer_id: str, db: Session = Depends(get_db)):
    offer = offer_store.get(offer_id, db)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if offer["status"] == OfferStatus.Accepted.value:
        raise HTTPException(status_code=409, detail="Accepted offers cannot be deleted")
    offer_store.delete(offer_id, db)
