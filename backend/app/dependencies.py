from typing import Any, Generic, TypeVar

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_token
from app.models.user import User

T = TypeVar("T")
security = HTTPBearer(auto_error=False)


class ApiResponse(Generic[T]):
    def __init__(self, data: T, message: str = "ok", code: int = 0):
        self.code = code
        self.message = message
        self.data = data


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": 40003, "message": "未登录或 Token 过期"},
        )
    try:
        payload = decode_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": 40003, "message": "未登录或 Token 过期"},
        ) from exc
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": 40003, "message": "Token 类型无效"},
        )
    user = await User.get(payload["sub"])
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": 40003, "message": "用户不存在"},
        )
    return user


def success(data: Any, message: str = "ok") -> dict[str, Any]:
    return {"code": 0, "message": message, "data": data}
