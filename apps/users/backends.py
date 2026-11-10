from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

UserModel = get_user_model()

class EmailOrUsernameModelBackend(ModelBackend):
    """
    Permet à l'utilisateur de s'authentifier indifféremment par son nom d'utilisateur (username)
    OU par son adresse email, insensible à la casse.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)
        if not username or not password:
            return None

        # Recherche par username OU email
        try:
            user = UserModel.objects.filter(
                Q(username__iexact=username) | Q(email__iexact=username)
            ).first()
        except Exception:
            return None

        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

