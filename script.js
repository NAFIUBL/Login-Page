// ==========================================
// LOGIN — Uploader / Viewer Roles
// ==========================================
// এখানে ইউজারনেম/পাসওয়ার্ড বদলাতে চাইলে নিচের অংশ এডিট করুন

const USERS = {
    "nafi":   { password: "nafi123",  role: "uploader" },
    "viewer": { password: "view123",  role: "viewer"   }
};

document.getElementById("loginForm")
    .addEventListener("submit", function (event) {

        event.preventDefault();

        const username =
            document.getElementById("username").value.trim();

        const password =
            document.getElementById("password").value.trim();

        const user = USERS[username];

        if (user && user.password === password) {

            // role টা মনে রাখা হচ্ছে যাতে dashboard.js বুঝতে পারে
            // কাকে Upload option দেখাবে, কাকে দেখাবে না

            localStorage.setItem("ofsRole", user.role);
            localStorage.setItem("ofsUser", username);

            window.location.href = "dashboard.html";

        } else {

            alert("Wrong Username or Password!");

        }

    });