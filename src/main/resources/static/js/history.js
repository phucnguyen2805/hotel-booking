let allHistoryBookings = [];
let historyPage = 1;
const HISTORY_PAGE_SIZE = 5;

document.addEventListener("DOMContentLoaded", function () {
    if (!requireLogin()) return;
    const user = getCurrentUser();
    const historyUser = document.getElementById("historyUser");
    if (historyUser) historyUser.textContent = user.name || user.email || user.userId;
    loadBookings();
});

async function loadBookings() {
    const guestId = getCurrentUserId();
    const container = document.getElementById("bookingList");
    if (!guestId) {
        showToast("Vui lòng đăng nhập lại.", "warning");
        return;
    }
    renderSkeletonCards(container, 2);

    try {
        const response = await fetch(`/bookings/guest/${encodeURIComponent(guestId)}`);
        if (!response.ok) throw new Error("Không thể tải lịch sử booking");
        let bookings = await response.json();
        if (!Array.isArray(bookings)) bookings = [];
        allHistoryBookings = bookings.map(normalizeBooking)
            .sort((a, b) => String(b.createdAt || b.checkIn || "").localeCompare(String(a.createdAt || a.checkIn || "")));
        historyPage = 1;
        applyHistoryFilters();
    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="empty-message"><i class="fa-solid fa-triangle-exclamation"></i><p>${error.message}</p></div>`;
        showToast(error.message, "error");
    }
}

function normalizeBooking(booking) {
    const b = { ...booking };
    if (!b.bookingId && b.SK) b.bookingId = String(b.SK).replace(/^BOOKING#/, "");
    if (!b.guestId && b.PK) b.guestId = String(b.PK).replace(/^GUEST#/, "");
    b.status = b.status || "unknown";
    b.paymentStatus = b.paymentStatus || "unpaid";
    return b;
}

function applyHistoryFilters() {
    const status = document.getElementById("historyStatusFilter")?.value || "";
    const payment = document.getElementById("historyPaymentFilter")?.value || "";
    let list = [...allHistoryBookings];
    if (status) list = list.filter(b => b.status === status);
    if (payment === "paid") list = list.filter(b => b.paymentStatus === "paid");
    if (payment === "unpaid") list = list.filter(b => b.paymentStatus !== "paid");

    const count = document.getElementById("bookingCount");
    if (count) count.textContent = `${list.length} booking`;

    const totalPages = Math.max(1, Math.ceil(list.length / HISTORY_PAGE_SIZE));
    if (historyPage > totalPages) historyPage = totalPages;
    const start = (historyPage - 1) * HISTORY_PAGE_SIZE;
    const pageItems = list.slice(start, start + HISTORY_PAGE_SIZE);
    displayBookings(pageItems);
    renderHistoryPagination(totalPages);
}

function renderHistoryPagination(totalPages) {
    const el = document.getElementById("historyPagination");
    if (!el) return;
    if (totalPages <= 1) { el.innerHTML = ""; return; }
    let html = `<button ${historyPage <= 1 ? "disabled" : ""} onclick="historyPage--;applyHistoryFilters()">&lt;</button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === historyPage ? "active" : ""}" onclick="historyPage=${i};applyHistoryFilters()">${i}</button>`;
    }
    html += `<button ${historyPage >= totalPages ? "disabled" : ""} onclick="historyPage++;applyHistoryFilters()">&gt;</button>`;
    el.innerHTML = html;
}

function displayBookings(bookings) {
    const container = document.getElementById("bookingList");
    if (!bookings.length) {
        container.innerHTML = `<div class="empty-message"><i class="fa-solid fa-inbox"></i><p>Không có booking phù hợp bộ lọc.</p></div>`;
        return;
    }
    container.innerHTML = "";
    bookings.forEach(booking => {
        const status = booking.status || "unknown";
        const isConfirmed = status === "confirmed";
        const isPaid = booking.paymentStatus === "paid";
        const isCancelled = status === "cancelled";
        let statusClass = "status-pending";
        let statusText = '<i class="fa-solid fa-circle-question"></i> Không xác định';
        if (isConfirmed) { statusClass = "status-confirmed"; statusText = '<i class="fa-solid fa-circle-check"></i> Đã xác nhận'; }
        else if (isCancelled) { statusClass = "status-cancelled"; statusText = '<i class="fa-solid fa-circle-xmark"></i> Đã hủy'; }
        else if (status === "completed") { statusClass = "status-confirmed"; statusText = '<i class="fa-solid fa-flag-checkered"></i> Hoàn tất'; }

        let actions = "";
        if (isConfirmed && !isPaid) {
            actions += `<button class="action-button pay-button" onclick="location.href='/payment.html?bookingId=${booking.bookingId}'"><i class="fa-solid fa-credit-card"></i> Thanh toán</button>`;
        }
        if (isConfirmed) {
            actions += `<button class="action-button cancel-button" onclick="cancelBooking('${booking.bookingId}')"><i class="fa-solid fa-ban"></i> Hủy</button>`;
        }

        const card = document.createElement("div");
        card.className = "booking-card";
        card.innerHTML = `
            <div class="booking-card-header">
                <div class="booking-id"><i class="fa-solid fa-ticket"></i> ${booking.bookingId || "--"}</div>
                <div class="status ${statusClass}">${statusText}</div>
            </div>
            <div class="booking-info">
                <div class="info-item"><div class="info-label">Khách sạn</div><div class="info-value">${booking.hotelId || "--"}</div></div>
                <div class="info-item"><div class="info-label">Phòng</div><div class="info-value">${booking.roomId || "--"}</div></div>
                <div class="info-item"><div class="info-label">Ngày nhận</div><div class="info-value">${formatDate(booking.checkIn)}</div></div>
                <div class="info-item"><div class="info-label">Ngày trả</div><div class="info-value">${formatDate(booking.checkOut)}</div></div>
                <div class="info-item"><div class="info-label">Tổng tiền</div><div class="info-value">${formatMoney(booking.total)} đ</div></div>
                <div class="info-item"><div class="info-label">Thanh toán</div><div class="info-value">${isPaid ? "Đã thanh toán" : "Chưa thanh toán"}</div></div>
            </div>
            <div class="booking-actions">${actions || '<span class="muted-action">Không có thao tác</span>'}</div>
        `;
        container.appendChild(card);
    });
}

async function payBooking(bookingId) {
    const ok = await showConfirm("Xác nhận thanh toán booking " + bookingId + "?", {
        title: "Thanh toán",
        okText: "Thanh toán",
        danger: false
    });
    if (!ok) return;
    const guestId = getCurrentUserId();
    try {
        const response = await fetch(`/bookings/${encodeURIComponent(bookingId)}/pay?guestId=${encodeURIComponent(guestId)}`, { method: "PUT" });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Thanh toán thất bại");
        showToast("Thanh toán thành công", "success");
        await loadBookings();
    } catch (error) {
        showToast(error.message, "error");
    }
}

async function cancelBooking(bookingId) {
    const ok = await showConfirm("Bạn chắc chắn muốn hủy booking " + bookingId + "?", {
        title: "Hủy đặt phòng",
        okText: "Hủy booking",
        danger: true
    });
    if (!ok) return;
    const guestId = getCurrentUserId();
    try {
        const response = await fetch(`/bookings/${encodeURIComponent(bookingId)}/cancel?guestId=${encodeURIComponent(guestId)}`, { method: "PUT" });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Hủy booking thất bại");
        showToast("Đã hủy booking", "success");
        await loadBookings();
    } catch (error) {
        showToast(error.message, "error");
    }
}

function formatMoney(value) {
    return Number(value || 0).toLocaleString("vi-VN");
}
function formatDate(date) {
    if (!date) return "--";
    const parts = String(date).split("-");
    if (parts.length !== 3) return date;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
