from django.contrib import admin
from .models import Conversation


class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'is_group', 'is_direct', 'name', 'created_at', 'updated_at')
    list_filter = ('is_group', 'is_direct', 'created_at', 'updated_at')
    search_fields = ('name', 'direct_participants')
    readonly_fields = ('id', 'created_at', 'updated_at')
    filter_horizontal = ('participants',)


admin.site.register(Conversation, ConversationAdmin)
