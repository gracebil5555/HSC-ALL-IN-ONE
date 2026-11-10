#!/usr/bin/env bash
# Script de build Render : uniquement dÃ©pendances et fichiers statiques (aucun accÃ¨s DB)
set -o errexit

echo "=== [1/2] Installation des dÃ©pendances ==="
pip install --upgrade pip
pip install -r requirements.txt

echo "=== [2/2] Collecte des fichiers statiques ==="
python manage.py collectstatic --no-input

echo "=== Build terminÃ© avec succÃ¨s ==="
