from beanie.operators import In

from fastapi import APIRouter, Depends, Query

from app.core.exceptions import not_found
from app.core.permissions import check_access, check_owner, get_accessible_factory_ids
from app.dependencies import get_current_user, success
from app.models.factory import Factory, FactoryMember
from app.models.invitation import Invitation
from app.models.record import Record
from app.models.settlement import Settlement
from app.models.style import Style
from app.models.user import User, utcnow

router = APIRouter(prefix="/recycle-bin", tags=["回收站"])


@router.get("/factories")
async def list_deleted_factories(user: User = Depends(get_current_user)):
    factories = await Factory.find(
        Factory.owner_id == user.id, Factory.deleted == True
    ).sort("-deleted_at").to_list()

    return success(
        {
            "list": [
                {
                    "id": f.id,
                    "name": f.name,
                    "deleted_at": f.deleted_at,
                }
                for f in factories
            ]
        }
    )


@router.get("/styles")
async def list_deleted_styles(
    factory_id: str | None = Query(None),
    user: User = Depends(get_current_user),
):
    accessible_ids = await get_accessible_factory_ids(user.id)
    if factory_id:
        if factory_id not in accessible_ids:
            return success({"list": []})
        query_ids = [factory_id]
    else:
        query_ids = accessible_ids

    if not query_ids:
        return success({"list": []})

    styles = await Style.find(
        In(Style.factory_id, query_ids), Style.deleted == True
    ).sort("-deleted_at").to_list()

    items = []
    for style in styles:
        factory = await Factory.get(style.factory_id)
        items.append(
            {
                "id": style.id,
                "style_code": style.style_code,
                "factory_id": style.factory_id,
                "factory_name": factory.name if factory else "",
                "deleted_at": style.deleted_at,
            }
        )

    return success({"list": items})


@router.post("/factories/{factory_id}/restore")
async def restore_factory(factory_id: str, user: User = Depends(get_current_user)):
    factory = await Factory.get(factory_id)
    if factory is None or not factory.deleted:
        raise not_found("工厂不存在")
    if factory.owner_id != user.id:
        raise not_found("工厂不存在")

    factory.deleted = False
    factory.deleted_at = None
    factory.updated_at = utcnow()
    await factory.save()

    styles = await Style.find(Style.factory_id == factory_id, Style.deleted == True).to_list()
    for style in styles:
        style.deleted = False
        style.deleted_at = None
        style.updated_at = utcnow()
        await style.save()

    return success(None, "已恢复")


@router.post("/styles/{style_id}/restore")
async def restore_style(style_id: str, user: User = Depends(get_current_user)):
    style = await Style.get(style_id)
    if style is None or not style.deleted:
        raise not_found("款式不存在")
    await check_owner(style.factory_id, user)

    style.deleted = False
    style.deleted_at = None
    style.updated_at = utcnow()
    await style.save()
    return success(None, "已恢复")


async def _purge_factory(factory_id: str) -> None:
    await Record.find(Record.factory_id == factory_id).delete()
    await Style.find(Style.factory_id == factory_id).delete()
    await Settlement.find(Settlement.factory_id == factory_id).delete()
    await Invitation.find(Invitation.factory_id == factory_id).delete()
    await FactoryMember.find(FactoryMember.factory_id == factory_id).delete()
    factory = await Factory.get(factory_id)
    if factory:
        await factory.delete()


@router.delete("/factories/{factory_id}/permanent")
async def permanent_delete_factory(factory_id: str, user: User = Depends(get_current_user)):
    factory = await Factory.get(factory_id)
    if factory is None or not factory.deleted:
        raise not_found("工厂不存在")
    if factory.owner_id != user.id:
        raise not_found("工厂不存在")

    await _purge_factory(factory_id)
    return success(None, "已删除")


@router.delete("/styles/{style_id}/permanent")
async def permanent_delete_style(style_id: str, user: User = Depends(get_current_user)):
    style = await Style.get(style_id)
    if style is None or not style.deleted:
        raise not_found("款式不存在")
    await check_owner(style.factory_id, user)

    await Record.find(Record.style_id == style_id).delete()
    await style.delete()
    return success(None, "已删除")
