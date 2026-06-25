from datetime import datetime

from beanie import Document
from pydantic import Field
from pymongo import IndexModel

from app.models.user import utcnow


class Factory(Document):
    name: str
    owner_id: str
    deleted: bool = False
    deleted_at: datetime | None = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "factories"
        indexes = [
            IndexModel([("owner_id", 1), ("deleted", 1), ("created_at", -1)]),
            IndexModel([("deleted", 1), ("owner_id", 1)]),
        ]


class FactoryMember(Document):
    factory_id: str
    user_id: str
    role: str  # owner | member
    joined_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "factory_members"
        indexes = [
            IndexModel([("factory_id", 1), ("user_id", 1)], unique=True),
            IndexModel([("user_id", 1)]),
        ]
