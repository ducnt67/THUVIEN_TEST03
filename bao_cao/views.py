from django.shortcuts import render

def report_statistics(request):
    return render(request, 'bao_cao/statistics.html')
