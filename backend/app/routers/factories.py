from datetime import date

from fastapi import APIRouter, Depends, Query

from beanie.operators import In

from app.core.exceptions import not_found
from app.core.permissions import (
    check_access,
    check_owner,
    get_accessible_factory_ids,
    get_user_role,
)
from app.dependencies import get_current_user, success
from app.models.factory import Factory, FactoryMember
from app.models.record import Record
from app.models.style import Style
from app.models.user import User, utcnow
from app.schemas.factory import FactoryCreate, FactoryListResponse, FactoryUpdate
from app.services.stats_service import aggregate_records

router = APIRouter(prefix="/factories", tags=["工厂"])


async def _today_summary(factory_ids: list[str]) -> dict:
    if not factory_ids:
        return {"total_out": 0, "total_in": 0, "diff": 0}

    today = date.today()
    records = await Record.find(
        In(Record.factory_id, factory_ids), Record.date == today
    ).to_list()

    summary, _ = aggregate_records(records)
    return {
        "total_out": summary.total_out,
        "total_in": summary.total_in,
        "diff": summary.diff,
    }


@router.get("")
async def list_factories(
    keyword: str | None = Query(None),
    user: User = Depends(get_current_user),
):
    factory_ids = await get_accessible_factory_ids(user.id)
    if not factory_ids:
        return success(
            {
                "today_summary": {"total_out": 0, "total_in": 0, "diff": 0},
                "deleted_count": 0,
                "list": [],
            }
        )

    factories = await Factory.find(
        In(Factory.id, factory_ids), Factory.deleted == False
    ).sort("-created_at").to_list()

    if keyword:
        kw = keyword.lower()
        factories = [f for f in factories if kw in f.name.lower()]

    deleted_count = await Factory.find(
        Factory.owner_id == user.id, Factory.deleted == True
    ).count()

    items = []
    for factory in factories:
        style_count = await Style.find(
            Style.factory_id == factory.id, Style.deleted == False
        ).count()
        role = await get_user_role(factory.id, user.id) or "member"
        items.append(
            {
                "id": factory.id,
                "name": factory.name,
                "style_count": style_count,
                "role": role,
                "created_at": factory.created_at,
            }
        )

    return success(
        {
            "today_summary": await _today_summary(factory_ids),
            "deleted_count": deleted_count,
            "list": items,
        }
    )


@router.post("")
async def create_factory(body: FactoryCreate, user: User = Depends(get_current_user)):
    factory = Factory(name=body.name.strip(), owner_id=user.id)
    await factory.insert()

    member = FactoryMember(factory_id=factory.id, user_id=user.id, role="owner")
    await member.insert()

    return success({"id": factory.id, "name": factory.name}, "创建成功")


@router.get("/{factory_id}")
async def get_factory(factory_id: str, user: User = Depends(get_current_user)):
    await check_access(factory_id, user)
    factory = await Factory.get(factory_id)
    if factory is None or factory.deleted:
        raise not_found("工厂不存在")
    role = await get_user_role(factory_id, user.id)
    return success(
        {
            "id": factory.id,
            "name": factory.name,
            "role": role,
            "created_at": factory.created_at,
        }
    )


@router.patch("/{factory_id}")
async def update_factory(
    factory_id: str,
    body: FactoryUpdate,
    user: User = Depends(get_current_user),
):
    factory = await check_owner(factory_id, user)
    factory.name = body.name.strip()
    factory.updated_at = utcnow()
    await factory.save()
    return success({"id": factory.id, "name": factory.name}, "已保存")


@router.delete("/{factory_id}")
async def delete_factory(factory_id: str, user: User = Depends(get_current_user)):
    factory = await check_owner(factory_id, user)
    now = utcnow()
    factory.deleted = True
    factory.deleted_at = now
    factory.updated_at = now
    await factory.save()

    styles = await Style.find(Style.factory_id == factory_id, Style.deleted == False).to_list()
    for style in styles:
        style.deleted = True
        style.deleted_at = now
        style.updated_at = now
        await style.save()

    return success(None, "已移入回收站")
