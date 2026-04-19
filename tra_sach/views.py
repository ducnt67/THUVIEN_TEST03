from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.views.decorators.http import require_POST
from django.http import JsonResponse, HttpResponseBadRequest
from django.db import transaction
from muon_sach.models import PhieuMuon, ChiTietPhieuMuon

from .models import KhoanPhat, ChinhSachPhat
from django.utils import timezone
from decimal import Decimal
from django.db.models import Q

@login_required
def return_list_view(request):
    # Tab 1: Danh sách sách đang mượn (chưa trả)
    chi_tiet_muon = ChiTietPhieuMuon.objects.filter(ngay_tra__isnull=True).select_related(
        'ma_phieu_muon', 'ma_sach_trong_kho', 'ma_phieu_muon__ma_nguoi_dung', 'ma_sach_trong_kho__ma_sach'
    )
    tab1_data = []
    for ct in chi_tiet_muon:
        pm = ct.ma_phieu_muon
        sach_trong_kho = ct.ma_sach_trong_kho
        sach = sach_trong_kho.ma_sach
        tab1_data.append({
            'ma_phieu_muon': pm.ma_phieu_muon,
            'ma_sach_trong_kho': sach_trong_kho.ma_sach_trong_kho,
            'ten_sach': sach.ten_sach,
            'nguoi_muon': pm.ma_nguoi_dung.ho_ten,
            'ngay_muon': pm.ngay_muon,
            'han_tra': ct.han_tra,
            'trang_thai': pm.trang_thai,
            'is_overdue': ct.han_tra < timezone.now().date(),
            'so_ngay_qua_han': (timezone.now().date() - ct.han_tra).days if ct.han_tra < timezone.now().date() else 0,
        })

    # Tab 2: Danh sách người dùng nợ phí phạt
    khoan_phat_chua_tt = KhoanPhat.objects.filter(trang_thai_tt='Chưa thanh toán').select_related('ma_nguoi_dung')
    tab2_data = {}
    for kp in khoan_phat_chua_tt:
        nd = kp.ma_nguoi_dung
        if nd.ma_nguoi_dung not in tab2_data:
            tab2_data[nd.ma_nguoi_dung] = {
                'ma_nguoi_dung': nd.ma_nguoi_dung,
                'ho_ten': nd.ho_ten,
                'tong_tien': 0,
            }
        tab2_data[nd.ma_nguoi_dung]['tong_tien'] += float(kp.so_tien)
    tab2_data = list(tab2_data.values())

    # Tab 3: Danh sách bản ghi mượn cần xử lý mất sách (chưa trả, chưa xử lý mất)
    lost_qs = ChiTietPhieuMuon.objects.filter(
        ngay_tra__isnull=True,
        ngay_khai_bao_mat__isnull=True
    ).select_related('ma_phieu_muon', 'ma_sach_trong_kho', 'ma_phieu_muon__ma_nguoi_dung', 'ma_sach_trong_kho__ma_sach')
    tab3_data = []
    for ct in lost_qs:
        pm = ct.ma_phieu_muon
        sach_trong_kho = ct.ma_sach_trong_kho
        sach = sach_trong_kho.ma_sach
        tab3_data.append({
            'ma_phieu_muon': pm.ma_phieu_muon,
            'ten_sach': sach.ten_sach,
            'ma_sach_trong_kho': sach_trong_kho.ma_sach_trong_kho,
            'nguoi_muon': pm.ma_nguoi_dung.ho_ten,
            'han_tra': ct.han_tra,
            'trang_thai': pm.trang_thai,
        })

    # Tab 4: Danh sách hồ sơ chờ xác nhận đền sách
    comp_qs = ChiTietPhieuMuon.objects.filter(
        ngay_tra__isnull=True,
        ngay_khai_bao_mat__isnull=False,
        ma_phieu_muon__trang_thai='Chờ đền sách'
    ).select_related('ma_phieu_muon', 'ma_sach_trong_kho', 'ma_phieu_muon__ma_nguoi_dung', 'ma_sach_trong_kho__ma_sach')
    tab4_data = []
    for ct in comp_qs:
        pm = ct.ma_phieu_muon
        sach_trong_kho = ct.ma_sach_trong_kho
        sach = sach_trong_kho.ma_sach
        tab4_data.append({
            'ma_phieu_muon': pm.ma_phieu_muon,
            'ten_sach': sach.ten_sach,
            'ma_sach_trong_kho': sach_trong_kho.ma_sach_trong_kho,
            'nguoi_muon': pm.ma_nguoi_dung.ho_ten,
            'ngay_khai_bao_mat': ct.ngay_khai_bao_mat,
            'trang_thai': pm.trang_thai,
        })

    context = {
        'tab1_data': tab1_data,
        'tab2_data': tab2_data,
        'tab3_data': tab3_data,
        'tab4_data': tab4_data,
    }
    return render(request, 'tra_sach/return_list.html', context)

@login_required
def return_list(request):
    return return_list_view(request)

@login_required
@require_POST
def api_xac_nhan_tra_sach(request):
    """
    API xác nhận trả sách: kiểm tra trạng thái, cập nhật trạng thái, tạo khoản phạt nếu cần.
    Yêu cầu POST: ma_phieu_muon, ma_sach_trong_kho, tinh_trang_khi_tra ('tot'/'hu_hong'), mo_ta_hu_hong (nếu có)
    """
    try:
        ma_phieu_muon = request.POST.get('ma_phieu_muon')
        ma_sach_trong_kho = request.POST.get('ma_sach_trong_kho')
        tinh_trang = request.POST.get('tinh_trang_khi_tra')
        mo_ta_hu_hong = request.POST.get('mo_ta_hu_hong', '')
        nguoi_xac_nhan = request.user
        if not (ma_phieu_muon and ma_sach_trong_kho and tinh_trang):
            return HttpResponseBadRequest('Thiếu thông tin bắt buộc')

        with transaction.atomic():
            ctpm = ChiTietPhieuMuon.objects.select_for_update().get(
                ma_phieu_muon__ma_phieu_muon=ma_phieu_muon,
                ma_sach_trong_kho__ma_sach_trong_kho=ma_sach_trong_kho,
                ngay_tra__isnull=True
            )
            pm = ctpm.ma_phieu_muon
            if pm.trang_thai not in ['Đang mượn', 'Quá hạn']:
                return JsonResponse({'error': 'Chỉ xác nhận trả khi trạng thái là Đang mượn hoặc Quá hạn.'}, status=400)
            # Cập nhật ngày trả, tình trạng
            ctpm.ngay_tra = timezone.now().date()
            ctpm.tinh_trang_khi_tra = 'Tốt' if tinh_trang == 'tot' else 'Hư hỏng'
            ctpm.save()
            # Cập nhật số lượng và trạng thái sách trong kho khi trả
            sach_trong_kho = ctpm.ma_sach_trong_kho
            if hasattr(sach_trong_kho, 'so_luong'):
                sach_trong_kho.so_luong = (sach_trong_kho.so_luong or 0) + 1
            if tinh_trang == 'tot':
                sach_trong_kho.trang_thai_sach = 'available'
            elif tinh_trang == 'hu_hong':
                sach_trong_kho.trang_thai_sach = 'damaged'
            sach_trong_kho.save()
            # Cập nhật trạng thái phiếu mượn nếu tất cả sách đã trả
            if not ChiTietPhieuMuon.objects.filter(ma_phieu_muon=pm, ngay_tra__isnull=True).exists():
                pm.trang_thai = 'Đã trả'
                pm.save()
            # Xử lý phạt trễ hạn
            han_tra = ctpm.han_tra
            ngay_tra = ctpm.ngay_tra
            phat_trong_chinh_sach = ChinhSachPhat.objects.filter(loai_phat__icontains='Trễ hạn').first()
            khoan_phat = None
            if ngay_tra > han_tra and phat_trong_chinh_sach:
                so_ngay_qua_han = (ngay_tra - han_tra).days
                so_tien = so_ngay_qua_han * Decimal(phat_trong_chinh_sach.muc_phat_moi_ngay or 0)
                khoan_phat = KhoanPhat.objects.create(
                    ma_phat=f'FINE-{timezone.now().strftime("%Y%m%d%H%M%S%f")}',
                    ma_nguoi_dung=pm.ma_nguoi_dung,
                    ma_phieu_muon=pm,
                    ma_sach_trong_kho=ctpm.ma_sach_trong_kho,
                    ma_loai_phat=phat_trong_chinh_sach,
                    so_tien=so_tien,
                    ngay_tao=timezone.now(),
                    trang_thai_tt='Chưa thanh toán',
                    ly_do=f'Trả trễ {so_ngay_qua_han} ngày',
                    nguoi_tao=nguoi_xac_nhan
                )
            # Xử lý phạt hư hỏng
            if tinh_trang == 'hu_hong':
                chinh_sach_hu_hong = ChinhSachPhat.objects.filter(loai_phat__icontains='Hư hỏng').first()
                if chinh_sach_hu_hong:
                    so_tien_hu_hong = Decimal(chinh_sach_hu_hong.muc_phat_hu_hong or 0)
                    KhoanPhat.objects.create(
                        ma_phat=f'FINE-{timezone.now().strftime("%Y%m%d%H%M%S%f")}',
                        ma_nguoi_dung=pm.ma_nguoi_dung,
                        ma_phieu_muon=pm,
                        ma_sach_trong_kho=ctpm.ma_sach_trong_kho,
                        ma_loai_phat=chinh_sach_hu_hong,
                        so_tien=so_tien_hu_hong,
                        ngay_tao=timezone.now(),
                        trang_thai_tt='Chưa thanh toán',
                        ly_do=f'Hư hỏng: {mo_ta_hu_hong}',
                        nguoi_tao=nguoi_xac_nhan
                    )
            return JsonResponse({'success': True})
    except ChiTietPhieuMuon.DoesNotExist:
        return JsonResponse({'error': 'Không tìm thấy bản ghi mượn.'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@require_POST
def api_thanh_toan_phi_phat(request):
    """
    API xác nhận thanh toán phí phạt cho 1 hoặc nhiều khoản phạt.
    Yêu cầu POST: ma_nguoi_dung, danh_sach_ma_phat[], phuong_thuc
    """
    try:
        ma_nguoi_dung = request.POST.get('ma_nguoi_dung')
        phuong_thuc = request.POST.get('phuong_thuc')
        danh_sach_ma_phat = request.POST.getlist('danh_sach_ma_phat[]')
        nguoi_thu = request.user
        if not (ma_nguoi_dung and phuong_thuc and danh_sach_ma_phat):
            return HttpResponseBadRequest('Thiếu thông tin bắt buộc')
        with transaction.atomic():
            khoan_phat_qs = KhoanPhat.objects.select_for_update().filter(ma_phat__in=danh_sach_ma_phat, trang_thai_tt='Chưa thanh toán')
            if khoan_phat_qs.count() != len(danh_sach_ma_phat):
                return JsonResponse({'error': 'Có khoản phạt không hợp lệ hoặc đã thanh toán.'}, status=400)
            tong_tien = sum([float(kp.so_tien) for kp in khoan_phat_qs])
            from .models import GiaoDichThanhToan, ChiTietThanhToan
            from quan_ly_nguoi_dung.models import NguoiDung
            nguoi_dung = NguoiDung.objects.get(pk=ma_nguoi_dung)
            gd = GiaoDichThanhToan.objects.create(
                ma_giao_dich=f'PAY-{timezone.now().strftime("%Y%m%d%H%M%S%f")}',
                ma_nguoi_dung=nguoi_dung,
                tong_so_tien=tong_tien,
                phuong_thuc=phuong_thuc,
                thoi_gian_thanh_toan=timezone.now(),
                trang_thai='Đã thanh toán',
                nguoi_thu=nguoi_thu
            )
            for kp in khoan_phat_qs:
                ChiTietThanhToan.objects.create(
                    ma_giao_dich=gd,
                    ma_phat=kp,
                    so_tien_thanh_toan=kp.so_tien
                )
                kp.trang_thai_tt = 'Đã thanh toán'
                kp.save()
            return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@require_POST
def api_xu_ly_mat_sach(request):
    """
    API xử lý mất sách: cập nhật trạng thái, tạo khoản phạt hoặc chuyển trạng thái chờ đền sách.
    Yêu cầu POST: ma_phieu_muon, ma_sach_trong_kho, ngay_khai_bao_mat, phuong_an ('den_bu_tien'/'den_sach_moi'), ghi_chu
    """
    try:
        ma_phieu_muon = request.POST.get('ma_phieu_muon')
        ma_sach_trong_kho = request.POST.get('ma_sach_trong_kho')
        ngay_khai_bao_mat = request.POST.get('ngay_khai_bao_mat')
        phuong_an = request.POST.get('phuong_an')
        ghi_chu = request.POST.get('ghi_chu', '')
        nguoi_xu_ly = request.user
        if not (ma_phieu_muon and ma_sach_trong_kho and ngay_khai_bao_mat and phuong_an):
            return HttpResponseBadRequest('Thiếu thông tin bắt buộc')
        with transaction.atomic():
            ctpm = ChiTietPhieuMuon.objects.select_for_update().get(
                ma_phieu_muon__ma_phieu_muon=ma_phieu_muon,
                ma_sach_trong_kho__ma_sach_trong_kho=ma_sach_trong_kho,
                ngay_tra__isnull=True
            )
            pm = ctpm.ma_phieu_muon
            if pm.trang_thai not in ['Đang mượn', 'Quá hạn']:
                return JsonResponse({'error': 'Chỉ xử lý mất sách khi trạng thái là Đang mượn hoặc Quá hạn.'}, status=400)
            ctpm.ngay_khai_bao_mat = ngay_khai_bao_mat
            ctpm.save()
            sach_trong_kho = ctpm.ma_sach_trong_kho
            if phuong_an == 'den_bu_tien':
                sach_trong_kho.trang_thai_sach = 'lost'
                sach_trong_kho.save()
                # Giảm số lượng sách
                sach = sach_trong_kho.ma_sach
                if sach.so_luong > 0:
                    sach.so_luong -= 1
                    sach.save()
                chinh_sach_mat = ChinhSachPhat.objects.filter(loai_phat__icontains='Mất sách').first()
                if not chinh_sach_mat:
                    return JsonResponse({'error': 'Chưa cấu hình chính sách phạt mất sách.'}, status=400)
                so_tien_mat = Decimal(chinh_sach_mat.muc_den_bu_mat_sach or 0)
                from .models import KhoanPhat
                KhoanPhat.objects.create(
                    ma_phat=f'FINE-{timezone.now().strftime("%Y%m%d%H%M%S%f")}',
                    ma_nguoi_dung=pm.ma_nguoi_dung,
                    ma_phieu_muon=pm,
                    ma_sach_trong_kho=ctpm.ma_sach_trong_kho,
                    ma_loai_phat=chinh_sach_mat,
                    so_tien=so_tien_mat,
                    ngay_tao=timezone.now(),
                    trang_thai_tt='Chưa thanh toán',
                    ly_do=f'Mất sách: {ghi_chu}',
                    nguoi_tao=nguoi_xu_ly
                )
                pm.trang_thai = 'Đang xử lý'
                pm.save()
            elif phuong_an == 'den_sach_moi':
                sach_trong_kho.trang_thai_sach = 'lost'
                sach_trong_kho.save()
                # Giảm số lượng sách
                sach = sach_trong_kho.ma_sach
                if sach.so_luong > 0:
                    sach.so_luong -= 1
                    sach.save()
                pm.trang_thai = 'Chờ đền sách'
                pm.save()
            else:
                return JsonResponse({'error': 'Phương án bồi hoàn không hợp lệ.'}, status=400)
            return JsonResponse({'success': True})
    except ChiTietPhieuMuon.DoesNotExist:
        return JsonResponse({'error': 'Không tìm thấy bản ghi mượn.'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
@require_POST
def api_xac_nhan_den_sach(request):
    """
    API xác nhận đền sách: cập nhật trạng thái phiếu mượn, nhập sách mới vào kho.
    Yêu cầu POST: ma_phieu_muon, ma_sach_trong_kho_moi, thong_tin_sach_moi
    """
    try:
        ma_phieu_muon = request.POST.get('ma_phieu_muon')
        ma_sach_trong_kho_moi = request.POST.get('ma_sach_trong_kho_moi')
        thong_tin_sach_moi = request.POST.get('thong_tin_sach_moi', '')
        nguoi_xac_nhan = request.user
        if not (ma_phieu_muon and ma_sach_trong_kho_moi):
            return HttpResponseBadRequest('Thiếu thông tin bắt buộc')
        with transaction.atomic():
            pm = PhieuMuon.objects.select_for_update().get(ma_phieu_muon=ma_phieu_muon)
            if pm.trang_thai != 'Chờ đền sách':
                return JsonResponse({'error': 'Chỉ xác nhận khi trạng thái là Chờ đền sách.'}, status=400)
            pm.trang_thai = 'Đã xử lý - Đền sách'
            pm.save()
            from quan_ly_sach.models import SachTrongKho, Sach
            sach_trong_kho = SachTrongKho.objects.create(
                ma_sach_trong_kho=ma_sach_trong_kho_moi,
                trang_thai_sach='available',
                ghi_chu=thong_tin_sach_moi
            )
            # Tăng số lượng sách
            # Tìm sách theo tiền tố mã sách trong kho
            ma_sach = ma_sach_trong_kho_moi.split('-')[0] if '-' in ma_sach_trong_kho_moi else None
            if ma_sach:
                try:
                    sach = Sach.objects.get(ma_sach=ma_sach)
                    sach.so_luong += 1
                    sach.save()
                except Sach.DoesNotExist:
                    pass
            return JsonResponse({'success': True})
    except PhieuMuon.DoesNotExist:
        return JsonResponse({'error': 'Không tìm thấy phiếu mượn.'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# Không có endpoint hoặc logic scan barcode ở backend, không cần chỉnh sửa gì thêm cho phần này.
