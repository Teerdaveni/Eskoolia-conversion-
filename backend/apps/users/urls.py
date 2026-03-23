from django.urls import path
from .views import HealthView, LoginView, LogoutView, RefreshView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", RefreshView.as_view(), name="refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
]
