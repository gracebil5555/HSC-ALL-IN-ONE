from rest_framework import serializers
from .models import MessageTemplate, CommunicationCampaign, MessageLog


class MessageTemplateSerializer(serializers.ModelSerializer):
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)

    class Meta:
        model = MessageTemplate
        fields = '__all__'
        read_only_fields = ['created_by']


class CommunicationCampaignSerializer(serializers.ModelSerializer):
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    department_name = serializers.CharField(source='target_department.name', read_only=True)
    audience_display = serializers.CharField(source='get_audience_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = CommunicationCampaign
        fields = '__all__'
        extra_kwargs = {
            'campus': {'required': False},
        }
        read_only_fields = [
            'status', 'total_recipients', 'sent_count', 'failed_count', 'sent_at', 'created_by'
        ]


class MessageLogSerializer(serializers.ModelSerializer):
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    campaign_title = serializers.CharField(source='campaign.title', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = MessageLog
        fields = '__all__'
