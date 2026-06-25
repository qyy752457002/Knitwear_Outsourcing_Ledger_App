from fastapi import APIRouter, Depends

from app.core.exceptions import conflict, not_found, validation_error
from app.core.permissions import check_access, check_owner
from app.dependencies import get_current_user, success
from app.models.factory import Factory
from app.models.style import Style
from app.models.user import User, utcnow
from app.schemas.style import AddColorRequest, StyleCreate, StyleUpdate

router = APIRouter(prefix="/factories/{factory_id}/styles", tags=["款式"])


async def _get_active_style(factory_id: str, style_id: str) -> Style:
    style = await Style.get(style_id)
    if style is None or style.deleted or style.factory_id != factory_id:
        raise not_found("款式不存在")
    return style


@router.get("")
async def list_styles(factory_id: str, user: User = Depends(get_current_user)):
    await check_access(factory_id, user)
    factory = await Factory.get(factory_id)
    if factory is None:
        raise not_found("工厂不存在")

    styles = await Style.find(
        Style.factory_id == factory_id, Style.deleted == False
    ).sort("-created_at").to_list()

    deleted_count = await Style.find(
        Style.factory_id == factory_id, Style.deleted == True
    ).count()

    return success(
        {
            "factory_name": factory.name,
            "deleted_count": deleted_count,
            "list": [
                {
                    "id": s.id,
                    "style_code": s.style_code,
                    "unit_price": s.unit_price,
                    "colors": s.colors,
                    "color_count": len(s.colors),
                    "created_at": s.created_at,
                }
                for s in styles
            ],
        }
    )


@router.post("")
async def create_style(
    factory_id: str,
    body: StyleCreate,
    user: User = Depends(get_current_user),
):
    await check_owner(factory_id, user)

    colors = list(dict.fromkeys(c.strip() for c in body.colors if c.strip()))
    if not colors:
        raise validation_error("至少添加一种颜色")

    existing = await Style.find_one(
        Style.factory_id == factory_id,
        Style.style_code == body.style_code.strip(),
        Style.deleted == False,
    )
    if existing:
        raise conflict("款式编号重复")

    style = Style(
        factory_id=factory_id,
        style_code=body.style_code.strip(),
        unit_price=body.unit_price,
        colors=colors,
    )
    await style.insert()
    return success(
        {
            "id": style.id,
            "style_code": style.style_code,
            "unit_price": style.unit_price,
            "colors": style.colors,
        },
        "创建成功",
    )


@router.get("/{style_id}")
async def get_style(
    factory_id: str,
    style_id: str,
    user: User = Depends(get_current_user),
):
    await check_access(factory_id, user)
    style = await _get_active_style(factory_id, style_id)
    return success(
        {
            "id": style.id,
            "style_code": style.style_code,
            "unit_price": style.unit_price,
            "colors": style.colors,
        }
    )


@router.patch("/{style_id}")
async def update_style(
    factory_id: str,
    style_id: str,
    body: StyleUpdate,
    user: User = Depends(get_current_user),
):
    await check_owner(factory_id, user)
    style = await _get_active_style(factory_id, style_id)

    if body.style_code is not None:
        code = body.style_code.strip()
        existing = await Style.find_one(
            Style.factory_id == factory_id,
            Style.style_code == code,
            Style.deleted == False,
        )
        if existing and existing.id != style.id:
            raise conflict("款式编号重复")
        style.style_code = code

    if body.unit_price is not None:
        style.unit_price = body.unit_price

    if body.colors is not None:
        colors = list(dict.fromkeys(c.strip() for c in body.colors if c.strip()))
        if not colors:
            raise validation_error("至少保留一种颜色")
        style.colors = colors

    style.updated_at = utcnow()
    await style.save()
    return success(
        {
            "id": style.id,
            "style_code": style.style_code,
            "unit_price": style.unit_price,
            "colors": style.colors,
        },
        "已保存",
    )


@router.delete("/{style_id}")
async def delete_style(
    factory_id: str,
    style_id: str,
    user: User = Depends(get_current_user),
):
    await check_owner(factory_id, user)
    style = await _get_active_style(factory_id, style_id)
    now = utcnow()
    style.deleted = True
    style.deleted_at = now
    style.updated_at = now
    await style.save()
    return success(None, "已移入回收站")


@router.post("/{style_id}/colors")
async def add_color(
    factory_id: str,
    style_id: str,
    body: AddColorRequest,
    user: User = Depends(get_current_user),
):
    await check_owner(factory_id, user)
    style = await _get_active_style(factory_id, style_id)
    color = body.color.strip()
    if color in style.colors:
        raise conflict("此颜色已存在")
    style.colors.append(color)
    style.updated_at = utcnow()
    await style.save()
    return success({"colors": style.colors})


@router.delete("/{style_id}/colors/{color_name}")
async def remove_color(
    factory_id: str,
    style_id: str,
    color_name: str,
    user: User = Depends(get_current_user),
):
    await check_owner(factory_id, user)
    style = await _get_active_style(factory_id, style_id)
    if color_name not in style.colors:
        raise not_found("颜色不存在")
    if len(style.colors) <= 1:
        raise validation_error("至少保留一种颜色")
    style.colors = [c for c in style.colors if c != color_name]
    style.updated_at = utcnow()
    await style.save()
    return success({"colors": style.colors})
