import jwt
import hashlib
import urllib

from django.conf import settings


def create_survey_from_csv_text(csv_text):
    # I suspect that pyxform is the reason that the server might be running slowly
    # so this is to test if it runs faster when lazily loaded.
    import pyxform_utils
    return pyxform_utils.create_survey_from_csv_text(csv_text)


def gravatar_url(email):
    gravatar_url = "http://www.gravatar.com/avatar/"
    gravatar_url += hashlib.md5(email.lower()).hexdigest() + "?"
    gravatar_url += urllib.urlencode({'s': '40'})
    return gravatar_url


def get_email_and_token(request):
    ona_user_cookie = request.COOKIES.get('ona_user')
    email = ''
    token = ''
    if ona_user_cookie:
        token_payload = jwt.decode(ona_user_cookie,
                                   settings.JWT_SECRET_KEY,
                                   algorithms=[settings.JWT_ALGORITHM])
        email = token_payload.get('email')
        token = token_payload.get('token')

    return (email, token)
