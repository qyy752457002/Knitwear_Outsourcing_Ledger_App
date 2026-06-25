import secrets
import string
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter

from app.config import get_settings
from app.core.exceptions import validation_error
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.dependencies import success
from app.models.user import User, utcnow
from app.schemas.auth import (
    PhoneLoginRequest,
    RefreshTokenRequest,
    WechatLoginRequest,
)

router = APIRouter(prefix="/auth", tags=["认证"])


def _token_payload(user: User) -> dict:
    settings = get_settings()
    user_id = str(user.id)
    return {
        "access_token": create_access_token(user_id),
        "refresh_token": create_refresh_token(user_id),
        "expires_in": settings.access_token_expire_minutes * 60,
        "user": {
            "id": user_id,
            "nickname": user.nickname,
            "phone": user.phone,
        },
    }


@router.post("/phone/login")
async def phone_login(body: PhoneLoginRequest):
    settings = get_settings()
    if body.sms_code != settings.dev_sms_code:
        raise validation_error("验证码错误")

    user = await User.find_one(User.phone == body.phone)
    if user is None:
        nickname = f"用户{body.phone[-4:]}"
        user = User(phone=body.phone, nickname=nickname)
        await user.insert()
    else:
        user.updated_at = utcnow()
        await user.save()

    return success(_token_payload(user))


@router.post("/wechat/login")
async def wechat_login(body: WechatLoginRequest):
    # 开发环境：用 code 模拟 openid
    openid = f"wx_{body.code}"

    user = await User.find_one(User.wechat_openid == openid)
    if user is None:
        user = User(wechat_openid=openid, nickname=f"微信用户{openid[-4:]}")
        await user.insert()
    else:
        user.updated_at = utcnow()
        await user.save()

    return success(_token_payload(user))


@router.post("/refresh")
async def refresh_token(body: RefreshTokenRequest):
    try:
        payload = decode_token(body.refresh_token)
    except ValueError as exc:
        raise validation_error("Refresh Token 无效") from exc

    if payload.get("type") != "refresh":
        raise validation_error("Token 类型无效")

    user = await User.get(payload["sub"])
    if user is None:
        raise validation_error("用户不存在")

    return success(_token_payload(user))
