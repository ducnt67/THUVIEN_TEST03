from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q, F
from django.shortcuts import get_object_or_404, redirect
import django.shortcuts as shortcuts
from .models import Sach, SachTrongKho


def _book_queryset(keyword):
    """Lấy danh sách sách và tính toán số lượng đang mượn"""
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
    """Xây dựng context cho trang danh sách sách"""
    keyword = request.GET.get('q', '').strip()
    detail_id = request.GET.get('detail', '').strip()
    edit_id = request.GET.get('edit', '').strip()

    books = _book_queryset(keyword)

    detail_book = None
    if detail_id:
        detail_book = Sach.objects.filter(ma_sach=detail_id).first()

    # Đổi tên thành selected_book để khớp với template HTML
    selected_book = None
    if edit_id:
        selected_book = Sach.objects.filter(ma_sach=edit_id).first()

    return {
        "books": books,
        "keyword": keyword,
        "detail_book": detail_book,
        "selected_book": selected_book,
    }


@login_required
def book_list_view(request):
    # =========================
    # XỬ LÝ POST (CREATE / UPDATE / DELETE)
    # =========================
    if request.method == "POST":
        action = request.POST.get("action", "").strip()

        # Lấy dữ liệu từ form
        book_id = request.POST.get("book_id", "").strip()
        title = request.POST.get("title", "").strip()
        author = request.POST.get("author", "").strip()
        category = request.POST.get("category", "").strip()
        publisher = request.POST.get("publisher", "").strip()
        year_raw = request.POST.get("year", "").strip()
        quantity_raw = request.POST.get("quantity", "0").strip()  # Lấy số lượng
        original_id = request.POST.get("original_id", "").strip()

        # 1. Kiểm tra hành động Xóa (Xử lý riêng vì không cần validate field khác)
        if action == "delete":
            book = get_object_or_404(Sach, ma_sach=book_id)
            if SachTrongKho.objects.filter(ma_sach=book).exists():
                messages.error(request, f"Không thể xóa sách '{book.ten_sach}' đang có dữ liệu trong kho.")
            else:
                book.delete()
                messages.success(request, "Xóa sách thành công.")
            return redirect("book_list")

        # 2. Validate dữ liệu cho Create và Update
        if not (book_id and title and year_raw):
            messages.error(request, "Vui lòng điền đầy đủ các thông tin bắt buộc.")
            return redirect("book_list")

        try:
            year = int(year_raw)
            quantity = int(quantity_raw)
        except ValueError:
            messages.error(request, "Năm xuất bản hoặc số lượng không hợp lệ.")
            return redirect("book_list")

        # 3. Thực hiện Thêm mới
        if action == "create":
            if Sach.objects.filter(ma_sach=book_id).exists():
                messages.error(request, "Mã sách này đã tồn tại trong hệ thống.")
                return redirect("book_list")

            Sach.objects.create(
                ma_sach=book_id,
                ten_sach=title,
                ten_tac_gia=author or None,
                the_loai=category or None,
                ten_nha_xuat_ban=publisher or None,
                nam_xuat_ban=year,
                so_luong=quantity  # Đã bổ sung lưu số lượng
            )
            messages.success(request, "Thêm sách mới thành công.")

        # 4. Thực hiện Cập nhật
        elif action == "update":
            # Ưu tiên lấy theo original_id để tránh lỗi khi người dùng đổi luôn mã sách
            book = get_object_or_404(Sach, ma_sach=original_id if original_id else book_id)

            # Kiểm tra trùng mã sách nếu người dùng thay đổi book_id
            if book_id != original_id and Sach.objects.filter(ma_sach=book_id).exists():
                messages.error(request, "Mã sách mới bị trùng với một sách khác.")
                return redirect("book_list")

            book.ma_sach = book_id
            book.ten_sach = title
            book.ten_tac_gia = author or None
            book.the_loai = category or None
            book.ten_nha_xuat_ban = publisher or None
            book.nam_xuat_ban = year
            book.so_luong = quantity
            book.save()
            messages.success(request, "Cập nhật thông tin sách thành công.")

        return redirect("book_list")

    # =========================
    # XỬ LÝ GET (HIỂN THỊ)
    # =========================
    context = _build_book_context(request)
    return shortcuts.render(request, "book_list.html", context)


@login_required
def book_list(request):
    """Entry point cho url 'book_list'"""
    return book_list_view(request)



@login_required
def quan_ly_kho_view(request):
    # Lấy mã sách từ tham số ?ma_sach=MS0002
    ma_sach_tu_url = request.GET.get('ma_sach')

    # Lấy thông tin cuốn sách chính
    sach_chinh = Sach.objects.get(ma_sach=ma_sach_tu_url)

    # Lấy danh sách các bản sao trong kho của cuốn sách đó
    danh_sach_kho = SachTrongKho.objects.filter(ma_sach=sach_chinh)

    return shortcuts.render(request, 'sachtrongkho.html', {
        'sach': sach_chinh,
        'danh_sach_kho': danh_sach_kho
    })