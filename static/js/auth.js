/* =========================================================
   auth.js - Quen mat khau / doi mat khau
   Khong can thiep submit form login Django
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

function initAuthState() {
    showModal('loginModal');
}

document.addEventListener('DOMContentLoaded', () => {
    initAuthState();

    const forgotForm = document.getElementById('forgotForm');
    const resetForm = document.getElementById('resetForm');

    if (forgotForm) {
        forgotForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const email = document.getElementById('forgotEmail')?.value.trim();
            if (!email) {
                alert('Vui long nhap email.');
                return;
            }

            alert('Da xac nhan email. Vui long dat lai mat khau.');
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
                alert('Vui long nhap day du thong tin.');
                return;
            }

            if (newPassword !== confirmPassword) {
                alert('Mat khau xac nhan khong khop.');
                return;
            }

            alert('Doi mat khau thanh cong!');
            showModal('loginModal');
        });
    }
});

window.showModal = showModal;

