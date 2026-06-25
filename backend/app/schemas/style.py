from datetime import datetime

from pydantic import BaseModel, Field


class StyleCreate(BaseModel):
    style_code: str = Field(..., min_length=1, max_length=50)
    unit_price: float = Field(0, ge=0)
    colors: list[str] = Field(..., min_length=1)


class StyleUpdate(BaseModel):
    style_code: str | None = Field(None, min_length=1, max_length=50)
    unit_price: float | None = Field(None, ge=0)
    colors: list[str] | None = Field(None, min_length=1)


class StyleItem(BaseModel):
    id: str
    style_code: str
    unit_price: float
    colors: list[str]
    color_count: int
    created_at: datetime


class StyleListResponse(BaseModel):
    factory_name: str
    deleted_count: int = 0
    list: list[StyleItem]


class AddColorRequest(BaseModel):
    color: str = Field(..., min_length=1, max_length=50)
