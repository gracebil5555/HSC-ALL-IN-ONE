#!/usr/bin/env bash
# Script de démarrage Render — migrations + seed + gunicorn
set -o errexit

echo "=== [START] Application des migrations en cours d'exécution ==="
python manage.py migrate --no-input

echo "=== [START] Seed des données initiales (idempotent) ==="
python manage.py seed_database || echo "[WARN] Seed ignoré (peut-être déjà fait)"

echo "=== [START] Démarrage de Gunicorn ==="
exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-10000}" --workers 2 --timeout 120

