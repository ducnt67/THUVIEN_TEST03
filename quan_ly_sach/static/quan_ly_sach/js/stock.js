/* =========================================================
   STOCK.JS - CẬP NHẬT: HIỂN THỊ MÃ SÁCH & ĐỒNG BỘ DỮ LIỆU
========================================================= */

// 1. Lấy thông tin sách đang chọn từ LocalStorage
let book = JSON.parse(localStorage.getItem("selectedBook"));

if (!book) {
    alert("Chưa chọn sách! Đang quay lại danh sách...");
    window.location.href = "book_list.html";
}

// 2. Khởi tạo Key lưu trữ kho riêng cho từng đầu sách
const stockKey = "book_stock_" + book.id;
let stock = JSON.parse(localStorage.getItem(stockKey)) || [];

// 3. Hàm hiển thị thông tin đầu sách lên Header
function loadInfo() {
    document.getElementById("bookId").innerText = book.id || "N/A";
    document.getElementById("bookTitle").innerText = book.title || "Chưa có tên";
    document.getElementById("bookAuthor").innerText = book.author || "Khuyết danh";
    document.getElementById("bookQty").innerText = book.quantity || "0/0";
}

// 4. Hàm render bảng kho (Hiển thị Mã sách & Mã vạch)
function renderStock() {
    const tableBody = document.getElementById("stockTable");
    if (!tableBody) return;

    if (stock.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px;">Chưa có bản sao nào</td></tr>`;
        return;
    }

    tableBody.innerHTML = stock.map(s => `
        <tr>
            <td>${s.code}</td>

            <td style="color: black;">${book.id}</td>

            <td style="color: black; ">${s.barcode}</td>

            <td>
                <span class="badge ${s.status === 'available' ? 'green' : 'orange'}">
                    ${s.status === 'available' ? 'Có sẵn' : 'Đang mượn'}
                </span>
            </td>
        </tr>
    `).join('');
}

function addCopy() {
    const input = prompt("Nhập số lượng bản sao muốn thêm vào kho:");
    const qtyToAdd = parseInt(input);

    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
        if (input !== null) alert("Vui lòng nhập số nguyên dương!");
        return;
    }

    // Tạo tiền tố (Ví dụ: Lịch sử -> LS)
    const prefix = book.id.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const currentCount = stock.length;

    for (let i = 1; i <= qtyToAdd; i++) {
        const nextIndex = currentCount + i;
        const newCode = `${prefix}-${String(nextIndex).padStart(3, "0")}`;

        stock.push({
            code: newCode,
            barcode: "BC-" + btoa(newCode).slice(0, 10).toUpperCase(),
            status: "available"
        });
    }

    // 6. Cập nhật số lượng (8/10 -> thêm 2 -> 10/12)
    let parts = (book.quantity || "0/0").split("/");
    let a = parseInt(parts[0]) || 0;
    let t = parseInt(parts[1]) || 0;

    book.quantity = `${a + qtyToAdd}/${t + qtyToAdd}`;

    // 7. LƯU TRỮ VÀ ĐỒNG BỘ HÓA
    // Lưu kho hiện tại
    localStorage.setItem(stockKey, JSON.stringify(stock));
    // Lưu sách đang chọn (để hiển thị tại trang này)
    localStorage.setItem("selectedBook", JSON.stringify(book));

    // Đồng bộ ngược lại danh sách tổng (để trang danh sách sách hiện đúng số lượng)
    let allBooks = JSON.parse(localStorage.getItem('due_library_books')) || [];
    let bIndex = allBooks.findIndex(b => b.id === book.id);
    if (bIndex !== -1) {
        allBooks[bIndex].quantity = book.quantity;
        localStorage.setItem('due_library_books', JSON.stringify(allBooks));
    }

    // Cập nhật lại giao diện
    loadInfo();
    renderStock();

    // Thông báo nhỏ (tùy chọn)
    console.log(`Đã thêm ${qtyToAdd} bản sao cho sách ${book.id}`);
}

// Khởi chạy khi tải trang
document.addEventListener("DOMContentLoaded", () => {
    loadInfo();
    renderStock();
});

// Gán hàm vào window để gọi được từ onclick HTML
window.addCopy = addCopy;