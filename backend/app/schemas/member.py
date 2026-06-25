from datetime import datetime

from pydantic import BaseModel, Field


class MemberItem(BaseModel):
    user_id: str
    nickname: str
    role: str
    joined_at: datetime


class MemberListResponse(BaseModel):
    factory_id: str
    factory_name: str
    current_user_role: str
    members: list[MemberItem]


class InvitationResponse(BaseModel):
    code: str
    factory_id: str
    factory_name: str
    expire_at: datetime
    share_url: str


class AcceptInvitationRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)
