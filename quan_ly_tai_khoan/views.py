from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db.models import Q
from django.shortcuts import redirect, render


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
