import random
import string
from datetime import timedelta

from fastapi import APIRouter, Depends, Query

from app.core.exceptions import conflict, not_found, validation_error
from app.core.permissions import check_access, check_owner, get_accessible_factory_ids
from app.dependencies import get_current_user, success
from app.models.factory import Factory, FactoryMember
from app.models.invitation import Invitation
from app.models.user import User, utcnow
from app.schemas.member import AcceptInvitationRequest

router = APIRouter(tags=["成员与邀请"])


def _generate_code() -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=6))


@router.get("/factories/{factory_id}/members")
async def list_members(factory_id: str, user: User = Depends(get_current_user)):
    await check_access(factory_id, user)
    factory = await Factory.get(factory_id)
    if factory is None:
        raise not_found("工厂不存在")

    memberships = await FactoryMember.find(
        FactoryMember.factory_id == factory_id
    ).sort("-joined_at").to_list()

    members = []
    for m in memberships:
        member_user = await User.get(m.user_id)
        members.append(
            {
                "user_id": m.user_id,
                "nickname": member_user.nickname if member_user else "未知用户",
                "role": m.role,
                "joined_at": m.joined_at,
            }
        )

    current_role = next((m.role for m in memberships if m.user_id == user.id), "member")
    members.sort(key=lambda x: (0 if x["role"] == "owner" else 1, x["joined_at"]), reverse=False)

    return success(
        {
            "factory_id": factory_id,
            "factory_name": factory.name,
            "current_user_role": current_role,
            "members": members,
        }
    )


@router.delete("/factories/{factory_id}/members/{member_user_id}")
async def remove_member(
    factory_id: str,
    member_user_id: str,
    user: User = Depends(get_current_user),
):
    await check_owner(factory_id, user)
    if member_user_id == user.id:
        raise validation_error("不可移除自己")

    membership = await FactoryMember.find_one(
        FactoryMember.factory_id == factory_id,
        FactoryMember.user_id == member_user_id,
    )
    if membership is None:
        raise not_found("成员不存在")
    if membership.role == "owner":
        raise validation_error("不可移除老板")

    await membership.delete()
    return success(None, "已移除")


@router.post("/factories/{factory_id}/invitations")
async def create_invitation(factory_id: str, user: User = Depends(get_current_user)):
    factory = await check_owner(factory_id, user)
    code = _generate_code()
    while await Invitation.find_one(Invitation.code == code):
        code = _generate_code()

    invitation = Invitation(
        factory_id=factory_id,
        factory_name=factory.name,
        inviter_id=user.id,
        code=code,
        expire_at=utcnow() + timedelta(days=7),
    )
    await invitation.insert()

    return success(
        {
            "code": invitation.code,
            "factory_id": factory_id,
            "factory_name": factory.name,
            "expire_at": invitation.expire_at,
            "share_url": f"app://invite?code={code}",
        }
    )


@router.post("/invitations/accept")
async def accept_invitation(body: AcceptInvitationRequest, user: User = Depends(get_current_user)):
    invitation = await Invitation.find_one(Invitation.code == body.code.upper())
    if invitation is None:
        raise validation_error("邀请码无效")
    if invitation.expire_at < utcnow():
        raise validation_error("邀请码已过期")
    if invitation.used_by:
        raise conflict("邀请码已使用")

    factory = await Factory.get(invitation.factory_id)
    if factory is None or factory.deleted:
        raise not_found("工厂不存在")

    existing = await FactoryMember.find_one(
        FactoryMember.factory_id == invitation.factory_id,
        FactoryMember.user_id == user.id,
    )
    if existing:
        raise conflict("您已是该工厂成员")

    member = FactoryMember(
        factory_id=invitation.factory_id,
        user_id=user.id,
        role="member",
    )
    await member.insert()

    invitation.used_by = user.id
    invitation.used_at = utcnow()
    await invitation.save()

    return success(
        {"factory_id": invitation.factory_id, "factory_name": invitation.factory_name}
    )


@router.get("/me/members")
async def my_members(
    factory_id: str | None = Query(None),
    user: User = Depends(get_current_user),
):
    if factory_id is None:
        memberships = await FactoryMember.find(
            FactoryMember.user_id == user.id
        ).sort("-joined_at").to_list()
        if not memberships:
            return success({"members": [], "factory_id": None, "factory_name": None})
        factory_id = memberships[0].factory_id

    return await list_members(factory_id, user)
