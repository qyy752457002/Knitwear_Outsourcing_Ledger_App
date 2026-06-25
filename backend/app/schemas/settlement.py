from datetime import date, datetime

from pydantic import BaseModel, Field


class SettlementUpsert(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    status: str = Field(..., pattern="^(settled|unsettled)$")


class SettlementResponse(BaseModel):
    status: str
    date_from: date | None = None
    date_to: date | None = None
    marked_by: str | None = None
    marked_at: datetime | None = None
