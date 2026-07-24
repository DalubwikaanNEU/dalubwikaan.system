// =================================
// DALUBWIKAAN TREASURY DASHBOARD
// VERSION 5.0 POLISHED
// FIREBASE REAL-TIME
// PROJECT TRANSPARENCY
// BUDGET MONITORING
// ANNOUNCEMENT BOARD
// PDF REPORT
// =================================

import { db } from "./firebase.js";

import {
    collection,
    onSnapshot,
    query,
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// =================================
// VARIABLES
// =================================

let collectionChart = null;
let budgetChart = null;

window.totalFunds = 0;
window.expenseTotal = 0;
window.currentExpenses = 0;
window.projectActualExpenseTotal = 0;

// Stores project expenses by project ID
let projectExpenses = {};

// Data used for PDF reports and dashboard summaries
let reportData = {
    funds: 0,
    expenses: 0,
    remaining: 0,
    years: {},
    projects: []
};

// =================================
// HELPERS
// =================================

function setText(id, value) {
    const element = document.getElementById(id);

    if (!element) return;

    element.textContent = value;
}

function peso(value) {
    const amount = Number(value) || 0;

    return amount.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2
    });
}

// =================================
// PROJECT STATUS BADGE
// =================================

function statusBadge(status) {
    const currentStatus = String(status || "Planning").trim();

    switch (currentStatus) {
        case "Completed":
            return `
                <span class="status completed">
                    🟢 Completed
                </span>
            `;

        case "Ongoing":
            return `
                <span class="status ongoing">
                    🔵 Ongoing
                </span>
            `;

        default:
            return `
                <span class="status planning">
                    🟡 Planning
                </span>
            `;
    }
}
// =================================
// FINANCIAL STATUS
// =================================

function updateFinancialSummary() {

    window.currentExpenses =
        (window.expenseTotal || 0) +
        (window.projectActualExpenseTotal || 0);

    const balance =
        (window.totalFunds || 0) -
        window.currentExpenses;

    setText("totalExpenses", peso(window.currentExpenses));
    setText("currentBalance", peso(balance));

    reportData.expenses = window.currentExpenses;
    reportData.remaining = balance;

    updateBudgetChart();
}

// =================================
// LOAD COLLECTIONS
// =================================

function loadCollections() {

    const q = query(
        collection(db, "collections"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {

        let totalFunds = 0;

        const yearTotals = {
            "First Year": 0,
            "Second Year": 0,
            "Third Year": 0,
            "Fourth Year": 0
        };

        const table = document.getElementById("transactionTable");

        if (table) {
            table.innerHTML = "";
        }

        snapshot.forEach((doc) => {

            const data = doc.data();
            const amount = Number(data.amount || 0);

            totalFunds += amount;

            if (
                data.yearLevel &&
                Object.prototype.hasOwnProperty.call(yearTotals, data.yearLevel)
            ) {
                yearTotals[data.yearLevel] += amount;
            }

            if (table) {

                table.innerHTML += `
                    <tr>
                        <td>${data.date || "N/A"}</td>
                        <td>${data.yearLevel || "N/A"}</td>
                        <td>${peso(amount)}</td>
                        <td>
                            <span class="${(data.status || "Recorded").toLowerCase()}">
                                ${data.status || "Recorded"}
                            </span>
                        </td>
                    </tr>
                `;
            }

        });

        if (snapshot.empty && table) {

            table.innerHTML = `
                <tr>
                    <td colspan="4">
                        No collection records yet.
                    </td>
                </tr>
            `;

        }

        // =================================
        // UPDATE GLOBAL VALUES
        // =================================

        window.totalFunds = totalFunds;

        reportData.funds = totalFunds;
        reportData.years = yearTotals;

        updateFinancialSummary();

        // =================================
        // UPDATE DASHBOARD
        // =================================

        setText("totalFunds", peso(totalFunds));

        setText(
            "firstYear",
            peso(yearTotals["First Year"])
        );

        setText(
            "secondYear",
            peso(yearTotals["Second Year"])
        );

        setText(
            "thirdYear",
            peso(yearTotals["Third Year"])
        );

        setText(
            "fourthYear",
            peso(yearTotals["Fourth Year"])
        );

        updateProgress(yearTotals);

        createCollectionChart(yearTotals);

        hideLoader();

    });

}
// =================================
// LOAD PROJECTS + BUDGET MONITORING
// PROJECT TRANSPARENCY SYSTEM
// =================================

function loadProjects() {

    const projectQuery = query(
        collection(db, "projects"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(projectQuery, async (projectSnapshot) => {

        window.projectActualExpenseTotal = 0;

        const table = document.getElementById("projectTable");

        if (table) {
            table.innerHTML = "";
        }

        // =================================
        // LOAD PROJECT EXPENSES
        // =================================

        const expenseSnapshot = await getDocs(
            collection(db, "expenses")
        );

        projectExpenses = {};

        expenseSnapshot.forEach((expenseDoc) => {

            const expense = expenseDoc.data();

            const projectName = expense.project || "Uncategorized";

            if (!projectExpenses[projectName]) {
                projectExpenses[projectName] = 0;
            }

            projectExpenses[projectName] += Number(expense.amount || 0);

        });

        reportData.projects = [];

        projectSnapshot.forEach((projectDoc) => {

            const data = projectDoc.data();

            const name = data.name || "Unnamed Project";

            const budget = Number(data.budget || 0);

            // Manual expense saved inside project document
            const actualExpense = Number(data.actualExpenses || 0);

            // Expenses recorded in expenses collection
            const recordedExpenses = Number(projectExpenses[name] || 0);

            // =================================
            // TOTAL SPENT
            // =================================

            const spent = actualExpense + recordedExpenses;

            // Running total for dashboard
            window.projectActualExpenseTotal += actualExpense;

            const remaining = budget - spent;
                        // =================================
            // PROJECT STATUS
            // =================================

            const status = (data.status || "Planning").trim();

            const projectData = {
                name,
                budget,
                spent,
                remaining,
                status,
                description: data.description || ""
            };

            reportData.projects.push(projectData);

            // =================================
            // DISPLAY PROJECT
            // =================================

            if (table) {

                table.innerHTML += `
                    <tr>

                        <td>
                            <strong>${name}</strong>
                            <br><br>
                            ${statusBadge(status)}
                        </td>

                        <td>
                            <strong>Allocated Budget</strong>
                            <br>
                            ${peso(budget)}
                            <br><br>
                            // =================================
// LOAD EXPENSE TRANSPARENCY
// RECEIPT MONITORING
// =================================

function loadExpenses() {

    const expenseQuery = query(
        collection(db, "expenses"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(expenseQuery, (snapshot) => {

        const container = document.getElementById("expensePreview");

        if (!container) return;

        container.innerHTML = "";

        let totalExpenses = 0;

        snapshot.forEach((expenseDoc) => {

            const data = expenseDoc.data();

            const amount = Number(data.amount || 0);

            totalExpenses += amount;

            const receiptHTML = data.receipt
  ? `
    <div class="receipt-box">
        <img 
          src="${data.receipt}" 
          class="receipt-image" 
          alt="Official Receipt" 
          loading="lazy"
        >
        <br>
        <a 
          href="${data.receipt}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="view-btn"
        >
          📄 View Receipt
        </a>
    </div>
  ` 
  : `
    <p>📄 No receipt uploaded.</p>
  `; 
              

            container.innerHTML += `
                <div class="expense-card">

                    <h3>
                        💸 ${data.project || "Unknown Project"}
                    </h3>

                    <p>
                        <strong>Amount:</strong>
                        ${peso(amount)}
                    </p>

                    <p>
                        ${data.description || "No description provided."}
                    </p>

                    ${receiptHTML}

                </div>
            `;

        });

        if (snapshot.empty) {

            container.innerHTML = `
                <p>
                    No expense records available.
                </p>
            `;

        }

        // =================================
        // UPDATE FINANCIAL DATA
        // =================================

        window.expenseTotal = totalExpenses;
        reportData.expenses = totalExpenses;

        updateFinancialSummary();

    });

}

// =================================
// ANNOUNCEMENT BOARD
// =================================

function loadAnnouncements() {

    const container = document.getElementById("announcementContainer");

    if (!container) return;

    const q = query(
        collection(db, "announcements"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {

        if (snapshot.empty) {

            container.innerHTML = `
                <div class="empty-state">
                    <p>📢 No announcements yet.</p>
                </div>
            `;

            return;
        }

        container.innerHTML = "";

        snapshot.forEach((docSnap) => {

            const data = docSnap.data();

            container.innerHTML += `
                <div class="announcement-card">

                    <h3>
                        📢 ${data.title || "Announcement"}
                    </h3>

                    <p>
                        ${data.message || ""}
                    </p>

                    <small>
                        Posted by:
                        ${data.createdBy || data.user || "Administrator"}
                    </small>

                </div>
            `;

        });

    });

}
// =================================
// FINANCIAL SUMMARY
// BALANCE COMPUTATION
// WITH ABONADO DETECTION
// =================================

function updateFinancialSummary() {

    // =================================
    // COMPUTE TOTAL EXPENSES
    // =================================

    window.currentExpenses =
        Number(window.expenseTotal || 0) +
        Number(window.projectActualExpenseTotal || 0);

    // =================================
    // COMPUTE REMAINING BALANCE
    // =================================

    const balance =
        Number(window.totalFunds || 0) -
        window.currentExpenses;

    // =================================
    // UPDATE DASHBOARD VALUES
    // =================================

    setText(
        "totalExpenses",
        peso(window.currentExpenses)
    );

    setText(
        "currentBalance",
        peso(balance)
    );

    // =================================
    // REMAINING BALANCE CARD
    // =================================

    const balanceElement =
        document.getElementById("remainingBalance");

    if (balanceElement) {

        if (balance < 0) {

            balanceElement.innerHTML = `
                🔴 Abonado
                <br>
                ${peso(Math.abs(balance))}
            `;

            balanceElement.classList.add("danger-status");

        } else {

            balanceElement.innerHTML = `
                🟢 Remaining
                <br>
                ${peso(balance)}
            `;

            balanceElement.classList.remove("danger-status");

        }

    }

    // =================================
    // SAVE REPORT VALUES
    // =================================

    reportData.expenses = window.currentExpenses;
    reportData.remaining = balance;

    // =================================
    // REFRESH CHART
    // =================================

    updateBudgetChart();

}
// =================================
// YEAR COLLECTION PROGRESS
// =================================

function updateProgress(data) {

    const yearValues = [
        Number(data["First Year"] || 0),
        Number(data["Second Year"] || 0),
        Number(data["Third Year"] || 0),
        Number(data["Fourth Year"] || 0)
    ];

    const max = Math.max(...yearValues);

    const progressData = {
        firstProgress: yearValues[0],
        secondProgress: yearValues[1],
        thirdProgress: yearValues[2],
        fourthProgress: yearValues[3]
    };

    Object.entries(progressData).forEach(([id, value]) => {

        const bar = document.getElementById(id);

        if (!bar) return;

        const percentage =
            max === 0
                ? 0
                : (value / max) * 100;

        bar.style.width = `${percentage}%`;
        bar.setAttribute("aria-valuenow", percentage.toFixed(0));

    });

}

// =================================
// COLLECTION CHART
// =================================

function createCollectionChart(data) {

    const canvas = document.getElementById("collectionChart");

    if (!canvas) return;

    if (collectionChart) {
        collectionChart.destroy();
    }

    collectionChart = new Chart(canvas, {

        type: "bar",

        data: {

            labels: Object.keys(data),

            datasets: [
                {
                    label: "Collected Funds",
                    data: Object.values(data),
                    borderWidth: 1
                }
            ]

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: true
                }
            },

            scales: {
                y: {
                    beginAtZero: true
                }
            }

        }

    });

}
// =================================
// BUDGET MONITORING CHART
// SHOW REAL EXPENSES
// =================================

function updateBudgetChart() {

    const canvas = document.getElementById("budgetChart");

    if (!canvas) return;

    if (budgetChart) {
        budgetChart.destroy();
    }

    const totalFunds = Number(window.totalFunds || 0);
    const currentExpenses = Number(window.currentExpenses || 0);
    const remaining = totalFunds - currentExpenses;

    budgetChart = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels: [
                "Expenses",
                remaining < 0 ? "Abonado" : "Remaining"
            ],

            datasets: [
                {
                    data: [
                        currentExpenses,
                        Math.abs(remaining)
                    ]
                }
            ]

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            cutout: "65%",

            plugins: {

                legend: {
                    position: "bottom"
                }

            }

        }

    });

}

// =================================
// PDF TREASURY REPORT
// PROJECT TRANSPARENCY VERSION
// =================================

function generatePDF() {

    const button = document.getElementById("generateReport");

    if (!button) return;

    button.onclick = () => {

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF();

        let y = 20;

        // =================================
        // TITLE
        // =================================

        pdf.setFontSize(18);
        pdf.text("DALUBWIKAAN TREASURY REPORT", 20, y);

        y += 15;

        pdf.setFontSize(12);
        pdf.text("Academic Year 2026–2027", 20, y);

        y += 10;

        pdf.text(
            `Generated: ${new Date().toLocaleDateString()}`,
            20,
            y
        );

        y += 20;

        // =================================
        // FINANCIAL SUMMARY
        // =================================

        pdf.text("FINANCIAL SUMMARY", 20, y);

        y += 10;

        pdf.text(
            `Total Funds: ${peso(reportData.funds)}`,
            20,
            y
        );

        y += 10;

        pdf.text(
            `Total Expenses: ${peso(reportData.expenses)}`,
            20,
            y
        );

        y += 10;

        pdf.text(
            `Balance: ${peso(reportData.remaining)}`,
            20,
            y
        );

        y += 20;

        // =================================
        // PROJECT TRANSPARENCY
        // =================================

        pdf.text("PROJECT TRANSPARENCY", 20, y);

        y += 10;

        reportData.projects.forEach((project) => {

            if (y > 250) {
                pdf.addPage();
                y = 20;
            }

            pdf.text(
                `Project: ${project.name}`,
                20,
                y
            );

            y += 7;

            pdf.text(
                `Status: ${project.status}`,
                20,
                y
            );

            y += 7;

            pdf.text(
                `Budget: ${peso(project.budget)}`,
                20,
                y
            );

            y += 7;

            pdf.text(
                `Spent: ${peso(project.spent)}`,
                20,
                y
            );

            y += 7;

            pdf.text(
                `Remaining: ${peso(project.remaining)}`,
                20,
                y
            );

            y += 15;

        });

        pdf.save("Dalubwikaan_Treasury_Report.pdf");

    };

}
// =================================
// SEARCH SYSTEM
// REAL-TIME TABLE FILTER
// =================================

function enableSearch() {

    const search = document.getElementById("searchRecord");

    if (!search) return;

    // Prevent duplicate event listeners
    search.oninput = () => {

        const keyword = search.value
            .trim()
            .toLowerCase();

        const rows = document.querySelectorAll(
            "#projectTable tr, #transactionTable tr"
        );

        rows.forEach((row) => {

            const text = row.textContent.toLowerCase();

            row.style.display =
                text.includes(keyword)
                    ? ""
                    : "none";

        });

    };

}

// =================================
// LOADER
// =================================

function hideLoader() {

    const loader = document.getElementById("loader");

    if (!loader) return;

    loader.style.opacity = "0";

    setTimeout(() => {

        loader.style.display = "none";

    }, 500);

}
// =================================
// DARK / LIGHT MODE
// =================================

function initializeTheme() {

    const button = document.getElementById("themeToggle");

    const savedTheme = localStorage.getItem("theme") || "light";

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    }

    if (button) {

        button.textContent =
            document.body.classList.contains("dark")
                ? "☀"
                : "🌙";

        button.onclick = () => {

            document.body.classList.toggle("dark");

            const darkMode =
                document.body.classList.contains("dark");

            localStorage.setItem(
                "theme",
                darkMode ? "dark" : "light"
            );

            button.textContent =
                darkMode
                    ? "☀"
                    : "🌙";

        };

    }

}

// =================================
// INITIALIZATION
// =================================

window.addEventListener("load", () => {

    // Load Firestore Data
    loadCollections();
    loadProjects();
    loadExpenses();
    loadAnnouncements();

    // Initialize Features
    generatePDF();
    enableSearch();
    initializeTheme();

    // Hide Splash Loader
    setTimeout(() => {
        hideLoader();
    }, 800);

});
// =================================
// AUTO SYNC CHECK
// =================================

const SYNC_INTERVAL = 30000; // 30 seconds

setInterval(() => {

    console.log(
        "Dalubwikaan Treasury Dashboard Sync..."
    );

}, SYNC_INTERVAL);

// =================================
// GLOBAL ERROR HANDLING
// =================================

window.addEventListener("error", (event) => {

    console.error(
        "Dashboard Error:",
        event.error
    );

});

window.addEventListener("unhandledrejection", (event) => {

    console.error(
        "Promise Error:",
        event.reason
    );

});

// =================================
// SYSTEM READY
// =================================

console.log(`
========================================
DALUBWIKAAN TREASURY DASHBOARD v5.0

✓ Firebase Real-Time Sync
✓ Project Status Monitoring
✓ Ongoing / Completed / Planning
✓ Budget Transparency
✓ Expense Tracking
✓ Abonado Detection
✓ Receipt Monitoring
✓ Announcement Board
✓ PDF Transparency Report
✓ Dark Mode

SYSTEM READY
========================================
`);
