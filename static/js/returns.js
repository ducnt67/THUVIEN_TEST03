let selectedReturnRow = null;
let selectedLostRow = null;
let selectedCompensateRow = null;
let overdueFineValue = 0;
let damageFineValue = 0;

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
    document.querySelectorAll('.tab-pane').forEach((p) => {
        p.classList.add('hidden');
        p.classList.remove('active');
        p.style.display = '';  // Xóa inline style để CSS class quyết định
    });

    clickedTab.classList.add('active');
    const target = document.getElementById(targetId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
        target.style.display = '';  // Xóa inline style để CSS .tab-pane.active quyết định
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
    const s = (status || '').toLowerCase();
    return s === 'đang mượn' || s === 'quá hạn' || s === 'dang_muon' || s === 'qua_han';
}

function isLostEligibleStatus(status) {
    const s = (status || '').toLowerCase();
    return s === 'đang mượn' || s === 'quá hạn' || s === 'dang_muon' || s === 'qua_han';
}

function openModalById(id) {
    const overlay = document.getElementById('popupOverlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    const flexModalIds = new Set(['popup-return-confirm', 'popup-return-cancel-confirm', 'popup-payment', 'popup-lost-book', 'popup-compensate-confirm']);
    document.querySelectorAll('.popup-modal').forEach((modal) => {
        if (modal.id === id) {
            modal.style.display = 'flex';
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
    const condition = getSelectedRadioValue('returnCondition');
    const isDamaged = condition === 'damaged';
    const checkedDamage = document.querySelector('input[name="damageLevel"]:checked');

    damageFineValue = 0;
    if (isDamaged && checkedDamage) {
        damageFineValue = parseInt(checkedDamage.dataset.fee) || 0;
    }
    const totalFine = overdueFineValue + damageFineValue;

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    };
    setText('damageFeeValue', formatCurrency(damageFineValue));
    setText('overdueFeeValue', formatCurrency(overdueFineValue));
    setText('overdueSummaryValue', formatCurrency(overdueFineValue));
    setText('damageSummaryValue', formatCurrency(damageFineValue));
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

    // Lấy các giá trị cần gửi
    const damageLevelRadio = document.querySelector('input[name="damageLevel"]:checked');
    const damageLevel = damageLevelRadio ? damageLevelRadio.value : '';

    if (condition === 'damaged' && !damageLevel) {
        showToast('error', 'Vui lòng chọn mức độ hư hỏng.');
        return;
    }

    const damageDescription = document.getElementById('damageDescription')?.value || '';
    // Lấy thông tin từ selectedReturnRow
    const ma_phieu_muon = selectedReturnRow?.dataset.loanId || '';
    const ma_sach_trong_kho = selectedReturnRow?.dataset.bookCode || '';

    // Gửi request xác nhận trả sách
    fetch('/api/xac_nhan_tra_sach/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': window.CSRF_TOKEN || ''
        },
        body: new URLSearchParams({
            ma_phieu_muon,
            ma_sach_trong_kho,
            tinh_trang: condition === 'damaged' ? 'hu_hong' : 'tot',
            mo_ta_hu_hong: damageDescription,
            damage_level: condition === 'damaged' ? damageLevel : ''
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                selectedReturnRow.dataset.status = 'Đã trả';
                if (selectedReturnRow.dataset.overdueDays) selectedReturnRow.dataset.overdueDays = '0';
                selectedReturnRow.classList.remove('row-overdue');

                const statusCell = selectedReturnRow.querySelector('.col-status');
                const actionCell = selectedReturnRow.querySelector('.col-action');

                if (statusCell) statusCell.innerHTML = '<span class="badge badge-green-solid">Đã trả</span>';
                if (actionCell) actionCell.innerHTML = '';

                closeAllPopups();
                resetReturnFormState();
                showToast('returnSuccess');
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast('returnError', data.error || 'Xác nhận trả sách thất bại');
            }
        })
        .catch(() => showToast('returnError'));
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

    // Tự động chọn ngày hôm nay
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

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
    const lostFee = Number(selectedLostRow?.dataset.lostFee || 0);
    const overdueDays = Number(selectedLostRow?.dataset.overdueDays || 0);
    const overdueRate = Number(selectedLostRow?.dataset.overdueRate || 0);
    const overdueFine = overdueDays > 0 ? overdueDays * overdueRate : 0;

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
        if (lostProcessingFee) lostProcessingFee.innerText = formatCurrency(0);
        if (lostRecordNextStatus) lostRecordNextStatus.innerText = '-';
        if (lostTotalAmount) lostTotalAmount.innerText = formatCurrency(0);
        if (lostOutcomeHint) lostOutcomeHint.innerText = 'Chọn phương án bồi hoàn để xem kết quả nghiệp vụ.';
        return;
    }

    if (method === 'money') {
        if (lostFineCreation) lostFineCreation.innerText = 'Có tạo khoản phạt';
        if (lostFineType) lostFineType.innerText = 'Mất sách' + (overdueFine > 0 ? ' + Trễ hạn' : '');
        if (lostFineStatus) lostFineStatus.innerText = 'Chưa thanh toán';
        if (lostProcessingFee) lostProcessingFee.innerText = formatCurrency(lostFee);
        if (lostRecordNextStatus) lostRecordNextStatus.innerText = 'Đang xử lý';
        if (lostTotalAmount) lostTotalAmount.innerText = formatCurrency(lostFee + overdueFine);
        if (lostOutcomeHint) lostOutcomeHint.innerText = 'Sau xác nhận: tạo phạt Mất sách và Trễ hạn (nếu có) với trạng thái Chưa thanh toán.';
        return;
    }

    if (lostFineCreation) lostFineCreation.innerText = 'Không tạo phạt mất sách';
    if (lostFineType) lostFineType.innerText = (overdueFine > 0 ? 'Trễ hạn' : '-');
    if (lostFineStatus) lostFineStatus.innerText = (overdueFine > 0 ? 'Chưa thanh toán' : '-');
    if (lostProcessingFee) lostProcessingFee.innerText = formatCurrency(0);
    if (lostRecordNextStatus) lostRecordNextStatus.innerText = 'Chờ đền sách';
    if (lostTotalAmount) lostTotalAmount.innerText = formatCurrency(overdueFine);
    if (lostOutcomeHint) lostOutcomeHint.innerText = 'Sau xác nhận: hồ sơ chuyển Chờ đền sách, chỉ tạo phạt Trễ hạn (nếu có).';
}

function openLostReport(triggerButton) {
    const row = triggerButton.closest('tr');
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

    const ma_phieu_muon = selectedLostRow?.dataset.loanId || '';
    const ma_sach_trong_kho = selectedLostRow?.dataset.bookCode || '';
    const ghi_chu = document.getElementById('lostNote')?.value || '';

    fetch('/api/xu_ly_mat_sach/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': window.CSRF_TOKEN || ''
        },
        body: new URLSearchParams({
            ma_phieu_muon,
            ma_sach_trong_kho,
            ngay_khai_bao_mat: reportDate,
            phuong_an: method === 'money' ? 'den_bu_tien' : 'den_sach_moi',
            ghi_chu
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const statusCell = selectedLostRow.querySelector('.col-status');
                const actionCell = selectedLostRow.querySelector('.col-action');

                if (method === 'money') {
                    selectedLostRow.dataset.status = 'Đang xử lý';
                    if (statusCell) statusCell.innerHTML = '<span class="badge badge-orange-solid">Đang xử lý</span>';
                } else {
                    selectedLostRow.dataset.status = 'Chờ đền sách';
                    if (statusCell) statusCell.innerHTML = '<span class="badge badge-red-solid">Chờ đền sách</span>';
                }

                if (actionCell) actionCell.innerHTML = '';

                closeAllPopups();
                resetLostFormState();
                showToast('lostSuccess');

                // Tải lại trang để đồng bộ dữ liệu giữa các Tab
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast('lostError', data.error || 'Xử lý mất sách thất bại');
            }
        })
        .catch(() => showToast('lostError'));
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

    document.querySelectorAll('tr.lost-record, tr.return-record').forEach((row) => {
        const status = row.dataset.status || '';
        if (!isLostEligibleStatus(status)) {
            const actionCell = row.querySelector('.col-action-lost');
            if (actionCell) {
                actionCell.innerHTML = '';
            }
        }
    });
}

function isCompensateEligibleStatus(status) {
    const s = (status || '').toLowerCase();
    return s === 'chờ đền sách' || s === 'cho_den_sach' || s === 'cho_den';
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
        showToast('compensateError', 'Sách đền không đạt yêu cầu, vui lòng kiểm tra lại.');
        return;
    }

    const ma_phieu_muon = selectedCompensateRow?.dataset.recordId || '';
    const ma_sach_trong_kho_moi = document.getElementById('compInspectionNote')?.value.trim() || '';

    if (!ma_sach_trong_kho_moi) {
        showToast('error', 'Vui lòng nhập mã sách mới vào ô thông tin.');
        return;
    }

    fetch('/api/xac_nhan_den_sach/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': window.CSRF_TOKEN || ''
        },
        body: new URLSearchParams({
            ma_phieu_muon,
            ma_sach_trong_kho_moi: ma_sach_trong_kho_moi,
            thong_tin_sach_moi: ma_sach_trong_kho_moi
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const statusCell = selectedCompensateRow.querySelector('.col-status');
                const actionCell = selectedCompensateRow.querySelector('.col-action');

                selectedCompensateRow.dataset.status = 'da_tra';
                if (statusCell) statusCell.innerHTML = '<span class="badge badge-green-solid">Đã trả (Đền sách)</span>';
                if (actionCell) actionCell.innerHTML = '';

                closeAllPopups();
                resetCompensateFormState();
                showToast('compensateSuccess');
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast('compensateError', data.error || 'Xác nhận đền sách thất bại');
            }
        })
        .catch(() => showToast('compensateError'));
}

function initCompensateFlow() {
    // Cho phép click vào cả dòng để hiện popup xác nhận
    document.querySelectorAll('tr.compensate-record').forEach((row) => {
        row.addEventListener('click', () => {
            const trigger = row.querySelector('.compensate-confirm-trigger');
            if (trigger) openCompensateConfirm(trigger);
        });

        // Trigger luôn hiển thị nếu có trong DOM (do template đã filter)
        const trigger = row.querySelector('.compensate-confirm-trigger');
        if (!trigger) {
            // Không có trigger nghĩa là đã hoàn thành
        }
    });

    // Sự kiện riêng cho trigger (ngăn sủi bọt)
    document.querySelectorAll('.compensate-confirm-trigger').forEach((trigger) => {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            openCompensateConfirm(trigger);
        });
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
            const actionCell = row.querySelector('.col-action');
            if (actionCell) actionCell.innerHTML = '';
            row.classList.remove('row-overdue');
        }
    });
}

let selectedPaymentUser = null;

function openPaymentPopup(maNguoiDung, hoTen = '', tongTien = 0) {
    selectedPaymentUser = maNguoiDung;
    const nameEl = document.getElementById('payUserName');
    const totalEl = document.getElementById('payTotalAmount');
    if (nameEl) nameEl.innerText = hoTen || '-';
    if (totalEl) totalEl.innerText = formatCurrency(Number(tongTien) || 0);

    // Xóa nội dung bảng cũ và hiện loading
    const tableBody = document.getElementById('paymentTableBody');
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#6b7280;">Đang tải chi tiết các khoản phạt...</td></tr>';

    openModalById('popup-payment');

    // Fetch chi tiết từ server
    fetch(`/api/get_user_fines/?ma_nguoi_dung=${maNguoiDung}`)
        .then(res => res.json())
        .then(data => {
            window.currentFineIds = []; // Chi luu ma phat chua thanh toan
            let unpaidTotal = 0;
            if (data.success && data.fines.length > 0) {
                tableBody.innerHTML = '';
                data.fines.forEach(fine => {
                    const fineAmount = Number(fine.so_tien) || 0;
                    const isUnpaid = fine.trang_thai === 'Chưa thanh toán';

                    if (isUnpaid) {
                        window.currentFineIds.push(fine.ma_phat);
                        unpaidTotal += fineAmount;
                    }

                    const row = document.createElement('tr');
                    row.style.borderBottom = '1px solid #f3f4f6';
                    row.innerHTML = `
                    <td style="padding:12px 14px; font-size:13px; color:#374151;">${fine.ma_sach_trong_kho}</td>
                    <td style="padding:12px 14px; font-size:13px; color:#374151;">${fine.ten_sach}</td>
                    <td style="padding:12px 14px; font-size:13px; color:#374151;">${fine.loai_phat}</td>
                    <td style="padding:12px 14px; font-size:13px; color:#374151;">${fine.ly_do}</td>
                    <td style="padding:12px 14px; font-size:13px; font-weight:700; color:#f97316;">${formatCurrency(fineAmount)}</td>
                    <td style="padding:12px 14px; font-size:13px; color:#374151;">${fine.ngay_tao}</td>
                    <td style="padding:12px 14px; font-size:13px; color:#374151;">${fine.ma_phieu_muon}</td>
                    <td style="padding:12px 14px;">
                        <span class="badge ${fine.trang_thai === 'Đã thanh toán' ? 'badge-green-solid' : 'badge-orange-solid'}" style="font-size:11px;">
                            ${fine.trang_thai}
                        </span>
                    </td>
                `;
                    tableBody.appendChild(row);
                });

                if (totalEl) {
                    totalEl.innerText = formatCurrency(unpaidTotal);
                }

                // Ẩn/Hiện bộ điều khiển thanh toán tùy vào còn nợ hay không
                const paymentControls = document.getElementById('paymentControls');
                const hasUnpaid = data.fines.some(f => f.trang_thai === 'Chưa thanh toán');
                if (paymentControls) {
                    paymentControls.style.display = hasUnpaid ? 'block' : 'none';
                }
            } else {
                tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#9ca3af;">Không có lịch sử phí phạt.</td></tr>';
                if (totalEl) totalEl.innerText = formatCurrency(0);
                const paymentControls = document.getElementById('paymentControls');
                if (paymentControls) paymentControls.style.display = 'none';
            }
        })
        .catch(() => {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#ef4444;">Lỗi kết nối khi tải chi tiết phí phạt.</td></tr>';
        });
}

function submitPayment() {
    if (!selectedPaymentUser) return;
    const paymentMethod = getSelectedRadioValue('paymentMethodNew');

    if (!window.currentFineIds || window.currentFineIds.length === 0) {
        alert('Không có khoản phạt nào để thanh toán.');
        return;
    }

    const params = new URLSearchParams();
    params.append('ma_nguoi_dung', selectedPaymentUser);
    params.append('phuong_thuc', paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản');

    window.currentFineIds.forEach(id => params.append('danh_sach_ma_phat[]', id));

    fetch('/api/thanh_toan_phi_phat/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': window.CSRF_TOKEN || ''
        },
        body: params
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeAllPopups();
                showToast('paymentSuccess');
                setTimeout(() => location.reload(), 1000);
            } else {
                alert('Thanh toán thất bại: ' + (data.error || 'Lỗi hệ thống'));
            }
        })
        .catch(() => alert('Lỗi kết nối khi thanh toán'));
}

document.addEventListener('DOMContentLoaded', () => {
    initReturnFlow();
    initLostFlow();
    initCompensateFlow();
});
