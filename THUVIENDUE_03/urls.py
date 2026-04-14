from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('tong_quan.urls')),
    path('', include('quan_ly_tai_khoan.urls')),
    path('', include('muon_sach.urls')),
    path('', include('tra_sach.urls')),
    path('', include('quan_ly_sach.urls')),
    path('', include('quan_ly_nguoi_dung.urls')),
    path('', include('bao_cao.urls')),
]