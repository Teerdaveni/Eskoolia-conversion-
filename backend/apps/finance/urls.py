from rest_framework.routers import DefaultRouter

from .views import BankAccountViewSet, ChartOfAccountViewSet, FundTransferViewSet, LedgerEntryViewSet

router = DefaultRouter()
router.register("chart-of-accounts", ChartOfAccountViewSet, basename="chart-of-account")
router.register("bank-accounts", BankAccountViewSet, basename="bank-account")
router.register("ledger-entries", LedgerEntryViewSet, basename="ledger-entry")
router.register("fund-transfers", FundTransferViewSet, basename="fund-transfer")

urlpatterns = router.urls
