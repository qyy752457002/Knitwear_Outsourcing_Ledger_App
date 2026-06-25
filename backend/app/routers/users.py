from fastapi import APIRouter, Depends

from app.core.permissions import get_accessible_factory_ids
from app.dependencies import get_current_user, success
from app.models.user import User, utcnow
from app.schemas.auth import UpdateUserRequest

router = APIRouter(prefix="/users", tags=["用户"])


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    factory_ids = await get_accessible_factory_ids(user.id)
    return success(
        {
            "id": user.id,
            "nickname": user.nickname,
            "phone": user.phone,
            "factory_ids": factory_ids,
        }
    )


@router.patch("/me")
async def update_me(body: UpdateUserRequest, user: User = Depends(get_current_user)):
    if body.nickname is not None:
        user.nickname = body.nickname
    user.updated_at = utcnow()
    await user.save()
    return success({"id": user.id, "nickname": user.nickname, "phone": user.phone})
