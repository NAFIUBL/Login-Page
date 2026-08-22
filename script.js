// ==========================================
// LOGIN — Uploader / Viewer Roles
// ==========================================
// দুটো একাউন্টেরই Username: Nafi
// শুধু Password আলাদা — তার ভিত্তিতেই Role ঠিক হবে
//
// এখানে পাসওয়ার্ড বদলাতে চাইলে নিচের দুইটা লাইন এডিট করুন

const ACCOUNTS = [
    { username: "nafi", password: "nafi67@", role: "uploader" },
    { username: "nafi", password: "view67@", role: "viewer"   }
];

document.getElementById("loginForm")
    .addEventListener("submit", function (event) {

        event.preventDefault();

        const username =
            document.getElementById("username").value.trim().toLowerCase();

        const password =
            document.getElementById("password").value.trim();

        const matched = ACCOUNTS.find(function (acc) {
            return acc.username === username && acc.password === password;
        });

        if (matched) {

            localStorage.setItem("ofsRole", matched.role);
            localStorage.setItem("ofsUser", "Nafi");

            window.location.href = "dashboard.html";

        } else {

            alert("Wrong Username or Password!");

        }

    });