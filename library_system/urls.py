from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='dashboard'),
    path('borrow/', views.borrow_list, name='borrow_list'),
    path('return/', views.return_list, name='return_list'),
    path('books/', views.book_list, name='book_list'),
    path('readers/', views.reader_list, name='reader_list'),
    path('reports/statistics/', views.report_statistics, name='report_statistics'),
]

