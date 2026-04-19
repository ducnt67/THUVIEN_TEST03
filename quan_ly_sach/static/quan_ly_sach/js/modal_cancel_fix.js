// Fix cho modal cancel - Đóng tất cả các modal khi xác nhận hủy
window.confirmCancelFixed = function() {
    // Reset form thêm sách
    const form = document.getElementById('bookForm');
    if (form) form.reset();

    // Reset form copy
    const qtyInput = document.getElementById('copyQty');
    if (qtyInput) qtyInput.value = "";
    const errCopy = document.getElementById('err-copy-qty');
    if (errCopy) errCopy.innerText = "";

    // Reset form edit
    const editForm = document.getElementById('editBookForm');
    if (editForm) editForm.reset();

    // Đóng tất cả các modal
    window.closeSubModal('cancelConfirmModal');
    window.closeSubModal('bookModal');
    window.closeSubModal('copyModal');
    window.closeSubModal('editBookModal');
    window.closeSubModal('detailModal');
};

// Ghi đè function confirmCancel cũ
window.confirmCancel = window.confirmCancelFixed;
