/* ================================================================
   borrow.js – Quản lý mượn sách
   Dùng cho: templates/circulation/borrow_list.html
================================================================ */
document.addEventListener('DOMContentLoaded', function () {
    const overlay = document.getElementById('pmOverlay');
    const searchInput = document.getElementById('borrowSearchInput');
    const searchBtn = document.getElementById('borrowSearchBtn');
    const addBtn = document.getElementById('addBorrowBtn');
    const tableBody = document.getElementById('borrowTableBody');

    if (!tableBody) return;

    /* ========================
       DỮ LIỆU MẪU
    ======================== */
    let slips = [
        {
            id: 1,
            slipCode: 'TC001',
            userId: '2051010001',
            userName: 'Trần Thị Bình',
            borrowDate: '5/1/2026',
            dueDate: '19/1/2026',
            status: 'Quá hạn',
            statusClass: 'tb-orange',
            books: [
                { code: 'MS001', title: 'Kinh tế học vi mô', qty: 1 },
                { code: 'MS002', title: 'Toán cao cấp A1', qty: 2 }
            ]
        },
        {
            id: 2,
            slipCode: 'TC002',
            userId: '2051010002',
            userName: 'Trần Bình Na',
            borrowDate: '11/1/2026',
            dueDate: '19/11/2026',
            status: 'Đang mượn',
            statusClass: 'tb-blue',
            books: [
                { code: 'MS003', title: 'Nguyên lý kế toán', qty: 1 }
            ]
        },
        {
            id: 3,
            slipCode: 'MIS3001',
            userId: '2051010003',
            userName: 'Hồ Bảo Trần',
            borrowDate: '5/1/2026',
            dueDate: '19/11/2025',
            status: 'Đã trả',
            statusClass: 'tb-green',
            books: [
                { code: 'MS004', title: 'Lịch sử Đảng', qty: 1 }
            ]
        },
        {
            id: 4,
            slipCode: 'MIS3021',
            userId: '2051010004',
            userName: 'Nguyễn Bình',
            borrowDate: '5/1/2026',
            dueDate: '29/8/2026',
            status: 'Đang mượn',
            statusClass: 'tb-blue',
            books: [
                { code: 'MS001', title: 'Kinh tế học vi mô', qty: 1 },
                { code: 'MS005', title: 'Lập trình Python cơ bản', qty: 1 }
            ]
        },
        {
            id: 5,
            slipCode: 'MIS3007',
            userId: '2051010005',
            userName: 'Nguyễn Khiêm',
            borrowDate: '14/2/2025',
            dueDate: '19/11/2025',
            status: 'Đã trả',
            statusClass: 'tb-green',
            books: [
                { code: 'MS006', title: 'Kinh tế vi mô', qty: 1 }
            ]
        },
        {
            id: 6,
            slipCode: 'ELC3008',
            userId: '2051010006',
            userName: 'Trần Thị Linh',
            borrowDate: '12/1/2026',
            dueDate: '9/12/2026',
            status: 'Đang mượn',
            statusClass: 'tb-blue',
            books: [
                { code: 'MS007', title: 'English Communication', qty: 2 }
            ]
        },
        {
            id: 7,
            slipCode: 'SMT1006',
            userId: '2051010007',
            userName: 'Đoàn Hồ Châu',
            borrowDate: '6/4/2026',
            dueDate: '24/3/2026',
            status: 'Quá hạn',
            statusClass: 'tb-orange',
            books: [
                { code: 'MS008', title: 'Quản trị học', qty: 1 }
            ]
        },
        {
            id: 8,
            slipCode: 'LAW2001',
            userId: '2051010008',
            userName: 'Lê Thị Loan',
            borrowDate: '18/10/2025',
            dueDate: '17/5/2026',
            status: 'Đang mượn',
            statusClass: 'tb-blue',
            books: [
                { code: 'MS009', title: 'Pháp luật đại cương', qty: 1 }
            ]
        }
    ];

    let pendingDeleteId = null;
    let extLargeSlipId = null;
    let extSmallSlipId = null;

    /* ========================
       TOAST HELPER
    ======================== */
    function safeToast(type, message) {
        if (typeof showToast === 'function') {
            showToast(type, message);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }

    /* ========================
       DATE HELPERS
    ======================== */
    function toIso(display) {
        if (!display || !display.includes('/')) return '';
        const parts = display.split('/');
        return `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
    }

    function toDisplay(iso) {
        if (!iso || !iso.includes('-')) return iso || '';
        const parts = iso.split('-');
        return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`;
    }

    /* ========================
       POPUP HELPERS
    ======================== */
    function hideAllPopups() {
        document.querySelectorAll('.pm-modal, .pm-modal-sm').forEach(function (modal) {
            modal.style.display = 'none';
        });
    }

    function openPm(id) {
        if (!overlay) return;
        overlay.classList.add('open');
        hideAllPopups();
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    window.closePm = function () {
        if (overlay) {
            overlay.classList.remove('open');
        }
        hideAllPopups();
    };

    if (overlay) {
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                window.closePm();
            }
        });
    }

    /* ========================
       RENDER TABLE
    ======================== */
    function renderRows(rows) {
        if (!rows.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;padding:32px;color:#9ca3af;">
                        Không có dữ liệu
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = rows.map(function (s) {
            return `
                <tr data-id="${s.id}">
                    <td>${s.slipCode}</td>
                    <td>${s.userId}</td>
                    <td>${s.userName}</td>
                    <td>${s.borrowDate}</td>
                    <td>${s.dueDate}</td>
                    <td>
                        <span class="tbadge ${s.statusClass}">${s.status}</span>
                    </td>
                    <td class="col-action">
                        <button class="icon-btn edit btn-edit" data-id="${s.id}" title="Gia hạn">
                            <i class="bx bx-calendar"></i>
                        </button>
                        &nbsp;
                        <button class="icon-btn del btn-del" data-id="${s.id}" title="Xóa">
                            <i class="bx bx-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /* ========================
       SEARCH
    ======================== */
    function doSearch() {
        const keyword = (searchInput ? searchInput.value : '').toLowerCase().trim();

        if (!keyword) {
            renderRows(slips);
            return;
        }

        const filtered = slips.filter(function (s) {
            return (
                s.slipCode.toLowerCase().includes(keyword) ||
                s.userId.toLowerCase().includes(keyword) ||
                s.userName.toLowerCase().includes(keyword)
            );
        });

        renderRows(filtered);

        safeToast(
            filtered.length ? 'success' : 'error',
            filtered.length
                ? `Tìm thấy ${filtered.length} phiếu mượn.`
                : 'Không tìm thấy phiếu mượn phù hợp.'
        );
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', doSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keyup', function (e) {
            if (e.key === 'Enter') {
                doSearch();
            }
        });
    }

    /* ========================
       BOOK LIST RENDER
    ======================== */
    function renderBookList(containerId, books) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!books || !books.length) {
            container.innerHTML = `<div style="color:#9ca3af;padding:14px 0;">Không có sách</div>`;
            return;
        }

        container.innerHTML = books.map(function (book) {
            return `
                <div class="pm-list-row">
                    <div class="lcode">${book.code}</div>
                    <div class="ltitle">${book.title}</div>
                    <div class="lqty">${book.qty}</div>
                </div>
            `;
        }).join('');
    }

    /* ========================
       ADD BOOK ROW
    ======================== */
    window.addBookRow = function () {
        const body = document.getElementById('addBooksBody');
        if (!body) return;

        const row = document.createElement('div');
        row.className = 'pm-book-row';
        row.innerHTML = `
            <input class="pm-input" type="text" placeholder="MS001">
            <input class="pm-input" type="text" placeholder="Tên sách">
            <input class="pm-input" type="number" min="1" value="1">
            <button class="btn-row-del" type="button" onclick="this.closest('.pm-book-row').remove()">×</button>
        `;
        body.appendChild(row);
    };

    /* ========================
       OPEN ADD POPUP
    ======================== */
    if (addBtn) {
        addBtn.addEventListener('click', function () {
            const addUserId = document.getElementById('addUserId');
            const addUserName = document.getElementById('addUserName');
            const addBorrowDate = document.getElementById('addBorrowDate');
            const addDueDate = document.getElementById('addDueDate');
            const addBooksBody = document.getElementById('addBooksBody');

            if (addUserId) addUserId.value = '';
            if (addUserName) addUserName.value = '';
            if (addBorrowDate) addBorrowDate.value = '';
            if (addDueDate) addDueDate.value = '';
            if (addBooksBody) addBooksBody.innerHTML = '';

            window.addBookRow();
            openPm('popup-add-borrow');
        });
    }

    /* ========================
       AUTO FILL USER NAME
    ======================== */
    const addUserIdEl = document.getElementById('addUserId');
    if (addUserIdEl) {
        addUserIdEl.addEventListener('blur', function () {
            const uid = this.value.trim();
            const found = slips.find(function (s) {
                return s.userId === uid;
            });

            const addUserName = document.getElementById('addUserName');
            if (addUserName) {
                addUserName.value = found ? found.userName : '';
            }
        });
    }

    /* ========================
       SUBMIT ADD BORROW
    ======================== */
    window.submitAddBorrow = function (e) {
        e.preventDefault();

        const userId = document.getElementById('addUserId')?.value.trim() || '';
        const userName = document.getElementById('addUserName')?.value.trim() || '';
        const borrowDate = document.getElementById('addBorrowDate')?.value || '';
        const dueDate = document.getElementById('addDueDate')?.value || '';

        if (!userId || !borrowDate || !dueDate) {
            safeToast('error', 'Vui lòng nhập đầy đủ thông tin.');
            return;
        }

        const books = [];
        document.querySelectorAll('#addBooksBody .pm-book-row').forEach(function (row) {
            const inputs = row.querySelectorAll('input');
            const code = inputs[0] ? inputs[0].value.trim() : '';
            const title = inputs[1] ? inputs[1].value.trim() : '';
            const qty = inputs[2] ? parseInt(inputs[2].value, 10) || 1 : 1;

            if (code) {
                books.push({ code, title, qty });
            }
        });

        const maxId = slips.reduce(function (max, s) {
            return Math.max(max, s.id);
        }, 0);

        slips.unshift({
            id: maxId + 1,
            slipCode: `PM${String(maxId + 1).padStart(3, '0')}`,
            userId: userId,
            userName: userName || userId,
            borrowDate: toDisplay(borrowDate),
            dueDate: toDisplay(dueDate),
            status: 'Đang mượn',
            statusClass: 'tb-blue',
            books: books
        });

        renderRows(slips);
        window.closePm();

        if (searchInput) {
            searchInput.value = '';
        }

        safeToast('success', 'Thêm phiếu mượn thành công.');
    };

    /* ========================
       TABLE CLICK EVENTS
    ======================== */
    tableBody.addEventListener('click', function (e) {
        const editBtn = e.target.closest('.btn-edit');
        if (editBtn) {
            const id = parseInt(editBtn.getAttribute('data-id'), 10);
            const slip = slips.find(function (s) {
                return s.id === id;
            });

            if (!slip) return;

            const extLgUserId = document.getElementById('extLgUserId');
            const extLgUserName = document.getElementById('extLgUserName');
            const extLgCurrentDue = document.getElementById('extLgCurrentDue');
            const extLgNewDue = document.getElementById('extLgNewDue');

            if (extLgUserId) extLgUserId.value = slip.userId;
            if (extLgUserName) extLgUserName.value = slip.userName;
            if (extLgCurrentDue) extLgCurrentDue.value = toIso(slip.dueDate);
            if (extLgNewDue) extLgNewDue.value = toIso(slip.dueDate);

            renderBookList('extLgBooksBody', slip.books);
            extLargeSlipId = id;
            openPm('popup-extend-large');
            return;
        }

        const delBtn = e.target.closest('.btn-del');
        if (delBtn) {
            pendingDeleteId = parseInt(delBtn.getAttribute('data-id'), 10);
            openPm('popup-delete-confirm');
            return;
        }

        const row = e.target.closest('tr[data-id]');
        if (row && !e.target.closest('.btn-edit') && !e.target.closest('.btn-del')) {
            const rowId = parseInt(row.getAttribute('data-id'), 10);
            const slip = slips.find(function (s) {
                return s.id === rowId;
            });

            if (!slip) return;

            const detUserId = document.getElementById('detUserId');
            const detUserName = document.getElementById('detUserName');
            const detBorrowDate = document.getElementById('detBorrowDate');
            const detDueDate = document.getElementById('detDueDate');

            if (detUserId) detUserId.value = slip.userId;
            if (detUserName) detUserName.value = slip.userName;
            if (detBorrowDate) detBorrowDate.value = toIso(slip.borrowDate);
            if (detDueDate) detDueDate.value = toIso(slip.dueDate);

            renderBookList('detBooksBody', slip.books);
            openPm('popup-borrow-detail');
        }
    });

    /* ========================
       SAVE EXTEND SMALL
    ======================== */
    window.saveExtendSmall = function () {
        const newDate = document.getElementById('extSmNewDate')?.value || '';

        if (!newDate) {
            safeToast('error', 'Vui lòng chọn ngày gia hạn mới.');
            return;
        }

        const slip = slips.find(function (s) {
            return s.id === extSmallSlipId;
        });

        if (slip) {
            slip.dueDate = toDisplay(newDate);
            renderRows(slips);
        }

        window.closePm();
        safeToast('success', 'Gia hạn thành công.');
    };

    /* ========================
       SAVE EXTEND LARGE
    ======================== */
    window.saveExtendLarge = function () {
        const newDate = document.getElementById('extLgNewDue')?.value || '';

        if (!newDate) {
            safeToast('error', 'Vui lòng chọn ngày đến hạn mới.');
            return;
        }

        const slip = slips.find(function (s) {
            return s.id === extLargeSlipId;
        });

        if (slip) {
            slip.dueDate = toDisplay(newDate);
            renderRows(slips);
        }

        window.closePm();
        safeToast('success', 'Lưu thay đổi thành công.');
    };

    /* ========================
       CONFIRM DELETE
    ======================== */
    window.confirmDelete = function () {
        if (pendingDeleteId === null) return;

        slips = slips.filter(function (s) {
            return s.id !== pendingDeleteId;
        });

        pendingDeleteId = null;
        renderRows(slips);
        window.closePm();
        safeToast('success', 'Đã xóa phiếu mượn.');
    };

    /* ========================
       INITIAL RENDER
    ======================== */
    renderRows(slips);
});