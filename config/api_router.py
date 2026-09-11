from django.conf import settings
from rest_framework.routers import DefaultRouter, SimpleRouter

from apps.campuses.views import CampusViewSet
from apps.departments.views import DepartmentViewSet
from apps.users.views import UserViewSet
from apps.finances.views import RegisterViewSet, VoucherViewSet, TransactionViewSet
from apps.members.views import BrigadeViewSet, MemberViewSet, AttendanceViewSet, PastoralAlertViewSet
from apps.patrimoine.views import AssetViewSet, ConsumableItemViewSet, StockMovementViewSet
from apps.assimilation.views import AssimilationProfileViewSet, ClassSessionViewSet, BaptismInterviewViewSet
from apps.directory.views import BusinessProfileViewSet
from apps.ai_engine.views import AILogViewSet

if settings.DEBUG:
    router = DefaultRouter()
else:
    router = SimpleRouter()

router.register("campuses", CampusViewSet)
router.register("departments", DepartmentViewSet)
router.register("users", UserViewSet)
router.register("finances/registers", RegisterViewSet)
router.register("finances/vouchers", VoucherViewSet)
router.register("finances/transactions", TransactionViewSet)
router.register("members/brigades", BrigadeViewSet)
router.register("members/list", MemberViewSet)
router.register("members/attendance", AttendanceViewSet)
router.register("members/alerts", PastoralAlertViewSet)
router.register("patrimoine/assets", AssetViewSet)
router.register("patrimoine/consumables", ConsumableItemViewSet)
router.register("patrimoine/movements", StockMovementViewSet)
router.register("assimilation/profiles", AssimilationProfileViewSet)
router.register("assimilation/classes", ClassSessionViewSet)
router.register("assimilation/interviews", BaptismInterviewViewSet)
router.register("directory/businesses", BusinessProfileViewSet)
router.register("ai/logs", AILogViewSet)

app_name = "api"
urlpatterns = router.urls
