document
    .getElementById("loginForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const username =
            document.getElementById("username").value;

        const password =
            document.getElementById("password").value;

        if (username === "nafi" && password === "nafi123") {

            window.location.href = "dashboard.html";

        } else {

            alert("Wrong Username or Password!");

        }

    });