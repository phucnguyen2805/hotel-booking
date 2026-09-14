/*
=========================================
LẤY THÔNG TIN TỪ URL
=========================================
*/

const params = new URLSearchParams(window.location.search);

const hotelId = params.get("hotelId");
const roomId = params.get("roomId");
const urlCheckIn = params.get("checkIn");
const urlCheckOut = params.get("checkOut");
const urlMaxGuest = Number(params.get("maxGuest") || 0);

let roomPrice = 0;
let syncingDates = false;

/*
=========================================
KHI TRANG ĐƯỢC MỞ
=========================================
*/

document.addEventListener("DOMContentLoaded", function () {
    if (!requireLogin()) {
        return;
    }

    const user = getCurrentUser();
    const bookingUser = document.getElementById("bookingUser");
    if (bookingUser && user) {
        bookingUser.textContent = user.name || user.email || user.userId;
    }

    document.getElementById("hotelId").textContent = hotelId || "--";
    document.getElementById("roomId").textContent = roomId || "--";

    // Mặc định ngày nhận = hôm nay
    const today = new Date();
    const todayStr = formatDateInput(today);

    if (urlCheckIn) {
        document.getElementById("checkIn").value = urlCheckIn;
    } else {
        document.getElementById("checkIn").value = todayStr;
    }

    if (urlCheckOut) {
        document.getElementById("checkOut").value = urlCheckOut;
        syncNightsFromDates();
    } else {
        // mặc định 2 đêm
        document.getElementById("nights").value = "2";
        onNightsChanged();
    }

    buildGuestOptions();

    const guestsEl = document.getElementById("guests");
    if (guestsEl) {
        guestsEl.addEventListener("change", updateGuestSummary);
        updateGuestSummary();
    }

    loadRoom();
    updateTotal();
});


function formatDateInput(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}


function addDays(dateStr, days) {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + Number(days));
    return formatDateInput(d);
}


function diffNights(checkIn, checkOut) {
    const start = new Date(checkIn + "T00:00:00");
    const end = new Date(checkOut + "T00:00:00");
    return Math.round((end - start) / (1000 * 60 * 60 * 24));
}


/*
=========================================
ĐỒNG BỘ SỐ ĐÊM <-> NGÀY
=========================================
*/

function onNightsChanged() {
    if (syncingDates) return;
    syncingDates = true;

    const checkIn = document.getElementById("checkIn").value;
    const nights = Number(document.getElementById("nights").value || 1);

    if (checkIn && nights > 0) {
        document.getElementById("checkOut").value = addDays(checkIn, nights);
    }

    syncingDates = false;
    updateTotal();
}


function onStayChanged() {
    if (syncingDates) return;
    syncNightsFromDates();
    updateTotal();
}


function syncNightsFromDates() {
    const checkIn = document.getElementById("checkIn").value;
    const checkOut = document.getElementById("checkOut").value;
    if (!checkIn || !checkOut) return;

    const nights = diffNights(checkIn, checkOut);
    if (nights <= 0) return;

    const select = document.getElementById("nights");
    // nếu option chưa có thì thêm
    let found = false;
    for (const opt of select.options) {
        if (Number(opt.value) === nights) {
            found = true;
            break;
        }
    }
    if (!found) {
        const opt = document.createElement("option");
        opt.value = String(nights);
        opt.textContent = `${nights} đêm`;
        select.appendChild(opt);
    }

    syncingDates = true;
    select.value = String(nights);
    syncingDates = false;
}



function buildGuestOptions() {
    const select = document.getElementById("guests");
    if (!select) return;

    let maxGuest = urlMaxGuest;
    if (!maxGuest || maxGuest < 1) {
        maxGuest = 6;
    }

    const current = Number(select.value || 2);
    select.innerHTML = "";

    for (let i = 1; i <= maxGuest; i++) {
        const opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = i + " người";
        if (i === Math.min(current, maxGuest) || (i === 2 && current > maxGuest && maxGuest >= 2)) {
            opt.selected = true;
        }
        select.appendChild(opt);
    }

    // mặc định chọn min(2, maxGuest)
    if (!select.value) {
        select.value = String(Math.min(2, maxGuest));
    }

    updateGuestSummary();
}

function updateGuestSummary() {
    const guests = document.getElementById("guests")?.value || "2";
    const el = document.getElementById("numberOfGuests");
    if (el) {
        el.textContent = `${guests} người`;
    }
}


/*
=========================================
LẤY THÔNG TIN PHÒNG
=========================================
*/

async function loadRoom() {
    if (!hotelId || !roomId) {
        return;
    }

    try {
        const response = await fetch(`/hotels/${hotelId}/rooms`);

        if (!response.ok) {
            throw new Error("Không thể tải phòng");
        }

        const rooms = await response.json();
        const room = rooms.find(r => getRoomId(r) === roomId);

        if (!room) {
            document.getElementById("roomPrice").textContent = "Không tìm thấy";
            return;
        }

        roomPrice = Number(room.price || 0);

        if (room.maxGuest) {
            // cập nhật giới hạn khách theo phòng
            const mg = Number(room.maxGuest) || 1;
            const select = document.getElementById("guests");
            if (select) {
                const cur = Number(select.value || 1);
                select.innerHTML = "";
                for (let i = 1; i <= mg; i++) {
                    const opt = document.createElement("option");
                    opt.value = String(i);
                    opt.textContent = i + " người";
                    if (i === Math.min(cur, mg)) opt.selected = true;
                    select.appendChild(opt);
                }
                updateGuestSummary();
            }
        }
        document.getElementById("roomPrice").textContent =
            formatMoney(roomPrice) + " đ / đêm";

        updateTotal();

    } catch (error) {
        console.error(error);
        showToast("Không thể tải thông tin phòng.", "error");
    }
}


function getRoomId(room) {
    return room.roomId || room.id || room.SK?.replace("ROOM#", "") || "";
}


/*
=========================================
TÍNH TỔNG TIỀN
=========================================
*/

function updateTotal() {
    const checkIn = document.getElementById("checkIn").value;
    const checkOut = document.getElementById("checkOut").value;
    updateGuestSummary();

    if (!checkIn || !checkOut) {
        document.getElementById("numberOfNights").textContent = "--";
        document.getElementById("totalPrice").textContent = "0 đ";
        return;
    }

    const nights = diffNights(checkIn, checkOut);

    if (nights <= 0) {
        document.getElementById("numberOfNights").textContent = "Không hợp lệ";
        document.getElementById("totalPrice").textContent = "0 đ";
        return;
    }

    const total = nights * roomPrice;

    document.getElementById("numberOfNights").textContent = `${nights} đêm`;
    document.getElementById("totalPrice").textContent = formatMoney(total) + " đ";
}


function formatMoney(value) {
    return Number(value || 0).toLocaleString("vi-VN");
}


function goBack() {
    if (hotelId) {
        window.location.href = `/hotel.html?id=${hotelId}`;
    } else {
        window.location.href = "/search.html";
    }
}


/*
=========================================
TẠO BOOKING
=========================================
*/

async function createBooking() {
    const user = getCurrentUser();

    if (!user) {
        showToast("Vui lòng đăng nhập.", "warning");
        return;
    }

    const guestId = user.userId;
    const checkIn = document.getElementById("checkIn").value;
    const checkOut = document.getElementById("checkOut").value;
    const guests = Number(document.getElementById("guests")?.value || 1);
    const message = document.getElementById("bookingMessage");

    message.className = "booking-message";
    message.textContent = "";

    if (!guestId) {
        showToast("Vui lòng đăng nhập lại.", "error");
        return;
    }

    if (!hotelId || !roomId) {
        showToast("Thiếu thông tin khách sạn hoặc phòng.", "error");
        return;
    }

    if (!checkIn || !checkOut) {
        showToast("Vui lòng chọn ngày nhận và ngày trả.", "warning");
        return;
    }

    if (checkIn >= checkOut) {
        showToast("Ngày trả phòng phải sau ngày nhận phòng.", "warning");
        return;
    }

    const today = formatDateInput(new Date());
    if (checkIn < today) {
        showToast("Ngày nhận phòng không được trong quá khứ.", "warning");
        return;
    }

    const nights = diffNights(checkIn, checkOut);
    const total = nights * roomPrice;

    const bookingData = {
        guestId: guestId,
        hotelId: hotelId,
        roomId: roomId,
        checkIn: checkIn,
        checkOut: checkOut,
        total: total
    };

    console.log("Booking request:", bookingData);

    try {
        const response = await fetch("/bookings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bookingData)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.message || "Đặt phòng thất bại");
        }

        message.className = "booking-message booking-success";
        message.textContent = "Đặt phòng thành công!";
        showToast("Đặt phòng thành công!", "success");

        const bookingId = result.bookingId || "";
        const guestsVal = document.getElementById("guests")?.value || "1";
        setTimeout(function () {
            const q = new URLSearchParams({
                bookingId,
                hotelId: hotelId || "",
                roomId: roomId || "",
                checkIn: checkIn || "",
                checkOut: checkOut || "",
                guests: guestsVal,
                total: String(total || 0)
            });
            window.location.href = "/success.html?" + q.toString();
        }, 700);

    } catch (error) {
        console.error(error);
        message.className = "booking-message booking-error";
        message.textContent = error.message;
        showToast(error.message, "error");
    }
}
