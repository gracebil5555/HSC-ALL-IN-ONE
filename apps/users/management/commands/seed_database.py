"""
Management command : seed_database
Charge les données initiales HSC de manière idempotente.
Appelé par start.sh au démarrage du service Render.
"""
import os
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Seed idempotent de la base de données HSC (utilisateurs, campus, départements)"

    def handle(self, *args, **options):
        self.stdout.write("=== Démarrage du seed HSC ===")
        try:
            with transaction.atomic():
                self._seed_users()
                self._seed_campuses()
                self._seed_department_catalog()
                self._seed_departments()
            self.stdout.write(self.style.SUCCESS("=== Seed terminé avec succès ==="))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"[WARN] Seed partiel ou déjà effectué : {e}"))

    def _seed_users(self):
        from apps.users.models import User

        users_data = [
            {
                "username": "roland.elenga",
                "first_name": "Roland",
                "last_name": "ELENGA",
                "email": "roland.elenga@hsc-eglise.org",
                "title": "Apôtre",
                "ecclesial_function": "APOTRE",
                "role": "SUPER_SUPER_ADMIN",
                "is_staff": True,
                "is_superuser": True,
                "password": "Password123!",
            },
            {
                "username": "chancel.niati",
                "first_name": "Chancel",
                "last_name": "NIATI",
                "email": "chancel.niati@hsc-eglise.org",
                "title": "Pasteur",
                "ecclesial_function": "PASTEUR",
                "role": "SUPER_ADMIN",
                "password": "12345678",
            },
            {
                "username": "kelly.makosso",
                "first_name": "Kelly",
                "last_name": "MAKOSSO",
                "email": "kelly.makosso@hsc-eglise.org",
                "title": "Pasteur",
                "ecclesial_function": "PASTEUR",
                "role": "SUPER_ADMIN",
                "password": "12345678",
            },
            {
                "username": "blanchard.ngoy",
                "first_name": "Blanchard",
                "last_name": "NGOY",
                "email": "blanchard.ngoy@hsc-eglise.org",
                "title": "Pasteur",
                "ecclesial_function": "PASTEUR",
                "role": "SUPER_ADMIN",
                "password": "12345678",
            },
            {
                "username": "antony.missamou",
                "first_name": "Antony",
                "last_name": "MISSAMOU",
                "email": "antony.missamou@hsc-eglise.org",
                "title": "Berger",
                "ecclesial_function": "BERGER",
                "role": "SUPER_ADMIN",
                "password": "12345678",
            },
            {
                "username": "stevi.dibala",
                "first_name": "Stevi",
                "last_name": "DIBALA",
                "email": "stevi.dibala@hsc-eglise.org",
                "title": "Pasteur",
                "ecclesial_function": "PASTEUR",
                "role": "SUPER_ADMIN",
                "password": "12345678",
            },
        ]

        self._users_cache = {}
        for data in users_data:
            password = data.pop("password")
            user, created = User.objects.get_or_create(
                username=data["username"], defaults=data
            )
            # Toujours mettre à jour les champs clés et le mot de passe
            for field, value in data.items():
                setattr(user, field, value)
            user.set_password(password)
            user.save()
            self._users_cache[user.username] = user
            action = "Créé" if created else "Mis à jour"
            self.stdout.write(f"  [{action}] {user.get_full_name()} ({user.role})")

    def _seed_campuses(self):
        from apps.campuses.models import Campus
        u = self._users_cache

        campuses_data = [
            {
                "name": "Mpita (Église Mère)",
                "code": "HSC-MPITA",
                "campus_type": "HQ",
                "parent_name": None,
                "country": "Congo",
                "city": "Pointe-Noire",
                "lead_pastor_username": "chancel.niati",
            },
            {
                "name": "Extension Mpaka",
                "code": "HSC-MPAKA",
                "campus_type": "EXTENSION",
                "parent_name": "Mpita (Église Mère)",
                "country": "Congo",
                "city": "Pointe-Noire",
                "lead_pastor_username": "kelly.makosso",
            },
            {
                "name": "Extension Ngoyo",
                "code": "HSC-NGOYO",
                "campus_type": "EXTENSION",
                "parent_name": "Mpita (Église Mère)",
                "country": "Congo",
                "city": "Pointe-Noire",
                "lead_pastor_username": "blanchard.ngoy",
            },
            {
                "name": "Extension Moungali",
                "code": "HSC-MOUNGALI",
                "campus_type": "EXTENSION",
                "parent_name": "Mpita (Église Mère)",
                "country": "Congo",
                "city": "Brazzaville",
                "lead_pastor_username": "antony.missamou",
            },
            {
                "name": "Extension Canada",
                "code": "HSC-CANADA",
                "campus_type": "EXTENSION",
                "parent_name": "Mpita (Église Mère)",
                "country": "Canada",
                "city": "Montréal",
                "lead_pastor_username": "stevi.dibala",
            },
        ]

        self._campuses_cache = {}
        for data in campuses_data:
            parent_name = data.pop("parent_name")
            lead_pastor_username = data.pop("lead_pastor_username")
            parent = self._campuses_cache.get(parent_name) if parent_name else None
            lead_pastor = u.get(lead_pastor_username)

            campus, created = Campus.objects.get_or_create(
                name=data["name"],
                defaults={**data, "parent": parent, "lead_pastor": lead_pastor, "is_active": True},
            )
            campus.lead_pastor = lead_pastor
            campus.parent = parent
            campus.campus_type = data["campus_type"]
            campus.country = data["country"]
            campus.city = data["city"]
            campus.save()

            # Associer le pasteur à ce campus
            if lead_pastor:
                lead_pastor.campus = campus
                lead_pastor.save()

            self._campuses_cache[campus.name] = campus
            action = "Créé" if created else "Mis à jour"
            self.stdout.write(f"  [{action}] Campus : {campus.name}")

    def _seed_department_catalog(self):
        from apps.departments.models import DepartmentCatalog

        CATALOG = [
            ("Secrétariat & Administration", "SECRETARIAT", "Gestion administrative, courriers et registres officiels", "FileText"),
            ("Accueil & Protocole", "ACCUEIL", "Accueil des visiteurs, intégration et orientation des fidèles", "HeartHandshake"),
            ("Social & Entraide", "SOCIAL", "Assistance aux veuves, orphelins et membres en situation difficile", "Heart"),
            ("Chorale & Louange / Musique", "CHORALE", "Direction du culte, musiciens, répétitions et chantres", "Music"),
            ("Finances & Trésorerie", "FINANCES", "Comptabilité de caisse, dîmes, offrandes et justificatifs", "Receipt"),
            ("Patrimoine & Logistique", "PATRIMOINE", "Inventaire des biens, sonorisation, instruments et maintenance", "Boxes"),
            ("GDC (Groupes de Croissance)", "GDC", "Cellules de maison et encadrement de proximité", "Church"),
            ("Brigades Territoriales", "BRIGADE", "Maillage territorial de suivi pastoral des membres", "Users"),
            ("Communication & Médias", "COMMUNICATION", "Réseaux sociaux, diffusion live, graphisme et annonces", "Radio"),
            ("Ministère de la Jeunesse", "JEUNESSE", "Activités, enseignements et rassemblements des jeunes", "Sparkles"),
            ("Évangélisation & Missions", "EVANGELISATION", "Sorties missionnaires, campagnes d'évangélisation et conquête d'âmes", "Compass"),
        ]

        for name, code, desc, icon in CATALOG:
            item, created = DepartmentCatalog.objects.get_or_create(
                code=code,
                defaults={"name": name, "description": desc, "icon": icon, "is_default": True},
            )
            if created:
                self.stdout.write(f"  [Créé] Catalogue : {name}")

    def _seed_departments(self):
        from apps.departments.models import Department, DepartmentCatalog
        from apps.campuses.models import Campus

        mpita = self._campuses_cache.get("Mpita (Église Mère)")
        if not mpita:
            return

        for cat in DepartmentCatalog.objects.all():
            dept, created = Department.objects.get_or_create(
                campus=mpita,
                name=cat.name,
                defaults={
                    "catalog_item": cat,
                    "code": cat.code,
                    "description": cat.description,
                    "icon": cat.icon,
                    "is_active": True,
                },
            )
            if created:
                self.stdout.write(f"  [Créé] Département Mpita : {dept.name}")
