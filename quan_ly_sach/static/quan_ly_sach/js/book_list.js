console.log('--- BOOK LIST JS LOADED ---');

/* =========================
   1. URL HELPER
========================= */
window.updateURL = function(param = '') {
    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + param;
    window.history.pushState({ path: newUrl }, '', newUrl);
};

/* =========================
   2. MODAL CONTROL
========================= */

// 👉 MỞ MODAL THÊM
window.openAddModal = function() {
    const modal = document.getElementById('addBookModal');
    const form = document.getElementById('addBookForm');

    if (modal) {
        if (form) form.reset();
        modal.style.display = 'flex';
    }
};

// 👉 MỞ MODAL SỬA
window.editBook = function(id, title, author, type, pub, year, qty) {
    const modal = document.getElementById('editBookModal');

    if (!modal) return;

    document.getElementById('editBookId').value = id;
    document.getElementById('editOriginalId').value = id;
    document.getElementById('editBookTitle').value = title;
    document.getElementById('editBookAuthor').value = author;
    document.getElementById('editBookType').value = type;
    document.getElementById('editBookPublisher').value = pub;
    document.getElementById('editBookYear').value = year;
    document.getElementById('editBookQty').value = qty;

    const subtitle = document.getElementById('editModalSubtitle');
    if (subtitle) {
        subtitle.innerHTML = `Cập nhật thông tin sách <strong>${id}</strong>`;
    }

    modal.style.display = 'flex';
};

/* =========================
   3. VIEW DETAIL
========================= */
window.viewDetail = function(id, title, author, type, pub, year, qty, status = 'CÓ SẴN') {
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('bookDetailContent');

    if (!modal || !content) return;

    content.innerHTML = `
        <div class="detail-info">
            <div class="detail-item">
                <label>Mã sách</label>
                <span>${id}</span>
            </div>
            <div class="detail-item">
                <label>Trạng thái</label>
                <span class="status-badge">${status}</span>
            </div>
            <div class="detail-item">
                <label>Tên sách</label>
                <span>${title}</span>
            </div>
            <div class="detail-item">
                <label>Thể loại</label>
                <span>${type}</span>
            </div>
            <div class="detail-item">
                <label>Tác giả</label>
                <span>${author}</span>
            </div>
            <div class="detail-item">
                <label>Năm xuất bản</label>
                <span>${year}</span>
            </div>
            <div class="detail-item">
                <label>Nhà xuất bản</label>
                <span>${pub}</span>
            </div>
            <div class="detail-item">
                <label>Số lượng</label>
                <span>${qty}</span>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
};

/* =========================
   4. DELETE
========================= */
window.requestDelete = function(id) {
    const modal = document.getElementById('deleteConfirmModal');
    const input = document.getElementById('deleteBookId');

    if (!modal || !input) {
        console.error("❌ Không tìm thấy modal xóa");
        return;
    }

    input.value = id;

    const title = modal.querySelector('.confirm-title');
    const desc = modal.querySelector('.confirm-desc');

    if (title) title.innerText = "Xác nhận xóa?";
    if (desc) desc.innerText = `Bạn có chắc muốn xóa sách ${id}?`;

    modal.style.display = 'flex';
};

window.closeDeleteModal = function() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.style.display = 'none';
};

/* =========================
   5. COPY
========================= */
window.openCopyModal = function(id, title) {
    const modal = document.getElementById('copyModal');
    const info = document.getElementById('copyBookInfo');
    const qty = document.getElementById('copyQty');

    if (!modal) return;

    if (qty) qty.value = "";
    document.getElementById('err-copy-qty').innerText = "";

    if (info) info.value = `${id} - ${title}`;

    modal.setAttribute('data-current-id', id);
    modal.style.display = 'flex';
};

window.submitCopy = function() {
    const modal = document.getElementById('copyModal');
    const qtyInput = document.getElementById('copyQty');

    const id = modal.getAttribute('data-current-id');
    const qty = parseInt(qtyInput.value);

    if (!qty || qty <= 0) {
        document.getElementById('err-copy-qty').innerText = "Nhập số > 0";
        qtyInput.focus();
        return;
    }

    console.log(`Copy ${qty} sách ${id}`);

    modal.style.display = 'none';
};

/* =========================
   6. CANCEL
========================= */
window.openCancelModal = function() {
    const modal = document.getElementById('cancelConfirmModal');
    if (modal) modal.style.display = 'flex';
};

window.confirmCancel = function() {
    const form = document.getElementById('bookForm');
    if (form) form.reset();

    window.closeSubModal('cancelConfirmModal');
    window.closeSubModal('bookModal');
};

window.closeSubModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
};

/* =========================
   7. DEBUG CHECK
========================= */
console.log("✅ Functions ready:", {
    viewDetail: typeof window.viewDetail,
    requestDelete: typeof window.requestDelete
});