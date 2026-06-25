from datetime import datetime, timezone

from beanie import Document
from pydantic import Field
from pymongo import IndexModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Document):
    nickname: str = ""
    phone: str | None = None
    wechat_openid: str | None = None
    wechat_unionid: str | None = None
    avatar_url: str | None = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "users"
        indexes = [
            IndexModel([("phone", 1)], unique=True, sparse=True),
            IndexModel([("wechat_openid", 1)], unique=True, sparse=True),
        ]
