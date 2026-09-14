/*
==================================================
QUẢN LÝ TÀI KHOẢN ĐĂNG NHẬP
==================================================
*/

const AUTH_KEY = "hotelBookingUser";


/*
==================================================
LƯU TÀI KHOẢN
==================================================
*/

function saveUser(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}


/*
==================================================
LẤY TÀI KHOẢN ĐANG ĐĂNG NHẬP
==================================================
*/

function getCurrentUser() {
    const data = localStorage.getItem(AUTH_KEY);

    if (!data) {
        return null;
    }

    try {
        return JSON.parse(data);
    } catch (error) {
        console.error("Lỗi đọc tài khoản:", error);
        return null;
    }
}


/*
==================================================
KIỂM TRA ĐÃ ĐĂNG NHẬP CHƯA
==================================================
*/

function isLoggedIn() {
    return getCurrentUser() !== null;
}


/*
==================================================
LẤY USER ID
==================================================
*/

function getCurrentUserId() {
    const user = getCurrentUser();
    return user ? user.userId : null;
}


/*
==================================================
LẤY ROLE
==================================================
*/

function getCurrentUserRole() {
    const user = getCurrentUser();
    return user ? user.role : null;
}


/*
==================================================
ĐĂNG XUẤT
==================================================
*/

function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = "/login.html";
}


/*
==================================================
BẮT BUỘC ĐĂNG NHẬP
==================================================
*/

function requireLogin() {
    if (!isLoggedIn()) {
        showToast("Vui lòng đăng nhập để sử dụng chức năng này.", "warning");
        setTimeout(function () {
            window.location.href = "/login.html";
        }, 800);
        return false;
    }
    return true;
}


/*
==================================================
HIỂN THỊ HEADER THEO TÀI KHOẢN
==================================================
*/

function updateAuthUI() {
    const user = getCurrentUser();

    const adminLink = document.getElementById("adminLink");
    const loginLink = document.getElementById("loginLink");
    const userInfo = document.getElementById("userInfo");
    const logoutButton = document.getElementById("logoutButton");
    const accountLink = document.getElementById("accountLink");

    if (adminLink) {
        if (user && user.role === "ADMIN") {
            adminLink.style.display = "inline-flex";
        } else {
            adminLink.style.display = "none";
        }
    }

    if (user) {
        if (accountLink) { accountLink.style.display = "inline-flex"; }
        if (loginLink) {
            loginLink.style.display = "none";
        }

        if (userInfo) {
            const name = user.name || user.email || user.userId;
            userInfo.textContent = `Xin chào, ${name}`;
            userInfo.style.display = "inline-flex";
        }

        if (logoutButton) {
            logoutButton.style.display = "inline-flex";
        }
    } else {
        if (accountLink) { accountLink.style.display = "none"; }
        if (loginLink) {
            loginLink.style.display = "inline-flex";
        }

        if (userInfo) {
            userInfo.style.display = "none";
        }

        if (logoutButton) {
            logoutButton.style.display = "none";
        }
    }
}


/*
==================================================
CHẠY KHI TRANG ĐƯỢC MỞ
==================================================
*/

document.addEventListener("DOMContentLoaded", function () {
    updateAuthUI();
    setupMobileNavigation();

    // Smooth page fade-in
    document.body.classList.add("page-loaded");
});


/*
==================================================
TOAST NOTIFICATION (hiện đại, thay alert)
==================================================
*/

function ensureToastContainer() {
    let el = document.getElementById("toast-container");
    if (!el) {
        el = document.createElement("div");
        el.id = "toast-container";
        document.body.appendChild(el);
    }
    return el;
}

function showToast(message, type = "info", duration = 3200) {
    const container = ensureToastContainer();

    const icons = {
        success: "fa-solid fa-check",
        error: "fa-solid fa-xmark",
        info: "fa-solid fa-circle-info",
        warning: "fa-solid fa-triangle-exclamation"
    };

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="${icons[type] || icons.info}"></i></div>
        <div class="toast-body">${message}</div>
        <button class="toast-close" aria-label="Đóng">&times;</button>
    `;

    const remove = () => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 250);
    };

    toast.querySelector(".toast-close").onclick = remove;
    container.appendChild(toast);

    if (duration > 0) {
        setTimeout(remove, duration);
    }

    return toast;
}

// Tương thích code cũ gọi alert
window._nativeAlert = window.alert;
window.alert = function (msg) {
    showToast(String(msg), "info");
};


/*
==================================================
MODAL XÁC NHẬN HIỆN ĐẠI
==================================================
*/
function showConfirm(message, options = {}) {
    return new Promise((resolve) => {
        const title = options.title || "Xác nhận";
        const okText = options.okText || "Đồng ý";
        const cancelText = options.cancelText || "Hủy";
        const danger = options.danger !== false;

        const overlay = document.createElement("div");
        overlay.className = "ui-modal-overlay";
        overlay.innerHTML = `
            <div class="ui-modal" role="dialog">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="ui-modal-actions">
                    <button type="button" class="ui-btn ui-btn-ghost" data-act="cancel">${cancelText}</button>
                    <button type="button" class="ui-btn ${danger ? "ui-btn-danger" : "ui-btn-primary"}" data-act="ok">${okText}</button>
                </div>
            </div>
        `;

        const close = (val) => {
            overlay.remove();
            resolve(val);
        };

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) close(false);
        });
        overlay.querySelector('[data-act="cancel"]').onclick = () => close(false);
        overlay.querySelector('[data-act="ok"]').onclick = () => close(true);
        document.body.appendChild(overlay);
    });
}

/*
==================================================
HOTEL IMAGE PLACEHOLDER
==================================================
*/
function getHotelImage(hotel) {
    // Ảnh demo cố định theo khách sạn để luôn đúng chủ đề Hotel Booking.
    // Khi muốn dùng ảnh riêng từ DynamoDB, có thể bỏ phần map này và ưu tiên imageUrl.
    const id = String(hotel?.hotelId || "").toUpperCase();
    const images = {
        "H01": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
        "H02": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=85",
        "H03": "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=85",
        "H04": "https://images.unsplash.com/photo-1601918774946-25832a4e3d7a?auto=format&fit=crop&w=1200&q=85"
    };
    return images[id] || images.H01;
}

function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h |= 0;
    }
    return h;
}

function getRoomImage(room, hotelId) {
    // Không dùng imageUrl cũ nếu nó trỏ nhầm ảnh (ví dụ ảnh rau củ).
    // Map theo mã phòng giúp demo luôn hiển thị đúng ảnh phòng ngủ.
    const id = String(room?.roomId || room?.id || "").toUpperCase();
    const byRoom = {
        "R101": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=85",
        "R102": "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1000&q=85",
        "R103": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=85",
        "R201": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=85",
        "R202": "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1000&q=85"
    };
    if (byRoom[id]) return byRoom[id];
    const type = String(room?.type || "").toLowerCase();
    if (type.includes("deluxe")) return byRoom.R101;
    if (type.includes("superior")) return byRoom.R102;
    return byRoom.R201;
}

/*
==================================================
CSV EXPORT
==================================================
*/
function exportToCsv(filename, rows) {
    if (!rows || !rows.length) {
        showToast("Không có dữ liệu để xuất", "warning");
        return;
    }
    const headers = Object.keys(rows[0]);
    const escape = (v) => {
        const s = String(v ?? "");
        if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
    };
    const lines = [headers.join(",")];
    rows.forEach(r => lines.push(headers.map(h => escape(r[h])).join(",")));
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Đã xuất file CSV", "success");
}

/*
==================================================
SKELETON HELPERS
==================================================
*/
function renderSkeletonCards(container, count = 3) {
    if (!container) return;
    container.innerHTML = Array.from({ length: count }).map(() =>
        `<div class="skeleton skeleton-card"></div>`
    ).join("");
}

function renderSkeletonRows(container, count = 5) {
    if (!container) return;
    container.innerHTML = Array.from({ length: count }).map(() =>
        `<div class="skeleton skeleton-row"></div>`
    ).join("");
}

function getToken() {
    const user = getCurrentUser();
    return user && user.token ? user.token : localStorage.getItem("token");
}

function authHeaders(extra = {}) {
    const headers = { ...extra };
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;
    return headers;
}

function getFavorites() {
    const user = getCurrentUser();
    const key = user?.userId ? `hotelFavorites:${user.userId}` : "favorites";
    try {
        let raw = localStorage.getItem(key);
        // Chuyển danh sách yêu thích cũ sang tài khoản hiện tại một lần.
        if (!raw && user?.userId) {
            const legacy = JSON.parse(localStorage.getItem("favorites") || "[]");
            if (Array.isArray(legacy) && legacy.length) {
                localStorage.setItem(key, JSON.stringify(legacy));
                raw = JSON.stringify(legacy);
            }
        }
        const current = JSON.parse(raw || "[]");
        return Array.isArray(current) ? current.map(String) : [];
    } catch { return []; }
}

function toggleFavorite(hotelId) {
    const user = getCurrentUser();
    if (!user) {
        showToast("Vui lòng đăng nhập để lưu khách sạn yêu thích.", "warning");
        setTimeout(() => { window.location.href = "/login.html"; }, 500);
        return false;
    }
    const key = `hotelFavorites:${user.userId}`;
    let fav = getFavorites();
    hotelId = String(hotelId);
    if (fav.includes(hotelId)) fav = fav.filter(id => id !== hotelId);
    else fav.push(hotelId);
    localStorage.setItem(key, JSON.stringify(fav));
    showToast(fav.includes(hotelId) ? "Đã thêm vào yêu thích" : "Đã bỏ khỏi yêu thích", "success");
    return fav.includes(hotelId);
}

function isFavorite(hotelId) {
    return getFavorites().includes(String(hotelId));
}

function pushRecent(hotelId) {
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem("recentHotels") || "[]"); } catch {}
    recent = [hotelId, ...recent.filter(id => id !== hotelId)].slice(0, 8);
    localStorage.setItem("recentHotels", JSON.stringify(recent));
}

function setupMobileNavigation() {
    const header = document.querySelector(".header");
    const nav = header?.querySelector("nav");
    if (!header || !nav || header.querySelector(".mobile-nav-toggle")) return;
    const btn = document.createElement("button");
    btn.className = "mobile-nav-toggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "Mở menu");
    btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    btn.addEventListener("click", () => {
        nav.classList.toggle("mobile-open");
        btn.innerHTML = nav.classList.contains("mobile-open") ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
    header.appendChild(btn);
    nav.addEventListener("click", (e) => {
        if (e.target.closest("a")) { nav.classList.remove("mobile-open"); btn.innerHTML = '<i class="fa-solid fa-bars"></i>'; }
    });
}

// Đăng ký Service Worker trên mọi trang để cập nhật giao diện ổn định hơn.
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js?v=5').catch(function () {});
    });
}
