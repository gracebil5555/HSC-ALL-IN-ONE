#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "=== [1/5] Mise à jour de pip ==="
pip install --upgrade pip

echo "=== [2/5] Installation des dépendances ==="
pip install -r requirements.txt

echo "=== [3/5] Application des migrations ==="
python manage.py migrate --no-input

echo "=== [4/5] Collecte des fichiers statiques ==="
python manage.py collectstatic --no-input

echo "=== [5/5] Réinitialisation du compte administrateur ==="
python manage.py reset_admin_password || true

echo "=== Build terminé avec succès ==="
