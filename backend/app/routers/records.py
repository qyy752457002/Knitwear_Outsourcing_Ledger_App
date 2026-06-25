from fastapi import APIRouter, Depends

from app.core.exceptions import not_found, validation_error
from app.core.permissions import check_access, check_owner
from app.dependencies import get_current_user, success
from app.models.record import Record
from app.models.style import Style
from app.models.user import User, utcnow
from app.schemas.record import RecordCellUpdate, RecordCreate, RecordUpdate
from app.services.stats_service import build_record_summary

router = APIRouter(
    prefix="/factories/{factory_id}/styles/{style_id}/records",
    tags=["收发记录"],
)


async def _get_style(factory_id: str, style_id: str) -> Style:
    style = await Style.get(style_id)
    if style is None or style.deleted or style.factory_id != factory_id:
        raise not_found("款式不存在")
    return style


def _validate_items(style: Style, items: dict[str, int]) -> None:
    for color in items:
        if color not in style.colors:
            raise validation_error(f"颜色「{color}」不属于该款式")


@router.get("")
async def list_records(
    factory_id: str,
    style_id: str,
    user: User = Depends(get_current_user),
):
    await check_access(factory_id, user)
    style = await _get_style(factory_id, style_id)
    records = await Record.find(Record.style_id == style_id).sort("-date").to_list()

    summary = build_record_summary(records, style.unit_price, style.colors)

    return success(
        {
            "style": {
                "id": style.id,
                "style_code": style.style_code,
                "unit_price": style.unit_price,
                "colors": style.colors,
            },
            "records": [
                {
                    "id": r.id,
                    "type": r.type,
                    "date": r.date.isoformat(),
                    "items": r.items,
                    "remark": r.remark,
                    "created_by": r.created_by,
                    "updated_at": r.updated_at,
                }
                for r in records
            ],
            "summary": summary.model_dump(by_alias=True),
        }
    )


@router.post("")
async def create_record(
    factory_id: str,
    style_id: str,
    body: RecordCreate,
    user: User = Depends(get_current_user),
):
    await check_owner(factory_id, user)
    style = await _get_style(factory_id, style_id)
    _validate_items(style, body.items)

    existing = await Record.find_one(
        Record.style_id == style_id,
        Record.type == body.type,
        Record.date == body.date,
    )
    if existing:
        raise validation_error("该日期已有记录，请使用更新接口")

    record = Record(
        factory_id=factory_id,
        style_id=style_id,
        type=body.type,
        date=body.date,
        items=body.items,
        remark=body.remark if body.type == "out" else None,
        created_by=user.id,
    )
    await record.insert()
    return success({"id": record.id, "type": record.type, "date": record.date.isoformat()})


@router.patch("/{record_id}")
async def update_record(
    factory_id: str,
    style_id: str,
    record_id: str,
    body: RecordUpdate,
    user: User = Depends(get_current_user),
):
    await check_owner(factory_id, user)
    style = await _get_style(factory_id, style_id)
    record = await Record.get(record_id)
    if record is None or record.style_id != style_id:
        raise not_found("记录不存在")

    if body.date is not None and body.date != record.date:
        conflict_record = await Record.find_one(
            Record.style_id == style_id,
            Record.type == record.type,
            Record.date == body.date,
        )
        if conflict_record and conflict_record.id != record.id:
            raise validation_error("目标日期已有同类型记录")
        record.date = body.date

    if body.items is not None:
        _validate_items(style, body.items)
        record.items = body.items

    if body.remark is not None and record.type == "out":
        record.remark = body.remark

    record.updated_at = utcnow()
    await record.save()
    return success({"id": record.id})


@router.put("/cell")
async def update_cell(
    factory_id: str,
    style_id: str,
    body: RecordCellUpdate,
    user: User = Depends(get_current_user),
):
    await check_owner(factory_id, user)
    style = await _get_style(factory_id, style_id)
    if body.color not in style.colors:
        raise validation_error(f"颜色「{body.color}」不属于该款式")

    record = await Record.find_one(
        Record.style_id == style_id,
        Record.type == body.type,
        Record.date == body.date,
    )

    if body.qty == 0:
        if record is None:
            return success(None)
        items = dict(record.items)
        items.pop(body.color, None)
        if not items:
            await record.delete()
            return success(None)
        record.items = items
        record.updated_at = utcnow()
        await record.save()
        return success({"id": record.id, "items": record.items})

    if record is None:
        record = Record(
            factory_id=factory_id,
            style_id=style_id,
            type=body.type,
            date=body.date,
            items={body.color: body.qty},
            remark=body.remark if body.type == "out" else None,
            created_by=user.id,
        )
        await record.insert()
    else:
        items = dict(record.items)
        items[body.color] = body.qty
        record.items = items
        if body.remark is not None and body.type == "out":
            record.remark = body.remark
        record.updated_at = utcnow()
        await record.save()

    return success({"id": record.id, "items": record.items})


@router.delete("/{record_id}")
async def delete_record(
    factory_id: str,
    style_id: str,
    record_id: str,
    user: User = Depends(get_current_user),
):
    await check_owner(factory_id, user)
    record = await Record.get(record_id)
    if record is None or record.style_id != style_id:
        raise not_found("记录不存在")
    await record.delete()
    return success(None, "已删除")
