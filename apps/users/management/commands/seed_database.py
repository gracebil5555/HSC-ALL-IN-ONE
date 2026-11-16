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
                "password": "Password123!",
            },
            {
                "username": "kelly.makosso",
                "first_name": "Kelly",
                "last_name": "MAKOSSO",
                "email": "kelly.makosso@hsc-eglise.org",
                "title": "Pasteur",
                "ecclesial_function": "PASTEUR",
                "role": "SUPER_ADMIN",
                "password": "Password123!",
            },
            {
                "username": "blanchard.ngoy",
                "first_name": "Blanchard",
                "last_name": "NGOY",
                "email": "blanchard.ngoy@hsc-eglise.org",
                "title": "Pasteur",
                "ecclesial_function": "PASTEUR",
                "role": "SUPER_ADMIN",
                "password": "Password123!",
            },
            {
                "username": "antony.missamou",
                "first_name": "Antony",
                "last_name": "MISSAMOU",
                "email": "antony.missamou@hsc-eglise.org",
                "title": "Berger",
                "ecclesial_function": "BERGER",
                "role": "SUPER_ADMIN",
                "password": "Password123!",
            },
            {
                "username": "stevi.dibala",
                "first_name": "Stevi",
                "last_name": "DIBALA",
                "email": "stevi.dibala@hsc-eglise.org",
                "title": "Pasteur",
                "ecclesial_function": "PASTEUR",
                "role": "SUPER_ADMIN",
                "password": "Password123!",
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
        from apps.users.models import User

        mpita = self._campuses_cache.get("Mpita (Église Mère)")
        if not mpita:
            return

        # Section 19 : Administrateurs de départements fictifs et Adjoint pour le prototype
        dept_admins_seed = [
            {
                "username": "grace.mavoungou",
                "first_name": "Grace",
                "last_name": "MAVOUNGOU",
                "email": "grace.mavoungou@hsc-eglise.org",
                "title": "Diaconesse",
                "ecclesial_function": "DIACRE",
                "role": "ADMIN_DEPT",
                "dept_code": "FINANCES",
            },
            {
                "username": "mireille.oka",
                "first_name": "Mireille",
                "last_name": "OKA",
                "email": "mireille.oka@hsc-eglise.org",
                "title": "Responsable",
                "ecclesial_function": "RESPONSABLE",
                "role": "ADMIN_DEPT",
                "dept_code": "PATRIMOINE",
            },
            {
                "username": "geraldine.louange",
                "first_name": "Géraldine",
                "last_name": "MOUKALA",
                "email": "geraldine.louange@hsc-eglise.org",
                "title": "Bergère",
                "ecclesial_function": "BERGER",
                "role": "ADMIN_DEPT",
                "dept_code": "CHORALE",
            },
            {
                "username": "david.accueil",
                "first_name": "David",
                "last_name": "MABIALA",
                "email": "david.accueil@hsc-eglise.org",
                "title": "Frère",
                "ecclesial_function": "RESPONSABLE",
                "role": "ADMIN_DEPT",
                "dept_code": "ACCUEIL",
            },
        ]

        dept_admins_by_code = {}
        for item in dept_admins_seed:
            dept_code = item.pop("dept_code")
            u, _ = User.objects.get_or_create(username=item["username"], defaults=item)
            for k, v in item.items():
                setattr(u, k, v)
            u.campus = mpita
            u.set_password("Password123!")
            u.save()
            dept_admins_by_code[dept_code] = u

        # Adjoint de l'Église Mère (Pasteur Chancel NIATI)
        pastor_chancel = self._users_cache.get("chancel.niati")
        if pastor_chancel:
            adjoint_mpita, _ = User.objects.get_or_create(
                username="jean.bouesso",
                defaults={
                    "first_name": "Jean",
                    "last_name": "BOUESSO",
                    "email": "jean.bouesso@hsc-eglise.org",
                    "title": "Ancien",
                    "ecclesial_function": "ANCIEN",
                    "role": "ADJOINT",
                },
            )
            adjoint_mpita.campus = mpita
            adjoint_mpita.role = "ADJOINT"
            adjoint_mpita.is_deputy = True
            adjoint_mpita.deputy_of = pastor_chancel
            if not adjoint_mpita.delegated_permissions:
                adjoint_mpita.delegated_permissions = ["voir", "creer", "valider", "exporter"]
            adjoint_mpita.set_password("Password123!")
            adjoint_mpita.save()

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
            admin_user = dept_admins_by_code.get(cat.code)
            if admin_user and not dept.admin_id:
                dept.admin = admin_user
                dept.save(update_fields=["admin"])
            if created:
                self.stdout.write(f"  [Créé] Département Mpita : {dept.name}")

