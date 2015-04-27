import jwt
from rest_framework import viewsets
from rest_framework.decorators import action
from serializers import (ListSurveyDraftSerializer,
                         DetailSurveyDraftSerializer,
                         TagSerializer)
from rest_framework.response import Response

from django.core.exceptions import PermissionDenied
from django.shortcuts import (render_to_response,
                              HttpResponse,
                              get_object_or_404)
from django.conf import settings

from models import SurveyDraft, SurveyPreview
from taggit.models import Tag
from dkobo.koboform import pyxform_utils


class SurveyAssetViewset(viewsets.ModelViewSet):
    model = SurveyDraft
    serializer_class = ListSurveyDraftSerializer
    exclude_asset_type = False

    def get_queryset(self):
        myw_kobo_user_cookie = self.request.COOKIES.get('myw_kobo_user')
        email = ''
        if myw_kobo_user_cookie:
            token_payload = jwt.decode(myw_kobo_user_cookie,
                                       settings.JWT_SECRET_KEY,
                                       algorithms=['HS256'])
            email = token_payload.get('email')
        queryset = SurveyDraft.objects.filter(email=email)
        if self.exclude_asset_type:
            queryset = queryset.exclude(asset_type=None)
        else:
            queryset = queryset.filter(asset_type=None)
        return queryset.order_by('-date_modified')

    def create(self, request):
        contents = request.DATA
        tags = contents.get('tags', [])
        if 'tags' in contents:
            del contents['tags']

        survey_draft = request.user.survey_drafts.create(**contents)
        user_email = request.COOKIES.get('user_email')
        if user_email:
            survey_draft.email = user_email
            survey_draft.save()

        for tag in tags:
            survey_draft.tags.add(tag)

        return Response(ListSurveyDraftSerializer(survey_draft).data)

    def retrieve(self, request, pk=None):
        myw_kobo_user_cookie = self.request.COOKIES.get('myw_kobo_user')
        email = ''
        if myw_kobo_user_cookie:
            myw_kobo_user = jwt.decode(myw_kobo_user_cookie,
                                       settings.JWT_SECRET_KEY,
                                       algorithms=['HS256'])
            email = myw_kobo_user.get('email')
        queryset = SurveyDraft.objects.filter(email=email)
        survey_draft = get_object_or_404(queryset, pk=pk)
        return Response(DetailSurveyDraftSerializer(survey_draft).data)

    @action(methods=['DELETE'])
    def delete_survey_draft(self, request, pk=None):
        draft = self.get_object()
        draft.delete()

    def list(self, request, *args, **kwargs):
        email = request.QUERY_PARAMS.get('email')
        token = request.QUERY_PARAMS.get('token')
        if email and token:
            payload = {
                'email': email,
                'token': token
            }

            encoded = jwt.encode(
                payload, settings.JWT_SECRET_KEY, algorithm='HS256')
            return Response({'jwt': encoded})

        return super(SurveyAssetViewset, self).list(request, *args, **kwargs)


class TagViewset(viewsets.ModelViewSet):
    model = Tag
    serializer_class = TagSerializer

    def get_queryset(self, *args, **kwargs):
        user = self.request.user
        if user.is_authenticated():
            ids = user.survey_drafts.all().values_list('id', flat=True)
            return Tag.objects.filter(taggit_taggeditem_items__object_id__in=ids).distinct()
        else:
            return Tag.objects.none()

    def destroy(self, request, pk):
        if request.user.is_authenticated():
            tag = Tag.objects.get(id=pk)
            items = SurveyDraft.objects.filter(user=request.user, tags__name=tag.name)
            for item in items:
                item.tags.remove(tag)
            return HttpResponse("", status="204")

class LibraryAssetViewset(SurveyAssetViewset):
    exclude_asset_type = True
    serializer_class = DetailSurveyDraftSerializer
    paginate_by = 100


class SurveyDraftViewSet(SurveyAssetViewset):
    exclude_asset_type = False
