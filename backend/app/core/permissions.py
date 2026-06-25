from beanie import PydanticObjectId

from app.core.exceptions import forbidden, not_found
from app.models.factory import Factory, FactoryMember
from app.models.user import User


def _id(value: str | PydanticObjectId) -> str:
    return str(value)


async def get_accessible_factory_ids(user_id: str | PydanticObjectId) -> list[str]:
    user_id = _id(user_id)
    memberships = await FactoryMember.find(FactoryMember.user_id == user_id).to_list()
    return [m.factory_id for m in memberships]


async def get_membership(
    factory_id: str | PydanticObjectId, user_id: str | PydanticObjectId
) -> FactoryMember | None:
    return await FactoryMember.find_one(
        FactoryMember.factory_id == _id(factory_id),
        FactoryMember.user_id == _id(user_id),
    )


async def check_access(factory_id: str, user: User) -> FactoryMember:
    membership = await get_membership(factory_id, user.id)
    if membership is None:
        raise forbidden("无权查看该工厂数据")
    return membership


async def check_owner(factory_id: str, user: User) -> Factory:
    factory = await Factory.get(factory_id)
    if factory is None or factory.deleted:
        raise not_found("工厂不存在")
    if _id(factory.owner_id) != _id(user.id):
        raise forbidden("无权操作")
    return factory


async def get_user_role(
    factory_id: str | PydanticObjectId, user_id: str | PydanticObjectId
) -> str | None:
    membership = await get_membership(factory_id, user_id)
    return membership.role if membership else None
