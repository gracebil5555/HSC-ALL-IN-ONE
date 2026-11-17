from django.conf import settings
from rest_framework.routers import DefaultRouter, SimpleRouter

from apps.core.views import SystemAuditLogViewSet
from apps.campuses.views import CampusViewSet
from apps.departments.views import DepartmentViewSet, DepartmentCatalogViewSet
from apps.users.views import UserViewSet, RoleAssignmentViewSet
from apps.finances.views import (
    RegisterViewSet,
    VoucherViewSet,
    TransactionViewSet,
    ExchangeRateViewSet,
    AccountingPeriodCloseViewSet,
)
from apps.members.views import (
    BrigadeViewSet,
    MemberViewSet,
    AttendanceViewSet,
    PastoralAlertViewSet,
    EcclesialFunctionCatalogViewSet,
    MemberStatusCatalogViewSet,
    MemberTransferRequestViewSet,
)
from apps.patrimoine.views import AssetViewSet, AssetMovementViewSet, ConsumableItemViewSet, StockMovementViewSet
from apps.assimilation.views import AssimilationProfileViewSet, ClassSessionViewSet, BaptismInterviewViewSet
from apps.directory.views import BusinessProfileViewSet
from apps.ai_engine.views import AILogViewSet
from apps.communications.views import (
    MessageTemplateViewSet,
    CommunicationCampaignViewSet,
    MessageLogViewSet,
)

if settings.DEBUG:
    router = DefaultRouter()
else:
    router = SimpleRouter()

router.register("core/audit-logs", SystemAuditLogViewSet, basename="audit-log")
router.register("campuses", CampusViewSet)
router.register("departments/catalog", DepartmentCatalogViewSet, basename="department-catalog")
router.register("departments", DepartmentViewSet)
router.register("users/role-assignments", RoleAssignmentViewSet, basename="role-assignment")
router.register("users", UserViewSet)

router.register("finances/exchange-rates", ExchangeRateViewSet, basename="exchange-rate")
router.register("finances/period-closes", AccountingPeriodCloseViewSet, basename="period-close")
router.register("finances/registers", RegisterViewSet)
router.register("finances/vouchers", VoucherViewSet)
router.register("finances/transactions", TransactionViewSet)
router.register("members/ecclesial-functions", EcclesialFunctionCatalogViewSet, basename="ecclesial-function-catalog")
router.register("members/statuses", MemberStatusCatalogViewSet, basename="member-status-catalog")
router.register("members/transfers", MemberTransferRequestViewSet, basename="member-transfer")
router.register("members/brigades", BrigadeViewSet)
router.register("members/list", MemberViewSet)
router.register("members/attendance", AttendanceViewSet)
router.register("members/alerts", PastoralAlertViewSet)
router.register("patrimoine/assets", AssetViewSet)
router.register("patrimoine/asset-movements", AssetMovementViewSet)
router.register("patrimoine/consumables", ConsumableItemViewSet)
router.register("patrimoine/movements", StockMovementViewSet)
router.register("assimilation/profiles", AssimilationProfileViewSet)
router.register("assimilation/classes", ClassSessionViewSet)
router.register("assimilation/interviews", BaptismInterviewViewSet)
router.register("directory/businesses", BusinessProfileViewSet)
router.register("ai/logs", AILogViewSet)
router.register("communications/templates", MessageTemplateViewSet, basename="communication-template")
router.register("communications/campaigns", CommunicationCampaignViewSet, basename="communication-campaign")
router.register("communications/logs", MessageLogViewSet, basename="communication-log")

app_name = "api"
urlpatterns = router.urls
