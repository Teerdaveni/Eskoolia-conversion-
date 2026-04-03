from django.db.models import Q
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "school",
            "is_school_admin",
            "access_status",
            "due_fees_login_blocked",
        ]


class LoginTokenObtainPairSerializer(TokenObtainPairSerializer):
    # Keep request contract compatible with current frontend which posts "username" and "password".
    def validate(self, attrs):
        login_value = (attrs.get("username") or "").strip()
        password = attrs.get("password") or ""

        if not login_value or not password:
            raise AuthenticationFailed("Login credentials are not found.")

        candidates = User.objects.filter(
            Q(username__iexact=login_value) | Q(email__iexact=login_value) | Q(phone__iexact=login_value)
        ).order_by("id")

        # Support full-name login (e.g. "First Last") for legacy/ERP-style usage.
        if not candidates.exists() and " " in login_value:
            parts = [part for part in login_value.split(" ") if part]
            if len(parts) >= 2:
                first_name = parts[0]
                last_name = " ".join(parts[1:])
                candidates = User.objects.filter(
                    first_name__iexact=first_name,
                    last_name__iexact=last_name,
                ).order_by("id")

        user = None
        for candidate in candidates:
            if candidate.check_password(password):
                user = candidate
                break

        if not user:
            raise AuthenticationFailed("Login credentials are not found.")

        if not user.is_active or not getattr(user, "access_status", True):
            raise AuthenticationFailed("You are not allowed, Please contact with administrator.")

        refresh = self.get_token(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
