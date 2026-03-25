from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok", "service": "backend"})


class LoginView(TokenObtainPairView):
    pass


class RefreshView(TokenRefreshView):
    pass


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response({"detail": "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Logout successful."}, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        role_rows = user.user_roles.select_related("role").all()
        role_names = [row.role.name for row in role_rows if row.role]
        role_ids = [row.role_id for row in role_rows if row.role_id]

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "school_id": user.school_id,
                "is_superuser": bool(user.is_superuser),
                "is_school_admin": bool(getattr(user, "is_school_admin", False)),
                "role_ids": role_ids,
                "role_names": role_names,
                "permission_codes": sorted(user.get_permission_codes()),
            },
            status=status.HTTP_200_OK,
        )
