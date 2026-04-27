from django.urls import path
from . import views

urlpatterns = [
    path('return-books/', views.return_list_view, name='return_list'),
    path('api/return/confirm/', views.api_xac_nhan_tra_sach, name='api_xac_nhan_tra_sach'),
    path('api/return/lost/', views.api_xu_ly_mat_sach, name='api_xu_ly_mat_sach'),
    path('api/return/compensate/', views.api_xac_nhan_den_sach, name='api_xac_nhan_den_sach'),
    path('api/return/fines/', views.api_get_user_fines, name='api_get_user_fines'),
    path('api/return/pay-fines/', views.api_thanh_toan_phi_phat, name='api_thanh_toan_phi_phat'),
]
