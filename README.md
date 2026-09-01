# 🏛️ Plateforme SaaS Église Hauts Standards pour Christ (HSC)
## Backend API REST Multi-Tenant & Moteur d'IA (Phase 1 Siège Mpita & Multi-Sites)

Visionnaire / Super-Super Admin : **Apôtre Roland G. Elenga**  
Siège Mondial Pilote : **Mpita (Pointe-Noire, République du Congo)**  
Extensions : **Ngoyo, Paka, Paris Île-de-France, Dakar Almadies, Brazzaville**

---

## 🛠️ Stack Technique

- **Langage & Framework** : Python 3.12 / Django 5.x / Django REST Framework (DRF)
- **Base de Données** : PostgreSQL 16 (modèle relationnel avec isolation Row-Level `TenantBoundModel`)
- **Authentification & Sécurité** : JWT (`djangorestframework-simplejwt`), matrice RBAC hiérarchique, `django-cors-headers`
- **Moteur Asynchrone & IA** : Celery + Redis (Voice-to-Action Whisper + Vision LLM OCR)
- **Documentation API** : OpenAPI 3 & Swagger UI interactif via `drf-spectacular`
- **Serveur Production** : Gunicorn + WhiteNoise (Prêt pour déploiement Render / Docker)

---

## 🏗️ Architecture du Projet

```text
backend/
├── .env.example                     # Gabarit des variables d'environnement
├── .env                             # Configuration locale active
├── requirements.txt                 # Dépendances Python
├── manage.py                        # CLI Django avec autoloader .env
│
├── config/                          # Configuration globale du projet
│   ├── celery.py                    # Instance & Worker Celery
│   ├── urls.py                      # Routage principal & Swagger (/api/docs/)
│   └── settings/
│       ├── base.py                  # Socle DRF, JWT, Celery, OpenAPI, Middlewares
│       ├── local.py                 # Mode développement
│       └── production.py            # Sécurité stricte (SSL, HSTS, Render)
│
└── apps/                            # Modules Métier Découpés
    ├── core/                        # TenantBoundModel, TenantMiddleware, RBAC & Seeder
    ├── campuses/                    # Multi-sites, extensions & Feature Flags
    ├── users/                       # Modèle User custom, Auth JWT (Téléphone/Email)
    ├── departments/                 # Pôles de service (Chantres, Médias, Protocole...)
    ├── members/                     # Membres, Brigades, Pointages & Alertes pastorales
    ├── assimilation/                # Pipeline Kanban 5 étapes des âmes
    ├── patrimoine/                  # Matériel QR codes, consommables, stocks
    ├── finances/                    # Circuit d'approbation pièces de caisse & trésorerie
    ├── directory/                   # Annuaire d'entraide économique & WhatsApp direct
    └── ai_engine/                   # Pipelines IA Whisper (Voice-to-Data) & Vision OCR
```

---

## 🚀 Démarrage Rapide

### 1. Installation de l'environnement virtuel & dépendances
```bash
# Cloner le projet et entrer dans le dossier backend
cd backend

# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Windows (PowerShell) :
.\venv\Scripts\Activate.ps1
# Linux / macOS :
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

### 2. Variables d'environnement
```bash
# Copier le fichier d'exemple si besoin
cp .env.example .env
```

### 3. Application des migrations & Données initiales (Seeders)
```bash
# Appliquer les migrations de base de données
python manage.py migrate

# Peupler la base avec les données réelles du Siège de Mpita
python manage.py seed_hsc_db
```

### 4. Lancement du serveur de développement
```bash
python manage.py runserver
```
L'API REST est accessible sur : `http://127.0.0.1:8000/`

---

## 📖 Documentation Interactive des APIs

Une fois le serveur démarré, accédez aux documentations interactives :
- **Swagger UI** : [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)
- **ReDoc** : [http://127.0.0.1:8000/api/redoc/](http://127.0.0.1:8000/api/redoc/)
- **Schéma OpenAPI JSON** : [http://127.0.0.1:8000/api/schema/](http://127.0.0.1:8000/api/schema/)

---

## 🔐 Identifiants de Test Préconfigurés (Seed)

| Rôle | Nom | Téléphone | Mot de passe | Portée |
| :--- | :--- | :--- | :--- | :--- |
| **Super-Super Admin** | Apôtre Roland G. Elenga | `+242066000001` | `Password123!` | Réseau Mondial (Tous Campus) |
| **Super Admin Campus** | Pasteur Chancel NIATI | `+242066112233` | `Password123!` | Siège de Mpita (Pointe-Noire) |
| **Super Admin Campus** | Pasteur Kelly Makosso | `+242066223344` | `Password123!` | Extension Ngoyo |
| **Trésorière** | Maman Rabbi | `+242066334455` | `Password123!` | Finances & Caisse Mpita |
| **Responsable Patrimoine** | Maman Mireille | `+242066445566` | `Password123!` | Matériel & Stocks Mpita |
| **Chef de Brigade** | Glenn Messi | `+242066556677` | `Password123!` | Brigade Mpita Centre |
| **Responsable GDC** | Jonathan NGAFOULA | `+242066667788` | `Password123!` | GDC Jeunesse Flamme Ardente |
| **Responsable Chantres** | Bergère Geraldine | `+242066778899` | `Password123!` | Département Chantres & Louange |

---

## ⚡ Lancement du Worker Asynchrone Celery & Redis (Moteur IA)

```bash
# Dans un terminal dédié avec l'environnement virtuel activé :
celery -A config worker -l info
```

---

## 📡 Synthèse des Endpoints Principaux

### 1. Authentification (`/api/auth/`)
- `POST /api/auth/login/` : Connexion (JWT Access + Refresh + Profil utilisateur)
- `POST /api/auth/refresh/` : Renouvellement du token JWT
- `GET|PATCH /api/auth/me/` : Consultation et mise à jour de son profil
- `POST /api/auth/change-password/` : Changement sécurisé de mot de passe
- `GET|POST /api/auth/users/` : Gestion des utilisateurs par campus

### 2. Campus & Multi-Sites (`/api/campuses/`)
- `GET /api/campuses/active/` : Liste des campus actifs pour le sélecteur frontend
- `PATCH /api/campuses/{id}/toggle-features/` : Activation modulaire des Feature Flags
- `GET /api/campuses/{id}/stats/` : Compteurs synthétiques consolidés

### 3. Membres, Brigades & Alertes (`/api/members/`)
- `GET|POST /api/members/` : Annuaire des fidèles (filtrable par quartier, brigade, étape)
- `POST /api/members/bulk-attendance/` : Pointage dominical en masse
- `GET|POST /api/members/brigades/` : Gestion des cellules de proximité
- `GET /api/members/alerts/critical/` : Alertes pastorales urgentes actives
- `POST /api/members/alerts/{id}/assign/` : Affectation pastorale d'une urgence
- `POST /api/members/alerts/{id}/resolve/` : Clôture avec compte-rendu de visite

### 4. Pipeline d'Assimilation Kanban (`/api/assimilation/`)
- `GET /api/assimilation/board/` : Tableau Kanban des 5 colonnes avec compteurs
- `POST /api/assimilation/{id}/move-stage/` : Progression d'une âme vers une étape suivante
- `POST /api/assimilation/sessions/` : Validation des séances de cours M1/M2
- `POST /api/assimilation/baptisms/` : Entretiens pastoraux de baptême

### 5. Patrimoine & Stocks (`/api/patrimoine/`)
- `GET /api/patrimoine/assets/lookup/?code=...` : Scan QR Code terrain de l'actif
- `GET /api/patrimoine/stocks/low-stock/` : Alertes de rupture de stock
- `POST /api/patrimoine/movements/` : Entrées/sorties avec mise à jour automatique des quantités
- `POST /api/patrimoine/audits/` : Clôture d'inventaire physique périodique

### 6. Finances & Pièces de Caisse (`/api/finances/`)
- `POST /api/finances/vouchers/` : Émission d'une demande de dépense (`PENDING`)
- `POST /api/finances/vouchers/{id}/approve/` : Validation pastorale (`APPROVED`)
- `POST /api/finances/vouchers/{id}/disburse/` : Décaissement trésorerie avec reçu (`DISBURSED`)
- `GET /api/finances/registers/summary/` : Synthèse des soldes (Caisse, Airtel Money, MoMo, Banque)

### 7. Annuaire d'Entraide HSC (`/api/directory/`)
- `GET /api/directory/public/` : Annuaire public des professionnels et entrepreneurs
- Lien WhatsApp direct généré automatiquement pour chaque prestataire.

### 8. Moteur IA (`/api/ai/`)
- `POST /api/ai/voice/` : Téléversement mémo vocal (Whisper + extraction structurée)
- `POST /api/ai/ocr/` : Téléversement photo feuille d'émargement
- `POST /api/ai/ocr/{id}/confirm/` : Validation 1-clic des présences reconnues

---

## 🌐 Déploiement en Production (Render)

1. Connecter le dépôt Git à Render.
2. Créer un **Web Service** :
   - **Environment** : `Python 3`
   - **Build Command** : `pip install -r backend/requirements.txt && python backend/manage.py migrate`
   - **Start Command** : `cd backend && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
3. Configurer les variables d'environnement dans Render (`DJANGO_SETTINGS_MODULE=config.settings.production`, `DATABASE_URL`, `DJANGO_SECRET_KEY`, `CELERY_BROKER_URL`).
