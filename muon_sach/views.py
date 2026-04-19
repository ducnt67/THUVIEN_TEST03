from django.contrib.auth.decorators import login_required
from django.shortcuts import render

@login_required
def borrow_list_view(request):
    return render(request, 'muon_sach/borrow_list.html')

@login_required
def borrow_list(request):
    return borrow_list_view(request)
