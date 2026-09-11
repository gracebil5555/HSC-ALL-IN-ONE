import os
from .base import *

# Override default base settings for local development
DEBUG = True
ALLOWED_HOSTS = os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

CORS_ALLOW_ALL_ORIGINS = True

# Add any local specific apps here
# INSTALLED_APPS += ['debug_toolbar']

# Add any local specific middleware here
# MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']

# You can also override the database here specifically for local if dj-database-url is not enough
