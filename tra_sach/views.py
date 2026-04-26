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

def _create_fine(ma_nguoi_dung, ma_phieu_muon, ma_sach_trong_kho, ma_loai_phat, so_tien, ly_do, nguoi_tao):
    """Hàm hỗ trợ tạo khoản phạt."""
    if so_tien > 0:
        KhoanPhat.objects.create(
            ma_nguoi_dung=ma_nguoi_dung,
            ma_phieu_muon=ma_phieu_muon,
            ma_sach_trong_kho=ma_sach_trong_kho,
            ma_loai_phat=ma_loai_phat,
            so_tien=so_tien,
            trang_thai_tt='Chưa thanh toán',
            ly_do=ly_do,
            nguoi_tao=nguoi_tao
        )

@login_required
def return_list_view(request):
    # Tab 1: Danh sách sách (Tất cả: Đang mượn + Đã trả)
    chi_tiet_muon = ChiTietPhieuMuon.objects.all().select_related(
        'ma_phieu_muon', 'ma_sach_trong_kho', 'ma_phieu_muon__ma_nguoi_dung', 'ma_sach_trong_kho__ma_sach'
    ).order_by('ma_phieu_muon')
    
    tab1_grouped = {}
    for ct in chi_tiet_muon:
        pm = ct.ma_phieu_muon
        key = pm.ma_phieu_muon
        if key not in tab1_grouped:
            tab1_grouped[key] = {
                'ma_phieu_muon': pm.ma_phieu_muon,
                'nguoi_muon': pm.ma_nguoi_dung.ho_ten,
                'ngay_muon': pm.ngay_muon,
                'trang_thai': pm.get_trang_thai_display(),
                'sach_list': []
            }
        sach_trong_kho = ct.ma_sach_trong_kho
        sach = sach_trong_kho.ma_sach
        tab1_grouped[key]['sach_list'].append({
            'ma_sach_trong_kho': sach_trong_kho.ma_sach_trong_kho,
            'ten_sach': sach.ten_sach,
            'han_tra': ct.han_tra,
            'ngay_tra': ct.ngay_tra,
            'tinh_trang': ct.tinh_trang_khi_tra,
            'is_returned': ct.ngay_tra is not None,
            'is_lost': ct.ngay_khai_bao_mat is not None,
            'is_overdue': ct.han_tra < timezone.now().date() if not ct.ngay_tra else ct.han_tra < ct.ngay_tra,
            'so_ngay_qua_han': (timezone.now().date() - ct.han_tra).days if ct.han_tra < timezone.now().date() and not ct.ngay_tra else 0,
        })
    tab1_data = list(tab1_grouped.values())

    # Tab 2: Danh sách người dùng nợ phí phạt (Chỉ hiện nợ thực tế, nhưng lưu vết tất cả)
    khoan_phat_all = KhoanPhat.objects.all().select_related('ma_nguoi_dung', 'ma_loai_phat')
    tab2_data = {}
    for kp in khoan_phat_all:
        nd = kp.ma_nguoi_dung
        if nd.ma_nguoi_dung not in tab2_data:
            tab2_data[nd.ma_nguoi_dung] = {
                'ma_nguoi_dung': nd.ma_nguoi_dung,
                'ho_ten': nd.ho_ten,
                'tong_tien': 0,
                'ly_do_phat': []
            }
        if kp.trang_thai_tt == 'Chưa thanh toán':
            tab2_data[nd.ma_nguoi_dung]['tong_tien'] += float(kp.so_tien)
            loai_phat = kp.ma_loai_phat.loai_phat if kp.ma_loai_phat else 'Khác'
            tab2_data[nd.ma_nguoi_dung]['ly_do_phat'].append(f"{loai_phat}")
            
    # Lọc lại lý do để tránh trùng lặp
    for k, v in tab2_data.items():
        v['ly_do_phat'] = list(set(v['ly_do_phat']))
        
    tab2_data = list(tab2_data.values())

    # Tab 3: Danh sách báo mất (Hiện các trường hợp ĐÃ báo mất HOẶC đang mượn/quá hạn để báo mất)
    lost_qs = ChiTietPhieuMuon.objects.filter(
        Q(ngay_khai_bao_mat__isnull=False) | Q(ngay_tra__isnull=True)
    ).select_related('ma_phieu_muon', 'ma_sach_trong_kho', 'ma_phieu_muon__ma_nguoi_dung', 'ma_sach_trong_kho__ma_sach')
    
    tab3_grouped = {}
    for ct in lost_qs:
        pm = ct.ma_phieu_muon
        key = pm.ma_phieu_muon
        if key not in tab3_grouped:
            tab3_grouped[key] = {
                'ma_phieu_muon': pm.ma_phieu_muon,
                'nguoi_muon': pm.ma_nguoi_dung.ho_ten,
                'trang_thai': pm.get_trang_thai_display(),
                'sach_list': []
            }
        sach_trong_kho = ct.ma_sach_trong_kho
        sach = sach_trong_kho.ma_sach
        is_lost = ct.ngay_khai_bao_mat is not None
        is_overdue = ct.han_tra < timezone.now().date() if not ct.ngay_tra else ct.han_tra < ct.ngay_tra
        
        tab3_grouped[key]['sach_list'].append({
            'ma_sach_trong_kho': sach_trong_kho.ma_sach_trong_kho,
            'ten_sach': sach.ten_sach,
            'han_tra': ct.han_tra,
            'is_lost': is_lost,
            'is_overdue': is_overdue,
            'ngay_mat': ct.ngay_khai_bao_mat,
            'so_ngay_qua_han': (timezone.now().date() - ct.han_tra).days if is_overdue and not ct.ngay_tra else 0,
        })
    tab3_data = list(tab3_grouped.values())

    # Tab 4: Danh sách hồ sơ chờ xác nhận đền sách (Chỉ các trường hợp chọn đền sách mới)
    comp_qs = ChiTietPhieuMuon.objects.filter(
        ngay_khai_bao_mat__isnull=False,
        phuong_an_boi_thuong='den_sach_moi'
    ).select_related('ma_phieu_muon', 'ma_sach_trong_kho', 'ma_phieu_muon__ma_nguoi_dung', 'ma_sach_trong_kho__ma_sach')
    
    tab4_grouped = {}
    for ct in comp_qs:
        pm = ct.ma_phieu_muon
        key = pm.ma_phieu_muon
        if key not in tab4_grouped:
            tab4_grouped[key] = {
                'ma_phieu_muon': pm.ma_phieu_muon,
                'nguoi_muon': pm.ma_nguoi_dung.ho_ten,
                'trang_thai': pm.get_trang_thai_display(),
                'sach_list': []
            }
        sach_trong_kho = ct.ma_sach_trong_kho
        sach = sach_trong_kho.ma_sach
        tab4_grouped[key]['sach_list'].append({
            'ma_sach_trong_kho': sach_trong_kho.ma_sach_trong_kho,
            'ten_sach': sach.ten_sach,
            'ngay_khai_bao_mat': ct.ngay_khai_bao_mat,
            'is_completed': pm.trang_thai == 'da_tra'
        })
    tab4_data = list(tab4_grouped.values())

    # Lấy tất cả chính sách phạt hư hỏng từ CSDL
    import json
    chinh_sach_hu_hong = ChinhSachPhat.objects.filter(muc_phat_hu_hong__isnull=False).order_by('muc_phat_hu_hong')
    damage_fines_dict = {}
    for cs in chinh_sach_hu_hong:
        if 'nhẹ' in cs.loai_phat.lower():
            damage_fines_dict['light'] = float(cs.muc_phat_hu_hong)
        elif 'vừa' in cs.loai_phat.lower():
            damage_fines_dict['medium'] = float(cs.muc_phat_hu_hong)
        elif 'nặng' in cs.loai_phat.lower():
            damage_fines_dict['severe'] = float(cs.muc_phat_hu_hong)
    damage_fines_json = json.dumps(damage_fines_dict)
    
    # Lấy mức phạt trễ hạn
    chinh_sach_tre_han = ChinhSachPhat.objects.filter(loai_phat__icontains='Trễ hạn').first()
    overdue_rate = float(chinh_sach_tre_han.muc_phat_moi_ngay) if chinh_sach_tre_han and chinh_sach_tre_han.muc_phat_moi_ngay else 0

    # Lấy phí phạt mất sách
    chinh_sach_mat_sach = ChinhSachPhat.objects.filter(loai_phat__icontains='Mất sách').first()
    lost_fee = float(chinh_sach_mat_sach.muc_den_bu_mat_sach) if chinh_sach_mat_sach and chinh_sach_mat_sach.muc_den_bu_mat_sach else 0

    context = {
        'tab1_data': tab1_data,
        'tab2_data': tab2_data,
        'tab3_data': tab3_data,
        'tab4_data': tab4_data,
        'damage_fines': damage_fines_json,
        'chinh_sach_hu_hong': chinh_sach_hu_hong,
        'overdue_rate': overdue_rate,
        'lost_fee': lost_fee,
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
        tinh_trang = request.POST.get('tinh_trang')
        mo_ta_hu_hong = request.POST.get('mo_ta_hu_hong', '')
        damage_level_id = request.POST.get('damage_level', '')  # ID của loại phạt hư hỏng
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

            if pm.trang_thai not in ['dang_muon', 'qua_han']:
                return JsonResponse({'error': f'Chỉ xác nhận trả khi trạng thái là Đang mượn hoặc Quá hạn (Hiện tại: {pm.trang_thai}).'}, status=400)
            
            ngay_tra = timezone.now().date()
            ctpm.ngay_tra = ngay_tra
            ctpm.tinh_trang_khi_tra = 'Tốt' if tinh_trang == 'tot' else f'Hư hỏng - {mo_ta_hu_hong}'
            ctpm.save(update_fields=['ngay_tra', 'tinh_trang_khi_tra'])

            sach_trong_kho = ctpm.ma_sach_trong_kho
            sach_trong_kho.trang_thai_sach = 'available' if tinh_trang == 'tot' else 'damaged'
            sach_trong_kho.save(update_fields=['trang_thai_sach'])

            # Xử lý phạt trễ hạn
            so_ngay_qua_han = (ngay_tra - ctpm.han_tra).days
            if so_ngay_qua_han > 0:
                chinh_sach_tre_han = ChinhSachPhat.objects.filter(loai_phat__icontains='Trễ hạn').first()
                if chinh_sach_tre_han and chinh_sach_tre_han.muc_phat_moi_ngay:
                    so_tien_phat = so_ngay_qua_han * chinh_sach_tre_han.muc_phat_moi_ngay
                    _create_fine(pm.ma_nguoi_dung, pm, sach_trong_kho, chinh_sach_tre_han, so_tien_phat, f'Trả sách trễ {so_ngay_qua_han} ngày', nguoi_xac_nhan)

            # Xử lý phạt hư hỏng
            if tinh_trang == 'hu_hong' and damage_level_id:
                try:
                    chinh_sach_hu_hong = ChinhSachPhat.objects.get(pk=damage_level_id)
                    if chinh_sach_hu_hong.muc_phat_hu_hong:
                        _create_fine(pm.ma_nguoi_dung, pm, sach_trong_kho, chinh_sach_hu_hong, chinh_sach_hu_hong.muc_phat_hu_hong, f'Làm hỏng sách: {mo_ta_hu_hong}', nguoi_xac_nhan)
                except ChinhSachPhat.DoesNotExist:
                    # Bỏ qua nếu không tìm thấy chính sách (tránh gây lỗi)
                    pass

            pm.sync_status()
            return JsonResponse({'success': True})

    except ChiTietPhieuMuon.DoesNotExist:
        return JsonResponse({'error': 'Không tìm thấy bản ghi mượn.'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def api_get_user_fines(request):
    """
    API lấy danh sách các khoản phạt (tất cả lịch sử) của một người dùng.
    """
    ma_nguoi_dung = request.GET.get('ma_nguoi_dung')
    if not ma_nguoi_dung:
        return JsonResponse({'error': 'Thiếu mã người dùng'}, status=400)
    
    khoan_phats = KhoanPhat.objects.filter(
        ma_nguoi_dung__ma_nguoi_dung=ma_nguoi_dung
    ).select_related('ma_sach_trong_kho__ma_sach', 'ma_loai_phat', 'ma_phieu_muon')
    
    data = []
    for kp in khoan_phats:
        data.append({
            'ma_phat': kp.ma_phat,
            'ma_sach_trong_kho': kp.ma_sach_trong_kho.ma_sach_trong_kho if kp.ma_sach_trong_kho else '-',
            'ten_sach': kp.ma_sach_trong_kho.ma_sach.ten_sach if kp.ma_sach_trong_kho else 'N/A',
            'loai_phat': kp.ma_loai_phat.loai_phat if kp.ma_loai_phat else 'Khác',
            'ly_do': kp.ly_do or '-',
            'so_tien': float(kp.so_tien),
            'ngay_tao': kp.ngay_tao.strftime('%d/%m/%Y'),
            'ma_phieu_muon': kp.ma_phieu_muon.ma_phieu_muon if kp.ma_phieu_muon else '-',
            'trang_thai': kp.trang_thai_tt
        })
    
    return JsonResponse({'success': True, 'fines': data})

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
            from muon_sach.models import PhieuMuon, ChiTietPhieuMuon
            
            for kp in khoan_phat_qs:
                ChiTietThanhToan.objects.create(
                    ma_giao_dich=gd,
                    ma_phat=kp,
                    so_tien_thanh_toan=kp.so_tien
                )
                kp.trang_thai_tt = 'Đã thanh toán'
                kp.save()

                # Nếu đây là khoản phạt mất sách, ta cần hoàn tất quy trình mượn
                if kp.ma_loai_phat and 'mất sách' in kp.ma_loai_phat.loai_phat.lower():
                    if kp.ma_phieu_muon and kp.ma_sach_trong_kho:
                        pm = kp.ma_phieu_muon
                        try:
                            ctpm = ChiTietPhieuMuon.objects.get(
                                ma_phieu_muon=pm,
                                ma_sach_trong_kho=kp.ma_sach_trong_kho
                            )
                            # Đánh dấu là đã xử lý xong việc mất sách (coi như đã trả)
                            if not ctpm.ngay_tra:
                                ctpm.ngay_tra = timezone.now().date()
                                ctpm.save(update_fields=['ngay_tra'])
                            
                            pm.sync_status() # Cập nhật lại trạng thái tổng của phiếu
                        except ChiTietPhieuMuon.DoesNotExist:
                            pass

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
        ngay_khai_bao_mat_str = request.POST.get('ngay_khai_bao_mat')
        phuong_an = request.POST.get('phuong_an')
        ghi_chu = request.POST.get('ghi_chu', '')
        nguoi_xu_ly = request.user

        if not (ma_phieu_muon and ma_sach_trong_kho and ngay_khai_bao_mat_str and phuong_an):
            return HttpResponseBadRequest('Thiếu thông tin bắt buộc')

        ngay_khai_bao_mat = timezone.datetime.strptime(ngay_khai_bao_mat_str, '%Y-%m-%d').date()

        with transaction.atomic():
            ctpm = ChiTietPhieuMuon.objects.select_for_update().get(
                ma_phieu_muon__ma_phieu_muon=ma_phieu_muon,
                ma_sach_trong_kho__ma_sach_trong_kho=ma_sach_trong_kho,
                ngay_tra__isnull=True
            )
            pm = ctpm.ma_phieu_muon

            if pm.trang_thai not in ['dang_muon', 'qua_han']:
                return JsonResponse({'error': f'Chỉ xử lý mất sách khi trạng thái là Đang mượn hoặc Quá hạn (Hiện tại: {pm.trang_thai}).'}, status=400)

            ctpm.ngay_khai_bao_mat = ngay_khai_bao_mat
            ctpm.phuong_an_boi_thuong = phuong_an
            ctpm.save()

            sach_trong_kho = ctpm.ma_sach_trong_kho
            sach_trong_kho.trang_thai_sach = 'lost'
            sach_trong_kho.save()
            
            sach = sach_trong_kho.ma_sach
            if sach.so_luong > 0:
                sach.so_luong -= 1
                sach.save()

            # Xử lý phạt trễ hạn (nếu có)
            so_ngay_qua_han = (ngay_khai_bao_mat - ctpm.han_tra).days
            if so_ngay_qua_han > 0:
                chinh_sach_tre_han = ChinhSachPhat.objects.filter(loai_phat__icontains='Trễ hạn').first()
                if chinh_sach_tre_han and chinh_sach_tre_han.muc_phat_moi_ngay:
                    so_tien_phat_tre_han = so_ngay_qua_han * chinh_sach_tre_han.muc_phat_moi_ngay
                    _create_fine(pm.ma_nguoi_dung, pm, sach_trong_kho, chinh_sach_tre_han, so_tien_phat_tre_han, f'Trễ hạn {so_ngay_qua_han} ngày trước khi báo mất', nguoi_xu_ly)

            if phuong_an == 'den_bu_tien':
                chinh_sach_mat = ChinhSachPhat.objects.filter(loai_phat__icontains='Mất sách').first()
                if not chinh_sach_mat:
                    return JsonResponse({'error': 'Chưa cấu hình chính sách phạt mất sách.'}, status=400)
                
                so_tien_mat = Decimal(chinh_sach_mat.muc_den_bu_mat_sach or 0)
                _create_fine(pm.ma_nguoi_dung, pm, sach_trong_kho, chinh_sach_mat, so_tien_mat, f'Báo mất sách: {ghi_chu}', nguoi_xu_ly)
                pm.trang_thai = 'dang_xu_ly'
                pm.save()

            elif phuong_an == 'den_sach_moi':
                pm.trang_thai = 'cho_den_sach'
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
            return JsonResponse({'error': 'Thiếu mã sách mới (vui lòng nhập vào ô Mã sách đền bù).'}, status=400)
        with transaction.atomic():
            pm = PhieuMuon.objects.select_for_update().get(ma_phieu_muon=ma_phieu_muon)
            if pm.trang_thai != 'cho_den_sach':
                return JsonResponse({'error': f'Chỉ xác nhận khi trạng thái là Chờ đền sách (Hiện tại: {pm.trang_thai}).'}, status=400)
            pm.trang_thai = 'da_tra'
            pm.save()
            from quan_ly_sach.models import SachTrongKho, Sach
            
            # Tách lấy mã sách gốc để lấy foreign key
            ma_sach_str = ma_sach_trong_kho_moi.split('-')[0] if '-' in ma_sach_trong_kho_moi else None
            sach_obj = None
            if ma_sach_str:
                try:
                    sach_obj = Sach.objects.get(ma_sach=ma_sach_str)
                except Sach.DoesNotExist:
                    pass
            
            if sach_obj:
                sach_trong_kho = SachTrongKho.objects.create(
                    ma_sach_trong_kho=ma_sach_trong_kho_moi,
                    ma_sach=sach_obj,
                    ma_vach=f"BC-{ma_sach_trong_kho_moi}",
                    trang_thai_sach='available'
                )
                # Tăng số lượng sách gốc để đồng bộ với số lượng bản ghi SachTrongKho
                sach_obj.so_luong += 1
                sach_obj.save()
            else:
                return JsonResponse({'error': 'Không tìm thấy sách gốc trong hệ thống.'}, status=400)
                
            return JsonResponse({'success': True})
    except PhieuMuon.DoesNotExist:
        return JsonResponse({'error': 'Không tìm thấy phiếu mượn.'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
