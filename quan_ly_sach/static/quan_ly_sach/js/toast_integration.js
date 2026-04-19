/* =================================================
   TOAST INTEGRATION - Tích h p thông báo vào h n d ng
==================================================== */

// Tích h p vào các h n d ng có s n
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Ghi dè h n submitCopy d hi n toast thành công
    const originalSubmitCopy = window.submitCopy;
    window.submitCopy = function() {
        const qtyInput = document.getElementById('copyQty');
        const form = document.getElementById('addCopiesForm');
        const btnSave = document.querySelector('#copyModal .btn-save');
        const qty = parseInt(qtyInput.value);

        if (!qty || qty <= 0) {
            document.getElementById('err-copy-qty').innerText = "Vui lòng nh p s > 0";
            return;
        }

        if (form) {
            // Hi n toast "ang x lý"
            const processingToast = showInfo('Ang x lý', 'ang thêm sách vào kho...', { 
                duration: 0, // Không t d ng
                closable: false 
            });

            // V hi u hóa nút
            btnSave.innerText = "Ang x lý...";
            btnSave.style.opacity = "0.5";
            btnSave.style.pointerEvents = "none";

            // Submit form
            form.submit();

            // Sau khi submit thành công, Django s redirect và hi n thông báo
            setTimeout(() => {
                toastNotification.hide(processingToast);
            }, 1000);
        }
    };

    // 2. Tích h p vào h n xóa
    const originalRequestDelete = window.requestDelete;
    window.requestDelete = function(id) {
        const modal = document.getElementById('deleteConfirmModal');
        const input = document.getElementById('deleteBookId');

        if (!modal || !input) {
            showError('L i', 'Không tìm th y modal xóa');
            return;
        }

        input.value = id;

        const title = modal.querySelector('.confirm-title');
        const desc = modal.querySelector('.confirm-desc');

        if (title) title.innerText = "Xác nh n xóa?";
        if (desc) desc.innerText = `B n có ch c mu n xóa sách ${id}?`;

        modal.style.display = 'flex';
    };

    // 3. Ghi dè h n editBook
    const originalEditBook = window.editBook;
    window.editBook = function(id, title, author, type, pub, year, qty) {
        const modal = document.getElementById('editBookModal');

        if (!modal) {
            showError('L i', 'Không tìm th y modal s a');
            return;
        }

        // Gán giá tr
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
            subtitle.innerHTML = `C p nh t thông tin sách <strong>${id}</strong>`;
        }

        modal.style.display = 'flex';
        
        // Hi n toast thông báo
        showInfo('S a sách', `Ang s a thông tin sách: ${title}`);
    };

    // 4. Tích h p vào h n viewDetail
    const originalViewDetail = window.viewDetail;
    window.viewDetail = function(id, title, author, type, pub, year, qty, status = 'CÓ S N') {
        const modal = document.getElementById('detailModal');
        const content = document.getElementById('bookDetailContent');

        if (!modal || !content) {
            showError('L i', 'Không tìm th y modal chi ti t');
            return;
        }

        content.innerHTML = `
            <div class="detail-info">
                <div class="detail-item">
                    <label>Mã sách</label>
                    <span>${id}</span>
                </div>
                <div class="detail-item">
                    <label>Trang thái</label>
                    <span class="status-badge">${status}</span>
                </div>
                <div class="detail-item">
                    <label>Tên sách</label>
                    <span>${title}</span>
                </div>
                <div class="detail-item">
                    <label>Th lo i</label>
                    <span>${type}</span>
                </div>
                <div class="detail-item">
                    <label>Tác gi </label>
                    <span>${author}</span>
                </div>
                <div class="detail-item">
                    <label>N m xu t b n</label>
                    <span>${year}</span>
                </div>
                <div class="detail-item">
                    <label>Nhà xu t b n</label>
                    <span>${pub}</span>
                </div>
                <div class="detail-item">
                    <label>S lu ng</label>
                    <span>${qty}</span>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    };

    // 5. Tích h p vào h n openCopyModal
    const originalOpenCopyModal = window.openCopyModal;
    window.openCopyModal = function(id, title) {
        const modal = document.getElementById('copyModal');

        if (!modal) {
            showError('L i', 'Không tìm th y modal thêm sách');
            return;
        }

        // Gán vào th hi n ra
        document.getElementById('copyBookInfo').value = id + " - " + title;
        document.getElementById('copyBookId').value = id;

        modal.style.display = 'flex';
        
        // Focus vào input s lu ng
        setTimeout(() => {
            document.getElementById('copyQty').focus();
        }, 100);
    };

    // 6. Tích h p vào h n openAddModal
    const originalOpenAddModal = window.openAddModal;
    window.openAddModal = function() {
        const modal = document.getElementById('addBookModal');
        const form = document.getElementById('addBookForm');

        if (modal) {
            if (form) form.reset();
            modal.style.display = 'flex';
            
            // Hi n toast thông báo
            showInfo('Thêm sách', 'Vui lòng nh p thông tin sách m i');
        }
    };

    // 7. Tích h p vào h n confirmCancel
    const originalConfirmCancel = window.confirmCancel;
    window.confirmCancel = function() {
        // Hi n toast h y
        showWarning('H y hành d ng', 'B n ã h y thao tác');

        // G i h n g c
        setTimeout(() => {
            // reset d li u
            document.querySelectorAll('form').forEach(f => f.reset());
            const qtyInput = document.getElementById('copyQty');
            if (qtyInput) qtyInput.value = "";
            const errCopy = document.getElementById('err-copy-qty');
            if (errCopy) errCopy.innerText = "";

            // d ng toàn b modal
            document.querySelectorAll('.modal').forEach(m => {
                m.style.display = 'none';
            });

            // reset state
            if (typeof currentModalId !== 'undefined') {
                currentModalId = null;
            }

            // quay v trang list
            window.location.href = '/books/';
        }, 1000);
    };

    console.log('Toast integration loaded successfully!');
});
