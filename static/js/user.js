/* =========================================================
   user.js – Quản lý người dùng
   Dùng cho: templates/users/user_list.html
========================================================= */

const usersData = [
    { stt: 1, id: '231121514205', name: 'Trần Thị Bình', type: 'Độc giả', class: '20K1', status: 'Chưa tốt nghiệp', email: 'ttbinh@due.edu.vn', phone: '0905111222', borrowed: 2, fine: '0đ' },
    { stt: 2, id: '231121514206', name: 'Lê Văn Cường', type: 'Độc giả', class: '20K2', status: 'Chưa tốt nghiệp', email: 'lvcuong@due.edu.vn', phone: '0905333444', borrowed: 0, fine: '50.000đ' },
    { stt: 3, id: '231121514207', name: 'Phạm Thị Dung', type: 'Độc giả', class: '20K1', status: 'Chưa tốt nghiệp', email: 'ptdung@due.edu.vn', phone: '0905555666', borrowed: 1, fine: '0đ' },
    { stt: 4, id: '231121514208', name: 'Hoàng Văn Em', type: 'Độc giả', class: '19K3', status: 'Đã tốt nghiệp', email: 'hvem1@due.edu.vn', phone: '0905777888', borrowed: 0, fine: '0đ' },
    { stt: 5, id: '231121514209', name: 'Hoàng Văn Em', type: 'Độc giả', class: '19K3', status: 'Đã tốt nghiệp', email: 'hvem2@due.edu.vn', phone: '0905999000', borrowed: 0, fine: '0đ' },
    { stt: 6, id: '231121514210', name: 'Hoàng Văn Em', type: 'Độc giả', class: '19K3', status: 'Đã tốt nghiệp', email: 'hvem3@due.edu.vn', phone: '0905123123', borrowed: 0, fine: '0đ' },
    { stt: 7, id: '231121514211', name: 'Hoàng Văn Em', type: 'Độc giả', class: '19K3', status: 'Đã tốt nghiệp', email: 'hvem4@due.edu.vn', phone: '0905456456', borrowed: 0, fine: '0đ' }
];

const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterStatus = document.getElementById('filterStatus');
const filterClass = document.getElementById('filterClass');
const emptyState = document.getElementById('emptyState');
const tableEl = document.getElementById('userTable');

const modal = document.getElementById('userModal');
const closeModalBtn = document.getElementById('closeModalBtn');

function renderTable(data) {
    if (!tableBody || !tableEl || !emptyState) return;

    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableEl.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    tableEl.style.display = 'table';
    emptyState.style.display = 'block';
    emptyState.style.display = 'none';

    data.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.stt}</td>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td><span class="tag">${user.type}</span></td>
            <td>${user.class}</td>
            <td>${user.status}</td>
            <td>
                <button class="action-btn" onclick="openModal('${user.id}')" title="Xem chi tiết">
                    <i class="fa-regular fa-eye"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function filterData() {
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const statusVal = filterStatus ? filterStatus.value : 'all';
    const classVal = filterClass ? filterClass.value : 'all';

    const filtered = usersData.filter(user => {
        const matchKeyword =
            user.name.toLowerCase().includes(keyword) ||
            user.id.includes(keyword);

        const matchStatus =
            statusVal === 'all' || user.status === statusVal;

        const matchClass =
            classVal === 'all' || user.class === classVal;

        return matchKeyword && matchStatus && matchClass;
    });

    renderTable(filtered);
}

window.openModal = function (userId) {
    const user = usersData.find(u => u.id === userId);
    if (!user || !modal) return;

    document.getElementById('modalUserId').textContent = user.id;
    document.getElementById('modalUserName').textContent = user.name;
    document.getElementById('modalUserEmail').textContent = user.email;
    document.getElementById('modalUserPhone').textContent = user.phone;
    document.getElementById('modalBooks').textContent = user.borrowed;
    document.getElementById('modalFine').textContent = user.fine;

    modal.style.display = 'flex';
};

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        if (modal) {
            modal.style.display = 'none';
        }
    });
}

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

if (searchBtn) {
    searchBtn.addEventListener('click', filterData);
}

if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            filterData();
        }
    });
}

if (filterStatus) {
    filterStatus.addEventListener('change', filterData);
}

if (filterClass) {
    filterClass.addEventListener('change', filterData);
}

document.addEventListener('DOMContentLoaded', () => {
    renderTable(usersData);
});