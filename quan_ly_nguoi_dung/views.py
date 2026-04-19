from django.contrib.auth.decorators import login_required
from django.shortcuts import render

@login_required
def reader_list_view(request):
    return render(request, 'quan_ly_nguoi_dung/user_list.html')

@login_required
def reader_list(request):
    return reader_list_view(request)
