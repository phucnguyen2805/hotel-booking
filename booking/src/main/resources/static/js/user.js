let userHotels = [];
let userBookings = [];
let userHistoryPage = 1;
const USER_HISTORY_SIZE = 5;

document.addEventListener("DOMContentLoaded", async () => {
    if (!requireLogin()) return;
    const user = getCurrentUser();
    const name = user.name || user.email || user.userId || "Khách hàng";
    document.getElementById("profileName").textContent = name;
    document.getElementById("profileEmail").textContent = user.email || "";
    document.getElementById("infoName").textContent = name;
    document.getElementById("infoEmail").textContent = user.email || "--";
    document.getElementById("infoId").textContent = user.userId || "--";
    document.getElementById("infoRole").textContent = user.role === "ADMIN" ? "Quản trị viên" : "Khách hàng";
    document.querySelectorAll(".user-tab").forEach(btn => btn.addEventListener("click", () => switchUserTab(btn.dataset.tab)));
    document.getElementById("historyStatusFilter").addEventListener("change", applyUserHistoryFilters);
    document.getElementById("historyPaymentFilter").addEventListener("change", applyUserHistoryFilters);
    document.getElementById("refreshHistory").addEventListener("click", loadUserHistory);
    await Promise.all([loadFavorites(), loadUserHistory()]);
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab === "history" || requestedTab === "favorites" || requestedTab === "profile") { switchUserTab(requestedTab); }
});

function switchUserTab(tab) {
    document.querySelectorAll(".user-tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
    document.querySelectorAll(".user-tab-panel").forEach(p => p.classList.toggle("active", p.id === `tab-${tab}`));
}

async function loadFavorites() {
    const box = document.getElementById("favoriteList");
    const ids = getFavorites();
    document.getElementById("favoriteCount").textContent = ids.length;
    if (!ids.length) { box.innerHTML = `<div class="user-empty"><i class="fa-regular fa-heart"></i><h3>Chưa có khách sạn yêu thích</h3><p>Nhấn biểu tượng trái tim ở trang tìm kiếm để lưu khách sạn.</p><a class="ui-btn ui-btn-primary" href="/search.html">Khám phá khách sạn</a></div>`; return; }
    box.innerHTML = `<div class="user-loading">Đang tải khách sạn...</div>`;
    try {
        const res = await fetch("/hotels/search");
        if (!res.ok) throw new Error("Không thể tải danh sách khách sạn");
        const hotels = await res.json();
        userHotels = Array.isArray(hotels) ? hotels : [];
        const favorites = userHotels.filter(h => ids.includes(String(h.hotelId)));
        if (!favorites.length) { box.innerHTML = `<div class="user-empty"><i class="fa-regular fa-heart"></i><h3>Danh sách yêu thích đang trống</h3><p>Các khách sạn đã lưu có thể đã được thay đổi.</p></div>`; return; }
        box.innerHTML = favorites.map(h => favoriteCard(h)).join("");
    } catch (e) { box.innerHTML = `<div class="user-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>${e.message}</p></div>`; }
}

function favoriteCard(hotel) {
    const stars = Number(hotel.stars || 0);
    return `<article class="favorite-card"><div class="favorite-image" style="background-image:url('${getHotelImage(hotel)}')"><button class="favorite-remove" onclick="removeFavorite('${hotel.hotelId}')" title="Bỏ yêu thích"><i class="fa-solid fa-heart"></i></button></div><div class="favorite-body"><div class="favorite-stars">${"★".repeat(stars)}${"☆".repeat(Math.max(0,5-stars))}</div><h3>${hotel.name || "Chưa có tên"}</h3><p><i class="fa-solid fa-location-dot"></i> ${hotel.city || ""}</p><span>${hotel.address || ""}</span><button class="ui-btn ui-btn-primary favorite-view" onclick="viewHotel('${hotel.hotelId}')">Xem khách sạn</button></div></article>`;
}

async function removeFavorite(id) {
    toggleFavorite(id);
    await loadFavorites();
}

async function loadUserHistory() {
    const id = getCurrentUserId();
    const box = document.getElementById("userBookingList");
    if (!id) return;
    renderSkeletonCards(box, 2);
    try {
        const res = await fetch(`/bookings/guest/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error("Không thể tải lịch sử booking");
        const data = await res.json();
        userBookings = (Array.isArray(data) ? data : []).map(normalizeUserBooking).sort((a,b) => String(b.createdAt || b.checkIn || "").localeCompare(String(a.createdAt || a.checkIn || "")));
        userHistoryPage = 1;
        applyUserHistoryFilters();
    } catch (e) { box.innerHTML = `<div class="user-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>${e.message}</p></div>`; showToast(e.message,"error"); }
}

function normalizeUserBooking(b) {
    const x={...b};
    if(!x.bookingId && x.SK) x.bookingId=String(x.SK).replace(/^BOOKING#/,"");
    x.status=x.status||"unknown"; x.paymentStatus=x.paymentStatus||"unpaid"; return x;
}

function applyUserHistoryFilters() {
    const status=document.getElementById("historyStatusFilter").value;
    const payment=document.getElementById("historyPaymentFilter").value;
    let list=userBookings.filter(b => !status || b.status===status).filter(b => !payment || (payment==="paid" ? b.paymentStatus==="paid" : b.paymentStatus!=="paid"));
    document.getElementById("historyCount").textContent=userBookings.length;
    const total=Math.max(1,Math.ceil(list.length/USER_HISTORY_SIZE));
    userHistoryPage=Math.min(userHistoryPage,total);
    const items=list.slice((userHistoryPage-1)*USER_HISTORY_SIZE,userHistoryPage*USER_HISTORY_SIZE);
    displayUserBookings(items); renderUserPagination(total);
}

function displayUserBookings(items) {
    const box=document.getElementById("userBookingList");
    if(!items.length){box.innerHTML=`<div class="user-empty"><i class="fa-solid fa-inbox"></i><h3>Chưa có booking</h3><p>Đặt phòng đầu tiên của bạn ngay hôm nay.</p><a class="ui-btn ui-btn-primary" href="/search.html">Tìm khách sạn</a></div>`;return;}
    box.innerHTML=items.map(b=>{
        const confirmed=b.status==="confirmed", cancelled=b.status==="cancelled", paid=b.paymentStatus==="paid";
        const status=confirmed?'<span class="status status-confirmed">Đã xác nhận</span>':cancelled?'<span class="status status-cancelled">Đã hủy</span>':b.status==="completed"?'<span class="status status-confirmed">Hoàn tất</span>':'<span class="status">Không xác định</span>';
        let actions=""; if(confirmed&&!paid) actions+=`<button class="action-button pay-button" onclick="location.href='/payment.html?bookingId=${b.bookingId}'"><i class="fa-solid fa-credit-card"></i> Thanh toán</button>`; if(confirmed) actions+=`<button class="action-button cancel-button" onclick="cancelUserBooking('${b.bookingId}')"><i class="fa-solid fa-ban"></i> Hủy</button>`;
        return `<article class="booking-card"><div class="booking-card-header"><div class="booking-id"><i class="fa-solid fa-ticket"></i> ${b.bookingId||"--"}</div>${status}</div><div class="booking-info"><div class="info-item"><div class="info-label">Khách sạn</div><div class="info-value">${b.hotelId||"--"}</div></div><div class="info-item"><div class="info-label">Phòng</div><div class="info-value">${b.roomId||"--"}</div></div><div class="info-item"><div class="info-label">Ngày nhận</div><div class="info-value">${formatUserDate(b.checkIn)}</div></div><div class="info-item"><div class="info-label">Ngày trả</div><div class="info-value">${formatUserDate(b.checkOut)}</div></div><div class="info-item"><div class="info-label">Tổng tiền</div><div class="info-value">${Number(b.total||0).toLocaleString("vi-VN")} đ</div></div><div class="info-item"><div class="info-label">Thanh toán</div><div class="info-value">${paid?"Đã thanh toán":"Chưa thanh toán"}</div></div></div><div class="booking-actions">${actions||'<span class="muted-action">Không có thao tác</span>'}</div></article>`;
    }).join("");
}

function renderUserPagination(total){const el=document.getElementById("userHistoryPagination");if(total<=1){el.innerHTML="";return;}let h=`<button ${userHistoryPage<=1?"disabled":""} onclick="userHistoryPage--;applyUserHistoryFilters()">‹</button>`;for(let i=1;i<=total;i++)h+=`<button class="${i===userHistoryPage?"active":""}" onclick="userHistoryPage=${i};applyUserHistoryFilters()">${i}</button>`;h+=`<button ${userHistoryPage>=total?"disabled":""} onclick="userHistoryPage++;applyUserHistoryFilters()">›</button>`;el.innerHTML=h;}

async function cancelUserBooking(bookingId){
    const ok=await showConfirm("Bạn chắc chắn muốn hủy booking "+bookingId+"?",{title:"Hủy đặt phòng",okText:"Hủy booking",danger:true}); if(!ok)return;
    try{const res=await fetch(`/bookings/${encodeURIComponent(bookingId)}/cancel?guestId=${encodeURIComponent(getCurrentUserId())}`,{method:"PUT"});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||"Hủy booking thất bại");showToast("Đã hủy booking","success");await loadUserHistory();}catch(e){showToast(e.message,"error");}
}

function formatUserDate(v){if(!v)return"--";const p=String(v).split("-");return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:String(v);}

// Xem chi tiết khách sạn từ danh sách yêu thích
function viewHotel(hotelId) {
    if (!hotelId) {
        console.error("Không có mã khách sạn");
        return;
    }

    window.location.href = `/hotel.html?id=${encodeURIComponent(hotelId)}`;
}