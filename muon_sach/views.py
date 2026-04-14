from django.shortcuts import render

def borrow_list_view(request):
    return render(request, 'muon_sach/borrow_list.html')

def borrow_list(request):
    return borrow_list_view(request)
