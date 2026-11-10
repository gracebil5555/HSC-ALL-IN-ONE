from django.core.management.base import BaseCommand
from apps.users.models import User

class Command(BaseCommand):
    help = "Définit ou réinitialise le mot de passe d'un utilisateur HSC"

    def add_arguments(self, parser):
        parser.add_argument("--username", type=str, default="roland.elenga", help="Nom d'utilisateur")
        parser.add_argument("--password", type=str, default="Password123!", help="Nouveau mot de passe")

    def handle(self, *args, **options):
        username = options["username"]
        password = options["password"]

        try:
            user, created = User.objects.get_or_create(username=username)
            user.set_password(password)
            if username == "roland.elenga":
                user.role = "SUPER_SUPER_ADMIN"
                user.is_superuser = True
                user.is_staff = True
                user.email = "roland.elenga@hsc-eglise.org"
            user.save()

            action = "Créé" if created else "Mis à jour"
            self.stdout.write(self.style.SUCCESS(
                f"[OK] Utilisateur '{username}' {action} avec succès. Mot de passe: '{password}'"
            ))
        except Exception as e:
            self.stdout.write(self.style.WARNING(
                f"[WARN] Impossible de réinitialiser le mot de passe pendant le build: {e}"
            ))

