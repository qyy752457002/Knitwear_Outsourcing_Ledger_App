from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import get_settings
from app.models.factory import Factory, FactoryMember
from app.models.invitation import Invitation
from app.models.record import Record
from app.models.settlement import Settlement
from app.models.style import Style
from app.models.user import User

_client: AsyncIOMotorClient | None = None


async def connect_db() -> None:
    global _client
    settings = get_settings()
    _client = AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(
        database=_client[settings.mongodb_db],
        document_models=[
            User,
            Factory,
            FactoryMember,
            Style,
            Record,
            Settlement,
            Invitation,
        ],
    )


async def close_db() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
