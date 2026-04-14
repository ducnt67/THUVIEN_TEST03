from django.shortcuts import render

def return_list_view(request):
    return render(request, 'tra_sach/return_list.html')

def return_list(request):
    return return_list_view(request)
