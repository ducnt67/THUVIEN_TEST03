/* =========================
   book.js - BẢN FIX KHÔNG API
========================= */

const bookModal = document.getElementById('bookModal');
const bookForm = document.getElementById('bookForm');

// Hàm reset các dòng báo lỗi đỏ
function resetErrors() {
    document.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
    document.querySelectorAll('.error-msg').forEach(m => m.innerText = '');
}

// Hàm hiển thị lỗi tại chỗ
function showError(id, message) {
    const input = document.getElementById(id);
    if (input) {
        const group = input.parentElement;
        group.classList.add('has-error');
        const errorTag = group.querySelector('.error-msg');
        if (errorTag) errorTag.innerText = message;
    }
    return false;
}

/* --- CÁC HÀM GỌI TỪ NÚT BẤM --- */

// Nút Thêm: Reset form và hiện modal
function openAddModal() {
    resetErrors();
    bookForm.reset();
    document.getElementById('modalTitle').innerText = 'Thêm sách mới';
    document.querySelector('[name="action"]').value = "create";
    bookModal.style.display = 'flex';
}

// Nút Đóng/Hủy: Tắt modal và xóa param trên URL để không bị tự mở lại
function closeModal() {
    bookModal.style.display = 'none';
    if (window.location.search.includes('edit=') || window.location.search.includes('detail=')) {
        window.location.href = window.location.pathname; // Quay về /books/ sạch sẽ
    }
}

// Nút Xóa: Hiện modal xác nhận xóa
function openDeleteModal(id) {
    document.getElementById("deleteBookId").value = id;
    document.getElementById("deleteConfirmModal").style.display = "flex";
}

function closeDeleteModal() {
    document.getElementById("deleteConfirmModal").style.display = "none";
}

/* --- LOGIC KIỂM TRA DỮ LIỆU KHI NHẤN LƯU --- */
if (bookForm) {
    bookForm.addEventListener('submit', function (e) {
        resetErrors();
        let isValid = true;
        const currentYear = new Date().getFullYear();
        const hasLetter = /[a-zA-ZÀ-ỹ]/;

        const tenSach = document.getElementById('bookTitle').value.trim();
        const tenTacGia = document.getElementById('bookAuthor').value.trim();
        const theLoai = document.getElementById('bookType').value.trim();
        const nxb = document.getElementById('bookPublisher').value.trim();
        const namXB = parseInt(document.getElementById('bookYear').value.trim());
        const soLuong = parseInt(document.getElementById('bookQuantity').value.trim());

        // Kiểm tra 4.a -> 4.e
        if (!hasLetter.test(tenSach)) isValid = showError('bookTitle', "Tên sách không hợp lệ. Vui lòng nhập chữ.");
        if (tenTacGia !== "" && !hasLetter.test(tenTacGia) && !/[!@#$%^&*(),.?":{}|<>]/.test(tenTacGia))
            isValid = showError('bookAuthor', "Tên tác giả không hợp lệ.");
        if (!hasLetter.test(theLoai)) isValid = showError('bookType', "Thể loại không hợp lệ.");
        if (!hasLetter.test(nxb)) isValid = showError('bookPublisher', "Tên NXB không hợp lệ.");
        if (isNaN(namXB) || namXB < 1450 || namXB > currentYear)
            isValid = showError('bookYear', `Năm từ 1450 - ${currentYear}.`);

        // Nếu có lỗi thì chặn không cho gửi lên Django
        if (!isValid) {
            e.preventDefault();
        }
    });
    // Hàm mở popup xác nhận hủy
        function openCancelModal() {
            document.getElementById('cancelConfirmModal').style.display = 'flex';
        }

// Hàm đóng popup (Quay lại tiếp tục nhập)
function closeCancelModal() {
            document.getElementById('cancelConfirmModal').style.display = 'none';
        }

        // Hàm xác nhận xóa sạch thông tin và đóng cả 2 modal
function clearFormAndClose() {
            // 1. Reset form nhập liệu
            document.getElementById('bookForm').reset();

            // 2. Đóng popup xác nhận
            closeCancelModal();

            // 3. Đóng modal thêm/sửa chính
            closeModal();
        }
}

// Đưa hàm ra ngoài để HTML gọi được
window.openAddModal = openAddModal;
window.closeModal = closeModal;
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.openCancelModal = openCancelModal;       // Cần thiết
window.closeCancelModal = closeCancelModal;     // Cần thiết
window.clearFormAndClose = clearFormAndClose;