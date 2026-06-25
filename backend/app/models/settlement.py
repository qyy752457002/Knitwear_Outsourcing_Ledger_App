from datetime import date, datetime

from beanie import Document
from pydantic import Field
from pymongo import IndexModel

from app.models.user import utcnow


class Settlement(Document):
    factory_id: str
    date_from: date | None = None
    date_to: date | None = None
    status: str = "unsettled"  # settled | unsettled
    marked_by: str | None = None
    marked_at: datetime | None = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "settlements"
        indexes = [
            IndexModel([("factory_id", 1), ("date_from", 1), ("date_to", 1)], unique=True),
        ]
