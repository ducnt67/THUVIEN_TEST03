
// --- 1. HÀM CẬP NHẬT URL (Để hiện ?edit= nhưng không load trang) ---
function updateURL(param = '') {
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + param;
    window.history.pushState({ path: newUrl }, '', newUrl);
}

// --- 2. CÁC HÀM ĐIỀU KHIỂN MODAL ---
// 1. HÀM MỞ MODAL THÊM MỚI (FIX LỖI KHÔNG LOAD)
function openAddModal() {
    console.log("Đã click nút Thêm!");
    const modal = document.getElementById('bookModal');
    const form = document.getElementById('bookForm');

    if (modal) {
        if (form) form.reset();

        // Dùng querySelector an toàn hơn
        const act = document.querySelector('input[name="action"]');
        if (act) act.value = "create";

        document.getElementById('modalTitle').innerText = "Thêm sách mới";
        modal.style.display = 'flex'; // Hiện modal
    } else {
        console.error("Không tìm thấy ID bookModal");
    }
}

function editBook(id, title, author, type, pub, year, qty) {
    console.log("Đã click nút Sửa!");
    const modal = document.getElementById('bookModal');
    if (modal) {
        document.getElementById('modalTitle').innerText = "Chỉnh sửa thông tin";

        // Điền dữ liệu
        document.getElementById('bookId').value = id;
        document.getElementById('bookTitle').value = title;
        document.getElementById('bookAuthor').value = author;
        document.getElementById('bookQty').value = qty;

        document.querySelector('input[name="action"]').value = "update";
        modal.style.display = 'flex';
    }
}

function editBook(id, title, author, type, pub, year, qty) {
    updateURL('?edit=' + id);
    resetErrors();
    document.getElementById('modalTitle').innerText = "Chỉnh sửa thông tin";

    document.querySelector('input[name="action"]').value = "update";
    document.querySelector('input[name="original_id"]').value = id;

    // Điền dữ liệu vào Form
    document.getElementById('bookId').value = id;
    document.getElementById('bookId').readOnly = true;
    document.getElementById('bookTitle').value = title;
    document.getElementById('bookAuthor').value = author;
    document.getElementById('bookType').value = type;
    document.getElementById('bookPublisher').value = pub;
    document.getElementById('bookYear').value = year;
    document.getElementById('bookQty').value = qty;

    document.getElementById('bookModal').style.display = 'flex';
}

// --- 3. LOGIC KIỂM TRA DỮ LIỆU (ĐÂY NÈ HOA!) ---

function resetErrors() {
    document.querySelectorAll('.error-msg').forEach(el => el.innerText = "");
    document.querySelectorAll('input').forEach(el => el.classList.remove('input-error'));
}

function showError(inputId, spanId, message) {
    const inputEl = document.getElementById(inputId);
    const errSpan = document.getElementById(spanId);
    if (errSpan) errSpan.innerText = message;
    if (inputEl) inputEl.classList.add('input-error');
    return false; // Trả về false để đánh dấu isValid = false
}

const bookForm = document.getElementById('bookForm');
if (bookForm) {
    bookForm.onsubmit = function(e) {
        resetErrors();
        let isValid = true;
        const currentYear = new Date().getFullYear();

        // Regex kiểm tra: Phải có ít nhất 1 chữ cái (không cho phép chỉ nhập toàn số/ký tự đặc biệt)
        const hasLetter = /[a-zA-ZÀ-ỹ]/;

        // Lấy giá trị từ Form
        const id = document.getElementById('bookId').value.trim();
        const title = document.getElementById('bookTitle').value.trim();
        const author = document.getElementById('bookAuthor').value.trim();
        const type = document.getElementById('bookType').value.trim();
        const publisher = document.getElementById('bookPublisher').value.trim();
        const yearVal = document.getElementById('bookYear').value.trim();
        const qtyVal = document.getElementById('bookQty').value.trim();

        // LOGIC 1: Mã sách (Không để trống)
        if (id === "") {
            isValid = showError('bookId', 'err-id', 'Mã sách không được để trống.');
        }

        // LOGIC 2: Tên sách (Phải có chữ, không chỉ toàn số)
        if (title === "" || !hasLetter.test(title)) {
            isValid = showError('bookTitle', 'err-title', 'Tên sách không hợp lệ (không được chỉ chứa số hoặc ký tự đặc biệt).');
        }

        // LOGIC 3: Tác giả (Phải có chữ nếu nhập)
        if (author !== "" && !hasLetter.test(author)) {
            isValid = showError('bookAuthor', 'err-author', 'Tên tác giả không hợp lệ.');
        }

        // LOGIC 4: Thể loại (Phải có chữ)
        if (type === "" || !hasLetter.test(type)) {
            isValid = showError('bookType', 'err-type', 'Vui lòng nhập thể loại hợp lệ.');
        }

        // LOGIC 5: Nhà xuất bản
        if (publisher === "" || !hasLetter.test(publisher)) {
            isValid = showError('bookPublisher', 'err-publisher', 'Tên NXB không hợp lệ.');
        }

        // LOGIC 6: Năm xuất bản (Từ 1450 đến năm hiện tại)
        const yearInt = parseInt(yearVal);
        if (yearVal === "" || isNaN(yearInt) || yearInt < 1450 || yearInt > currentYear) {
            isValid = showError('bookYear', 'err-year', `Năm phải từ 1450 - ${currentYear}.`);
        }

        // LOGIC 7: Số lượng (Phải là số dương)
        const qtyInt = parseInt(qtyVal);
        if (qtyVal === "" || isNaN(qtyInt) || qtyInt <= 0) {
            isValid = showError('bookQty', 'err-qty', 'Số lượng phải là số lớn hơn 0.');
        }

        // KẾT QUẢ: Nếu có bất kỳ lỗi nào thì dừng lại (e.preventDefault)
        if (!isValid) {
            e.preventDefault();
            console.log("Form có lỗi, đã chặn gửi dữ liệu.");
            const firstError = document.querySelector('.input-error');
            if (firstError) firstError.focus();
        }
        return isValid;
    };
}

// --- 4. XỬ LÝ HỦY VÀ ĐÓNG ---
function openCancelModal() {
    document.getElementById('cancelConfirmModal').style.display = 'flex';
}

function confirmCancel() {
    document.getElementById('bookForm').reset();
    closeSubModal('cancelConfirmModal');
    closeSubModal('bookModal');
}

function closeSubModal(id) {
    document.getElementById(id).style.display = 'none';
    if (id === 'bookModal') updateURL('');
}

// Xuất hàm ra ngoài HTML
Object.assign(window, {
    openAddModal, editBook, openCancelModal, confirmCancel, closeSubModal
});