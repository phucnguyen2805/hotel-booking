let lastRevenueData = null;
let lastAdminBookings = [];
let cachedHotels = [];
let cachedRoomsList = [];
let cachedBookingsList = [];

/*
==================================================
ADMIN DASHBOARD
==================================================
*/


let hotels = [];

let editingHotelId = null;

let editingRoomId = null;


/*
==================================================
KIỂM TRA ADMIN
==================================================
*/

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        if (!requireLogin()) {
            return;
        }


        const user =
            getCurrentUser();


        if (!user ||
            user.role !== "ADMIN") {

            showToast("Bạn không có quyền truy cập trang Admin.", "error");
            window.location.href =
                "/search.html";

            return;
        }


        document.getElementById(
            "adminName"
        ).textContent =
            user.name ||
            user.email;


        /*
        ==========================================
        LOAD DỮ LIỆU
        ==========================================
        */

        await loadHotels();

        await loadDashboard();


        /*
        ==========================================
        MẶC ĐỊNH THÁNG HIỆN TẠI
        ==========================================
        */

        const now =
            new Date();

        const month =
            now.toISOString()
                .slice(0, 7);

        document.getElementById(
            "revenueMonth"
        ).value = month;

    }
);


/*
==================================================
LẤY ADMIN USER ID
==================================================
*/

function getAdminId() {

    return getCurrentUserId();

}


/*
==================================================
CHUYỂN SECTION
==================================================
*/

function showSection(
    sectionId,
    button
) {

    document
        .querySelectorAll(".admin-section")
        .forEach(section => {
            section.classList.remove("active");
        });

    document
        .querySelectorAll(".menu-item")
        .forEach(item => {
            item.classList.remove("active");
        });

    const section =
        document.getElementById(sectionId);

    if (section) {
        section.classList.add("active");
    }

    if (button) {
        button.classList.add("active");
    }

    // ==========================================
    // ĐỔI TIÊU ĐỀ HEADER THEO TRANG
    // ==========================================

    const titles = {

        dashboard:
            "Tổng quan",

        hotels:
            "Quản lý khách sạn",

        rooms:
            "Quản lý phòng",

        bookings:
            "Quản lý Booking",

        revenue:
            "Doanh thu",

        users:
            "Quản lý người dùng",

        audit:
            "Nhật ký thao tác",

        backup:
            "Backup / Restore"

    };

    const pageTitle =
        document.getElementById("pageTitle");

    if (pageTitle) {

        pageTitle.textContent =
            titles[sectionId] ||
            "Admin";

    }


    /*
    ==========================================
    LOAD DỮ LIỆU THEO SECTION
    ==========================================
    */

    if (sectionId === "hotels") {

        loadHotels();

    }


    if (sectionId === "rooms") {

        loadHotels();

        loadRooms();

    }


    if (sectionId === "revenue") {

        loadRevenueHotels();

        loadDashboardOverview();

    }


    if (sectionId === "bookings") {

        loadAdminBookings();

    }


    if (sectionId === "users") {

        loadAdminUsers();

    }

}


/*
==================================================
MỞ SECTION TỪ QUICK ACTION
==================================================
*/

function openSection(
    sectionId
) {

    const button =
        document.querySelector(
            `.menu-item[onclick*="'${sectionId}'"]`
        );


    showSection(
        sectionId,
        button
    );

}


/*
==================================================
LOAD HOTELS
==================================================
*/

async function loadHotels() {

    try {

        const response =
            await fetch(
                "/hotels"
            );


        if (!response.ok) {

            throw new Error(
                "Không thể tải danh sách khách sạn"
            );

        }


        hotels =
            await response.json();


        renderHotels();

        populateHotelSelects();


    } catch (error) {

        console.error(error);

        showMessage(
            "hotelMessage",
            error.message,
            false
        );

    }

}


/*
==================================================
HIỂN THỊ HOTELS
==================================================
*/

function renderHotels() {

    const table =
        document.getElementById(
            "hotelTable"
        );


    table.innerHTML = "";


    if (!hotels.length) {

        table.innerHTML = `
            <tr>
                <td colspan="6"
                    style="text-align:center">

                    Chưa có khách sạn

                </td>
            </tr>
        `;

        return;
    }


    hotels.forEach(
        hotel => {

            const id =
                hotel.hotelId ||
                hotel.id ||
                "";


            const name =
                hotel.name ||
                "";


            const city =
                hotel.city ||
                "";


            const address =
                hotel.address ||
                "";


            const stars =
                hotel.stars ||
                "";


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    <strong>${escapeHtml(id)}</strong>
                </td>

                <td>
                    ${escapeHtml(name)}
                </td>

                <td>
                    ${escapeHtml(city)}
                </td>

                <td>
                    ${escapeHtml(address)}
                </td>

                <td>
                    ${"".repeat(Number(stars))}
                </td>

                <td>

                    <div class="action-buttons">

                        <button
                            class="edit-button"
                            onclick="editHotel('${escapeAttr(id)}')">

                            ️ Sửa

                        </button>

                        <button
                            class="delete-button"
                            onclick="deleteHotel('${escapeAttr(id)}')">

                            ️ Xóa

                        </button>

                    </div>

                </td>
            `;


            table.appendChild(row);

        }
    );

}


/*
==================================================
HOTEL MODAL
==================================================
*/

function openHotelModal(
    hotel = null
) {

    const modal =
        document.getElementById(
            "hotelModal"
        );


    modal.classList.add(
        "show"
    );


    if (hotel) {

        editingHotelId =
            hotel.hotelId ||
            hotel.id;


        document.getElementById(
            "hotelModalTitle"
        ).textContent =
            "Sửa khách sạn";


        document.getElementById(
            "hotelId"
        ).value =
            editingHotelId;


        document.getElementById(
            "hotelId"
        ).disabled = true;


        document.getElementById(
            "hotelName"
        ).value =
            hotel.name || "";


        document.getElementById(
            "hotelCity"
        ).value =
            hotel.city || "";


        document.getElementById(
            "hotelAddress"
        ).value =
            hotel.address || "";


        document.getElementById(
            "hotelStars"
        ).value =
            hotel.stars || 5;

    } else {

        editingHotelId =
            null;


        document.getElementById(
            "hotelModalTitle"
        ).textContent =
            "Thêm khách sạn";


        document.getElementById(
            "hotelId"
        ).disabled = false;


        clearHotelForm();

    }

}


function closeHotelModal() {

    document
        .getElementById(
            "hotelModal"
        )
        .classList.remove(
            "show"
        );

}


function clearHotelForm() {

    document.getElementById(
        "hotelId"
    ).value = "";


    document.getElementById(
        "hotelName"
    ).value = "";


    document.getElementById(
        "hotelCity"
    ).value = "";


    document.getElementById(
        "hotelAddress"
    ).value = "";


    document.getElementById(
        "hotelStars"
    ).value = 5;

}


/*
==================================================
SỬA HOTEL
==================================================
*/

function editHotel(
    hotelId
) {

    const hotel =
        hotels.find(
            h =>
                (h.hotelId || h.id) === hotelId
        );


    if (!hotel) {

        showToast("Không tìm thấy khách sạn", "error");
        return;
    }


    openHotelModal(
        hotel
    );

}


/*
==================================================
LƯU HOTEL
==================================================
*/

async function saveHotel() {

    const hotelId =
        document.getElementById(
            "hotelId"
        ).value.trim();


    const name =
        document.getElementById(
            "hotelName"
        ).value.trim();


    const city =
        document.getElementById(
            "hotelCity"
        ).value.trim();


    const address =
        document.getElementById(
            "hotelAddress"
        ).value.trim();


    const stars =
        Number(
            document.getElementById(
                "hotelStars"
            ).value
        );


    if (!hotelId ||
        !name ||
        !city ||
        !address) {

        showToast("Vui lòng nhập đầy đủ thông tin.", "error");
        return;
    }


    const userId =
        getAdminId();


    const body = {

        hotelId,
        name,
        city,
        address,
        stars

    };


    try {

        let response;


        if (editingHotelId) {

            response =
                await fetch(
                    `/admin/hotels/${encodeURIComponent(editingHotelId)}?userId=${encodeURIComponent(userId)}`,
                    {

                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(body)

                    }
                );

        } else {

            response =
                await fetch(
                    `/admin/hotels?userId=${encodeURIComponent(userId)}`,
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(body)

                    }
                );

        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Không thể lưu khách sạn"
            );

        }


        closeHotelModal();


        showMessage(
            "hotelMessage",
            editingHotelId
                ? " Cập nhật khách sạn thành công"
                : " Thêm khách sạn thành công",
            true
        );


        editingHotelId =
            null;


        await loadHotels();


    } catch (error) {

        console.error(error);

        showToast(error.message, "error");
    }

}


/*
==================================================
XÓA HOTEL
==================================================
*/

async function deleteHotel(
    hotelId
) {

    if (!confirm(
        `Bạn có chắc muốn xóa khách sạn ${hotelId}?`
    )) {

        return;
    }


    try {

        const response =
            await fetch(
                `/admin/hotels/${encodeURIComponent(hotelId)}?userId=${encodeURIComponent(getAdminId())}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Xóa khách sạn thất bại"
            );

        }


        showMessage(
            "hotelMessage",
            " Xóa khách sạn thành công",
            true
        );


        await loadHotels();


    } catch (error) {

        showToast(error.message, "error");
    }

}


/*
==================================================
POPULATE HOTEL SELECT
==================================================
*/

function populateHotelSelects() {

    const roomFilter =
        document.getElementById(
            "roomHotelFilter"
        );


    const roomHotelId =
        document.getElementById(
            "roomHotelId"
        );


    const revenueHotel =
        document.getElementById(
            "revenueHotel"
        );


    roomFilter.innerHTML =
        `<option value="">
            -- Tất cả khách sạn --
         </option>`;


    roomHotelId.innerHTML =
        "";


    revenueHotel.innerHTML =
        "";


    hotels.forEach(
        hotel => {

            const id =
                hotel.hotelId ||
                hotel.id;


            const name =
                hotel.name ||
                id;


            roomFilter.innerHTML += `
                <option value="${escapeAttr(id)}">
                    ${escapeHtml(id)} - ${escapeHtml(name)}
                </option>
            `;


            roomHotelId.innerHTML += `
                <option value="${escapeAttr(id)}">
                    ${escapeHtml(id)} - ${escapeHtml(name)}
                </option>
            `;


            revenueHotel.innerHTML += `
                <option value="${escapeAttr(id)}">
                    ${escapeHtml(id)} - ${escapeHtml(name)}
                </option>
            `;

        }
    );

}


/*
==================================================
ROOM MODAL
==================================================
*/

function openRoomModal(
    room = null
) {

    const modal =
        document.getElementById(
            "roomModal"
        );


    modal.classList.add(
        "show"
    );


    if (room) {

        editingRoomId =
            room.roomId;


        document.getElementById(
            "roomModalTitle"
        ).textContent =
            "Sửa phòng";


        document.getElementById(
            "roomHotelId"
        ).value =
            room.hotelId;


        document.getElementById(
            "roomHotelId"
        ).disabled = true;


        document.getElementById(
            "roomId"
        ).value =
            room.roomId;


        document.getElementById(
            "roomId"
        ).disabled = true;


        document.getElementById(
            "roomType"
        ).value =
            room.type || "";


        document.getElementById(
            "roomPrice"
        ).value =
            room.price || "";


        document.getElementById(
            "roomMaxGuest"
        ).value =
            room.maxGuest || 2;

    } else {

        editingRoomId =
            null;


        document.getElementById(
            "roomModalTitle"
        ).textContent =
            "Thêm phòng";


        document.getElementById(
            "roomHotelId"
        ).disabled = false;


        document.getElementById(
            "roomId"
        ).disabled = false;


        document.getElementById(
            "roomHotelId"
        ).value =
            hotels.length
                ? (hotels[0].hotelId || hotels[0].id)
                : "";


        clearRoomForm();

    }

}


function closeRoomModal() {

    document
        .getElementById(
            "roomModal"
        )
        .classList.remove(
            "show"
        );

}


function clearRoomForm() {

    document.getElementById(
        "roomId"
    ).value = "";


    document.getElementById(
        "roomType"
    ).value = "";


    document.getElementById(
        "roomPrice"
    ).value = "";


    document.getElementById(
        "roomMaxGuest"
    ).value = 2;

}


/*
==================================================
LOAD ROOMS
==================================================
*/

async function loadRooms() {

    const hotelId =
        document.getElementById(
            "roomHotelFilter"
        ).value;


    const table =
        document.getElementById(
            "roomTable"
        );


    table.innerHTML = `
        <tr>
            <td colspan="7"
                style="text-align:center">

                Đang tải...

            </td>
        </tr>
    `;


    try {

        let rooms = [];


        if (hotelId) {

            rooms =
                await getRoomsByHotel(
                    hotelId
                );

        } else {

            /*
            ======================================
            Nếu chọn tất cả khách sạn,
            lấy phòng từng khách sạn
            ======================================
            */

            for (
                const hotel
                of hotels
            ) {

                const id =
                    hotel.hotelId ||
                    hotel.id;


                const hotelRooms =
                    await getRoomsByHotel(
                        id
                    );


                rooms.push(
                    ...hotelRooms
                );

            }

        }


        renderRooms(
            rooms
        );


    } catch (error) {

        console.error(error);

        table.innerHTML = `
            <tr>
                <td colspan="7"
                    style="text-align:center">

                    Không thể tải danh sách phòng

                </td>
            </tr>
        `;

    }

}


/*
==================================================
GET ROOMS
==================================================
*/

async function getRoomsByHotel(
    hotelId
) {

    const response =
        await fetch(
            `/hotels/${encodeURIComponent(hotelId)}/rooms`
        );


    if (!response.ok) {

        throw new Error(
            "Không thể lấy phòng"
        );

    }


    return await response.json();

}


/*
==================================================
HIỂN THỊ ROOM
==================================================
*/

function renderRooms(
    rooms
) {

    const table =
        document.getElementById(
            "roomTable"
        );


    table.innerHTML = "";


    if (!rooms.length) {

        table.innerHTML = `
            <tr>
                <td colspan="7"
                    style="text-align:center">

                    Chưa có phòng

                </td>
            </tr>
        `;

        return;
    }


    rooms.forEach(
        room => {

            const hotelId =
                room.hotelId;


            const roomId =
                room.roomId;


            const row =
                document.createElement(
                    "tr"
                );


            const status =
                room.status ||
                "available";


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHtml(roomId)}
                    </strong>
                </td>

                <td>
                    ${escapeHtml(hotelId)}
                </td>

                <td>
                    ${escapeHtml(room.type || "")}
                </td>

                <td>
                    ${formatMoney(room.price)}
                </td>

                <td>
                    ${room.maxGuest || ""}
                </td>

                <td>

                    <span class="status-badge">
                        ${escapeHtml(status)}
                    </span>

                </td>

                <td>

                    <div class="action-buttons">

                        <button
                            class="edit-button"
                            onclick='editRoom(${JSON.stringify(room)})'>

                            ️ Sửa

                        </button>

                        <button
                            class="delete-button"
                            onclick="deleteRoom('${escapeAttr(hotelId)}','${escapeAttr(roomId)}')">

                            ️ Xóa

                        </button>

                    </div>

                </td>

            `;


            table.appendChild(
                row
            );

        }
    );

}


/*
==================================================
SỬA ROOM
==================================================
*/

function editRoom(
    room
) {

    openRoomModal(
        room
    );

}


/*
==================================================
SAVE ROOM
==================================================
*/

async function saveRoom() {

    const hotelId =
        document.getElementById(
            "roomHotelId"
        ).value;


    const roomId =
        document.getElementById(
            "roomId"
        ).value.trim();


    const type =
        document.getElementById(
            "roomType"
        ).value.trim();


    const price =
        Number(
            document.getElementById(
                "roomPrice"
            ).value
        );


    const maxGuest =
        Number(
            document.getElementById(
                "roomMaxGuest"
            ).value
        );


    if (!hotelId ||
        !roomId ||
        !type ||
        !price ||
        !maxGuest) {

        showToast("Vui lòng nhập đầy đủ thông tin.", "error");
        return;
    }


    const body = {

        roomId,
        type,
        price,
        maxGuest

    };


    try {

        let response;


        if (editingRoomId) {

            response =
                await fetch(
                    `/admin/hotels/${encodeURIComponent(hotelId)}/rooms/${encodeURIComponent(editingRoomId)}?userId=${encodeURIComponent(getAdminId())}`,
                    {

                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(body)

                    }
                );

        } else {

            response =
                await fetch(
                    `/admin/hotels/${encodeURIComponent(hotelId)}/rooms?userId=${encodeURIComponent(getAdminId())}`,
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(body)

                    }
                );

        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Không thể lưu phòng"
            );

        }


        closeRoomModal();


        showMessage(
            "roomMessage",
            editingRoomId
                ? " Cập nhật phòng thành công"
                : " Thêm phòng thành công",
            true
        );


        editingRoomId =
            null;


        await loadRooms();


    } catch (error) {

        showToast(error.message, "error");
    }

}


/*
==================================================
DELETE ROOM
==================================================
*/

async function deleteRoom(
    hotelId,
    roomId
) {

    if (!confirm(
        `Bạn có chắc muốn xóa phòng ${roomId}?`
    )) {

        return;
    }


    try {

        const response =
            await fetch(
                `/admin/hotels/${encodeURIComponent(hotelId)}/rooms/${encodeURIComponent(roomId)}?userId=${encodeURIComponent(getAdminId())}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Xóa phòng thất bại"
            );

        }


        showMessage(
            "roomMessage",
            " Xóa phòng thành công",
            true
        );


        await loadRooms();


    } catch (error) {

        showToast(error.message, "error");
    }

}


/*
==================================================
LOAD REVENUE HOTEL SELECT
==================================================
*/

function loadRevenueHotels() {

    populateHotelSelects();

}


/*
==================================================
LOAD REVENUE
==================================================
*/

async function loadRevenue() {

    const hotelId = document.getElementById("revenueHotel").value;
    const month = document.getElementById("revenueMonth").value;

    if (!hotelId || !month) {
        showToast("Vui lòng chọn khách sạn và tháng.", "warning");
        return;
    }

    try {
        const response = await fetch(
            `/admin/revenue?userId=${encodeURIComponent(getAdminId())}&hotelId=${encodeURIComponent(hotelId)}&month=${encodeURIComponent(month)}`
        );

        if (!response.ok) {
            throw new Error("Không thể tải doanh thu");
        }

        const data = await response.json();

        const resultBox = document.getElementById("revenueResult");
        resultBox.innerHTML = `
            <div class="revenue-summary-grid">
                <div class="revenue-card">
                    <div class="revenue-label">Tổng doanh thu</div>
                    <div class="revenue-number">${Number(data.totalRevenue || 0).toLocaleString("vi-VN")} đ</div>
                </div>
                <div class="revenue-card">
                    <div class="revenue-label">Tổng booking</div>
                    <div class="revenue-number">${data.totalBookings || 0}</div>
                </div>
                <div class="revenue-card">
                    <div class="revenue-label">Đã thanh toán</div>
                    <div class="revenue-number">${data.paidBookings || 0}</div>
                </div>
                <div class="revenue-card">
                    <div class="revenue-label">Đã hủy</div>
                    <div class="revenue-number">${data.cancelledBookings || 0}</div>
                </div>
            </div>
        `;

        lastRevenueData = data;
        renderRevenueCharts(data);

        const msg = document.getElementById("revenueMessage");
        if (msg) {
            msg.className = "message success";
            msg.textContent = "Đã tải dữ liệu doanh thu";
        }

    } catch (error) {
        console.error(error);
        showToast(error.message, "error");
    }
}

let revenueChartInstance = null;
let bookingChartInstance = null;

function renderRevenueCharts(data) {
    const daily = Array.isArray(data.daily) ? data.daily : [];
    const labels = daily.map(d => {
        const parts = String(d.date).split("-");
        return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.date;
    });
    const revenues = daily.map(d => Number(d.revenue || 0));
    const bookings = daily.map(d => Number(d.bookings || 0));

    const revenueCanvas = document.getElementById("revenueChart");
    const bookingCanvas = document.getElementById("bookingChart");
    const chartsWrap = document.getElementById("revenueCharts");
    if (chartsWrap) chartsWrap.style.display = "grid";

    if (!revenueCanvas || !bookingCanvas) {
        console.warn("Canvas not found");
        return;
    }
    if (typeof Chart === "undefined") {
        console.warn("Chart.js not loaded");
        showToast("Không tải được thư viện biểu đồ", "error");
        return;
    }

    if (revenueChartInstance) revenueChartInstance.destroy();
    if (bookingChartInstance) bookingChartInstance.destroy();

    revenueChartInstance = new Chart(revenueCanvas, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Doanh thu (đ)",
                data: revenues,
                borderColor: "#0f766e",
                backgroundColor: "rgba(15, 118, 110, 0.12)",
                fill: true,
                tension: 0.35,
                pointRadius: 3,
                pointBackgroundColor: "#0f766e"
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (v) => Number(v).toLocaleString("vi-VN")
                    }
                }
            }
        }
    });

    bookingChartInstance = new Chart(bookingCanvas, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Số booking",
                data: bookings,
                backgroundColor: "rgba(13, 148, 136, 0.75)",
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}



/*
==================================================
BACKUP
==================================================
*/

async function backupData() {

    if (!confirm(
        "Bạn có muốn backup toàn bộ dữ liệu không?"
    )) {

        return;
    }


    try {

        const response =
            await fetch(
                `/admin/backup?userId=${encodeURIComponent(getAdminId())}`
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Backup thất bại"
            );

        }


        showMessage(
            "backupMessage",
            ` Backup thành công. Đã sao lưu ${result.totalItems || result.count || "toàn bộ"} dữ liệu.`,
            true
        );


    } catch (error) {

        showMessage(
            "backupMessage",
            " " + error.message,
            false
        );

    }

}


/*
==================================================
RESTORE
==================================================
*/

async function restoreData() {

    if (!confirm(
        "Bạn có chắc muốn restore dữ liệu không?"
    )) {

        return;
    }


    try {

        const response =
            await fetch(
                `/admin/restore?userId=${encodeURIComponent(getAdminId())}`,
                {
                    method: "POST"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Restore thất bại"
            );

        }


        showMessage(
            "backupMessage",
            ` Restore thành công. Đã khôi phục ${result.restoredItems || result.count || "dữ liệu"}.`,
            true
        );


        await loadHotels();


    } catch (error) {

        showMessage(
            "backupMessage",
            " " + error.message,
            false
        );

    }

}


/*
==================================================
DASHBOARD
==================================================
*/

async function loadDashboard() {

    /*
    ==========================================
    SỐ HOTEL
    ==========================================
    */

    document.getElementById(
        "hotelCount"
    ).textContent =
        hotels.length;


    /*
    ==========================================
    ĐẾM ROOM
    ==========================================
    */

    let totalRooms = 0;


    for (
        const hotel
        of hotels
    ) {

        try {

            const hotelId =
                hotel.hotelId ||
                hotel.id;


            const rooms =
                await getRoomsByHotel(
                    hotelId
                );


            totalRooms +=
                rooms.length;

        } catch (error) {

            console.error(error);

        }

    }


    document.getElementById(
        "roomCount"
    ).textContent =
        totalRooms;


    /*
    ==========================================
    DOANH THU THÁNG HIỆN TẠI
    ==========================================
    */

    if (hotels.length) {

        const now =
            new Date();

        const month =
            now.toISOString()
                .slice(0, 7);


        let totalRevenue = 0;

        let totalBookings = 0;


        for (
            const hotel
            of hotels
        ) {

            try {

                const hotelId =
                    hotel.hotelId ||
                    hotel.id;


                const response =
                    await fetch(
                        `/admin/revenue?userId=${encodeURIComponent(getAdminId())}&hotelId=${encodeURIComponent(hotelId)}&month=${encodeURIComponent(month)}`
                    );


                if (!response.ok) {
                    continue;
                }


                const data =
                    await response.json();


                totalRevenue +=
                    Number(
                        data.totalRevenue || 0
                    );


                totalBookings +=
                    Number(
                        data.totalBookings || 0
                    );

            } catch (error) {

                console.error(error);

            }

        }


        document.getElementById(
            "bookingCount"
        ).textContent =
            totalBookings;


        document.getElementById(
            "revenueCount"
        ).textContent =
            formatMoney(
                totalRevenue
            );

    }

}


/*
==================================================
HIỂN THỊ MESSAGE
==================================================
*/

function showMessage(
    elementId,
    message,
    success
) {

    const element =
        document.getElementById(
            elementId
        );


    element.textContent =
        message;


    element.className =
        success
            ? "message success"
            : "message error";


    setTimeout(
        () => {

            element.className =
                "message";

        },
        4000
    );

}


/*
==================================================
FORMAT MONEY
==================================================
*/

function formatMoney(
    value
) {

    return Number(
        value || 0
    ).toLocaleString(
        "vi-VN"
    ) + " đ";

}


/*
==================================================
ESCAPE HTML
==================================================
*/

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );

}


function escapeAttr(
    value
) {

    return String(
        value ?? ""
    )
    .replaceAll(
        "'",
        "\\'"
    );

}


async function loadAdminBookings() {
    const tbody = document.getElementById("bookingTable");
    const stats = document.getElementById("bookingStats");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="10" class="table-empty">Đang tải danh sách booking...</td></tr>';

    try {
        const response = await fetch("/bookings");
        if (!response.ok) throw new Error("Không thể tải danh sách booking");

        let bookings = await response.json();
        if (!Array.isArray(bookings)) bookings = [];

        bookings = bookings.map(b => {
            const row = { ...b };
            if (!row.bookingId && row.SK) row.bookingId = String(row.SK).replace(/^BOOKING#/, "");
            if (!row.guestId && row.PK) row.guestId = String(row.PK).replace(/^GUEST#/, "");
            return row;
        });

        bookings.sort((a, b) => String(b.createdAt || b.checkIn || "").localeCompare(String(a.createdAt || a.checkIn || "")));
        lastAdminBookings = bookings;

        const confirmed = bookings.filter(b => b.status === "confirmed").length;
        const cancelled = bookings.filter(b => b.status === "cancelled").length;
        const paid = bookings.filter(b => b.paymentStatus === "paid").length;

        if (stats) {
            stats.innerHTML = `
                <div class="mini-stat"><span>Tổng</span><strong>${bookings.length}</strong></div>
                <div class="mini-stat"><span>Confirmed</span><strong>${confirmed}</strong></div>
                <div class="mini-stat"><span>Đã hủy</span><strong>${cancelled}</strong></div>
                <div class="mini-stat"><span>Đã thanh toán</span><strong>${paid}</strong></div>
            `;
        }

        if (!bookings.length) {
            tbody.innerHTML = '<tr><td colspan="10" class="table-empty">Chưa có booking nào</td></tr>';
            return;
        }

        tbody.innerHTML = bookings.map(b => {
            const status = b.status || "unknown";
            const paidFlag = b.paymentStatus === "paid";
            const guestId = b.guestId || "";
            const bookingId = b.bookingId || "";
            const total = Number(b.total || 0).toLocaleString("vi-VN");
            const statusBadge = status === "confirmed"
                ? '<span class="badge badge-success">Confirmed</span>'
                : status === "cancelled"
                    ? '<span class="badge badge-danger">Cancelled</span>'
                    : status === "completed"
                        ? '<span class="badge badge-info">Completed</span>'
                        : `<span class="badge">${status}</span>`;

            return `
                <tr>
                    <td><strong>${bookingId}</strong></td>
                    <td>${guestId}</td>
                    <td>${b.hotelId || "--"}</td>
                    <td>${b.roomId || "--"}</td>
                    <td>${b.checkIn || "--"}</td>
                    <td>${b.checkOut || "--"}</td>
                    <td>${total} đ</td>
                    <td>
                        <div class="status-cell">
                            ${statusBadge}
                            <select class="status-select" data-guest="${guestId}" data-id="${bookingId}" onchange="adminChangeBookingStatus(this)">
                                <option value="confirmed" ${status === "confirmed" ? "selected" : ""}>Confirmed</option>
                                <option value="cancelled" ${status === "cancelled" ? "selected" : ""}>Cancelled</option>
                                <option value="completed" ${status === "completed" ? "selected" : ""}>Completed</option>
                            </select>
                        </div>
                    </td>
                    <td>${paidFlag ? '<span class="badge badge-success">Paid</span>' : '<span class="badge badge-warning">Unpaid</span>'}</td>
                    <td>
                        <button class="table-button danger" ${status === "cancelled" ? "disabled" : ""} onclick="adminCancelBooking('${guestId}','${bookingId}')">
                            <i class="fa-solid fa-ban"></i> Hủy
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="10" class="table-empty error">${error.message}</td></tr>`;
        showToast(error.message, "error");
    }
}


async function adminChangeBookingStatus(selectEl) {
    const guestId = selectEl.getAttribute("data-guest");
    const bookingId = selectEl.getAttribute("data-id");
    const status = selectEl.value;

    try {
        const response = await fetch(
            `/bookings/${encodeURIComponent(bookingId)}/status?guestId=${encodeURIComponent(guestId)}&status=${encodeURIComponent(status)}`,
            { method: "PUT" }
        );
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Cập nhật thất bại");
        showToast("Đã cập nhật trạng thái booking", "success");
    } catch (error) {
        console.error(error);
        showToast(error.message, "error");
        loadAdminBookings();
    }
}

async function adminCancelBooking(guestId, bookingId) {
    const ok = await showConfirm("Bạn chắc chắn muốn hủy booking này?", { title: "Hủy booking", okText: "Hủy booking", danger: true });
    if (!ok) return;
    try {
        const response = await fetch(
            `/bookings/${encodeURIComponent(bookingId)}/cancel?guestId=${encodeURIComponent(guestId)}`,
            { method: "PUT" }
        );
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Hủy thất bại");
        showToast("Đã hủy booking", "success");
        loadAdminBookings();
    } catch (error) {
        console.error(error);
        showToast(error.message, "error");
    }
}


function filterHotels() {
    const q = (document.getElementById("hotelSearch")?.value || "").trim().toLowerCase();
    const tbody = document.getElementById("hotelTable");
    if (!tbody) return;
    const rows = tbody.querySelectorAll("tr");
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = !q || text.includes(q) ? "" : "none";
    });
}

function filterRooms() {
    const q = (document.getElementById("roomSearch")?.value || "").trim().toLowerCase();
    const tbody = document.getElementById("roomTable");
    if (!tbody) return;
    const rows = tbody.querySelectorAll("tr");
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = !q || text.includes(q) ? "" : "none";
    });
}

function filterBookings() {
    const q = (document.getElementById("bookingSearch")?.value || "").trim().toLowerCase();
    const tbody = document.getElementById("bookingTable");
    if (!tbody) return;
    const rows = tbody.querySelectorAll("tr");
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = !q || text.includes(q) ? "" : "none";
    });
}


function toggleAdminSidebar(force) {
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (!sidebar) return;
    const open = typeof force === "boolean" ? force : !sidebar.classList.contains("open");
    sidebar.classList.toggle("open", open);
    if (overlay) overlay.classList.toggle("show", open);
}

async function loadAdminUsers() {
    const tbody = document.getElementById("userTable");
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Đang tải...</td></tr>';
    try {
        const response = await fetch(`/admin/users?userId=${encodeURIComponent(getAdminId())}`);
        if (!response.ok) throw new Error("Không thể tải danh sách người dùng");
        const users = await response.json();
        if (!users.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Chưa có người dùng</td></tr>';
            return;
        }
        tbody.innerHTML = users.map(u => {
            const status = u.status || "active";
            const locked = status === "locked";
            return `<tr>
                <td>${u.userId || ""}</td>
                <td>${u.name || ""}</td>
                <td>${u.email || ""}</td>
                <td>${u.role || ""}</td>
                <td>${locked ? '<span class="badge badge-danger">Locked</span>' : '<span class="badge badge-success">Active</span>'}</td>
                <td>
                    <button class="table-button danger" onclick="toggleUserStatus('${u.userId}','${locked ? "active" : "locked"}')">
                        <i class="fa-solid fa-${locked ? "lock-open" : "lock"}"></i>
                        ${locked ? "Mở khóa" : "Khóa"}
                    </button>
                    <button class="table-button role-button" onclick="changeUserRole('${u.userId}','${u.role === "ADMIN" ? "CUSTOMER" : "ADMIN"}')">
                        <i class="fa-solid fa-user-gear"></i> Đổi vai trò
                    </button>
                </td>
            </tr>`;
        }).join("");
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" class="table-empty error">${e.message}</td></tr>`;
        showToast(e.message, "error");
    }
}

function filterUsers() {
    const q = (document.getElementById("userSearch")?.value || "").trim().toLowerCase();
    const tbody = document.getElementById("userTable");
    if (!tbody) return;
    tbody.querySelectorAll("tr").forEach(row => {
        row.style.display = !q || row.innerText.toLowerCase().includes(q) ? "" : "none";
    });
}

async function toggleUserStatus(targetUserId, status) {
    const ok = await showConfirm(
        status === "locked" ? "Khóa tài khoản này?" : "Mở khóa tài khoản này?",
        { title: "Cập nhật user", okText: "Xác nhận", danger: status === "locked" }
    );
    if (!ok) return;
    try {
        const response = await fetch(
            `/admin/users/${encodeURIComponent(targetUserId)}/status?userId=${encodeURIComponent(getAdminId())}&status=${encodeURIComponent(status)}`,
            { method: "PUT" }
        );
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Cập nhật thất bại");
        showToast("Đã cập nhật trạng thái user", "success");
        loadAdminUsers();
    } catch (e) {
        showToast(e.message, "error");
    }
}

function exportBookingsCsv() {
    const rows = (lastAdminBookings || []).map(b => ({
        bookingId: b.bookingId || "",
        guestId: b.guestId || "",
        hotelId: b.hotelId || "",
        roomId: b.roomId || "",
        checkIn: b.checkIn || "",
        checkOut: b.checkOut || "",
        total: b.total || "",
        status: b.status || "",
        paymentStatus: b.paymentStatus || ""
    }));
    exportToCsv("bookings.csv", rows);
}

function exportRevenueCsv() {
    if (!lastRevenueData || !Array.isArray(lastRevenueData.daily)) {
        showToast("Hãy xem doanh thu trước khi xuất CSV", "warning");
        return;
    }
    const rows = lastRevenueData.daily.map(d => ({
        date: d.date,
        revenue: d.revenue,
        bookings: d.bookings
    }));
    exportToCsv(`revenue-${lastRevenueData.month || "export"}.csv`, rows);
}


let dashboardChartInstance = null;

async function loadDashboardOverview() {
    try {
        const res = await fetch(`/admin/dashboard?userId=${encodeURIComponent(getAdminId())}`);
        if (!res.ok) throw new Error("Không tải được dashboard");
        const data = await res.json();
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        set("hotelCount", data.hotels ?? 0);
        set("roomCount", data.rooms ?? 0);
        set("bookingCount", data.bookings ?? 0);
        set("revenueCount", Number(data.revenue || 0).toLocaleString("vi-VN") + " đ");

        const noti = document.getElementById("adminNotifications");
        if (noti && Array.isArray(data.notifications)) {
            noti.innerHTML = data.notifications.map(n =>
                `<div class="noti-item"><i class="fa-solid fa-bell"></i> ${n.text}</div>`
            ).join("");
        }

        const monthly = Array.isArray(data.monthlyRevenue) ? data.monthlyRevenue : [];
        const canvas = document.getElementById("dashboardChart");
        if (canvas && typeof Chart !== "undefined") {
            if (dashboardChartInstance) dashboardChartInstance.destroy();
            dashboardChartInstance = new Chart(canvas, {
                type: "bar",
                data: {
                    labels: monthly.map(m => m.month),
                    datasets: [{
                        label: "Doanh thu",
                        data: monthly.map(m => Number(m.revenue || 0)),
                        backgroundColor: "rgba(15,118,110,0.75)",
                        borderRadius: 8
                    }]
                },
                options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            });
        }
    } catch (e) {
        console.error(e);
    }
}

async function loadAuditLogs() {
    const tbody = document.getElementById("auditTable");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="4" class="table-empty">Đang tải...</td></tr>`;
    try {
        const res = await fetch(`/admin/audit?userId=${encodeURIComponent(getAdminId())}&limit=50`);
        if (!res.ok) throw new Error("Không tải được nhật ký");
        const rows = await res.json();
        if (!rows.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="table-empty">Chưa có nhật ký</td></tr>`;
            return;
        }
        tbody.innerHTML = rows.map(r => `<tr>
            <td>${r.createdAt || ""}</td>
            <td>${r.actorId || ""}</td>
            <td>${r.action || ""}</td>
            <td>${r.detail || ""}</td>
        </tr>`).join("");
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" class="table-empty error">${e.message}</td></tr>`;
    }
}

async function runSeedData() {
    const ok = await showConfirm("Nạp dữ liệu khách sạn/phòng mẫu?", { title: "Seed data", okText: "Seed", danger: false });
    if (!ok) return;
    try {
        const res = await fetch(`/admin/seed?userId=${encodeURIComponent(getAdminId())}`, { method: "POST" });
        const data = await res.json().catch(()=>({}));
        if (!res.ok) throw new Error(data.message || "Seed thất bại");
        showToast(data.message || "Seed thành công", "success");
        loadDashboardOverview();
    } catch (e) {
        showToast(e.message, "error");
    }
}



async function changeUserRole(targetUserId, role) {
    const roleText = role === "ADMIN" ? "Quản trị viên" : "Khách hàng";
    const ok = await showConfirm("Đổi vai trò tài khoản này thành " + roleText + "?", { title: "Đổi vai trò", okText: "Xác nhận", danger: false });
    if (!ok) return;
    try {
        const res = await fetch(`/admin/users/${encodeURIComponent(targetUserId)}/role?userId=${encodeURIComponent(getAdminId())}&role=${encodeURIComponent(role)}`, { method: "PUT" });
        const data = await res.json().catch(()=>({}));
        if (!res.ok) throw new Error(data.message || "Đổi role thất bại");
        showToast("Đã đổi role", "success");
        loadAdminUsers();
    } catch (e) { showToast(e.message, "error"); }
}

