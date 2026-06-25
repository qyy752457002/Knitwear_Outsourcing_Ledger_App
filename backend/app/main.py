from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import close_db, connect_db
from app.routers import (
    auth,
    factories,
    members,
    records,
    recycle_bin,
    settlements,
    stats,
    styles,
    users,
    utils,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="毛织厂外协收发记账 API",
    description="前后端分离 RESTful 后端（FastAPI + MongoDB）",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

prefix = settings.api_prefix
app.include_router(auth.router, prefix=prefix)
app.include_router(users.router, prefix=prefix)
app.include_router(factories.router, prefix=prefix)
app.include_router(styles.router, prefix=prefix)
app.include_router(records.router, prefix=prefix)
app.include_router(stats.router, prefix=prefix)
app.include_router(settlements.router, prefix=prefix)
app.include_router(members.router, prefix=prefix)
app.include_router(recycle_bin.router, prefix=prefix)
app.include_router(utils.router, prefix=prefix)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"code": 40007, "message": "参数校验失败", "data": exc.errors()},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"message": "TQ Accounting API", "docs": "/docs"}
