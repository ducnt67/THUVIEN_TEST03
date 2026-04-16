from django.shortcuts import render
from django.db.models import Q, Sum, Max, F
from muon_sach.models import ChiTietPhieuMuon
from tra_sach.models import KhoanPhat
from django.utils import timezone


def report_statistics(request):
    today = timezone.now().date()

    # ── Thống kê sách đã trả (dùng cho tab 1 & summary top) ──────────────
    returned_qs = ChiTietPhieuMuon.objects.filter(ngay_tra__isnull=False)
    total_returned = returned_qs.count()
    on_time        = returned_qs.filter(ngay_tra__lte=F('han_tra')).count()
    late           = returned_qs.filter(ngay_tra__gt=F('han_tra')).count()

    # ── Thống kê phí phạt ─────────────────────────────────────────────────
    fines_qs = KhoanPhat.objects.select_related(
        'ma_nguoi_dung',
        'ma_sach_trong_kho__ma_sach',
        'ma_phieu_muon',
    )

    total_paid   = fines_qs.filter(
                       trang_thai_tt__iexact='Đã thanh toán'
                   ).aggregate(s=Sum('so_tien'))['s'] or 0

    total_unpaid = fines_qs.filter(
                       ~Q(trang_thai_tt__iexact='Đã thanh toán')
                   ).aggregate(s=Sum('so_tien'))['s'] or 0

    max_fine     = fines_qs.aggregate(m=Max('so_tien'))['m'] or 0

    top_user = (
        fines_qs.values('ma_nguoi_dung__ho_ten')
        .annotate(t=Sum('so_tien'))
        .order_by('-t')
        .first()
    )
    top_user_name = top_user['ma_nguoi_dung__ho_ten'] if top_user else '—'

    # ── Danh sách chi tiết khoản phạt ────────────────────────────────────
    fines_list = []
    for f in fines_qs.order_by('-ngay_tao'):
        fines_list.append({
            'nguoi':     f.ma_nguoi_dung.ho_ten,
            'ma_sach':   f.ma_sach_trong_kho.ma_sach.ma_sach,
            'ten_sach':  f.ma_sach_trong_kho.ma_sach.ten_sach,
            'ly_do':     f.ly_do or '',
            'so_tien':   f.so_tien,
            'ngay_tao':  f.ngay_tao,
            'ma_phieu':  f.ma_phieu_muon.ma_phieu_muon,
            'trang_thai': f.trang_thai_tt,
        })

    context = {
        # Tab thống kê chung
        'total_returned': total_returned,
        'on_time':        on_time,
        'late':           late,
        # Thẻ tổng kê phí phạt
        'total_paid':     total_paid,
        'total_unpaid':   total_unpaid,
        'max_fine':       max_fine,
        'top_user_name':  top_user_name,
        'total_fines':    len(fines_list),
        # Bảng chi tiết phí phạt
        'fines': fines_list,
    }
    return render(request, 'bao_cao/statistics.html', context)
