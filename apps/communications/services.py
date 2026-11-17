from collections import defaultdict
from django.db.models import Q
from django.utils import timezone

from apps.members.models import Member
from apps.users.models import User
from .models import CommunicationCampaign, MessageLog, MessageTemplate
from .providers import get_provider_adapter


def render_template_body(body: str, context: dict) -> str:
    safe_ctx = defaultdict(str, {k: ("" if v is None else str(v)) for k, v in context.items()})
    try:
        return (body or "").format_map(safe_ctx)
    except Exception:
        return body or ""


def _resolve_channels_for_member(requested_channel: str, member: Member | None) -> list[str]:
    if member and member.unsubscribed_at is not None:
        return []
    req = (requested_channel or "SMS").upper()
    if req == "BOTH":
        channels = []
        if not member or member.whatsapp_opt_in:
            channels.append("WHATSAPP")
        if not member or member.sms_opt_in:
            channels.append("SMS")
        return channels
    if req == "WHATSAPP":
        if member and not member.whatsapp_opt_in:
            return []
        return ["WHATSAPP"]
    if member and not member.sms_opt_in:
        return []
    return ["SMS"]


def dispatch_single_message(
    *,
    campus,
    recipient_name: str,
    recipient_phone: str,
    channel: str,
    body_template: str,
    context: dict,
    campaign: CommunicationCampaign | None = None,
    template: MessageTemplate | None = None,
    recipient_member: Member | None = None,
    recipient_user: User | None = None,
) -> MessageLog:
    rendered = render_template_body(body_template, context)
    adapter = get_provider_adapter(channel)
    result = adapter.send(recipient_phone, rendered)
    return MessageLog.objects.create(
        campus=campus,
        campaign=campaign,
        template=template,
        recipient_member=recipient_member,
        recipient_user=recipient_user,
        recipient_name=recipient_name,
        recipient_phone=recipient_phone or "",
        channel=channel,
        status=result.status,
        rendered_content=rendered,
        provider_message_id=result.provider_message_id,
        error_message=result.error_message,
    )


def trigger_welcome_message_for_member(member: Member, created_by=None) -> list[MessageLog]:
    """
    Déclenche automatiquement le message de bienvenue (SMS ou WhatsApp selon consentement et scénario actif)
    lors de l'enregistrement d'un nouveau venu.
    """
    if not member or not member.phone or member.unsubscribed_at is not None:
        return []
    if member.status != "NOUVEAU":
        return []

    template = (
        MessageTemplate.objects.filter(
            category="BIENVENUE",
            is_active=True,
            is_auto_welcome=True,
            campus=member.campus,
        )
        .order_by("-updated_at")
        .first()
    ) or (
        MessageTemplate.objects.filter(
            category="BIENVENUE",
            is_active=True,
            is_auto_welcome=True,
            campus__isnull=True,
        )
        .order_by("-updated_at")
        .first()
    )
    if not template:
        template = (
            MessageTemplate.objects.filter(
                category="BIENVENUE",
                is_active=True,
                campus=member.campus,
            )
            .order_by("-updated_at")
            .first()
        ) or (
            MessageTemplate.objects.filter(
                category="BIENVENUE",
                is_active=True,
                campus__isnull=True,
            )
            .order_by("-updated_at")
            .first()
        )
    if not template:
        return []

    channels = _resolve_channels_for_member(template.channel, member)
    if not channels:
        return []

    # Pour l'accueil automatique, si BOTH est configuré, privilégier WhatsApp si opt-in sinon SMS (1 message)
    if template.channel == "BOTH" and len(channels) > 1:
        channels = [channels[0]]

    context = {
        "first_name": member.first_name,
        "last_name": member.last_name,
        "full_name": f"{member.first_name} {member.last_name}".strip(),
        "campus_name": member.campus.name if member.campus else "HSC",
        "ecclesial_function": member.ecclesial_function,
    }
    logs = []
    for ch in channels:
        logs.append(
            dispatch_single_message(
                campus=member.campus,
                recipient_name=context["full_name"],
                recipient_phone=member.phone,
                channel=ch,
                body_template=template.body,
                context=context,
                template=template,
                recipient_member=member,
            )
        )
    return logs


def execute_campaign(campaign: CommunicationCampaign) -> CommunicationCampaign:
    """
    Résout la cible strictement dans le campus de la campagne, respecte les consentements
    (opt-in / désinscription) et journalise chaque envoi dans MessageLog.
    """
    body_template = campaign.custom_body or (campaign.template.body if campaign.template else "")
    if not body_template:
        campaign.status = "FAILED"
        campaign.save(update_fields=["status"])
        return campaign

    targets = []  # list of tuples: (kind, obj, name, phone, ecclesial_function)
    seen_phones = set()

    if campaign.audience_type == "LEADERS_AND_DEPUTIES":
        roles = ["SUPER_ADMIN", "ADMIN_DEPT"]
        if campaign.include_deputies:
            roles.append("ADJOINT")
        users_qs = User.objects.filter(
            campus=campaign.campus,
            is_active=True,
            role__in=roles,
        )
        for u in users_qs:
            phone = (u.phone or "").strip()
            if phone and phone not in seen_phones:
                seen_phones.add(phone)
                targets.append(("user", u, u.get_full_name() or u.username, phone, u.ecclesial_function))
    else:
        members_qs = Member.objects.filter(campus=campaign.campus)
        if campaign.audience_type == "NEW_MEMBERS":
            members_qs = members_qs.filter(status="NOUVEAU")
        elif campaign.audience_type == "INACTIVE_MEMBERS":
            members_qs = members_qs.filter(status="INACTIF")
        elif campaign.audience_type == "BY_STATUS" and campaign.target_status:
            members_qs = members_qs.filter(status=campaign.target_status)
        elif campaign.audience_type == "BY_FUNCTION" and campaign.target_ecclesial_function:
            members_qs = members_qs.filter(ecclesial_function=campaign.target_ecclesial_function)
        elif campaign.audience_type == "BY_DEPARTMENT" and campaign.target_department_id:
            members_qs = members_qs.filter(department_id=campaign.target_department_id)

        for m in members_qs:
            phone = (m.phone or "").strip()
            if phone and phone not in seen_phones:
                seen_phones.add(phone)
                targets.append(("member", m, f"{m.first_name} {m.last_name}".strip(), phone, m.ecclesial_function))

    sent_count = 0
    failed_count = 0
    total_dispatches = 0

    for kind, obj, name, phone, func in targets:
        member_obj = obj if kind == "member" else None
        user_obj = obj if kind == "user" else None
        channels = _resolve_channels_for_member(campaign.channel, member_obj)
        if not channels:
            continue

        context = {
            "first_name": getattr(obj, "first_name", ""),
            "last_name": getattr(obj, "last_name", ""),
            "full_name": name,
            "campus_name": campaign.campus.name if campaign.campus else "HSC",
            "ecclesial_function": func,
        }
        for ch in channels:
            total_dispatches += 1
            log = dispatch_single_message(
                campus=campaign.campus,
                recipient_name=name,
                recipient_phone=phone,
                channel=ch,
                body_template=body_template,
                context=context,
                campaign=campaign,
                template=campaign.template,
                recipient_member=member_obj,
                recipient_user=user_obj,
            )
            if log.status in ("SENT", "DELIVERED", "SIMULATED"):
                sent_count += 1
            else:
                failed_count += 1

    campaign.total_recipients = total_dispatches
    campaign.sent_count = sent_count
    campaign.failed_count = failed_count
    campaign.sent_at = timezone.now()
    if total_dispatches == 0:
        campaign.status = "SENT"
    elif failed_count == 0:
        campaign.status = "SENT"
    elif sent_count > 0:
        campaign.status = "PARTIAL"
    else:
        campaign.status = "FAILED"
    campaign.save()
    return campaign
