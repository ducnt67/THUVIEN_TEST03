from django.shortcuts import render

def login_view(request):
    return render(request, 'quan_ly_tai_khoan/login.html')
