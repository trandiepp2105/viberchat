from django.contrib import admin
from .models import Notification, NotificationSetting


class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'recipient', 'sender', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('recipient__username', 'sender__username', 'text')
    readonly_fields = ('created_at', 'updated_at')


class NotificationSettingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'email_notifications', 'push_notifications')
    list_filter = ('email_notifications', 'push_notifications')
    search_fields = ('user__username',)


admin.site.register(Notification, NotificationAdmin)
admin.site.register(NotificationSetting, NotificationSettingAdmin)
