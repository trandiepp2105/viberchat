from django.conf import settings
from users.models import User

from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Create admin user'

    def handle(self, *args, **kwargs):
        if User.objects.filter(email=settings.ADMIN_EMAIL).exists():
            self.stdout.write(self.style.WARNING('Admin user already exists'))
            return

        User.objects.create_superuser(
            email=settings.ADMIN_EMAIL,
            password=settings.ADMIN_PASSWORD,
            username=settings.ADMIN_USERNAME
        )
        self.stdout.write(self.style.SUCCESS('Admin user created successfully'))