from django.contrib.auth.decorators import login_required
from django.shortcuts import render

@login_required
def dashboard_view(request):
    return render(request, 'tong_quan/index.html')

@login_required
def index(request):
    return dashboard_view(request)
