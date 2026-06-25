from datetime import date as DateType, datetime

from pydantic import BaseModel, Field


class RecordCreate(BaseModel):
    type: str = Field(..., pattern="^(out|in)$")
    date: DateType
    items: dict[str, int] = Field(default_factory=dict)
    remark: str | None = Field(None, max_length=500)


class RecordUpdate(BaseModel):
    date: DateType | None = None
    items: dict[str, int] | None = None
    remark: str | None = Field(None, max_length=500)


class RecordCellUpdate(BaseModel):
    type: str = Field(..., pattern="^(out|in)$")
    date: DateType
    color: str
    qty: int = Field(..., ge=0)
    remark: str | None = Field(None, max_length=500)


class RecordItem(BaseModel):
    id: str
    type: str
    date: DateType
    items: dict[str, int]
    remark: str | None = None
    created_by: str
    updated_at: datetime


class ColorDetail(BaseModel):
    color: str
    out: int = 0
    in_: int = Field(0, alias="in")
    diff: int = 0

    model_config = {"populate_by_name": True}


class RecordSummary(BaseModel):
    total_out: int = 0
    total_in: int = 0
    diff: int = 0
    payable: float = 0.0
    color_details: list[ColorDetail] = []


class StyleBrief(BaseModel):
    id: str
    style_code: str
    unit_price: float
    colors: list[str]


class RecordListResponse(BaseModel):
    style: StyleBrief
    records: list[RecordItem]
    summary: RecordSummary
