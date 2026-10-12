let lastHotels = [];

async function searchHotels() {
    const city = document.getElementById("city").value.trim();
    const minStars = document.getElementById("minStars").value;
    const maxPrice = document.getElementById("maxPrice").value;
    const roomType = document.getElementById("roomType").value;

    const params = new URLSearchParams();
    if (city) params.append("city", city);
    if (minStars) params.append("minStars", minStars);
    if (maxPrice) params.append("maxPrice", maxPrice);
    if (roomType) params.append("roomType", roomType);

    const url = "/hotels/search?" + params.toString();
    const container = document.getElementById("hotelResults");
    const resultCount = document.getElementById("resultCount");

    renderSkeletonCards(container, 3);
    if (resultCount) resultCount.textContent = "Đang tìm...";

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Không thể tìm khách sạn. Vui lòng thử lại.");

        const hotels = await response.json();
        lastHotels = Array.isArray(hotels) ? hotels : [];
        applyHotelSort();
    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="empty-message"><i class="fa-solid fa-triangle-exclamation"></i><p>${error.message}</p></div>`;
        if (resultCount) resultCount.textContent = "Lỗi";
        showToast(error.message, "error");
    }
}

function applyHotelSort() {
    const sortEl = document.getElementById("hotelSort");
    const sort = sortEl ? sortEl.value : "default";
    let hotels = [...lastHotels];

    if (sort === "stars_desc") hotels.sort((a, b) => Number(b.stars || 0) - Number(a.stars || 0));
    else if (sort === "stars_asc") hotels.sort((a, b) => Number(a.stars || 0) - Number(b.stars || 0));
    else if (sort === "name_asc") hotels.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "vi"));
    else if (sort === "name_desc") hotels.sort((a, b) => String(b.name || "").localeCompare(String(a.name || ""), "vi"));

    displayHotels(hotels);
}

function displayHotels(hotels) {
    const container = document.getElementById("hotelResults");
    const resultCount = document.getElementById("resultCount");

    if (resultCount) resultCount.textContent = `${hotels.length} khách sạn`;

    if (!hotels.length) {
        container.innerHTML = `<div class="empty-message"><i class="fa-solid fa-magnifying-glass"></i><p>Không tìm thấy khách sạn phù hợp.</p></div>`;
        return;
    }

    container.innerHTML = "";
    hotels.forEach(hotel => {
        const stars = Number(hotel.stars || 0);
        const starText = "★".repeat(stars) + "☆".repeat(Math.max(0, 5 - stars));
        const img = getHotelImage(hotel);
        const card = document.createElement("div");
        card.className = "hotel-card";
        card.innerHTML = `
            <div class="hotel-image" style="background-image:url('${img}');background-size:cover;background-position:center;">
            </div>
            <div class="hotel-info">
                <div class="hotel-name">${hotel.name || "Chưa có tên"}</div>
                <div class="hotel-stars" title="${stars} sao">${starText}</div>
                <div class="hotel-city"><i class="fa-solid fa-location-dot"></i> ${hotel.city || ""}</div>
                <div class="hotel-address"><i class="fa-solid fa-map"></i> ${hotel.address || ""}</div>
                <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
                  <button class="view-button" onclick="viewHotel('${hotel.hotelId}')">
                    <i class="fa-solid fa-door-open"></i> Xem phòng
                  </button>
                  <button class="favorite-button ${isFavorite(hotel.hotelId) ? 'is-favorite' : ''}" aria-label="Yêu thích" onclick="event.stopPropagation();const saved=toggleFavorite('${hotel.hotelId}');this.classList.toggle('is-favorite', saved);this.querySelector('i').className=saved?'fa-solid fa-heart':'fa-regular fa-heart';">
                    <i class="${isFavorite(hotel.hotelId)?'fa-solid':'fa-regular'} fa-heart"></i>
                  </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function viewHotel(hotelId) {
    pushRecent(hotelId);
    window.location.href = `/hotel.html?id=${hotelId}`;
}
