from django.urls import path
from . import views

urlpatterns = [
    path('books/', views.book_list, name='book_list'),
    path('quan-ly-kho/', views.quan_ly_kho_view, name='quan_ly_kho'),
]
