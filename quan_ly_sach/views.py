from django.contrib import messages
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404, redirect, render
from library_system.models import Sach, SachTrongKho

def _book_queryset(keyword):
    books = Sach.objects.all()
    if keyword:
        books = books.filter(
            Q(ma_sach__icontains=keyword)
            | Q(ten_sach__icontains=keyword)
            | Q(ten_tac_gia__icontains=keyword)
            | Q(the_loai__icontains=keyword)
            | Q(ten_nha_xuat_ban__icontains=keyword)
        )

    return books.annotate(
        total_quantity=Count('sach_trong_kho', distinct=True),
        borrowed_quantity=Count(
            'sach_trong_kho',
            filter=Q(sach_trong_kho__trang_thai_sach__icontains='muon'),
            distinct=True,
        ),
    ).order_by('ten_sach')

def _build_book_context(request):
    keyword = request.GET.get('q', '').strip()
    books = _book_queryset(keyword)
    selected_id = request.GET.get('edit', '').strip()
    detail_id = request.GET.get('detail', '').strip()

    selected_book = None
    if selected_id:
        selected_book = Sach.objects.filter(ma_sach=selected_id).first()

    detail_book = None
    detail_copies = []
    if detail_id:
        detail_book = Sach.objects.filter(ma_sach=detail_id).first()
        if detail_book:
            detail_copies = list(
                SachTrongKho.objects.filter(ma_sach=detail_book).values(
                    'ma_sach_trong_kho', 'ma_vach', 'trang_thai_sach'
                )
            )

    return {
        'books': books,
        'keyword': keyword,
        'selected_book': selected_book,
        'detail_book': detail_book,
        'detail_copies': detail_copies,
    }

def book_list_view(request):
    if request.method == 'POST':
        action = request.POST.get('action', '').strip()

        if action == 'delete':
            book_id = request.POST.get('book_id', '').strip()
            book = get_object_or_404(Sach, ma_sach=book_id)
            if book.sach_trong_kho.exists():
                messages.error(request, 'Khong the xoa sach da co ban ghi trong kho.')
            else:
                book.delete()
                messages.success(request, 'Da xoa sach thanh cong.')
            return redirect('book_list')

        form_book_id = request.POST.get('book_id', '').strip()
        title = request.POST.get('title', '').strip()
        author = request.POST.get('author', '').strip()
        category = request.POST.get('category', '').strip()
        publisher = request.POST.get('publisher', '').strip()
        year_raw = request.POST.get('year', '').strip()

        if not (form_book_id and title and year_raw):
            messages.error(request, 'Vui long nhap day du ma sach, ten sach va nam xuat ban.')
            return redirect('book_list')

        try:
            publish_year = int(year_raw)
        except ValueError:
            messages.error(request, 'Nam xuat ban khong hop le.')
            return redirect('book_list')

        if publish_year <= 0:
            messages.error(request, 'Nam xuat ban phai lon hon 0.')
            return redirect('book_list')

        if action == 'create':
            if Sach.objects.filter(ma_sach=form_book_id).exists():
                messages.error(request, 'Ma sach da ton tai, vui long chon ma khac.')
                return redirect('book_list')

            Sach.objects.create(
                ma_sach=form_book_id,
                ten_sach=title,
                ten_tac_gia=author or None,
                the_loai=category or None,
                ten_nha_xuat_ban=publisher or None,
                nam_xuat_ban=publish_year,
            )
            messages.success(request, 'Da them sach moi thanh cong.')
            return redirect('book_list')

        if action == 'update':
            original_id = request.POST.get('original_id', '').strip() or form_book_id
            book = get_object_or_404(Sach, ma_sach=original_id)

            if original_id != form_book_id and Sach.objects.filter(ma_sach=form_book_id).exists():
                messages.error(request, 'Ma sach moi da ton tai.')
                return redirect('book_list')

            book.ma_sach = form_book_id
            book.ten_sach = title
            book.ten_tac_gia = author or None
            book.the_loai = category or None
            book.ten_nha_xuat_ban = publisher or None
            book.nam_xuat_ban = publish_year
            book.save()
            messages.success(request, 'Da cap nhat thong tin sach.')
            return redirect('book_list')

        messages.error(request, 'Thao tac khong hop le.')
        return redirect('book_list')

    context = _build_book_context(request)
    return render(request, 'quan_ly_sach/book_list.html', context)

def book_list(request):
    return book_list_view(request)
