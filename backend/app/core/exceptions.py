from fastapi import HTTPException, status


class AppError(HTTPException):
    def __init__(self, code: int, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail={"code": code, "message": message})


def forbidden(message: str = "无权操作") -> AppError:
    return AppError(40001, message, status.HTTP_403_FORBIDDEN)


def not_found(message: str = "资源不存在") -> AppError:
    return AppError(40004, message, status.HTTP_404_NOT_FOUND)


def conflict(message: str) -> AppError:
    return AppError(40005, message, status.HTTP_409_CONFLICT)


def validation_error(message: str) -> AppError:
    return AppError(40007, message, status.HTTP_422_UNPROCESSABLE_ENTITY)
