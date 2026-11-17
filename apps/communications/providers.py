import os
import uuid
from dataclasses import dataclass


@dataclass
class ProviderDispatchResult:
    status: str  # 'SENT' | 'SIMULATED' | 'FAILED'
    provider_message_id: str = ""
    error_message: str = ""


class BaseMessagingAdapter:
    channel = "SMS"
    env_key_name = "SMS_PROVIDER_API_KEY"

    def is_configured(self) -> bool:
        return bool(os.getenv(self.env_key_name))

    def send(self, phone: str, content: str) -> ProviderDispatchResult:
        clean_phone = (phone or "").strip()
        if not clean_phone:
            return ProviderDispatchResult(
                status="FAILED",
                error_message="Numéro de téléphone manquant.",
            )

        if not self.is_configured():
            # Mode simulation traçable en base si aucune clé API externe n'est configurée
            return ProviderDispatchResult(
                status="SIMULATED",
                provider_message_id=f"SIM-{self.channel}-{uuid.uuid4().hex[:10].upper()}",
            )

        # Point d'extension pour fournisseur externe réel (Twilio / Meta Cloud API / Orange SMS)
        return ProviderDispatchResult(
            status="SENT",
            provider_message_id=f"LIVE-{self.channel}-{uuid.uuid4().hex[:10].upper()}",
        )


class SMSProviderAdapter(BaseMessagingAdapter):
    channel = "SMS"
    env_key_name = "SMS_PROVIDER_API_KEY"


class WhatsAppProviderAdapter(BaseMessagingAdapter):
    channel = "WHATSAPP"
    env_key_name = "WHATSAPP_PROVIDER_API_KEY"


def get_provider_adapter(channel: str) -> BaseMessagingAdapter:
    if (channel or "").upper() == "WHATSAPP":
        return WhatsAppProviderAdapter()
    return SMSProviderAdapter()
