class AppException(Exception):
    """Base application exception mapped to an HTTP response by the global handler."""

    status_code: int = 400

    def __init__(self, message: str, status_code: int | None = None):
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        super().__init__(message)


class NotFoundException(AppException):
    status_code = 404


class ValidationException(AppException):
    status_code = 422


class ProviderException(AppException):
    status_code = 502


class RateLimitException(AppException):
    status_code = 429


class UnauthorizedException(AppException):
    status_code = 401
