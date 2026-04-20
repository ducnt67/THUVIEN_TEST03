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
        chi_tiet = s.chi_tiet_phieu_muon.all()
        
        if not chi_tiet.exists():
            status = 'dang_muon'
        else:
            all_returned = all(ct.ngay_tra is not None for ct in chi_tiet)
            any_overdue = any(ct.ngay_tra is None and ct.han_tra < today for ct in chi_tiet)
            
            if all_returned:
                status = 'da_tra'
            elif any_overdue:
                status = 'qua_han'
            else:
                status = 'dang_muon'

        status_display = dict(PhieuMuon.TRANG_THAI_MUON_CHOICES).get(status, 'Đang mượn')
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
            'dueDate': chi_tiet[0].han_tra.strftime('%d/%m/%Y') if chi_tiet.exists() else '',
            'status': status_display,
            'statusClass': status_class,
            'books': [
                {'code': ct.ma_sach_trong_kho.ma_sach_trong_kho, 'title': ct.ma_sach_trong_kho.ma_sach.ten_sach, 'qty': 1}
                for ct in chi_tiet
            ]
        })
    return JsonResponse(data, safe=False)

@login_required
@require_GET
def api_get_user_info(request):
    ma_nguoi_dung = request.GET.get('ma_nguoi_dung')
    try:
        user = NguoiDung.objects.get(ma_nguoi_dung=ma_nguoi_dung)
        if user.loai_nguoi_dung != 'doc_gia':
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
        return JsonResponse({
            'success': True,
            'ten_sach': book.ma_sach.ten_sach
        })
    except SachTrongKho.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Không tìm thấy sách trong kho'}, status=200)

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
                ChiTietPhieuMuon.objects.create(
                    ma_phieu_muon=pm,
                    ma_sach_trong_kho=sach_kho,
                    han_tra=due_date_str
                )
                sach_kho.trang_thai_sach = 'borrowed'
                sach_kho.save()

        return JsonResponse({'success': True, 'message': 'Thêm phiếu mượn thành công'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)
