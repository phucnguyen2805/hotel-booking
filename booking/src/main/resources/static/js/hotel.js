// Lấy hotelId từ URL
//
// Ví dụ:
// http://localhost:8080/hotel.html?id=H01
//
// hotelId = H01

const params =
    new URLSearchParams(window.location.search);

const hotelId =
    params.get("id");

let cachedRooms = [];


// Kiểm tra hotelId

if (!hotelId) {

    document.getElementById("hotelName")
        .textContent =
        "Không tìm thấy khách sạn";

} else {

    loadHotel();

    loadRooms();

}


/*
=========================================
1. LẤY THÔNG TIN KHÁCH SẠN
=========================================
*/

async function loadHotel() {

    try {

        const response =
            await fetch(`/hotels/${hotelId}`);

        if (!response.ok) {

            throw new Error(
                "Không tìm thấy khách sạn"
            );

        }

        const hotel =
            await response.json();


        // Tên

        document.getElementById(
            "hotelName"
        ).textContent =
            hotel.name || "Chưa có tên";

        // Đồng bộ ảnh banner với ảnh khách sạn trên trang tìm kiếm.
        const banner = document.getElementById("hotelBanner");
        if (banner && typeof getHotelImage === "function") {
            banner.style.backgroundImage = `linear-gradient(90deg, rgba(15,23,42,.68), rgba(15,23,42,.18)), url("${getHotelImage(hotel)}")`;
            banner.style.backgroundSize = "cover";
            banner.style.backgroundPosition = "center";
        }


        // Số sao

        const stars =
            Number(hotel.stars || 0);

        document.getElementById(
            "hotelStars"
        ).textContent =
            "".repeat(stars);


        // Thành phố

        document.getElementById(
            "hotelCity"
        ).textContent =
            ` ${hotel.city || ""}`;


        // Địa chỉ

        document.getElementById(
            "hotelAddress"
        ).textContent =
            hotel.address || "";


    } catch (error) {

        console.error(error);

        document.getElementById(
            "hotelName"
        ).textContent =
            "Không thể tải thông tin khách sạn";

    }

}


/*
=========================================
2. LẤY DANH SÁCH PHÒNG
=========================================
*/

async function loadRooms() {

    try {

        const response =
            await fetch(
                `/hotels/${hotelId}/rooms`
            );


        if (!response.ok) {

            throw new Error(
                "Không thể lấy danh sách phòng"
            );

        }


        const rooms =
            await response.json();

        cachedRooms = rooms;


        displayRooms(rooms);


    } catch (error) {

        console.error(error);

        document.getElementById(
            "roomResults"
        ).innerHTML = `

            <div class="empty-message">

                 Không thể tải danh sách phòng

            </div>

        `;

    }

}


/*
=========================================
3. HIỂN THỊ PHÒNG
=========================================
*/

function displayRooms(rooms) {

    const container =
        document.getElementById(
            "roomResults"
        );


    const roomCount =
        document.getElementById(
            "roomCount"
        );


    roomCount.textContent =
        `${rooms.length} phòng`;


    if (rooms.length === 0) {

        container.innerHTML = `

            <div class="empty-message">

                Khách sạn chưa có phòng

            </div>

        `;

        return;
    }


    container.innerHTML = "";


    rooms.forEach(room => {

        const status =
            room.status || "available";


        const isAvailable =
            status === "available";


        const card =
            document.createElement("div");


        card.className =
            "room-card";


        const roomImg = (typeof getRoomImage === "function") ? getRoomImage(room, hotelId) : "";
        card.innerHTML = `
            <img class="room-card-image" src="${roomImg}" alt="Ảnh phòng ${room.type || 'khách sạn'}" style="height:140px;width:100%;display:block;object-fit:cover;border-radius:12px 12px 0 0;" onerror="this.src='https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=85'">
            <div class="room-header">
                <div class="room-name">
                    <i class="fa-solid fa-bed"></i>
                    ${room.type || "Phòng"}
                </div>
                <div class="room-status ${isAvailable ? "room-available" : "room-booked"}">
                    ${isAvailable
                        ? '<i class="fa-solid fa-circle-check"></i> Còn phòng'
                        : '<i class="fa-solid fa-circle-xmark"></i> Đã đặt'}
                </div>
            </div>

            <div class="room-info">
                <div class="room-meta">
                    <span><i class="fa-solid fa-users"></i> Tối đa ${room.maxGuest || 0} người</span>
                    <span><i class="fa-solid fa-hashtag"></i> Mã phòng: ${getRoomId(room) || ""}</span>
                </div>
            </div>

            <div class="room-price">
                <i class="fa-solid fa-tag"></i>
                ${formatMoney(room.price)} đ / đêm
            </div>

            <button
                class="book-button"
                ${!isAvailable ? "disabled" : ""}
                onclick="bookingRoom('${getRoomId(room)}')">
                <i class="fa-solid fa-calendar-check"></i>
                Đặt phòng
            </button>
        `;


        container.appendChild(card);

    });

}


/*
=========================================
4. KIỂM TRA PHÒNG THEO NGÀY
=========================================
*/

async function checkAvailableRooms() {

    const checkIn =
        document.getElementById(
            "checkIn"
        ).value;


    const checkOut =
        document.getElementById(
            "checkOut"
        ).value;


    const message =
        document.getElementById(
            "availabilityMessage"
        );


    // Kiểm tra nhập ngày

    if (!checkIn || !checkOut) {

        message.textContent =
            "⚠️ Vui lòng chọn ngày nhận và ngày trả phòng";

        message.style.color =
            "#c62828";

        return;
    }


    // Kiểm tra ngày

    if (checkIn >= checkOut) {

        message.textContent =
            "⚠️ Ngày trả phòng phải sau ngày nhận phòng";

        message.style.color =
            "#c62828";

        return;
    }


    try {

        const response =
            await fetch(
                `/hotels/${hotelId}/rooms/available`
                + `?checkIn=${checkIn}`
                + `&checkOut=${checkOut}`
            );


        if (!response.ok) {

            throw new Error(
                "Không thể kiểm tra phòng"
            );

        }


        const rooms =
            await response.json();


        displayRooms(rooms);


        message.textContent =
            ` Có ${rooms.length} phòng còn trống `
            + `từ ${formatDate(checkIn)} `
            + `đến ${formatDate(checkOut)}`;


        message.style.color =
            "#2e7d32";


    } catch (error) {

        console.error(error);

        message.textContent =
            " Không thể kiểm tra phòng";

        message.style.color =
            "#c62828";

    }

}


/*
=========================================
5. ĐẶT PHÒNG
=========================================
*/

function bookingRoom(roomId) {

    const checkIn =
        document.getElementById(
            "checkIn"
        ).value;


    const checkOut =
        document.getElementById(
            "checkOut"
        ).value;


    if (!checkIn || !checkOut) {

        showToast("Vui lòng chọn ngày nhận và ngày trả phòng trước.", "error");
        return;
    }


    if (checkIn >= checkOut) {

        showToast("Ngày trả phòng phải sau ngày nhận phòng.", "info");
        return;
    }

    let maxGuest = 2;
    const room = (cachedRooms || []).find(r => getRoomId(r) === roomId);
    if (room && room.maxGuest) {
        maxGuest = Number(room.maxGuest) || 2;
    }

    window.location.href =
        `/booking.html`
        + `?hotelId=${hotelId}`
        + `&roomId=${roomId}`
        + `&checkIn=${checkIn}`
        + `&checkOut=${checkOut}`
        + `&maxGuest=${maxGuest}`;

}


/*
=========================================
6. FORMAT TIỀN
=========================================
*/

function formatMoney(value) {

    if (!value) {

        return "0";

    }

    return Number(value)
        .toLocaleString("vi-VN");

}


/*
=========================================
7. FORMAT NGÀY
=========================================
*/

function formatDate(date) {

    const parts =
        date.split("-");


    return `${parts[2]}/${parts[1]}/${parts[0]}`;

}

function getRoomId(room) {

    // Nếu backend có roomId
    if (room.roomId) {
        return room.roomId;
    }

    // Nếu backend trả SK = ROOM#R101
    if (room.SK) {

        return room.SK.replace(
            "ROOM#",
            ""
        );

    }

    return null;
}

async function loadReviews() {
  const list = document.getElementById("reviewList");
  const form = document.getElementById("reviewForm");
  if (!list || !hotelId) return;
  if (getCurrentUserId()) form.style.display = "block";
  try {
    const res = await fetch(`/reviews/hotel/${encodeURIComponent(hotelId)}`);
    const rows = await res.json();
    if (!rows.length) {
      list.innerHTML = `<div class="empty-message"><i class="fa-regular fa-comments"></i><p>Chưa có đánh giá</p></div>`;
      return;
    }
    list.innerHTML = rows.map(r => `
      <article class="review-card">
        <div class="review-card-head">
          <span class="review-card-user"><i class="fa-solid fa-user"></i> ${r.userName || "Khách"}</span>
          <span class="review-card-stars">${"★".repeat(Number(r.stars||0))}${"☆".repeat(Math.max(0,5-Number(r.stars||0)))}</span>
        </div>
        <p class="review-card-comment">${r.comment || "Chưa có nhận xét."}</p>
      </article>`).join("");
  } catch (e) {
    list.innerHTML = `<div class="empty-message">${e.message}</div>`;
  }
}

async function submitReview() {
  const user = getCurrentUser();
  if (!user) { showToast("Vui lòng đăng nhập để đánh giá", "warning"); return; }
  const stars = Number(document.getElementById("reviewStars").value || 5);
  const comment = document.getElementById("reviewComment").value.trim();
  try {
    const res = await fetch("/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotelId, userId: user.userId, userName: user.name || user.email, stars, comment })
    });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(data.message || "Gửi đánh giá thất bại");
    showToast("Đã gửi đánh giá", "success");
    document.getElementById("reviewComment").value = "";
    loadReviews();
  } catch (e) {
    showToast(e.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", function() {
  if (typeof hotelId !== "undefined" && hotelId) {
    setTimeout(loadReviews, 300);
  }
});
