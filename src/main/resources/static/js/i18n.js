const I18N = {
  vi: {
    nav_home: "Trang chủ", nav_search: "Tìm khách sạn", nav_history: "Lịch sử",
    nav_about: "Giới thiệu", nav_login: "Đăng nhập", nav_admin: "Quản trị", nav_logout: "Đăng xuất",
    hero_title: "Tìm chỗ nghỉ hoàn hảo cho mọi chuyến đi",
    hero_sub: "Giá minh bạch · Xác nhận nhanh · Quản lý đặt phòng dễ dàng",
    btn_search: "Tìm phòng", why_title: "Vì sao chọn Hotel Booking?", ph_city: "Thành phố..."
  },
  en: {
    nav_home: "Home", nav_search: "Search hotels", nav_history: "History",
    nav_about: "About", nav_login: "Login", nav_admin: "Admin", nav_logout: "Logout",
    hero_title: "Find the perfect stay for every trip",
    hero_sub: "Transparent pricing · Fast confirmation · Easy booking management",
    btn_search: "Search", why_title: "Why Hotel Booking?", ph_city: "City..."
  }
};

function getLang() {
  return localStorage.getItem("lang") || "vi";
}

function toggleLang() {
  const next = getLang() === "vi" ? "en" : "vi";
  localStorage.setItem("lang", next);
  applyI18n();
  showToast(next === "vi" ? "Đã chuyển tiếng Việt" : "Switched to English", "success");
}

function applyI18n() {
  const dict = I18N[getLang()] || I18N.vi;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.setAttribute("placeholder", dict[key]);
  });
}

document.addEventListener("DOMContentLoaded", applyI18n);
