# UAT Closure Matrix (as of 2026-03-30)

This matrix maps each reported FAIL/CRITICAL issue to current implementation status based on backend code changes and local validation.

## Validation Evidence
- Django framework check: `py -3.14 manage.py check` => no issues.
- Frontend production build: `npm run build` (Next.js) => compiled successfully with type checks.
- Frontend lint baseline: `npm run lint` => executes successfully; current output is warning-only (`react-hooks/exhaustive-deps`) across legacy panels.
- Permission seed updated and applied (including behaviour permissions).

## A. Role/Permission UAT Report

| ID | Original Status | Current Status | Evidence | Notes |
|---|---|---|---|---|
| 4.1 No backend permission enforcement on module APIs | CRITICAL | Fixed (Backend) | Added action-level permission checks in major modules: access control, admissions, students, fees, finance, HR, library, exams, behaviour, academics, attendance | API access now denied when role lacks mapped permission code. |
| 4.2 Permission granularity is view-only | CRITICAL | Partial | Existing permission catalog is still largely `*.view`; enforcement now action-aware where mappings exist | Security gap reduced by enforcement, but full CRUD permission taxonomy is still pending. |
| 4.3 Duplicate role name returns 500 | FAIL | Fixed (Backend) | Role serializer duplicate validation + IntegrityError handling in role create/update | Now returns validation error instead of 500. |
| 4.4 GET/DELETE non-existent role returns 500 | FAIL | Fixed (Backend) | Role `get_object` now converts invalid/missing IDs to 404 Not Found | Removes server error behavior. |
| 4.5 Assign permission URL parameter ignored | FAIL | Fixed (Frontend + Backend) | Assign-permission page now resolves role from route and loads role-scoped endpoint (`/roles/{id}/permission-tree/`) | Role context is honored end-to-end for permission loading. |
| 4.6 Due Fees Login Permission page non-functional | FAIL | Fixed (Frontend + Backend) | Due-fees page sends explicit search API requests and backend filters sections by selected class | Section dropdown behavior and search call path are both implemented. |
| 4.7 No confirmation dialog on role delete | FAIL | Fixed (Frontend) | Role delete in UI uses explicit confirmation prompt before delete action | Destructive role deletion now requires user confirmation. |
| 4.8 Empty form submit shows no validation | FAIL | Fixed (Frontend + Backend) | Role form now shows inline field error state for empty/invalid name; backend validation also enforced | User now gets immediate visual feedback and API-safe validation. |

## B. Admin Section UAT Report

| ID | Original Status | Current Status | Evidence | Notes |
|---|---|---|---|---|
| BUG-A001 Zero permission enforcement on Admin APIs | CRITICAL | Fixed (Backend) | `AdminSectionRBACMixin` enforces action permission codes on all admin section viewsets | Includes inquiries, visitors, complaints, postal, phone logs, setup, id card, certificates. |
| BUG-A002 Admin setup duplicate returns 500 | P1 | Fixed (Backend) | Duplicate-safe write handling + serializer duplicate validation for admin setup | Now validation-level response instead of unhandled 500. |
| BUG-A003 `visitor_id` accepts duplicates | P1 | Fixed (Backend) | Generated `visitor_id` with transactional retry + duplicate validation in serializer | Prevents duplicate effective IDs at API layer. |
| BUG-A004 Certificate/ID card APIs return 404 | P1 | Fixed (Backend) | Added routes for `/admissions/certificates/` and `/admissions/id-cards/` | Read-only API endpoints now registered. |
| BUG-A005 Visitor Book shows FK IDs instead of names | P2 | Fixed (Backend API) | Serializer resolves and returns purpose display names | Frontend should consume resolved value fields. |
| BUG-A006 Complaint page shows FK IDs instead of names | P2 | Fixed (Backend API) | Serializer resolves complaint type/source names in response | Frontend should consume normalized output fields. |
| BUG-A007 Generate ID card dropdown shows raw ID | P2 | Fixed (Frontend + Backend) | Generate ID card UI normalizes template label display (`templateLabel`) and uses backend title/name metadata | Raw numeric IDs are no longer shown as dropdown labels. |
| BUG-A008 Phone fields accept letters | P2 | Fixed (Backend) | Phone validation regex added for visitor and phone-call log serializers | Rejects non-phone alphabetic input at API layer. |
| BUG-A009 `out_time < in_time` accepted | P2 | Fixed (Backend) | Cross-field time validation added in visitor serializer | Prevents logically invalid visitor records. |
| BUG-A010 No inline form validation feedback | P2 | Fixed (Frontend + Backend) | Inline field-level validation now implemented across admin forms (Admin Setup, Visitor Book, Phone Call, Complaint, Postal Receive/Dispatch, Certificate, ID Card) with backend validation still enforced | Form validation now has user-visible inline feedback in the administration module. |

## C. Files with Core Fixes

- `backend/apps/access_control/views.py`
- `backend/apps/access_control/serializers.py`
- `backend/apps/access_control/management/commands/seed_permissions.py`
- `backend/apps/access_control/migrations/0004_seed_behaviour_permissions.py`
- `backend/apps/admissions/views.py`
- `backend/apps/admissions/serializers.py`
- `backend/apps/admissions/urls.py`
- `backend/apps/students/views.py`
- `backend/apps/fees/views.py`
- `backend/apps/finance/views.py`
- `backend/apps/hr/views.py`
- `backend/apps/library/views.py`
- `backend/apps/exams/views.py`
- `backend/apps/behaviour/views.py`
- `backend/apps/academics/views.py`
- `backend/apps/attendance/views.py`
- `backend/apps/attendance/subject_views.py`

## D. Remaining Work to Reach Full PASS

1. Expand permission catalog from view-heavy model to full CRUD/action-specific coverage across all entities.
2. Reduce/close existing frontend lint warnings (`react-hooks/exhaustive-deps`) in legacy panels and enforce warning budget for CI.
