#!/usr/bin/env bash
# Build script Render — pip + migrations + seed + collectstatic
set -o errexit

echo "=== [1/5] Mise à jour de pip ==="
pip install --upgrade pip

echo "=== [2/5] Installation des dépendances ==="
pip install -r requirements.txt

echo "=== [3/5] Application des migrations ==="
python manage.py migrate --no-input

echo "=== [4/5] Seed des données initiales (idempotent) ==="
python manage.py seed_database || echo "[WARN] Seed ignoré ou partiellement appliqué"

echo "=== [5/5] Collecte des fichiers statiques ==="
python manage.py collectstatic --no-input

echo "=== Build terminé avec succès ==="
