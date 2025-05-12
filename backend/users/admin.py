from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Contact


class CustomUserAdmin(UserAdmin):
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'email', 'avatar', 'bio', 'phone_number')}),
        (_('Status'), {'fields': ('status', 'last_active')}),
        (_('Settings'), {'fields': ('dark_mode', 'notifications_enabled', 'sound_effects_enabled')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    list_display = ('username', 'email', 'first_name', 'last_name', 'status', 'is_staff')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    list_filter = ('status', 'is_staff', 'is_superuser', 'is_active')


class ContactAdmin(admin.ModelAdmin):
    list_display = ('user', 'contact', 'created_at')
    search_fields = ('user__username', 'contact__username')
    list_filter = ('created_at',)


admin.site.register(User, CustomUserAdmin)
admin.site.register(Contact, ContactAdmin)
