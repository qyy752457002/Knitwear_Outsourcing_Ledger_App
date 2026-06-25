from datetime import date

from app.models.record import Record
from app.models.style import Style
from app.schemas.record import ColorDetail, RecordSummary
from app.schemas.stats import ColorStat, StyleStat, SummaryStat


def round2(value: float) -> float:
    return round(value, 2)


def diff_label(diff: int) -> str:
    if diff > 0:
        return f"{diff} 欠"
    if diff < 0:
        return f"{abs(diff)} 超"
    return "平"


def aggregate_records(
    records: list[Record],
    unit_price: float = 0.0,
    colors: list[str] | None = None,
) -> tuple[SummaryStat, list[ColorStat]]:
    color_map: dict[str, dict[str, int]] = {}
    if colors:
        for c in colors:
            color_map[c] = {"out": 0, "in": 0}

    total_out = 0
    total_in = 0

    for record in records:
        for color, qty in record.items.items():
            if color not in color_map:
                color_map[color] = {"out": 0, "in": 0}
            if record.type == "out":
                color_map[color]["out"] += qty
                total_out += qty
            else:
                color_map[color]["in"] += qty
                total_in += qty

    diff = total_out - total_in
    payable = round2(total_in * unit_price)

    color_stats = [
        ColorStat(
            color=color,
            out=vals["out"],
            in_=vals["in"],
            diff=vals["out"] - vals["in"],
            diff_label=diff_label(vals["out"] - vals["in"]),
        )
        for color, vals in color_map.items()
    ]

    summary = SummaryStat(
        total_out=total_out,
        total_in=total_in,
        diff=diff,
        payable=payable,
    )
    return summary, color_stats


def build_record_summary(records: list[Record], unit_price: float, colors: list[str]) -> RecordSummary:
    summary, color_stats = aggregate_records(records, unit_price, colors)
    return RecordSummary(
        total_out=summary.total_out,
        total_in=summary.total_in,
        diff=summary.diff,
        payable=summary.payable,
        color_details=[
            ColorDetail(color=c.color, out=c.out, in_=c.in_, diff=c.diff)
            for c in color_stats
        ],
    )


def filter_records_by_date(
    records: list[Record],
    date_from: date | None,
    date_to: date | None,
) -> list[Record]:
    result = records
    if date_from:
        result = [r for r in result if r.date >= date_from]
    if date_to:
        result = [r for r in result if r.date <= date_to]
    return result


async def compute_style_stats(
    styles: list[Style],
    date_from: date | None = None,
    date_to: date | None = None,
    style_id: str | None = None,
) -> list[StyleStat]:
    if style_id:
        styles = [s for s in styles if s.id == style_id]

    stats: list[StyleStat] = []
    for style in styles:
        records = await Record.find(Record.style_id == style.id).to_list()
        records = filter_records_by_date(records, date_from, date_to)
        summary, color_stats = aggregate_records(records, style.unit_price, style.colors)
        stats.append(
            StyleStat(
                style_id=style.id,
                style_code=style.style_code,
                unit_price=style.unit_price,
                total_out=summary.total_out,
                total_in=summary.total_in,
                diff=summary.diff,
                payable=summary.payable,
                color_stats=color_stats,
            )
        )
    return stats
