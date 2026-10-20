"""Custom exceptions and standardized error responses for the API."""

import logging

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class APIError(Exception):
    """Base class for API errors handled by the global exception handlers."""

    code = "INTERNAL_ERROR"
    http_status = 500
    message = "An internal error occurred."

    def __init__(self, message: str | None = None) -> None:
        resolved_message = message or self.message
        super().__init__(resolved_message)
        self.message = resolved_message


class EmptyReviewError(APIError):
    code = "EMPTY_REVIEW"
    http_status = 400
    message = "Review text is empty or whitespace-only."


class FileTooLargeError(APIError):
    code = "FILE_TOO_LARGE"
    http_status = 413
    message = "Uploaded file exceeds the maximum allowed size."


class MissingColumnError(APIError):
    code = "MISSING_COLUMN"
    http_status = 400
    message = "Required column is missing from the uploaded file."


class ModelNotFoundError(APIError):
    code = "MODEL_NOT_FOUND"
    http_status = 400
    message = "Requested model is not available."


class ValidationError(APIError):
    code = "VALIDATION_ERROR"
    http_status = 422
    message = "Request validation failed."


async def api_error_handler(_: Request, exc: APIError) -> JSONResponse:
    """Format custom API errors into the standard error shape."""
    return JSONResponse(
        status_code=exc.http_status,
        content={"error": True, "code": exc.code, "message": exc.message},
    )


async def request_validation_error_handler(
    _: Request, exc: RequestValidationError
) -> JSONResponse:
    """Collapse FastAPI validation details into the standard error shape."""
    message = "; ".join(error["msg"] for error in exc.errors()) or ValidationError.message
    return JSONResponse(
        status_code=422,
        content={
            "error": True,
            "code": ValidationError.code,
            "message": message,
        },
    )


async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    """Log the real error server-side and return a generic message to clients."""
    logger.error("Unhandled exception", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "code": APIError.code,
            "message": APIError.message,
        },
    )
