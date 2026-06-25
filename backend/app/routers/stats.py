from datetime import date, datetime, timezone

from beanie.operators import In

from fastapi import APIRouter, Depends, Query

from app.core.permissions import check_access, get_accessible_factory_ids
from app.dependencies import get_current_user, success
from app.models.factory import Factory
from app.models.record import Record
from app.models.settlement import Settlement
from app.models.style import Style
from app.models.user import User
from app.schemas.stats import ReconciliationCardRequest
from app.services.stats_service import aggregate_records, compute_style_stats

router = APIRouter(tags=["统计"])


@router.get("/stats/today-summary")
async def today_summary(user: User = Depends(get_current_user)):
    factory_ids = await get_accessible_factory_ids(user.id)
    if not factory_ids:
        return success({"total_out": 0, "total_in": 0, "diff": 0})

    today = date.today()
    records = await Record.find(
        In(Record.factory_id, factory_ids), Record.date == today
    ).to_list()
    summary, _ = aggregate_records(records)
    return success(
        {
            "total_out": summary.total_out,
            "total_in": summary.total_in,
            "diff": summary.diff,
        }
    )


@router.get("/factories/{factory_id}/stats")
async def factory_stats(
    factory_id: str,
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    style_id: str | None = Query(None),
    user: User = Depends(get_current_user),
):
    await check_access(factory_id, user)
    factory = await Factory.get(factory_id)
    if factory is None:
        return success({})

    styles = await Style.find(
        Style.factory_id == factory_id, Style.deleted == False
    ).to_list()

    style_stats = await compute_style_stats(styles, date_from, date_to, style_id)

    total_out = sum(s.total_out for s in style_stats)
    total_in = sum(s.total_in for s in style_stats)
    payable = round(sum(s.payable for s in style_stats), 2)

    settlement = await Settlement.find_one(
        Settlement.factory_id == factory_id,
        Settlement.date_from == date_from,
        Settlement.date_to == date_to,
    )

    return success(
        {
            "factory_id": factory_id,
            "factory_name": factory.name,
            "date_from": date_from.isoformat() if date_from else None,
            "date_to": date_to.isoformat() if date_to else None,
            "summary": {
                "total_out": total_out,
                "total_in": total_in,
                "diff": total_out - total_in,
                "payable": payable,
            },
            "settlement": {
                "status": settlement.status if settlement else "unsettled",
                "marked_at": settlement.marked_at if settlement else None,
            },
            "style_stats": [
                {
                    "style_id": s.style_id,
                    "style_code": s.style_code,
                    "unit_price": s.unit_price,
                    "total_out": s.total_out,
                    "total_in": s.total_in,
                    "diff": s.diff,
                    "payable": s.payable,
                    "color_stats": [c.model_dump(by_alias=True) for c in s.color_stats],
                }
                for s in style_stats
            ],
        }
    )


@router.post("/factories/{factory_id}/reconciliation-card")
async def reconciliation_card(
    factory_id: str,
    body: ReconciliationCardRequest,
    user: User = Depends(get_current_user),
):
    await check_access(factory_id, user)
    factory = await Factory.get(factory_id)
    styles = await Style.find(
        Style.factory_id == factory_id, Style.deleted == False
    ).to_list()
    style_stats = await compute_style_stats(styles, body.date_from, body.date_to)

    total_out = sum(s.total_out for s in style_stats)
    total_in = sum(s.total_in for s in style_stats)
    payable = round(sum(s.payable for s in style_stats), 2)

    return success(
        {
            "factory_name": factory.name if factory else "",
            "date_from": body.date_from.isoformat() if body.date_from else None,
            "date_to": body.date_to.isoformat() if body.date_to else None,
            "summary": {
                "total_out": total_out,
                "total_in": total_in,
                "diff": total_out - total_in,
                "payable": payable,
            },
            "style_stats": [
                {
                    "style_code": s.style_code,
                    "total_in": s.total_in,
                    "payable": s.payable,
                }
                for s in style_stats
            ],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
    )
