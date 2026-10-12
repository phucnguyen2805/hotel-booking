async function login(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("loginMessage");

    message.className = "auth-message";
    message.textContent = "";

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Đăng nhập thất bại");
        }

        /*
        ==========================================
        LƯU THÔNG TIN TÀI KHOẢN
        ==========================================
        */

        saveUser({
            userId: result.userId,
            role: result.role,
            token: result.token || "",
            email: email,
            name: result.name || email
        });

        message.className = "auth-message auth-success";
        message.textContent = "Đăng nhập thành công!";

        /*
        ==========================================
        CHUYỂN TRANG THEO ROLE
        ==========================================
        */

        setTimeout(function () {
            if (result.role === "ADMIN") {
                window.location.href = "/admin.html";
            } else {
                window.location.href = "/about.html";
            }
        }, 600);

    } catch (error) {
        console.error(error);

        message.className = "auth-message auth-error";
        message.textContent = error.message;
    }
}
