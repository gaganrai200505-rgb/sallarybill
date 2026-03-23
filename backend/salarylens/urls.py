from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        'message': 'Welcome to SalaryLens API',
        'version': '1.0',
        'endpoints': {
            'admin': '/admin/',
            'auth': '/api/auth/',
            'salary': '/api/salary/',
        }
    })

urlpatterns = [
    path('', api_root, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/salary/', include('salary.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
