from datetime import date, datetime

from pydantic import BaseModel, Field


class StatsQuery(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    style_id: str | None = None


class ColorStat(BaseModel):
    color: str
    out: int = 0
    in_: int = Field(0, alias="in")
    diff: int = 0
    diff_label: str = "平"

    model_config = {"populate_by_name": True}


class StyleStat(BaseModel):
    style_id: str
    style_code: str
    unit_price: float
    total_out: int = 0
    total_in: int = 0
    diff: int = 0
    payable: float = 0.0
    color_stats: list[ColorStat] = []


class SummaryStat(BaseModel):
    total_out: int = 0
    total_in: int = 0
    diff: int = 0
    payable: float = 0.0


class SettlementBrief(BaseModel):
    status: str = "unsettled"
    marked_at: datetime | None = None


class FactoryStatsResponse(BaseModel):
    factory_id: str
    factory_name: str
    date_from: date | None = None
    date_to: date | None = None
    summary: SummaryStat
    settlement: SettlementBrief
    style_stats: list[StyleStat] = []


class ReconciliationCardRequest(BaseModel):
    date_from: date | None = None
    date_to: date | None = None


class ReconciliationStyleItem(BaseModel):
    style_code: str
    total_in: int
    payable: float


class ReconciliationCardResponse(BaseModel):
    factory_name: str
    date_from: date | None = None
    date_to: date | None = None
    summary: SummaryStat
    style_stats: list[ReconciliationStyleItem]
    generated_at: datetime
