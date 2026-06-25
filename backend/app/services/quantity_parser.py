import re

from app.core.exceptions import validation_error


def parse_quantity(input_str: str) -> int:
    text = input_str.strip()
    if not text:
        raise validation_error("数量不能为空")

    if re.fullmatch(r"\d+", text):
        return int(text)

    match = re.fullmatch(r"(\d+(?:\.\d+)?)打(\d*)", text)
    if match:
        da = float(match.group(1))
        extra = int(match.group(2)) if match.group(2) else 0
        return round(da * 12) + extra

    match = re.fullmatch(r"(\d+(?:\.\d+)?)打", text)
    if match:
        return round(float(match.group(1)) * 12)

    raise validation_error("格式错误，如: 36 / 3打 / 1打2")
