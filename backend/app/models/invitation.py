from datetime import datetime

from beanie import Document
from pydantic import Field
from pymongo import IndexModel

from app.models.user import utcnow


class Invitation(Document):
    factory_id: str
    factory_name: str
    inviter_id: str
    code: str
    expire_at: datetime
    used_by: str | None = None
    used_at: datetime | None = None
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "invitations"
        indexes = [
            IndexModel([("code", 1)], unique=True),
            IndexModel([("factory_id", 1), ("expire_at", -1)]),
        ]
