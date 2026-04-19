from django.contrib import messages
from django.db.models import Count, Q, F
from django.shortcuts import get_object_or_404, redirect, render
from .models import Sach, SachTrongKho


def _book_queryset(keyword):
    """Lây danh sách sách và tính toán sô luông dang muôn"""
    books = Sach.objects.all()

    if keyword:
        books = books.filter(
            Q(ma_sach__icontains=keyword) |
            Q(ten_sach__icontains=keyword) |
            Q(ten_tac_gia__icontains=keyword) |
            Q(the_loai__icontains=keyword) |
            Q(ten_nha_xuat_ban__icontains=keyword)
        )

    return books.annotate(
        total_quantity=F('so_luong'),
        borrowed_quantity=Count(
            'sach_trong_kho',
            filter=Q(sach_trong_kho__trang_thai_sach__icontains='muon'),
            distinct=True
        ),
    ).order_by('ten_sach')


def _build_book_context(request):
    """Xây context cho trang book_list"""
    keyword = request.GET.get('keyword', '')
    books = _book_queryset(keyword)

    context = {
        'books': books,
        'keyword': keyword
    }
    return context


def book_list(request):
    """Hiên thî danh sách sách"""
    context = _build_book_context(request)
    return render(request, 'book_list.html', context)


def quan_ly_kho_view(request):
    """Hiên thî thông tin chi tiêt các phiên sao trong kho"""
    # Lây mã sách dari tham sô ?ma_sach=MS0002
    ma_sach_tu_url = request.GET.get('ma_sach')
    
    if not ma_sach_tu_url:
        messages.error(request, 'Vui lòng cung cung mã sách!')
        return redirect('book_list')

    try:
        # Lây thông tin cuôn sách chính
        sach_chinh = Sach.objects.get(ma_sach=ma_sach_tu_url)

        # Lây danh sách các phiên sao trong kho cua cuôn sách dô
        danh_sach_kho = SachTrongKho.objects.filter(ma_sach=sach_chinh)

        return render(request, 'sachtrongkho.html', {
            'sach': sach_chinh,
            'danh_sach_kho': danh_sach_kho
        })
    except Sach.DoesNotExist:
        messages.error(request, f'Không tìm tìm sách có mã: {ma_sach_tu_url}')
        return redirect('book_list')
