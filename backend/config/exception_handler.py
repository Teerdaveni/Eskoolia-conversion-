"""
Custom Exception Handler for Django REST Framework.
Provides standardized error responses across the API.
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import APIException, ValidationError as DRFValidationError


def _first_error_message(detail):
    if isinstance(detail, str):
        return detail

    if isinstance(detail, list):
        for item in detail:
            message = _first_error_message(item)
            if message:
                return message
        return None

    if isinstance(detail, dict):
        non_field = detail.get("non_field_errors")
        if non_field:
            message = _first_error_message(non_field)
            if message:
                return message

        for value in detail.values():
            message = _first_error_message(value)
            if message:
                return message

    return None


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns standardized error responses.
    
    Args:
        exc: The exception that was raised
        context: Context information about the request
    
    Returns:
        Response with standardized error format
    """
    
    # Return a clean validation message with no nested non_field_errors structure.
    if isinstance(exc, DRFValidationError):
        message = _first_error_message(exc.detail) or "Validation failed"
        return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

    # Handle our custom API exceptions
    if isinstance(exc, APIException):
        if hasattr(exc, 'get_response_data'):
            # Our custom exception with get_response_data method
            return Response(exc.get_response_data(), status=exc.status_code)
        else:
            # Standard DRF exception
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": getattr(exc, 'default_code', 'error'),
                        "message": str(exc.detail),
                    },
                },
                status=exc.status_code,
            )
    
    # Handle validation errors
    elif isinstance(exc, Exception) and hasattr(exc, 'messages'):
        return Response(
            {
                "success": False,
                "error": {
                    "code": "validation_error",
                    "message": "Validation failed",
                    "details": exc.messages if isinstance(exc.messages, dict) else str(exc.messages),
                },
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    # Handle generic exceptions
    else:
        return Response(
            {
                "success": False,
                "error": {
                    "code": "internal_server_error",
                    "message": "An unexpected error occurred",
                },
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
