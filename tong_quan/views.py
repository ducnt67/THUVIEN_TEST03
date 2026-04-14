from django.shortcuts import render

def dashboard_view(request):
    return render(request, 'tong_quan/index.html')

def index(request):
    return dashboard_view(request)
