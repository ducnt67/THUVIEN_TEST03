from django.shortcuts import render

def reader_list_view(request):
    return render(request, 'quan_ly_nguoi_dung/user_list.html')

def reader_list(request):
    return reader_list_view(request)
