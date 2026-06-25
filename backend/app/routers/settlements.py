from datetime import date

from fastapi import APIRouter, Depends, Query

from app.core.permissions import check_access, check_owner
from app.dependencies import get_current_user, success
from app.models.settlement import Settlement
from app.models.user import User, utcnow
from app.schemas.settlement import SettlementUpsert

router = APIRouter(prefix="/factories/{factory_id}/settlements", tags=["结算"])


@router.get("")
async def get_settlement(
    factory_id: str,
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    user: User = Depends(get_current_user),
):
    await check_access(factory_id, user)
    settlement = await Settlement.find_one(
        Settlement.factory_id == factory_id,
        Settlement.date_from == date_from,
        Settlement.date_to == date_to,
    )
    if settlement is None:
        return success(
            {
                "status": "unsettled",
                "date_from": date_from.isoformat() if date_from else None,
                "date_to": date_to.isoformat() if date_to else None,
                "marked_by": None,
                "marked_at": None,
            }
        )
    return success(
        {
            "status": settlement.status,
            "date_from": settlement.date_from.isoformat() if settlement.date_from else None,
            "date_to": settlement.date_to.isoformat() if settlement.date_to else None,
            "marked_by": settlement.marked_by,
            "marked_at": settlement.marked_at,
        }
    )


@router.put("")
async def upsert_settlement(
    factory_id: str,
    body: SettlementUpsert,
    user: User = Depends(get_current_user),
):
    await check_owner(factory_id, user)
    settlement = await Settlement.find_one(
        Settlement.factory_id == factory_id,
        Settlement.date_from == body.date_from,
        Settlement.date_to == body.date_to,
    )
    now = utcnow()
    message = "已标记结清" if body.status == "settled" else "已标记未结"

    if settlement is None:
        settlement = Settlement(
            factory_id=factory_id,
            date_from=body.date_from,
            date_to=body.date_to,
            status=body.status,
            marked_by=user.id,
            marked_at=now,
        )
        await settlement.insert()
    else:
        settlement.status = body.status
        settlement.marked_by = user.id
        settlement.marked_at = now
        settlement.updated_at = now
        await settlement.save()

    return success({"status": settlement.status}, message)
