function normalizeSearchText(text) {
    return (text || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}
function formatCurrency(value) {
    const numeric = Number(value || 0);
    return `${new Intl.NumberFormat('vi-VN').format(Math.max(0, numeric))}đ`;
}
function getVisibleRows() {
    return Array.from(document.querySelectorAll('#tableBody tr.user-row'));
}
function updateEmptyState() {
    const emptyState = document.getElementById('emptyState');
    const visibleRows = getVisibleRows().filter((row) => row.style.display !== 'none');
    if (emptyState) emptyState.classList.toggle('hidden', visibleRows.length > 0);
}
function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('filterStatus');
    const classFilter = document.getElementById('filterClass');
    const query = normalizeSearchText(searchInput ? searchInput.value : '');
    const selectedStatus = statusFilter ? statusFilter.value : 'all';
    const selectedClass = classFilter ? classFilter.value : 'all';
    getVisibleRows().forEach((row) => {
        const rowText = normalizeSearchText(row.textContent);
        const rowStatus = row.dataset.userStatus || '';
        const rowClass = row.dataset.userClass || '';
        const matchesSearch = !query || rowText.includes(query);
        const matchesStatus = selectedStatus === 'all' || rowStatus === selectedStatus;
        const matchesClass = selectedClass === 'all' || rowClass === selectedClass;
        row.style.display = matchesSearch && matchesStatus && matchesClass ? '' : 'none';
    });
    updateEmptyState();
}
function openModalFromRow(row) {
    const modal = document.getElementById('userModal');
    if (!modal || !row) return;
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value || '-';
    };
    setText('modalUserId', row.dataset.userId);
    setText('modalUserName', row.dataset.userName);
    setText('modalUserEmail', row.dataset.userEmail);
    setText('modalUserPhone', row.dataset.userPhone || '-');
    setText('modalBooks', row.dataset.userBooks || '0');
    setText('modalFine', formatCurrency(row.dataset.userFine || 0));
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
}
function closeModal() {
    const modal = document.getElementById('userModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
}
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const filterStatus = document.getElementById('filterStatus');
    const filterClass = document.getElementById('filterClass');
    const tableBody = document.getElementById('tableBody');
    const modal = document.getElementById('userModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeModalFooterBtn = document.getElementById('closeModalFooterBtn');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
        searchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') applyFilters();
        });
    }
    if (searchBtn) searchBtn.addEventListener('click', applyFilters);
    if (filterStatus) filterStatus.addEventListener('change', applyFilters);
    if (filterClass) filterClass.addEventListener('change', applyFilters);
    if (tableBody) {
        tableBody.addEventListener('click', (event) => {
            const trigger = event.target.closest('.user-detail-trigger');
            if (!trigger) return;
            const row = trigger.closest('.user-row');
            if (row) openModalFromRow(row);
        });
    }
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });
    }
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (closeModalFooterBtn) closeModalFooterBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeModal();
    });
    applyFilters();
});
