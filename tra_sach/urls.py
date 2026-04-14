from django.urls import path
from . import views

urlpatterns = [
    path('return/', views.return_list, name='return_list'),
]
