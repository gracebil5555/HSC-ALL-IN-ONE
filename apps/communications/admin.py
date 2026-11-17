from django.contrib import admin
from .models import MessageTemplate, CommunicationCampaign, MessageLog

admin.site.register(MessageTemplate)
admin.site.register(CommunicationCampaign)
admin.site.register(MessageLog)
