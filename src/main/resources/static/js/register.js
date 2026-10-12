async function register(event) {

    event.preventDefault();


    const name =
        document.getElementById(
            "name"
        ).value.trim();


    const email =
        document.getElementById(
            "email"
        ).value.trim();


    const password =
        document.getElementById(
            "password"
        ).value;


    const message =
        document.getElementById(
            "registerMessage"
        );


    message.className =
        "auth-message";


    try {

        const response =
            await fetch(
                "/auth/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        name: name,

                        email: email,

                        password: password

                    })
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Đăng ký thất bại"
            );

        }


        message.className =
            "auth-message auth-success";


        message.textContent =
            ` Đăng ký thành công!
             Mã khách hàng: ${result.userId ||
             "đã tạo"}`;


        /*
        ==========================================
        CHUYỂN SANG ĐĂNG NHẬP
        ==========================================
        */

        setTimeout(
            function () {

                window.location.href =
                    "/login.html";

            },
            1200
        );


    } catch (error) {

        console.error(error);


        message.className =
            "auth-message auth-error";


        message.textContent =
            " "
            + error.message;

    }

}