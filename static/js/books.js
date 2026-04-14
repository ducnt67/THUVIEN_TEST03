function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('open');
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('open');
    }
}

function resetBookForm() {
    document.getElementById('bookAction').value = 'create';
    document.getElementById('bookModalTitle').textContent = 'Them sach moi';
    document.getElementById('originalId').value = '';
    document.getElementById('bookId').readOnly = false;
    document.getElementById('bookForm').reset();
}

function openCreateModal() {
    resetBookForm();
    openModal('bookModal');
}

function openEditModal(bookId, title, author, category, publisher, year) {
    document.getElementById('bookAction').value = 'update';
    document.getElementById('bookModalTitle').textContent = 'Cap nhat thong tin sach';
    document.getElementById('originalId').value = bookId;
    document.getElementById('bookId').value = bookId;
    document.getElementById('bookId').readOnly = true;
    document.getElementById('bookTitle').value = title;
    document.getElementById('bookAuthor').value = author;
    document.getElementById('bookType').value = category;
    document.getElementById('bookPublisher').value = publisher;
    document.getElementById('bookYear').value = year;
    openModal('bookModal');
}

function openDetailModal(bookId, title, author, category, publisher, year, quantity) {
    const detail = document.getElementById('bookDetailContent');
    detail.innerHTML =
        '<p><strong>Ma sach:</strong> ' + bookId + '</p>' +
        '<p><strong>Ten sach:</strong> ' + title + '</p>' +
        '<p><strong>Tac gia:</strong> ' + (author || '-') + '</p>' +
        '<p><strong>The loai:</strong> ' + (category || '-') + '</p>' +
        '<p><strong>NXB:</strong> ' + (publisher || '-') + '</p>' +
        '<p><strong>Nam xuat ban:</strong> ' + year + '</p>' +
        '<p><strong>So luong ban ghi trong kho:</strong> ' + quantity + '</p>';
    openModal('detailModal');
}

function openDeleteModal(bookId, title) {
    document.getElementById('deleteBookId').value = bookId;
    document.getElementById('deleteMessage').textContent =
        'Ban sap xoa sach "' + title + '" (' + bookId + '). Hanh dong nay khong the hoan tac.';
    openModal('deleteConfirmModal');
}

window.addEventListener('click', function (event) {
    ['bookModal', 'detailModal', 'deleteConfirmModal'].forEach(function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal && event.target === modal) {
            closeModal(modalId);
        }
    });
});

