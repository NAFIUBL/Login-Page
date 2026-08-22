// ==========================================
// SALESMAN PRODUCTIVITY DASHBOARD
// ==========================================

let selectedFile = null;
let allData = [];

const role = localStorage.getItem("ofsRole");
const currentUser = localStorage.getItem("ofsUser");


// ==========================================
// 0. AUTH GUARD + ROLE SETUP
// ==========================================

if (!role) {

    // লগইন ছাড়া কেউ dashboard.html-এ সরাসরি ঢুকলে
    window.location.href = "index.html";

}

document.getElementById("userBadge").innerText =
    "👤 " + currentUser + (role === "viewer" ? " (Viewer)" : "");

document.getElementById("userBadge2").innerText =
    "👤 " + currentUser + (role === "viewer" ? " (Viewer)" : "");


if (role === "viewer") {

    // Viewer রা Upload করতে পারবে না

    document.getElementById("uploadBox").style.display = "none";
    document.getElementById("viewerBanner").style.display = "block";

} else {

    // Uploader দের জন্য Export বাটন visible থাকবে (Upload করার পর)

    document.getElementById("exportBtn").style.display = "inline-block";

}


// ==========================================
// 1. SELECT EXCEL FILE
// ==========================================

const excelFileInput = document.getElementById("excelFile");

if (excelFileInput) {

    excelFileInput.addEventListener("change", function (event) {

        selectedFile = event.target.files[0];

        if (selectedFile) {

            alert(
                "Excel File Selected:\n" +
                selectedFile.name
            );

        }

    });

}


// ==========================================
// 2. UPLOAD EXCEL (Uploader only)
// ==========================================

const uploadBtn = document.getElementById("uploadBtn");

if (uploadBtn) {

    uploadBtn.addEventListener("click", function () {

        if (role !== "uploader") {
            alert("এই একাউন্টে Upload করার অনুমতি নেই।");
            return;
        }

        if (!selectedFile) {

            alert("Please choose an Excel file first!");

            return;
        }


        const reader = new FileReader();


        reader.onload = function (event) {

            try {

                const data = new Uint8Array(event.target.result);

                const workbook = XLSX.read(data, {
                    type: "array"
                });


                allData = [];


                workbook.SheetNames.forEach(function (sheetName) {

                    const sheet = workbook.Sheets[sheetName];


                    const rows = XLSX.utils.sheet_to_json(
                        sheet,
                        {
                            header: 1,
                            defval: ""
                        }
                    );


                    if (rows.length < 2) {
                        return;
                    }


                    for (let i = 0; i < rows.length; i++) {

                        const row = rows[i];


                        /*
                            Based on your Excel:

                            Area
                            Territory
                            Town
                            Salesman Code
                            Salesman Description
                            Scheduled Outlets
                            Non Scheduled Outlets
                            S+NS Outlets
                            Total Productive call
                            BP%
                        */


                        if (
                            row.length >= 5 &&
                            row[4] !== "" &&
                            row[4] !== null &&
                            row[4] !== undefined
                        ) {

                            const salesmanName =
                                String(row[4]).trim();


                            if (
                                salesmanName.toLowerCase()
                                === "salesman description"
                            ) {

                                continue;

                            }


                            let town = sheetName;

                            if (row[2] !== "") {
                                town = String(row[2]).trim();
                            }


                            let salesmanCode = "";

                            if (row[3] !== "") {
                                salesmanCode = String(row[3]).trim();
                            }


                            let scheduled = Number(row[5]) || 0;
                            let nonScheduled = Number(row[6]) || 0;
                            let totalOutlets = Number(row[7]) || 0;
                            let productive = Number(row[8]) || 0;
                            let bp = Number(row[9]) || 0;

                            if (bp > 1) {
                                bp = bp / 100;
                            }


                            allData.push({

                                town: town,
                                code: salesmanCode,
                                salesman: salesmanName,
                                scheduled: scheduled,
                                nonScheduled: nonScheduled,
                                totalOutlets: totalOutlets,
                                productive: productive,
                                bp: bp

                            });

                        }

                    }

                });


                allData = allData.filter(function (item, index, self) {

                    return index === self.findIndex(function (x) {

                        return (
                            x.town === item.town &&
                            x.code === item.code &&
                            x.salesman === item.salesman
                        );

                    });

                });


                // Uploader-এর নিজের ব্রাউজারে সেভ রাখা হচ্ছে,
                // যাতে পরের বার লগইন করলেও ডাটা থাকে

                localStorage.setItem("ofsReportData", JSON.stringify(allData));


                renderDashboard();
                populateTownFilter();
                renderSalesmanTable();


                alert(
                    "Excel Successfully Uploaded!\n\n" +
                    "Total Records: " +
                    allData.length +
                    "\n\nViewer-দের জন্য Website-এ Update করতে " +
                    "'Download Report for Website' বাটনে ক্লিক করুন।"
                );


            } catch (error) {

                console.error(error);

                alert(
                    "Excel file read করতে সমস্যা হয়েছে.\n" +
                    "Please check the Excel file."
                );

            }

        };


        reader.readAsArrayBuffer(selectedFile);

    });

}


// ==========================================
// 3. EXPORT REPORT (for GitHub Pages / Viewers)
// ==========================================

const exportBtn = document.getElementById("exportBtn");

if (exportBtn) {

    exportBtn.addEventListener("click", function () {

        if (allData.length === 0) {
            alert("প্রথমে Excel Upload করুন, তারপর Export করুন।");
            return;
        }

        const blob = new Blob(
            [JSON.stringify(allData, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "report-data.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        alert(
            "report-data.json ডাউনলোড হয়েছে।\n\n" +
            "এবার এই ফাইলটা আপনার প্রজেক্ট ফোল্ডারে বসিয়ে " +
            "GitHub-এ Commit + Push করুন — তাহলে Viewer-রা " +
            "এই আপডেটেড রিপোর্ট দেখতে পাবে।"
        );

    });

}


// ==========================================
// 4. LOGOUT
// ==========================================

function logout() {
    localStorage.removeItem("ofsRole");
    localStorage.removeItem("ofsUser");
    window.location.href = "index.html";
}


// ==========================================
// 5. VIEW SWITCHING (Dashboard / Salesman)
// ==========================================

function showView(viewName) {

    document.querySelectorAll(".view").forEach(function (v) {
        v.classList.remove("active");
    });

    document.querySelectorAll(".sidebar a").forEach(function (a) {
        a.classList.remove("active");
    });

    if (viewName === "dashboard") {

        document.getElementById("dashboardView").classList.add("active");
        document.getElementById("navDashboard").classList.add("active");

    } else if (viewName === "salesman") {

        document.getElementById("salesmanView").classList.add("active");
        document.getElementById("navSalesman").classList.add("active");

        closeSalesmanProfile();
        renderSalesmanTable();

    }

}


// ==========================================
// 6. DASHBOARD — KPI + Town-wise Report + Top/Low
// ==========================================

function renderDashboard() {


    document.getElementById("totalSalesman").innerText =
        allData.length.toLocaleString();

    const totalOutlets =
        allData.reduce(function (t, item) { return t + item.totalOutlets; }, 0);

    document.getElementById("totalOutlets").innerText =
        totalOutlets.toLocaleString();

    const productiveCall =
        allData.reduce(function (t, item) { return t + item.productive; }, 0);

    document.getElementById("productiveCall").innerText =
        productiveCall.toLocaleString();

    let averageBP = 0;

    if (allData.length > 0) {
        const totalBP =
            allData.reduce(function (t, item) { return t + item.bp; }, 0);
        averageBP = totalBP / allData.length;
    }

    document.getElementById("averageBP").innerText =
        (averageBP * 100).toFixed(1) + "%";


    // TOWN-WISE REPORT

    const townTableEl = document.getElementById("townTable");
    townTableEl.innerHTML = "";

    if (allData.length === 0) {

        townTableEl.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:26px;">No Data Found</td>
            </tr>
        `;

    } else {

        const townMap = {};

        allData.forEach(function (item) {

            if (!townMap[item.town]) {
                townMap[item.town] = {
                    town: item.town,
                    salesmanCount: 0,
                    totalOutlets: 0,
                    productive: 0,
                    bpSum: 0
                };
            }

            townMap[item.town].salesmanCount += 1;
            townMap[item.town].totalOutlets += item.totalOutlets;
            townMap[item.town].productive += item.productive;
            townMap[item.town].bpSum += item.bp;

        });

        const townRows = Object.values(townMap).sort(function (a, b) {
            return b.totalOutlets - a.totalOutlets;
        });

        townRows.forEach(function (t) {

            const avgBp = t.salesmanCount > 0 ? (t.bpSum / t.salesmanCount) : 0;

            let bpClass = "bp-low";
            if (avgBp >= 0.90) bpClass = "bp-good";
            else if (avgBp >= 0.80) bpClass = "bp-medium";

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${t.town}</td>
                <td>${t.salesmanCount}</td>
                <td>${t.totalOutlets.toLocaleString()}</td>
                <td>${t.productive.toLocaleString()}</td>
                <td><span class="bp-tag ${bpClass}">${(avgBp * 100).toFixed(1)}%</span></td>
            `;

            townTableEl.appendChild(row);

        });

    }


    // TOP / LOW PERFORMERS

    const sorted = allData.slice().sort(function (a, b) { return b.bp - a.bp; });

    const topEl = document.getElementById("topPerformerList");
    const lowEl = document.getElementById("lowPerformerList");

    if (sorted.length === 0) {

        const msg = `<div class="empty-msg">এখনো কোনো ডাটা নেই।</div>`;
        topEl.innerHTML = msg;
        lowEl.innerHTML = msg;

    } else {

        topEl.innerHTML = "";
        const topCount = Math.min(5, sorted.length);
        for (let i = 0; i < topCount; i++) {
            topEl.appendChild(buildSalesmanCard(sorted[i], "#" + (i + 1)));
        }

        lowEl.innerHTML = "";
        const lowCount = Math.min(5, sorted.length);
        const lowSlice = sorted.slice(sorted.length - lowCount).reverse();
        lowSlice.forEach(function (item, i) {
            lowEl.appendChild(buildSalesmanCard(item, "#" + (i + 1)));
        });

    }

}


// ==========================================
// 7. HELPER: build one salesman card
// ==========================================

function buildSalesmanCard(item, rankLabel) {

    let bpClass = "bp-low";

    if (item.bp >= 0.90) bpClass = "bp-good";
    else if (item.bp >= 0.80) bpClass = "bp-medium";

    const card = document.createElement("div");
    card.className = "salesman-card";

    card.innerHTML = `
        ${rankLabel ? `<span class="rank-badge">${rankLabel}</span>` : ""}
        <h4>${item.salesman}</h4>
        <p>Code: ${item.code}</p>
        <p>Town: ${item.town}</p>
        <span class="bp-tag ${bpClass}">${(item.bp * 100).toFixed(1)}% BP</span>
    `;

    card.addEventListener("click", function () {
        openSalesmanProfile(item);
    });

    return card;

}


// ==========================================
// 8. SALESMAN VIEW — Town filter + Search + List
// ==========================================

function populateTownFilter() {

    const select = document.getElementById("salesmanTownFilter");
    if (!select) return;

    const currentValue = select.value || "All";

    const towns = Array.from(new Set(allData.map(function (i) { return i.town; })))
        .sort();

    select.innerHTML = `<option value="All">All Town</option>`;

    towns.forEach(function (t) {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        select.appendChild(opt);
    });

    if (towns.includes(currentValue) || currentValue === "All") {
        select.value = currentValue;
    }

}

document.getElementById("salesmanTownFilter").addEventListener("change", renderSalesmanTable);
document.getElementById("salesmanSearchBox").addEventListener("input", renderSalesmanTable);


function renderSalesmanTable() {

    const tableEl = document.getElementById("salesmanTable");
    if (!tableEl) return;

    const town = document.getElementById("salesmanTownFilter").value;

    const search =
        document.getElementById("salesmanSearchBox").value
            .toLowerCase()
            .trim();

    const filtered = allData.filter(function (item) {

        const townMatch =
            town === "All" || item.town.toLowerCase() === town.toLowerCase();

        const searchMatch =
            item.salesman.toLowerCase().includes(search) ||
            String(item.code).toLowerCase().includes(search);

        return townMatch && searchMatch;

    });

    const sorted = filtered.slice().sort(function (a, b) { return b.bp - a.bp; });

    tableEl.innerHTML = "";

    if (sorted.length === 0) {

        tableEl.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:30px;">No Data Found</td>
            </tr>
        `;

        return;

    }

    sorted.forEach(function (item) {

        let bpClass = "bp-low";
        if (item.bp >= 0.90) bpClass = "bp-good";
        else if (item.bp >= 0.80) bpClass = "bp-medium";

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.town}</td>
            <td>${item.code}</td>
            <td>${item.salesman}</td>
            <td>${item.scheduled}</td>
            <td>${item.nonScheduled}</td>
            <td>${item.totalOutlets}</td>
            <td>${item.productive}</td>
            <td><span class="bp-tag ${bpClass}">${(item.bp * 100).toFixed(1)}%</span></td>
        `;

        row.addEventListener("click", function () {
            openSalesmanProfile(item);
        });

        tableEl.appendChild(row);

    });

}


// ==========================================
// 9. SALESMAN PROFILE (details view)
// ==========================================

function openSalesmanProfile(item) {

    document.getElementById("salesmanListWrap").style.display = "none";
    document.getElementById("salesmanProfile").style.display = "block";

    document.getElementById("profileName").innerText = item.salesman;
    document.getElementById("profileMeta").innerText =
        "Code: " + item.code + "  |  Town: " + item.town;

    document.getElementById("profileScheduled").innerText =
        item.scheduled.toLocaleString();

    document.getElementById("profileNonScheduled").innerText =
        item.nonScheduled.toLocaleString();

    document.getElementById("profileTotalOutlets").innerText =
        item.totalOutlets.toLocaleString();

    document.getElementById("profileProductive").innerText =
        item.productive.toLocaleString();

    document.getElementById("profileBP").innerText =
        (item.bp * 100).toFixed(1) + "%";

}

function closeSalesmanProfile() {

    document.getElementById("salesmanProfile").style.display = "none";
    document.getElementById("salesmanListWrap").style.display = "block";

}


// ==========================================
// 10. LOAD DATA ON PAGE OPEN
// ==========================================
// Uploader: আগে Upload করা থাকলে localStorage থেকে লোড হবে
// Viewer  : সবসময় report-data.json থেকে লোড হবে (GitHub-এ commit করা ফাইল)

function initLoad() {

    if (role === "viewer") {

        fetch("report-data.json")
            .then(function (res) {
                if (!res.ok) throw new Error("no report file");
                return res.json();
            })
            .then(function (json) {
                allData = json;
                renderDashboard();
                populateTownFilter();
                renderSalesmanTable();
            })
            .catch(function () {
                // এখনো কোনো report-data.json commit করা হয়নি
                renderDashboard();
                populateTownFilter();
                renderSalesmanTable();
            });

    } else {

        const saved = localStorage.getItem("ofsReportData");

        if (saved) {
            try {
                allData = JSON.parse(saved);
            } catch (e) {
                allData = [];
            }
        }

        renderDashboard();
        populateTownFilter();
        renderSalesmanTable();

    }

}

initLoad();