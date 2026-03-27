#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.reports.views import IssueReportView
from apps.users.models import User
from apps.tenancy.models import School
from django.test import RequestFactory
from rest_framework_simplejwt.tokens import RefreshToken
from django.test.utils import setup_test_environment

setup_test_environment()

# Create test data
school = School.objects.first()
user = User.objects.filter(username='testuser').first()

if not school:
    school = School.objects.create(name="Test", code="TEST")
if not user:
    user = User.objects.create_user(username="testdebug", password="test", school=school)

# Create request
factory = RequestFactory()
request = factory.get('/api/v1/reports/issues/')
request.user = user

# Get token and add auth
refresh = RefreshToken.for_user(user)
request.META['HTTP_AUTHORIZATION'] = f'Bearer {str(refresh.access_token)}'

# Call the view
view = IssueReportView()
view.request = request
try:
    response = view.get(request)
    print(f"Status: {response.status_code}")
    print(f"Data: {response.data}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
