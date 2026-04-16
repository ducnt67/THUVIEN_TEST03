let selectedReturnRow = null;
let selectedLostRow = null;
let selectedCompensateRow = null;
let overdueFineValue = 0;

function normalizeSearchText(text) {
    return (text || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const query = normalizeSearchText(searchInput.value);
    const allRows = document.querySelectorAll('.tab-pane tbody tr');

    allRows.forEach((row) => {
        const rowText = normalizeSearchText(row.textContent);
        row.style.display = !query || rowText.includes(query) ? '' : 'none';
    });
}

function switchTab(clickedTab, targetId) {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach((p) => p.classList.add('hidden'));
    document.querySelectorAll('.tab-pane').forEach((p) => p.style.display = 'none');

    clickedTab.classList.add('active');
    const target = document.getElementById(targetId);
    if (target) {
        target.classList.remove('hidden');
        target.style.display = 'flex';
    }
}

function showToast(type, customMessage) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-msg';

    const map = {
        returnSuccess: { cls: 'toast-success', icon: 'bx bx-check-circle', msg: 'Xác nhận trả sách thành công' },
        returnError: { cls: 'toast-error', icon: 'bx bx-x-circle', msg: 'Xác nhận trả sách thất bại' },
        compensateSuccess: { cls: 'toast-success', icon: 'bx bx-check-circle', msg: 'Xác nhận đền sách thành công' },
        compensateError: { cls: 'toast-error', icon: 'bx bx-x-circle', msg: 'Xác nhận đền sách thất bại' },
        lostSuccess: { cls: 'toast-success', icon: 'bx bx-check-circle', msg: 'Xác nhận mất sách thành công' },
        lostError: { cls: 'toast-error', icon: 'bx bx-x-circle', msg: 'Xác nhận xử lý mất sách thất bại' },
        paymentSuccess: { cls: 'toast-success', icon: 'bx bx-check-circle', msg: 'Thanh toán phí phạt thành công' },
        error: { cls: 'toast-error', icon: 'bx bx-x-circle', msg: customMessage || 'Đã có lỗi xảy ra' }
    };

    const cfg = map[type] || map.error;
    toast.classList.add(cfg.cls);
    toast.innerHTML = `<i class='${cfg.icon}'></i> <span>${customMessage || cfg.msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOutToast 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatCurrency(value) {
    return `${new Intl.NumberFormat('vi-VN').format(Math.max(0, value || 0))}đ`;
}

function isReturnEligibleStatus(status) {
    return status === 'Đang mượn' || status === 'Quá hạn';
}

function isLostEligibleStatus(status) {
    return status === 'Đang mượn' || status === 'Quá hạn';
}

function openModalById(id) {
    const overlay = document.getElementById('popupOverlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    const flexModalIds = new Set(['popup-return-confirm', 'popup-return-cancel-confirm', 'popup-payment', 'popup-lost-book']);
    document.querySelectorAll('.popup-modal').forEach((modal) => {
        if (modal.id === id) {
            modal.style.display = flexModalIds.has(id) ? 'flex' : 'block';
        } else {
            modal.style.display = 'none';
        }
    });
}

function closeAllPopups() {
    const overlay = document.getElementById('popupOverlay');
    if (overlay) overlay.style.display = 'none';
    document.querySelectorAll('.popup-modal').forEach((modal) => {
        modal.style.display = 'none';
    });
}

function getSelectedRadioValue(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
}

function markReturnConditionError(showError) {
    const conditionGroup = document.getElementById('returnConditionGroup');
    const conditionError = document.getElementById('returnConditionError');
    if (!conditionGroup || !conditionError) return;
    conditionGroup.classList.toggle('error', showError);
    conditionError.classList.toggle('hidden', !showError);
}

function resetReturnFormState() {
    document.querySelectorAll('input[name="returnCondition"]').forEach((input) => { input.checked = false; });
    document.querySelectorAll('input[name="damageLevel"]').forEach((input) => { input.checked = false; });

    const damageDescription = document.getElementById('damageDescription');
    if (damageDescription) damageDescription.value = '';

    const damageSection = document.getElementById('damageSection');
    if (damageSection) damageSection.classList.add('hidden');

    markReturnConditionError(false);
    updateReturnFeeSummary();
}

function updateReturnFeeSummary() {
    const isDamaged = getSelectedRadioValue('returnCondition') === 'damaged';
    const selectedDamageLevel = getSelectedRadioValue('damageLevel');
    const damageFeeMap = { light: 30000, medium: 70000, severe: 120000 };
    const damageFee = isDamaged ? (damageFeeMap[selectedDamageLevel] || 0) : 0;
    const totalFine = overdueFineValue + damageFee;

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    };
    setText('damageFeeValue', formatCurrency(damageFee));
    setText('overdueFeeValue', formatCurrency(overdueFineValue));
    setText('overdueSummaryValue', formatCurrency(overdueFineValue));
    setText('damageSummaryValue', formatCurrency(damageFee));
    setText('totalFineValue', formatCurrency(totalFine));

    const overdueSummaryRow = document.getElementById('overdueSummaryRow');
    const damageSummaryRow = document.getElementById('damageSummaryRow');
    if (overdueSummaryRow) overdueSummaryRow.classList.toggle('hidden', overdueFineValue <= 0);
    if (damageSummaryRow) damageSummaryRow.classList.toggle('hidden', !isDamaged);
}

function syncReturnPopupFromRow(row) {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value || '-';
    };

    setText('returnBookCode', row.dataset.bookCode);
    setText('returnBookTitle', row.dataset.bookTitle);
    setText('returnBorrower', row.dataset.borrower);
    setText('returnDueDate', row.dataset.dueDate);

    const overdueDays = Number(row.dataset.overdueDays || 0);
    const overdueRate = Number(row.dataset.overdueRate || 0);
    overdueFineValue = overdueDays > 0 ? overdueDays * overdueRate : 0;

    setText('overdueDaysValue', `${overdueDays} ngày`);
    setText('overdueRateValue', formatCurrency(overdueRate));

    const overdueSection = document.getElementById('overdueSection');
    if (overdueSection) overdueSection.classList.toggle('hidden', overdueDays <= 0);
}

function openReturnConfirm(triggerButton) {
    const row = triggerButton.closest('tr.return-record');
    if (!row) return;

    const status = row.dataset.status || '';
    if (!isReturnEligibleStatus(status)) {
        showToast('error', 'Chỉ bản ghi Đang mượn hoặc Quá hạn mới được xác nhận trả.');
        return;
    }

    selectedReturnRow = row;
    syncReturnPopupFromRow(row);
    resetReturnFormState();
    openModalById('popup-return-confirm');
}

function requestCloseReturnPopup() {
    const hasCondition = !!getSelectedRadioValue('returnCondition');
    const hasDamageLevel = !!getSelectedRadioValue('damageLevel');
    const damageDescription = document.getElementById('damageDescription');
    const hasDescription = !!(damageDescription && damageDescription.value.trim());

    if (!hasCondition && !hasDamageLevel && !hasDescription) {
        closeAllPopups();
        return;
    }

    openModalById('popup-return-cancel-confirm');
}

function backToReturnPopup() {
    openModalById('popup-return-confirm');
}

function confirmCancelReturnPopup() {
    resetReturnFormState();
    closeAllPopups();
}

function submitReturnConfirm() {
    const condition = getSelectedRadioValue('returnCondition');
    if (!condition) {
        markReturnConditionError(true);
        return;
    }
    markReturnConditionError(false);

    try {
        if (!selectedReturnRow) throw new Error('Missing row');

        selectedReturnRow.dataset.status = 'Đã trả';
        selectedReturnRow.dataset.overdueDays = '0';
        selectedReturnRow.classList.remove('row-overdue');

        const statusCell = selectedReturnRow.querySelector('td:nth-child(7)');
        const actionCell = selectedReturnRow.querySelector('td:nth-child(8)');
        if (!statusCell || !actionCell) throw new Error('Invalid cells');

        statusCell.innerHTML = '<span class="badge badge-green-solid">Đã trả</span>';
        actionCell.innerHTML = '<span class="action-disabled">Không khả dụng</span>';

        closeAllPopups();
        resetReturnFormState();
        showToast('returnSuccess');
    } catch (err) {
        showToast('returnError');
    }
}

function markLostDateError(showError) {
    const dateInput = document.getElementById('lostReportDate');
    const dateError = document.getElementById('lostDateError');
    if (!dateInput || !dateError) return;

    dateInput.classList.toggle('error-input', showError);
    dateError.classList.toggle('hidden', !showError);
}

function markLostMethodError(showError) {
    const methodGroup = document.getElementById('lostCompensateGroup');
    const methodError = document.getElementById('lostMethodError');
    if (!methodGroup || !methodError) return;

    methodGroup.classList.toggle('error', showError);
    methodError.classList.toggle('hidden', !showError);
}

function resetLostFormState() {
    const dateInput = document.getElementById('lostReportDate');
    const noteInput = document.getElementById('lostNote');
    if (dateInput) dateInput.value = '';
    if (noteInput) noteInput.value = '';

    document.querySelectorAll('input[name="compensateMethod"]').forEach((input) => {
        input.checked = false;
    });

    markLostDateError(false);
    markLostMethodError(false);
    updateLostOutcome();
}

function updateLostOutcome() {
    const method = getSelectedRadioValue('compensateMethod');
    const bookPrice = Number(selectedLostRow?.dataset.bookPrice || 0);
    const processingFee = Number(selectedLostRow?.dataset.processingFee || 0);

    const lostFineCreation = document.getElementById('lostFineCreation');
    const lostFineType = document.getElementById('lostFineType');
    const lostFineStatus = document.getElementById('lostFineStatus');
    const lostProcessingFee = document.getElementById('lostProcessingFee');
    const lostRecordNextStatus = document.getElementById('lostRecordNextStatus');
    const lostTotalAmount = document.getElementById('lostTotalAmount');
    const lostOutcomeHint = document.getElementById('lostOutcomeHint');

    if (!method) {
        if (lostFineCreation) lostFineCreation.innerText = 'Chưa xác định';
        if (lostFineType) lostFineType.innerText = '-';
        if (lostFineStatus) lostFineStatus.innerText = '-';
        if (lostProcessingFee) lostProcessingFee.innerText = formatCurrency(processingFee);
        if (lostRecordNextStatus) lostRecordNextStatus.innerText = '-';
        if (lostTotalAmount) lostTotalAmount.innerText = formatCurrency(0);
        if (lostOutcomeHint) lostOutcomeHint.innerText = 'Chọn phương án bồi hoàn để xem kết quả nghiệp vụ.';
        return;
    }

    if (method === 'money') {
        if (lostFineCreation) lostFineCreation.innerText = 'Có tạo khoản phạt';
        if (lostFineType) lostFineType.innerText = 'Mất sách';
        if (lostFineStatus) lostFineStatus.innerText = 'Chưa thanh toán';
        if (lostProcessingFee) lostProcessingFee.innerText = formatCurrency(processingFee);
        if (lostRecordNextStatus) lostRecordNextStatus.innerText = 'Đang xử lý';
        if (lostTotalAmount) lostTotalAmount.innerText = formatCurrency(bookPrice + processingFee);
        if (lostOutcomeHint) lostOutcomeHint.innerText = 'Sau xác nhận: tạo phạt Mất sách trạng thái Chưa thanh toán, cộng thêm phí xử lý nếu có.';
        return;
    }

    if (lostFineCreation) lostFineCreation.innerText = 'Không tạo phạt mất sách';
    if (lostFineType) lostFineType.innerText = '-';
    if (lostFineStatus) lostFineStatus.innerText = '-';
    if (lostProcessingFee) lostProcessingFee.innerText = formatCurrency(processingFee);
    if (lostRecordNextStatus) lostRecordNextStatus.innerText = 'Chờ đền sách';
    if (lostTotalAmount) lostTotalAmount.innerText = formatCurrency(processingFee);
    if (lostOutcomeHint) lostOutcomeHint.innerText = 'Sau xác nhận: hồ sơ chuyển Chờ đền sách, không tạo phạt mất sách, chỉ thu phí xử lý bắt buộc (nếu có).';
}

function openLostReport(triggerButton) {
    const row = triggerButton.closest('tr.lost-record');
    if (!row) return;

    const status = row.dataset.status || '';
    if (!isLostEligibleStatus(status)) {
        showToast('error', 'Chỉ bản ghi Đang mượn hoặc Quá hạn mới được báo mất.');
        return;
    }

    selectedLostRow = row;
    const bookTitle = document.getElementById('lostBookTitle');
    const borrower = document.getElementById('lostBorrowerName');
    if (bookTitle) bookTitle.innerText = row.dataset.bookTitle || '-';
    if (borrower) borrower.innerText = row.dataset.borrower || '-';

    resetLostFormState();
    openModalById('popup-lost-book');
}

function submitLostBookReport() {
    const reportDate = document.getElementById('lostReportDate')?.value || '';
    const method = getSelectedRadioValue('compensateMethod');

    const validDate = Boolean(reportDate);
    markLostDateError(!validDate);
    markLostMethodError(!method);
    if (!validDate || !method) return;

    try {
        if (!selectedLostRow) throw new Error('Missing row');

        const statusCell = selectedLostRow.querySelector('td:nth-child(6)');
        const actionCell = selectedLostRow.querySelector('td:nth-child(7)');
        if (!statusCell || !actionCell) throw new Error('Invalid row structure');

        if (method === 'money') {
            selectedLostRow.dataset.status = 'Đang xử lý';
            statusCell.innerHTML = '<span class="badge badge-orange-solid">Đang xử lý</span>';
        } else {
            selectedLostRow.dataset.status = 'Chờ đền sách';
            statusCell.innerHTML = '<span class="badge badge-red-solid">Chờ đền sách</span>';
        }

        actionCell.innerHTML = '<span class="action-disabled">Không khả dụng</span>';

        closeAllPopups();
        resetLostFormState();
        showToast('lostSuccess');
    } catch (error) {
        showToast('lostError');
    }
}

function initLostFlow() {
    document.querySelectorAll('.lost-report-trigger').forEach((button) => {
        button.addEventListener('click', () => openLostReport(button));
    });

    document.querySelectorAll('input[name="compensateMethod"]').forEach((input) => {
        input.addEventListener('change', () => {
            markLostMethodError(false);
            updateLostOutcome();
        });
    });

    const reportDateInput = document.getElementById('lostReportDate');
    if (reportDateInput) {
        reportDateInput.addEventListener('change', () => markLostDateError(false));
    }

    document.querySelectorAll('tr.lost-record').forEach((row) => {
        const status = row.dataset.status || '';
        if (!isLostEligibleStatus(status)) {
            const actionCell = row.querySelector('td:nth-child(7)');
            if (actionCell) actionCell.innerHTML = '<span class="action-disabled">Không khả dụng</span>';
        }
    });
}

function isCompensateEligibleStatus(status) {
    return status === 'Chờ đền sách';
}

function markCompInspectionError(showError) {
    const group = document.getElementById('compInspectionGroup');
    const error = document.getElementById('compInspectionError');
    if (!group || !error) return;

    group.classList.toggle('error', showError);
    error.classList.toggle('hidden', !showError);
}

function resetCompensateFormState() {
    document.querySelectorAll('input[name="compInspectionResult"]').forEach((input) => {
        input.checked = false;
    });
    const note = document.getElementById('compInspectionNote');
    if (note) note.value = '';
    markCompInspectionError(false);
}

function syncCompensatePopupFromRow(row) {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value || '-';
    };

    setText('compRecordId', row.dataset.recordId);
    setText('compBookTitle', row.dataset.bookTitle);
    setText('compBookCode', row.dataset.bookCode);
    setText('compBorrower', row.dataset.compensator);
    setText('compReportDate', row.dataset.reportDate);
}

function openCompensateConfirm(triggerEl) {
    const row = triggerEl.closest('tr.compensate-record');
    if (!row) return;

    const status = row.dataset.status || '';
    if (!isCompensateEligibleStatus(status)) {
        showToast('error', 'Chỉ hồ sơ Chờ đền sách mới được xác nhận.');
        return;
    }

    selectedCompensateRow = row;
    syncCompensatePopupFromRow(row);
    resetCompensateFormState();
    openModalById('popup-compensate-confirm');
}

function submitCompensateConfirm() {
    const inspection = getSelectedRadioValue('compInspectionResult');
    if (!inspection) {
        markCompInspectionError(true);
        return;
    }

    markCompInspectionError(false);

    if (inspection === 'fail') {
        showToast('compensateError');
        return;
    }

    try {
        if (!selectedCompensateRow) throw new Error('Missing compensate row');

        const statusCell = selectedCompensateRow.querySelector('td:nth-child(6)');
        if (!statusCell) throw new Error('Missing status cell');

        selectedCompensateRow.dataset.status = 'Đã xử lý - Đền sách';
        statusCell.innerHTML = '<span class="badge badge-green-solid">Đã xử lý - Đền sách</span>';

        closeAllPopups();
        resetCompensateFormState();
        showToast('compensateSuccess');
    } catch (error) {
        showToast('compensateError');
    }
}

function initCompensateFlow() {
    document.querySelectorAll('.compensate-confirm-trigger').forEach((trigger) => {
        trigger.addEventListener('click', () => openCompensateConfirm(trigger));
    });

    document.querySelectorAll('tr.compensate-record').forEach((row) => {
        const status = row.dataset.status || '';
        const trigger = row.querySelector('.compensate-confirm-trigger');
        if (!isCompensateEligibleStatus(status) && trigger) {
            trigger.outerHTML = '<span class="badge badge-green-solid">Đã xử lý - Đền sách</span>';
        }
    });

    document.querySelectorAll('input[name="compInspectionResult"]').forEach((input) => {
        input.addEventListener('change', () => markCompInspectionError(false));
    });
}

function initReturnFlow() {
    const overlay = document.getElementById('popupOverlay');
    if (overlay) {
        overlay.addEventListener('click', (event) => {
            if (event.target !== overlay) return;
            const returnModal = document.getElementById('popup-return-confirm');
            if (returnModal && returnModal.style.display !== 'none') {
                requestCloseReturnPopup();
            } else {
                closeAllPopups();
            }
        });
    }

    document.querySelectorAll('.return-confirm-trigger').forEach((btn) => {
        btn.addEventListener('click', () => openReturnConfirm(btn));
    });

    document.querySelectorAll('input[name="returnCondition"]').forEach((input) => {
        input.addEventListener('change', () => {
            const damageSection = document.getElementById('damageSection');
            const isDamaged = getSelectedRadioValue('returnCondition') === 'damaged';
            if (damageSection) damageSection.classList.toggle('hidden', !isDamaged);
            markReturnConditionError(false);
            updateReturnFeeSummary();
        });
    });

    document.querySelectorAll('input[name="damageLevel"]').forEach((input) => {
        input.addEventListener('change', updateReturnFeeSummary);
    });

    document.querySelectorAll('tr.return-record').forEach((row) => {
        const status = row.dataset.status || '';
        if (!isReturnEligibleStatus(status)) {
            const actionCell = row.querySelector('td:nth-child(8)');
            if (actionCell) actionCell.innerHTML = '<span class="action-disabled">Không khả dụng</span>';
            row.classList.remove('row-overdue');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initReturnFlow();
    initLostFlow();
    initCompensateFlow();
});

