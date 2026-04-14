/* =========================================================
   auth.js – Đăng nhập / quên mật khẩu / đổi mật khẩu
   Dùng cho: templates/auth/login.html
========================================================= */

function showModal(modalId) {
    const forms = document.querySelectorAll('.auth-form-container');
    forms.forEach((form) => form.classList.remove('active'));

    const authPage = document.getElementById('authPage');
    if (authPage) {
        authPage.classList.add('active');
    }

    const targetForm = document.getElementById(modalId);
    if (targetForm) {
        targetForm.classList.add('active');
    }
}

function handleLogin(event) {
    if (event) event.preventDefault();

    const username = document.getElementById('loginUsername')?.value.trim();
    const password = document.getElementById('loginPassword')?.value.trim();

    if (!username || !password) {
        alert('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
        return;
    }

    // Demo đăng nhập front-end
    // Sau này có thể thay bằng gọi Django auth thật
    localStorage.setItem('due_logged_in', 'true');
    localStorage.setItem('due_logged_user', username);

    window.location.href = '/';
}

function handleLogout() {
    localStorage.removeItem('due_logged_in');
    localStorage.removeItem('due_logged_user');
    window.location.href = '/login/';
}

function initAuthState() {
    const isLoggedIn = localStorage.getItem('due_logged_in') === 'true';

    // Nếu đang ở trang login mà đã login thì chuyển về dashboard
    if (isLoggedIn && window.location.pathname === '/login/') {
        window.location.href = '/';
        return;
    }

    showModal('loginModal');
}

document.addEventListener('DOMContentLoaded', () => {
    initAuthState();

    const loginForm = document.getElementById('loginForm');
    const forgotForm = document.getElementById('forgotForm');
    const resetForm = document.getElementById('resetForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (forgotForm) {
        forgotForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const email = document.getElementById('forgotEmail')?.value.trim();
            if (!email) {
                alert('Vui lòng nhập email.');
                return;
            }

            alert('Đã xác nhận email. Vui lòng đặt lại mật khẩu.');
            showModal('resetModal');
        });
    }

    if (resetForm) {
        resetForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const oldPassword = document.getElementById('oldPassword')?.value.trim();
            const newPassword = document.getElementById('newPassword')?.value.trim();
            const confirmPassword = document.getElementById('confirmPassword')?.value.trim();

            if (!oldPassword || !newPassword || !confirmPassword) {
                alert('Vui lòng nhập đầy đủ thông tin.');
                return;
            }

            if (newPassword !== confirmPassword) {
                alert('Mật khẩu xác nhận không khớp.');
                return;
            }

            alert('Đổi mật khẩu thành công!');
            showModal('loginModal');
        });
    }
});

window.showModal = showModal;
window.handleLogout = handleLogout;