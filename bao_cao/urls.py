from django.urls import path
from . import views

urlpatterns = [
    path('reports/statistics/', views.report_statistics, name='report_statistics'),
]
