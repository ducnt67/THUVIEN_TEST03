from django.contrib import messages
from django.db.models import Count, Q, F
from django.shortcuts import get_object_or_404, redirect, render
from .models import Sach, SachTrongKho


def _book_queryset(keyword):
    books = Sach.objects.all()

    if keyword:
        books = books.filter(
            Q(ma_sach__icontains=keyword) |
            Q(ten_sach__icontains=keyword) |
            Q(ten_tac_gia__icontains=keyword) |
            Q(the_loai__icontains=keyword) |
            Q(ten_nha_xuat_ban__icontains=keyword)
        )

    # Trong views.py, hãy đảm bảo filter đúng giá trị text trong database
    return books.annotate(
        total_quantity=F('so_luong'),
        # Đếm số lượng Sẵn sàng
        available_quantity=Count(
            'sach_trong_kho',
            filter=Q(sach_trong_kho__trang_thai_sach='available'),
            distinct=True
        ),
        # Đếm tất cả những cuốn KHÔNG sẵn sàng (đang mượn, quá hạn, mất...)
        not_available_quantity=Count(
            'sach_trong_kho',
            filter=~Q(sach_trong_kho__trang_thai_sach='available'),
            distinct=True
        ),
        # Bạn có thể đếm riêng Quá hạn nếu muốn hiện cảnh báo đỏ
        overdue_quantity=Count(
            'sach_trong_kho',
            filter=Q(sach_trong_kho__trang_thai_sach='overdue'),
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


def book_list_view(request):
    # =========================
    # XỬ LÝ POST (CREATE / UPDATE / DELETE / ADD COPIES)
    # =========================
    if request.method == "POST":
        action = request.POST.get("action", "").strip()
        book_id = request.POST.get("book_id", "").strip()

        # --- NHÓM 1: CÁC HÀNH ĐỘNG CHỈ CẦN ID (XÓA / THÊM BẢN SAO) ---

        # 1. Hành động Xóa
        if action == "delete":
            book = get_object_or_404(Sach, ma_sach=book_id)

            # Lấy các bản sao theo trạng thái
            available_copies = book.sach_trong_kho.filter(trang_thai_sach='available')
            not_available_copies = book.sach_trong_kho.exclude(trang_thai_sach='available')

            # Xóa chỉ các bản available
            deleted_count = available_copies.count()
            available_copies.delete()

            # Nếu vẫn còn bản đang mượn / quá hạn
            if not_available_copies.exists():
                messages.warning(
                    request,
                    f"Đã xóa {deleted_count} bản có sẵn. "
                    f"Còn {not_available_copies.count()} bản đang được mượn / không thể xóa."
                )
            else:
                # Không còn bản nào → xóa luôn sách chính
                book.delete()

            return redirect("book_list")

        # 2. Hành động Thêm bản sao (Modal riêng)
        elif action == "add_copies":
            num_to_add_raw = request.POST.get("num_to_add", "0")
            try:
                num_to_add = int(num_to_add_raw)
                book = get_object_or_404(Sach, ma_sach=book_id)
                book.so_luong += num_to_add
                book.save()  # Tự động gọi dong_bo_kho() trong Model
                messages.success(request, f"Đã thêm {num_to_add} bản sao cho sách {book.ten_sach}.")
            except Exception as e:
                messages.error(request, f"Lỗi khi thêm bản sao: {str(e)}")
            return redirect("book_list")

        # --- NHÓM 2: CÁC HÀNH ĐỘNG CẦN NHẬP FORM ĐẦY ĐỦ (CREATE / UPDATE) ---

        title = request.POST.get("title", "").strip()
        author = request.POST.get("author", "").strip()
        category = request.POST.get("category", "").strip()
        publisher = request.POST.get("publisher", "").strip()
        year_raw = request.POST.get("year", "").strip()
        quantity_raw = request.POST.get("quantity", "0").strip()
        original_id = request.POST.get("original_id", "").strip()

        # Kiểm tra thông tin bắt buộc cho Create/Update
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
                messages.error(request, "Mã sách này đã tồn tại.")
            else:
                Sach.objects.create(
                    ma_sach=book_id, ten_sach=title, ten_tac_gia=author or None,
                    the_loai=category or None, ten_nha_xuat_ban=publisher or None,
                    nam_xuat_ban=year, so_luong=quantity
                )


        # 4. Thực hiện Cập nhật
        elif action == "update":
            book = get_object_or_404(Sach, ma_sach=original_id if original_id else book_id)
            if book_id != original_id and Sach.objects.filter(ma_sach=book_id).exists():
                messages.error(request, "Mã sách mới bị trùng.")
            else:
                book.ma_sach = book_id
                book.ten_sach = title
                book.ten_tac_gia = author or None
                book.the_loai = category or None
                book.ten_nha_xuat_ban = publisher or None
                book.nam_xuat_ban = year
                book.so_luong = quantity
                book.save()

        return redirect("book_list")

    # =========================
    # XỬ LÝ GET (HIỂN THỊ)
    # =========================
    context = _build_book_context(request)
    return render(request, "book_list.html", context)



def book_list(request):
    """Entry point cho url 'book_list'"""
    return book_list_view(request)


def quan_ly_kho_view(request):
    # Lấy mã sách từ tham số ?ma_sach=MS0002
    ma_sach_tu_url = request.GET.get('ma_sach')

    # Lấy thông tin cuốn sách chính
    sach_chinh = Sach.objects.get(ma_sach=ma_sach_tu_url)

    # Lấy danh sách các bản sao trong kho của cuốn sách đó
    danh_sach_kho = SachTrongKho.objects.filter(ma_sach=sach_chinh)

    return render(request, 'sachtrongkho.html', {
        'sach': sach_chinh,
        'danh_sach_kho': danh_sach_kho
    })