from pydantic import BaseModel, Field


class PhoneLoginRequest(BaseModel):
    phone: str = Field(..., min_length=11, max_length=20)
    sms_code: str = Field(..., min_length=4, max_length=8)


class WechatLoginRequest(BaseModel):
    code: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    user: "UserBrief"


class UserBrief(BaseModel):
    id: str
    nickname: str
    phone: str | None = None


class UpdateUserRequest(BaseModel):
    nickname: str | None = Field(None, min_length=1, max_length=64)
