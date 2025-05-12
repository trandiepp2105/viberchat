from django.contrib import admin
from .models import ChatSession, Attachment


class AttachmentInline(admin.TabularInline):
    model = Attachment
    extra = 0
    readonly_fields = ('id', 'message_id', 'created_at', 'uploaded_by')


class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'is_group_chat', 'name', 'created_at', 'updated_at')
    list_filter = ('is_group_chat', 'created_at', 'updated_at')
    search_fields = ('name',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    filter_horizontal = ('participants',)
    inlines = [AttachmentInline]


class AttachmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'file_name', 'file_type', 'file_size', 'uploaded_by', 'created_at')
    list_filter = ('file_type', 'created_at')
    search_fields = ('file_name', 'uploaded_by__username')
    readonly_fields = ('id', 'message_id', 'created_at')


admin.site.register(ChatSession, ChatSessionAdmin)
admin.site.register(Attachment, AttachmentAdmin)
