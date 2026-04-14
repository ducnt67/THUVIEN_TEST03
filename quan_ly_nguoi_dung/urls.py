from django.urls import path
from . import views

urlpatterns = [
    path('readers/', views.reader_list, name='reader_list'),
]
