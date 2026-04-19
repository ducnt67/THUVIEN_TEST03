/* =================================================
   TOAST NOTIFICATION SYSTEM - JS
==================================================== */

class ToastNotification {
    constructor() {
        this.container = document.getElementById('toastContainer');
        this.toasts = [];
        this.maxToasts = 5; // S toast hiên cùng lúc
    }

    // Hiên toast chính
    show(options = {}) {
        const {
            type = 'success', // success, error, warning, info
            title = '',
            message = '',
            duration = 4000, // Thôi gian hiên (ms)
            closable = true, // Có nút close không
            showProgress = false // Có progress bar không
        } = options;

        // Giói sô toast
        if (this.toasts.length >= this.maxToasts) {
            this.toasts[0].remove();
            this.toasts.shift();
        }

        // T toast element
        const toast = this.createToastElement(type, title, message, closable, showProgress);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Hiên animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Progress bar
        if (showProgress) {
            const progressBar = toast.querySelector('.toast-progress');
            setTimeout(() => {
                progressBar.style.transform = 'scaleX(0)';
            }, 100);
        }

        // T dng
        if (duration > 0) {
            setTimeout(() => {
                this.hide(toast);
            }, duration);
        }

        return toast;
    }

    // T toast element
    createToastElement(type, title, message, closable, showProgress) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // Icon theo type
        const icons = {
            success: 'i class="bx bx-check"',
            error: 'i class="bx bx-x"',
            warning: 'i class="bx bx-error"',
            info: 'i class="bx bx-info-circle"'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                ${icons[type] || icons.success}
            </div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            ${closable ? `<button class="toast-close" onclick="toastNotification.hide(this.parentElement)">×</button>` : ''}
            ${showProgress ? '<div class="toast-progress"></div>' : ''}
        `;

        return toast;
    }

    // N toast
    hide(toast) {
        if (!toast) return;

        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
            const index = this.toasts.indexOf(toast);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, 300);
    }

    // T toast nhanh
    success(title, message, options = {}) {
        return this.show({ type: 'success', title, message, ...options });
    }

    error(title, message, options = {}) {
        return this.show({ type: 'error', title, message, ...options });
    }

    warning(title, message, options = {}) {
        return this.show({ type: 'warning', title, message, ...options });
    }

    info(title, message, options = {}) {
        return this.show({ type: 'info', title, message, ...options });
    }

    // Xa t toast
    clear() {
        this.toasts.forEach(toast => {
            this.hide(toast);
        });
        this.toasts = [];
    }
}

// Kh i instance toàn c
window.toastNotification = new ToastNotification();

// Các hàm nhanh toàn c
window.showToast = (options) => toastNotification.show(options);
window.showSuccess = (title, message, options) => toastNotification.success(title, message, options);
window.showError = (title, message, options) => toastNotification.error(title, message, options);
window.showWarning = (title, message, options) => toastNotification.warning(title, message, options);
window.showInfo = (title, message, options) => toastNotification.info(title, message, options);

// Auto-show thông báo t Django messages (n c)
document.addEventListener('DOMContentLoaded', function() {
    // T thông báo t Django messages (n c)
    const messages = document.querySelectorAll('.django-message');
    messages.forEach(msg => {
        const type = msg.classList.contains('success') ? 'success' : 
                   msg.classList.contains('error') ? 'error' : 
                   msg.classList.contains('warning') ? 'warning' : 'info';
        const text = msg.textContent.trim();
        if (text) {
            toastNotification[type](text, '', { duration: 5000 });
        }
        msg.remove(); // Xóa message g c
    });
});
