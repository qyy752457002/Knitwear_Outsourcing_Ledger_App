from datetime import datetime

from beanie import Document
from pydantic import Field
from pymongo import IndexModel

from app.models.user import utcnow


class Style(Document):
    factory_id: str
    style_code: str
    unit_price: float = 0.0
    colors: list[str] = Field(default_factory=list)
    deleted: bool = False
    deleted_at: datetime | None = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "styles"
        indexes = [
            IndexModel([("factory_id", 1), ("deleted", 1), ("created_at", -1)]),
            IndexModel([("factory_id", 1), ("style_code", 1)]),
        ]
