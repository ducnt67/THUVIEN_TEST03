from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_POST
import json


User = get_user_model()


def login_view(request):
    error_message = ''
    username_value = ''

    if request.method == 'POST':
        username_value = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')

        user = authenticate(request, username=username_value, password=password)
        if user is None:
            user_obj = User.objects.filter(
                Q(username__iexact=username_value) | Q(email__iexact=username_value)
            ).first()
            if user_obj is not None:
                user = authenticate(request, username=user_obj.get_username(), password=password)

        if user is not None:
            if not user.is_active:
                error_message = 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.'
                return render(
                    request,
                    'quan_ly_tai_khoan/login.html',
                    {'error_message': error_message, 'username_value': username_value},
                )

            login(request, user)
            messages.success(request, 'Đăng nhập thành công.')
            next_url = request.POST.get('next') or request.GET.get('next')
            return redirect(next_url or 'dashboard')

        error_message = 'Tài khoản hoặc mật khẩu không đúng.'

    return render(
        request,
        'quan_ly_tai_khoan/login.html',
        {
            'error_message': error_message,
            'username_value': username_value,
        },
    )


def logout_view(request):
    logout(request)
    return redirect('login')


@require_POST
def forgot_password_view(request):
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip()
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Dữ liệu không hợp lệ.'}, status=400)

    if not email:
        return JsonResponse({'success': False, 'message': 'Vui lòng nhập email.'})

    # Kiểm tra email trong hệ thống (User hoặc NguoiDung)
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        # Nếu không có trong User, thử tìm trong NguoiDung
        from quan_ly_nguoi_dung.models import NguoiDung
        nguoi_dung = NguoiDung.objects.filter(email__iexact=email).first()
        if nguoi_dung and nguoi_dung.user:
            user = nguoi_dung.user

    if user:
        return JsonResponse({'success': True, 'message': 'Xác nhận email thành công.'})
    else:
        return JsonResponse({'success': False, 'message': 'Email không tồn tại trong hệ thống.'})


@require_POST
def reset_password_view(request):
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip()
        new_password = data.get('new_password', '').strip()
        confirm_password = data.get('confirm_password', '').strip()
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Dữ liệu không hợp lệ.'}, status=400)

    if not email or not new_password or not confirm_password:
        return JsonResponse({'success': False, 'message': 'Vui lòng nhập đầy đủ thông tin.'})

    if new_password != confirm_password:
        return JsonResponse({'success': False, 'message': 'Mật khẩu xác nhận không khớp.'})

    if len(new_password) < 8:
        return JsonResponse({'success': False, 'message': 'Mật khẩu mới phải có ít nhất 8 ký tự.'})

    user = User.objects.filter(email__iexact=email).first()
    if not user:
        from quan_ly_nguoi_dung.models import NguoiDung
        nguoi_dung = NguoiDung.objects.filter(email__iexact=email).first()
        if nguoi_dung and nguoi_dung.user:
            user = nguoi_dung.user

    if user:
        user.set_password(new_password)
        user.save()
        return JsonResponse({'success': True, 'message': 'Cập nhật mật khẩu thành công.'})
    else:
        return JsonResponse({'success': False, 'message': 'Không tìm thấy tài khoản để cập nhật.'})
