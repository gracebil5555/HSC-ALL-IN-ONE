import os
import django
from dotenv import load_dotenv

load_dotenv()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', os.getenv('DJANGO_SETTINGS_MODULE', 'config.settings.local'))
django.setup()

from apps.users.models import User
from apps.campuses.models import Campus
from apps.departments.models import Department, DepartmentCatalog
from apps.finances.models import Register
from apps.members.models import EcclesialFunctionCatalog, MemberStatusCatalog
from apps.communications.models import MessageTemplate

print("--- 0. INITIALISATION DES CATALOGUES FONCTIONS & STATUTS (Sections 22, 25, 26) ---")
ECCLESIAL_FUNCTIONS_SEED = [
    ("APOTRE", "Apôtre", 1),
    ("PASTEUR", "Pasteur", 2),
    ("ANCIEN", "Ancien", 3),
    ("DIACRE", "Diacre", 4),
    ("BERGER", "Berger", 5),
    ("RESPONSABLE", "Responsable", 6),
    ("ADJOINT", "Adjoint", 7),
    ("OUVRIER", "Ouvrier", 8),
    ("MEMBRE", "Membre", 9),
]
for code, label, rank_order in ECCLESIAL_FUNCTIONS_SEED:
    EcclesialFunctionCatalog.objects.update_or_create(
        code=code,
        defaults={"label": label, "rank_order": rank_order, "is_active": True},
    )

MEMBER_STATUSES_SEED = [
    ("NOUVEAU", "Nouveau", "info"),
    ("ACTIF", "Actif", "success"),
    ("INACTIF", "Inactif", "warning"),
    ("SUSPENDU", "Suspendu", "error"),
]
for code, label, color in MEMBER_STATUSES_SEED:
    MemberStatusCatalog.objects.update_or_create(
        code=code,
        defaults={"label": label, "color": color, "is_active": True},
    )
print("[OK] Catalogues des fonctions ecclésiales et statuts initialisés.")

print("--- 1. MISE À JOUR DU SUPER SUPER ADMIN GLOBAL ---")
admin_user, _ = User.objects.get_or_create(username="roland.elenga")
admin_user.first_name = "Roland"
admin_user.last_name = "ELENGA"
admin_user.email = "roland.elenga@hsc-eglise.org"
admin_user.phone = "+242 06 600 00 01"
admin_user.title = "Apôtre"
admin_user.ecclesial_function = "APOTRE"
admin_user.role = "SUPER_SUPER_ADMIN"
admin_user.is_staff = True
admin_user.is_superuser = True
admin_user.set_password("Password123!")
admin_user.save()
print(f"Super Super Admin : {admin_user.get_full_name()} ({admin_user.role}) - Mot de passe: Password123!")

print("\n--- 2. INITIALISATION DES ÉGLISES & EXTENSIONS (Section 3 & 19) ---")

# A. Église Mère — Mpita (Racine)
pastor_chancel, _ = User.objects.get_or_create(username="chancel.niati")
pastor_chancel.first_name = "Chancel"
pastor_chancel.last_name = "NIATI"
pastor_chancel.email = "chancel.niati@hsc-eglise.org"
pastor_chancel.phone = "+242 06 611 22 33"
pastor_chancel.title = "Pasteur"
pastor_chancel.ecclesial_function = "PASTEUR"
pastor_chancel.role = "SUPER_ADMIN"
pastor_chancel.set_password("Password123!")
pastor_chancel.save()

mpita_hq, _ = Campus.objects.get_or_create(
    name="Mpita (Église Mère)",
    defaults={
        "code": "HSC-MPITA",
        "campus_type": "HQ",
        "parent": None,
        "country": "Congo",
        "city": "Pointe-Noire",
        "lead_pastor": pastor_chancel,
        "is_active": True
    }
)
mpita_hq.lead_pastor = pastor_chancel
mpita_hq.campus_type = "HQ"
mpita_hq.parent = None
mpita_hq.save()
pastor_chancel.campus = mpita_hq
pastor_chancel.save()
print(f"[OK] Eglise Mere : {mpita_hq.name} | Super Admin: {pastor_chancel.get_full_name()}")

# B. Extension — Mpaka
pastor_kelly, _ = User.objects.get_or_create(username="kelly.makosso")
pastor_kelly.first_name = "Kelly"
pastor_kelly.last_name = "MAKOSSO"
pastor_kelly.email = "kelly.makosso@hsc-eglise.org"
pastor_kelly.phone = "+242 06 622 33 44"
pastor_kelly.title = "Pasteur"
pastor_kelly.ecclesial_function = "PASTEUR"
pastor_kelly.role = "SUPER_ADMIN"
pastor_kelly.set_password("Password123!")
pastor_kelly.save()

mpaka_ext, _ = Campus.objects.get_or_create(
    name="Extension Mpaka",
    defaults={
        "code": "HSC-MPAKA",
        "campus_type": "EXTENSION",
        "parent": mpita_hq,
        "country": "Congo",
        "city": "Pointe-Noire",
        "lead_pastor": pastor_kelly,
        "is_active": True
    }
)
mpaka_ext.parent = mpita_hq
mpaka_ext.lead_pastor = pastor_kelly
mpaka_ext.save()
pastor_kelly.campus = mpaka_ext
pastor_kelly.save()
print(f"[OK] Extension : {mpaka_ext.name} | Super Admin: {pastor_kelly.get_full_name()}")

# C. Extension — Ngoyo
pastor_blanchard, _ = User.objects.get_or_create(username="blanchard.ngoy")
pastor_blanchard.first_name = "Blanchard"
pastor_blanchard.last_name = "NGOY"
pastor_blanchard.email = "blanchard.ngoy@hsc-eglise.org"
pastor_blanchard.phone = "+242 05 533 44 55"
pastor_blanchard.title = "Pasteur"
pastor_blanchard.ecclesial_function = "PASTEUR"
pastor_blanchard.role = "SUPER_ADMIN"
pastor_blanchard.set_password("Password123!")
pastor_blanchard.save()

ngoyo_ext, _ = Campus.objects.get_or_create(
    name="Extension Ngoyo",
    defaults={
        "code": "HSC-NGOYO",
        "campus_type": "EXTENSION",
        "parent": mpita_hq,
        "country": "Congo",
        "city": "Pointe-Noire",
        "lead_pastor": pastor_blanchard,
        "is_active": True
    }
)
ngoyo_ext.parent = mpita_hq
ngoyo_ext.lead_pastor = pastor_blanchard
ngoyo_ext.save()
pastor_blanchard.campus = ngoyo_ext
pastor_blanchard.save()
print(f"[OK] Extension : {ngoyo_ext.name} | Super Admin: {pastor_blanchard.get_full_name()}")

# D. Extension — Moungali
berger_antony, _ = User.objects.get_or_create(username="antony.missamou")
berger_antony.first_name = "Antony"
berger_antony.last_name = "MISSAMOU"
berger_antony.email = "antony.missamou@hsc-eglise.org"
berger_antony.phone = "+242 06 644 55 66"
berger_antony.title = "Berger"
berger_antony.ecclesial_function = "BERGER"
berger_antony.role = "SUPER_ADMIN"
berger_antony.set_password("Password123!")
berger_antony.save()

moungali_ext, _ = Campus.objects.get_or_create(
    name="Extension Moungali",
    defaults={
        "code": "HSC-MOUNGALI",
        "campus_type": "EXTENSION",
        "parent": mpita_hq,
        "country": "Congo",
        "city": "Brazzaville",
        "lead_pastor": berger_antony,
        "is_active": True
    }
)
moungali_ext.parent = mpita_hq
moungali_ext.lead_pastor = berger_antony
moungali_ext.country = "Congo"
moungali_ext.city = "Brazzaville"
moungali_ext.save()
berger_antony.campus = moungali_ext
berger_antony.save()
print(f"[OK] Extension : {moungali_ext.name} | Super Admin: {berger_antony.get_full_name()}")

# E. Extension — Canada
pastor_stevi, _ = User.objects.get_or_create(username="stevi.dibala")
pastor_stevi.first_name = "Stevi"
pastor_stevi.last_name = "DIBALA"
pastor_stevi.email = "stevi.dibala@hsc-eglise.org"
pastor_stevi.phone = "+1 514 555 0199"
pastor_stevi.title = "Pasteur"
pastor_stevi.ecclesial_function = "PASTEUR"
pastor_stevi.role = "SUPER_ADMIN"
pastor_stevi.set_password("Password123!")
pastor_stevi.save()

canada_ext, _ = Campus.objects.get_or_create(
    name="Extension Canada",
    defaults={
        "code": "HSC-CANADA",
        "campus_type": "EXTENSION",
        "parent": mpita_hq,
        "country": "Canada",
        "city": "Montréal",
        "lead_pastor": pastor_stevi,
        "is_active": True
    }
)
canada_ext.parent = mpita_hq
canada_ext.lead_pastor = pastor_stevi
canada_ext.country = "Canada"
canada_ext.city = "Montréal"
canada_ext.save()
pastor_stevi.campus = canada_ext
pastor_stevi.save()
print(f"[OK] Extension : {canada_ext.name} | Super Admin: {pastor_stevi.get_full_name()}")

print("\n--- 3. POPULATION DU CATALOGUE DES STRUCTURES (Section 8) ---")
CATALOG_DEPARTMENTS = [
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

for name, code, desc, icon in CATALOG_DEPARTMENTS:
    item, created = DepartmentCatalog.objects.get_or_create(
        code=code,
        defaults={
            "name": name,
            "description": desc,
            "icon": icon,
            "is_default": True
        }
    )
    if created:
        print(f"  + Structure ajoutée au catalogue : {name}")

print("\n--- 4. ACTIVATION DES STRUCTURES INITIALES POUR L'ÉGLISE MÈRE MPITA ---")
for cat in DepartmentCatalog.objects.all():
    dept, created = Department.objects.get_or_create(
        campus=mpita_hq,
        name=cat.name,
        defaults={
            "catalog_item": cat,
            "code": cat.code,
            "description": cat.description,
            "icon": cat.icon,
            "is_active": True
        }
    )
    if created:
        print(f"  + Département activé à Mpita : {dept.name}")

print("\n--- 5. INITIALISATION DES CAISSES PAR CAMPUS ---")
for campus in Campus.objects.all():
    reg, created = Register.objects.get_or_create(
        campus=campus,
        register_type="CASH",
        defaults={
            "name": f"Caisse Principale - {campus.name}",
            "current_balance": 0,
        },
    )
    if created:
        print(f"  + Caisse créée : {reg.name}")

print("\n--- 6. MODÈLES DE MESSAGES SMS & WHATSAPP PAR DÉFAUT ---")
MessageTemplate.objects.get_or_create(
    campus=None,
    name="Bienvenue Nouveau Venu (Automatique)",
    defaults={
        "category": "BIENVENUE",
        "channel": "BOTH",
        "body": "Bonjour {first_name}, toute la famille de {campus_name} vous souhaite la bienvenue ! Nous sommes heureux de vous compter parmi nous.",
        "is_active": True,
        "is_auto_welcome": True,
        "created_by": admin_user,
    },
)
MessageTemplate.objects.get_or_create(
    campus=None,
    name="Relance Membres Inactifs",
    defaults={
        "category": "RELANCE",
        "channel": "SMS",
        "body": "Bonjour {first_name}, vous nous manquez à {campus_name} ! N'hésitez pas à nous contacter si vous avez besoin de prière ou d'accompagnement.",
        "is_active": True,
        "is_auto_welcome": False,
        "created_by": admin_user,
    },
)

print("\nConfiguration des données initiales terminée avec succès !")
