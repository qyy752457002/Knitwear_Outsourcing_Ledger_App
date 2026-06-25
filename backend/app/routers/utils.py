from pydantic import BaseModel

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user, success
from app.models.user import User
from app.services.quantity_parser import parse_quantity

router = APIRouter(prefix="/utils", tags=["工具"])


class ParseQuantityRequest(BaseModel):
    input: str


@router.post("/parse-quantity")
async def parse_quantity_api(
    body: ParseQuantityRequest,
    user: User = Depends(get_current_user),
):
    pieces = parse_quantity(body.input)
    return success({"pieces": pieces, "parsed": True})
