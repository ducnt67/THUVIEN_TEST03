from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from django.db import transaction
from django.utils import timezone
import json
from .models import PhieuMuon, ChiTietPhieuMuon
from quan_ly_nguoi_dung.models import NguoiDung
from quan_ly_sach.models import SachTrongKho

@login_required
def borrow_list_view(request):
    return render(request, 'muon_sach/borrow_list.html')

@login_required
def borrow_list(request):
    return borrow_list_view(request)

@login_required
@require_GET
def api_get_borrow_list(request):
    slips = PhieuMuon.objects.all().select_related('ma_nguoi_dung').order_by('-ngay_muon')
    data = []
    today = timezone.now().date()
    
    for s in slips:
        status = s.sync_status()
        status_display = s.get_trang_thai_display()
        status_class = {
            'dang_muon': 'badge badge-blue-solid',
            'qua_han': 'badge badge-orange-solid',
            'da_tra': 'badge badge-green-solid',
        }.get(status, 'badge badge-blue-solid')

        data.append({
            'id': s.pk,
            'slipCode': s.ma_phieu_muon,
            'userId': s.ma_nguoi_dung.ma_nguoi_dung,
            'userName': s.ma_nguoi_dung.ho_ten,
            'borrowDate': s.ngay_muon.strftime('%d/%m/%Y'),
            'dueDate': s.chi_tiet_phieu_muon.first().han_tra.strftime('%d/%m/%Y') if s.chi_tiet_phieu_muon.exists() else '',
            'status': status_display,
            'statusClass': status_class,
            'books': [
                {'code': ct.ma_sach_trong_kho.ma_sach_trong_kho, 'title': ct.ma_sach_trong_kho.ma_sach.ten_sach, 'qty': 1}
                for ct in s.chi_tiet_phieu_muon.all()
            ]
        })
    return JsonResponse(data, safe=False)

@login_required
@require_GET
def api_get_user_info(request):
    ma_nguoi_dung = request.GET.get('ma_nguoi_dung')
    try:
        user = NguoiDung.objects.get(ma_nguoi_dung=ma_nguoi_dung)
        if user.loai_nguoi_dung != 'doc_gia' or user.trang_thai_tot_nghiep:
            return JsonResponse({'success': False, 'message': 'Người dùng này không thể mượn sách'}, status=200)
        return JsonResponse({
            'success': True,
            'ho_ten': user.ho_ten
        })
    except NguoiDung.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Không tìm thấy người dùng'}, status=200)

@login_required
@require_GET
def api_get_book_info(request):
    ma_sach_trong_kho = request.GET.get('ma_sach_trong_kho')
    try:
        book = SachTrongKho.objects.get(ma_sach_trong_kho=ma_sach_trong_kho)
        # Kiểm tra trạng thái sách - chỉ cho mượn nếu 'available'
        if book.trang_thai_sach != 'available':
            return JsonResponse({
                'success': False, 
                'message': 'Mã sách đã được mượn'
            }, status=200)
            
        return JsonResponse({
            'success': True,
            'ten_sach': book.ma_sach.ten_sach
        })
    except SachTrongKho.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Không tìm thấy sách'}, status=200)

@login_required
@require_POST
def api_create_borrow_slip(request):
    try:
        data = json.loads(request.body)
        user_id = data.get('userId')
        borrow_date_str = data.get('borrowDate')
        due_date_str = data.get('dueDate')
        books = data.get('books', [])

        if not user_id or not borrow_date_str or not due_date_str or not books:
            return JsonResponse({'success': False, 'message': 'Thiếu thông tin bắt buộc'}, status=400)

        with transaction.atomic():
            nguoi_dung = NguoiDung.objects.get(ma_nguoi_dung=user_id)
            try:
                nguoi_tao = request.user.nguoi_dung
            except:
                nguoi_tao = NguoiDung.objects.filter(loai_nguoi_dung='thu_thu').first()

            pm = PhieuMuon.objects.create(
                ma_nguoi_dung=nguoi_dung,
                ngay_muon=borrow_date_str,
                nguoi_tao=nguoi_tao,
                trang_thai='dang_muon'
            )

            for b in books:
                sach_kho = SachTrongKho.objects.get(ma_sach_trong_kho=b['code'])
                
                # Backend validation: check status again in case of concurrent requests
                if sach_kho.trang_thai_sach != 'available':
                    raise Exception('Mã sách không hợp lệ')

                ChiTietPhieuMuon.objects.create(
                    ma_phieu_muon=pm,
                    ma_sach_trong_kho=sach_kho,
                    han_tra=due_date_str
                )
                sach_kho.trang_thai_sach = 'borrowed'
                sach_kho.save()
            
            pm.sync_status()

        return JsonResponse({'success': True, 'message': 'Thêm thông tin mượn sách thành công'})
    except Exception as e:
        # Nếu lỗi là 'Mã sách không hợp lệ' thì giữ nguyên, không thì str(e)
        msg = str(e) if str(e) == 'Mã sách không hợp lệ' else f'Lỗi: {str(e)}'
        return JsonResponse({'success': False, 'message': msg}, status=400)

@login_required
@require_POST
def api_delete_borrow_slip(request, pk):
    try:
        with transaction.atomic():
            pm = PhieuMuon.objects.get(pk=pk)
            
            if pm.trang_thai == 'dang_muon':
                return JsonResponse({'success': False, 'message': 'Không thể xóa phiếu mượn đang mượn'}, status=200)

            if pm.trang_thai == 'qua_han':
                return JsonResponse({'success': False, 'message': 'Không thể xóa phiếu mượn quá hạn'}, status=200)

            # Revert book status
            chi_tiet = pm.chi_tiet_phieu_muon.all()
            for ct in chi_tiet:
                sach_kho = ct.ma_sach_trong_kho
                sach_kho.trang_thai_sach = 'available'
                sach_kho.save()
            
            pm.delete()
        return JsonResponse({'success': True, 'message': 'Xóa phiếu mượn thành công'})
    except PhieuMuon.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Không tìm thấy phiếu mượn'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

@login_required
@require_POST
def api_extend_borrow_slip(request, pk):
    try:
        data = json.loads(request.body)
        new_due_date = data.get('newDueDate')
        
        if not new_due_date:
            return JsonResponse({'success': False, 'message': 'Thiếu ngày gia hạn mới'}, status=400)
            
        with transaction.atomic():
            pm = PhieuMuon.objects.get(pk=pk)
            
            # Cập nhật hạn trả cho toàn bộ sách chưa trả trong phiếu
            pm.chi_tiet_phieu_muon.filter(ngay_tra__isnull=True).update(han_tra=new_due_date)
            
            # Cập nhật lại trạng thái (có thể từ Quá hạn sang Đang mượn)
            pm.sync_status()
            
        return JsonResponse({'success': True, 'message': 'Gia hạn thành công'})
    except PhieuMuon.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Không tìm thấy phiếu mượn'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)
