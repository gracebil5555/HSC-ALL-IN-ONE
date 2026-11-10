#!/usr/bin/env bash
# Build script Render — uniquement pip + collectstatic
# Les migrations et le seed sont dans start.sh (exécuté au runtime)
set -o errexit

echo "=== [1/3] Mise à jour de pip ==="
pip install --upgrade pip

echo "=== [2/3] Installation des dépendances ==="
pip install -r requirements.txt

echo "=== [3/3] Collecte des fichiers statiques ==="
python manage.py collectstatic --no-input

echo "=== Build terminé avec succès ==="
