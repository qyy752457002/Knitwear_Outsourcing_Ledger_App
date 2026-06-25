from datetime import datetime

from pydantic import BaseModel, Field


class FactoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class FactoryUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class FactoryItem(BaseModel):
    id: str
    name: str
    style_count: int = 0
    role: str
    created_at: datetime


class TodaySummary(BaseModel):
    total_out: int = 0
    total_in: int = 0
    diff: int = 0


class FactoryListResponse(BaseModel):
    today_summary: TodaySummary
    deleted_count: int = 0
    list: list[FactoryItem]
