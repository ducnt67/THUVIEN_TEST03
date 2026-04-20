from django.urls import path
from . import views

urlpatterns = [
    path('borrow/', views.borrow_list, name='borrow_list'),
    path('api/borrow/list/', views.api_get_borrow_list, name='api_get_borrow_list'),
    path('api/user/info/', views.api_get_user_info, name='api_get_user_info'),
    path('api/book/info/', views.api_get_book_info, name='api_get_book_info'),
    path('api/borrow/create/', views.api_create_borrow_slip, name='api_create_borrow_slip'),
    path('api/borrow/delete/<str:pk>/', views.api_delete_borrow_slip, name='api_delete_borrow_slip'),
    path('api/borrow/extend/<str:pk>/', views.api_extend_borrow_slip, name='api_extend_borrow_slip'),
]
