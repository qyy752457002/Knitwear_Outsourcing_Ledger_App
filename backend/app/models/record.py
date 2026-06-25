from datetime import date, datetime

from beanie import Document
from pydantic import Field
from pymongo import IndexModel

from app.models.user import utcnow


class Record(Document):
    factory_id: str
    style_id: str
    type: str  # out | in
    date: date
    items: dict[str, int] = Field(default_factory=dict)
    remark: str | None = None
    created_by: str
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "records"
        indexes = [
            IndexModel([("style_id", 1), ("date", -1)]),
            IndexModel([("factory_id", 1), ("date", 1)]),
            IndexModel([("style_id", 1), ("type", 1), ("date", 1)], unique=True),
        ]
