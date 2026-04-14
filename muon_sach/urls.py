from django.urls import path
from . import views

urlpatterns = [
    path('borrow/', views.borrow_list, name='borrow_list'),
]
