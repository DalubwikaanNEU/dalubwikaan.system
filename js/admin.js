// ========================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// Admin Panel
// Firebase Authentication
// Firestore CRUD
// Firebase Storage
// ========================================

import { db, storage } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const auth = getAuth();
let currentUser = null;

// ========================================
// LOADER
// ========================================

window.addEventListener("load", () => {

    setTimeout(() => {

        document.getElementById("loader")?.remove();

    }, 800);

});

// ========================================
// HELPERS
// ========================================

const value = (id) =>
    document.getElementById(id)?.value.trim() || "";

const peso = (amount) =>
    `₱${Number(amount || 0).toLocaleString()}`;

const notify = (message) => alert(message);

// ========================================
// AUTHENTICATION
// ========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "login.html";
        return;

    }

    try {

        const adminRef = doc(db, "admins", user.uid);
        const adminDoc = await getDoc(adminRef);

        if (!adminDoc.exists()) {

            alert("Access denied.");

            await signOut(auth);

            location.href = "login.html";

            return;

        }

        currentUser = user;

        const email = document.getElementById("adminEmail");

        if (email) {

            email.textContent = user.email;

        }

        await refresh();

    }

    catch (error) {

        console.error(error);

        notify("Unable to verify administrator.");

    }

});

// ========================================
// LOGOUT
// ========================================

document.getElementById("logout")?.addEventListener("click", async () => {

    await signOut(auth);

    location.href = "login.html";

});
// ========================================
// AUDIT TRAIL
// ========================================

async function createAudit(action, details) {

    try {

        await addDoc(collection(db, "audit"), {

            action,
            details,

            user: currentUser?.email || "Administrator",

            date: new Date().toLocaleString(),

            createdAt: serverTimestamp()

        });

    }

    catch (error) {

        console.error("Audit Error:", error);

    }

}

// ========================================
// COLLECTION FORM
// ========================================

const collectionForm = document.getElementById("collectionForm");

if (collectionForm) {

    collectionForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        try {

            const year = value("yearLevel");
            const amount = Number(value("amount"));
            const date = value("date");

            // ===========================
            // VALIDATION
            // ===========================

            if (!year) {

                notify("Please select a year level.");
                return;

            }

            if (isNaN(amount) || amount <= 0) {

                notify("Enter a valid collection amount.");
                return;

            }

            if (!date) {

                notify("Please select a collection date.");
                return;

            }

            // ===========================
            // DATA
            // ===========================

            const data = {

                year,
                amount,
                date,

                type: "Collection",

                createdAt: serverTimestamp()

            };

            // ===========================
            // SAVE TO FIRESTORE
            // ===========================

            await addDoc(
                collection(db, "collections"),
                data
            );

            // ===========================
            // AUDIT LOG
            // ===========================

            await createAudit(

                "Added Collection",

                `${year} • ${peso(amount)}`

            );

            notify("Collection successfully added.");

            collectionForm.reset();

            await refresh();

        }

        catch (error) {

            console.error("Collection Error:", error);

            notify("Failed to save collection.");

        }

    });

}

// ========================================
// COLLECTION HELPERS
// ========================================

function resetCollectionForm() {

    collectionForm?.reset();

}

function validateCollection(amount) {

    return !isNaN(amount) && amount > 0;

}
// ========================================
// PROJECT MODULE
// Add New Project
// ========================================

const projectForm = document.getElementById("projectForm");

if (projectForm) {

    projectForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        try {

            // ===========================
            // GET VALUES
            // ===========================

            const name = value("projectName");
            const budget = Number(value("projectBudget"));
            const description = value("description");

            // ===========================
            // VALIDATION
            // ===========================

            if (!name) {

                notify("Please enter the project name.");
                return;

            }

            if (isNaN(budget) || budget <= 0) {

                notify("Please enter a valid project budget.");
                return;

            }

            if (!description) {

                notify("Please provide a project description.");
                return;

            }

            // ===========================
            // FIRESTORE DATA
            // ===========================

            const data = {

                name,
                budget,
                description,

                status: "Planned",
                type: "Project",

                createdAt: serverTimestamp()

            };

            // ===========================
            // SAVE PROJECT
            // ===========================

            await addDoc(
                collection(db, "projects"),
                data
            );

            // ===========================
            // AUDIT LOG
            // ===========================

            await createAudit(

                "Added Project",

                `${name} • Budget: ${peso(budget)}`

            );

            notify("Project successfully added.");

            projectForm.reset();

            await refresh();

        }

        catch (error) {

            console.error("Project Error:", error);

            notify("Unable to save project.");

        }

    });

}

// ========================================
// PROJECT HELPERS
// ========================================

function validateProjectBudget(budget) {

    return !isNaN(budget) && budget > 0;

}

function resetProjectForm() {

    projectForm?.reset();

}
// ========================================
// EXPENSE MODULE
// Firebase Storage + Firestore
// ========================================

const expenseForm = document.getElementById("expenseForm");
const receiptInput = document.getElementById("receiptFile");
const receiptPreview = document.getElementById("receiptPreview");

// ========================================
// RECEIPT PREVIEW
// ========================================

if (receiptInput) {

    receiptInput.addEventListener("change", () => {

        receiptPreview.innerHTML = "";

        const file = receiptInput.files[0];

        if (!file) return;

        // Image files only
        if (!file.type.startsWith("image/")) {

            notify("Only image files are allowed.");

            receiptInput.value = "";

            return;

        }

        // Maximum 5 MB
        const MAX_SIZE = 5 * 1024 * 1024;

        if (file.size > MAX_SIZE) {

            notify("Receipt image must not exceed 5 MB.");

            receiptInput.value = "";

            return;

        }

        receiptPreview.innerHTML = `
            <img
                src="${URL.createObjectURL(file)}"
                alt="Receipt Preview"
                style="
                    width:220px;
                    border-radius:12px;
                    margin-top:15px;
                    box-shadow:0 5px 15px rgba(0,0,0,.15);
                "
            `;
    });

}

// ========================================
// SAVE EXPENSE
// ========================================

if (expenseForm) {

    expenseForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        try {

            const project = value("expenseProject");
            const amount = Number(value("expenseAmount"));
            const description = value("expenseDescription");

            // ===========================
            // VALIDATION
            // ===========================

            if (!project) {

                notify("Please select a project.");
                return;

            }

            if (isNaN(amount) || amount <= 0) {

                notify("Please enter a valid amount.");
                return;

            }

            if (!description) {

                notify("Please enter an expense description.");
                return;

            }

            let receiptURL = "";

            // ===========================
            // UPLOAD RECEIPT
            // ===========================

            const file = receiptInput?.files[0];

            if (file) {

                const fileName =
                    `${Date.now()}_${file.name}`;

                const storageRef = ref(
                    storage,
                    `receipts/${fileName}`
                );

                await uploadBytes(storageRef, file);

                receiptURL = await getDownloadURL(storageRef);

            }

            // ===========================
            // SAVE FIRESTORE
            // ===========================

            const expenseData = {

                project,
                amount,
                description,

                receipt: receiptURL,

                status: "Approved",

                type: "Expense",

                date: new Date().toLocaleDateString(),

                createdAt: serverTimestamp()

            };

            await addDoc(
                collection(db, "expenses"),
                expenseData
            );

            // ===========================
            // AUDIT
            // ===========================

            await createAudit(

                "Added Expense",

                `${project} • ${peso(amount)}`

            );

            notify("Expense successfully recorded.");

            expenseForm.reset();

            if (receiptPreview) {

                receiptPreview.innerHTML = "";

            }

            await refresh();

        }

        catch (error) {

            console.error("Expense Error:", error);

            notify("Failed to save expense.");

        }

    });

}

// ========================================
// EXPENSE HELPERS
// ========================================

function validateExpense(amount) {

    return !isNaN(amount) && amount > 0;

}

function resetExpenseForm() {

    expenseForm?.reset();

    if (receiptPreview) {

        receiptPreview.innerHTML = "";

    }

}
// ========================================
// LOAD ALL RECORDS
// ========================================

async function loadRecords() {

    const table = document.getElementById("records");

    if (!table) return;

    table.innerHTML = `
        <tr>
            <td colspan="4" style="text-align:center;">
                Loading records...
            </td>
        </tr>
    `;

    try {

        // ========================================
        // LOAD COLLECTIONS
        // ========================================

        const collectionsQuery = query(
            collection(db, "collections"),
            orderBy("createdAt", "desc")
        );

        const projectsQuery = query(
            collection(db, "projects"),
            orderBy("createdAt", "desc")
        );

        const expensesQuery = query(
            collection(db, "expenses"),
            orderBy("createdAt", "desc")
        );

        const [

            collectionsSnap,
            projectsSnap,
            expensesSnap

        ] = await Promise.all([

            getDocs(collectionsQuery),
            getDocs(projectsQuery),
            getDocs(expensesQuery)

        ]);

        const records = [];

        // ========================================
        // COLLECTIONS
        // ========================================

        collectionsSnap.forEach(docSnap => {

            const data = docSnap.data();

            records.push({

                id: docSnap.id,
                collection: "collections",

                type: "Collection",

                title: data.year,

                details: data.date,

                amount: data.amount,

                receipt: ""

            });

        });

        // ========================================
        // PROJECTS
        // ========================================

        projectsSnap.forEach(docSnap => {

            const data = docSnap.data();

            records.push({

                id: docSnap.id,
                collection: "projects",

                type: "Project",

                title: data.name,

                details: data.description,

                amount: data.budget,

                receipt: ""

            });

        });

        // ========================================
        // EXPENSES
        // ========================================

        expensesSnap.forEach(docSnap => {

            const data = docSnap.data();

            records.push({

                id: docSnap.id,
                collection: "expenses",

                type: "Expense",

                title: data.project,

                details: data.description,

                amount: data.amount,

                receipt: data.receipt || ""

            });

        });

        updateStats(records);

        // ========================================
        // EMPTY TABLE
        // ========================================

        if (records.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="4">
                        No records found.
                    </td>
                </tr>
            `;

            return;

        }

        // ========================================
        // TABLE RENDER
        // ========================================

        table.innerHTML = records.map(record => `

            <tr>

                <td>${record.type}</td>

                <td>

                    <strong>${record.title}</strong>

                    <br>

                    ${record.details}

                    ${record.receipt ? `

                    <br><br>

                    <a
                        href="${record.receipt}"
                        target="_blank"
                        rel="noopener"
                    >

                        🧾 View Receipt

                    </a>

                    ` : ""}

                </td>

                <td>${peso(record.amount)}</td>

                <td>

                    <button
                        class="delete-btn"
                        onclick="deleteRecord('${record.collection}','${record.id}')"
                    >

                        🗑 Delete

                    </button>

                </td>

            </tr>

        `).join("");

    }

    catch (error) {

        console.error(error);

        table.innerHTML = `

            <tr>

                <td colspan="4">

                    Failed to load records.

                </td>

            </tr>

        `;

    }

}

// ========================================
// DASHBOARD STATISTICS
// ========================================

function updateStats(records) {

    const totalRecords = records.length;

    const totalCollections =
        records.filter(r => r.type === "Collection").length;

    const totalProjects =
        records.filter(r => r.type === "Project").length;

    const totalExpenses =
        records.filter(r => r.type === "Expense").length;

    document.getElementById("recordCount").textContent =
        totalRecords;

    document.getElementById("collectionCount").textContent =
        totalCollections;

    document.getElementById("projectCount").textContent =
        totalProjects;

    document.getElementById("expenseCount").textContent =
        totalExpenses;

}
// ========================================
// AUDIT TRAIL
// ========================================

async function loadAudit() {

    const auditContainer =
        document.getElementById("auditContainer");

    const auditCount =
        document.getElementById("auditCount");

    if (!auditContainer) return;

    auditContainer.innerHTML = `
        <div class="panel">
            Loading audit logs...
        </div>
    `;

    try {

        const auditQuery = query(
            collection(db, "audit"),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(auditQuery);

        const logs = [];

        snapshot.forEach(docSnap => {

            logs.push({

                id: docSnap.id,
                ...docSnap.data()

            });

        });

        auditCount.textContent = logs.length;

        if (logs.length === 0) {

            auditContainer.innerHTML = `
                <div class="panel">

                    No audit logs found.

                </div>
            `;

            return;

        }

        auditContainer.innerHTML = logs.map(log => `

            <div class="panel audit-card">

                <h4>

                    ${log.action}

                </h4>

                <p>

                    ${log.details}

                </p>

                <small>

                    👤 ${log.user}

                    <br>

                    🕒 ${log.date}

                </small>

            </div>

        `).join("");

    }

    catch (error) {

        console.error("Audit Error:", error);

        auditContainer.innerHTML = `
            <div class="panel">

                Failed to load audit logs.

            </div>
        `;

    }

}

// ========================================
// DELETE RECORD
// ========================================

window.deleteRecord = async (collectionName, documentId) => {

    const confirmDelete = confirm(

        "Are you sure you want to delete this record?"

    );

    if (!confirmDelete) return;

    try {

        await deleteDoc(
            doc(db, collectionName, documentId)
        );

        await createAudit(

            "Deleted Record",

            `${collectionName} • ${documentId}`

        );

        notify("Record deleted successfully.");

        await refresh();

    }

    catch (error) {

        console.error("Delete Error:", error);

        notify("Unable to delete the selected record.");

    }

};

// ========================================
// LIVE SEARCH
// ========================================

const searchInput =
    document.getElementById("searchRecord");

if (searchInput) {

    searchInput.addEventListener("keyup", () => {

        const keyword =
            searchInput.value.toLowerCase().trim();

        const rows =
            document.querySelectorAll("#records tr");

        rows.forEach(row => {

            const text =
                row.textContent.toLowerCase();

            row.style.display =
                text.includes(keyword)
                    ? ""
                    : "none";

        });

    });

}

// ========================================
// REFRESH SYSTEM
// ========================================

async function refresh() {

    try {

        await Promise.all([

            loadRecords(),

            loadAudit()

        ]);

    }

    catch (error) {

        console.error("Refresh Error:", error);

    }

}

// ========================================
// AUTO REFRESH
// ========================================

refresh();
// ========================================
// FINANCIAL ANALYTICS
// Dashboard Summary
// ========================================

async function loadFinancialSummary() {

    try {

        const [
            collectionsSnap,
            projectsSnap,
            expensesSnap

        ] = await Promise.all([

            getDocs(collection(db, "collections")),
            getDocs(collection(db, "projects")),
            getDocs(collection(db, "expenses"))

        ]);

        let totalCollections = 0;
        let totalExpenses = 0;
        let totalProjectBudget = 0;

        // ===============================
        // COLLECTIONS
        // ===============================

        collectionsSnap.forEach(doc => {

            const data = doc.data();

            totalCollections += Number(data.amount || 0);

        });

        // ===============================
        // PROJECT BUDGETS
        // ===============================

        projectsSnap.forEach(doc => {

            const data = doc.data();

            totalProjectBudget += Number(data.budget || 0);

        });

        // ===============================
        // EXPENSES
        // ===============================

        expensesSnap.forEach(doc => {

            const data = doc.data();

            totalExpenses += Number(data.amount || 0);

        });

        // ===============================
        // COMPUTATIONS
        // ===============================

        const currentBalance =
            totalCollections - totalExpenses;

        // ===============================
        // UPDATE DASHBOARD
        // ===============================

        document.getElementById("totalCollection").textContent =
            peso(totalCollections);

        document.getElementById("totalExpenses").textContent =
            peso(totalExpenses);

        document.getElementById("currentBalance").textContent =
            peso(currentBalance);

        document.getElementById("totalProjects").textContent =
            peso(totalProjectBudget);

        // ===============================
        // TREASURY STATUS
        // ===============================

        const status =
            document.getElementById("dashboardStatus");

        if (status) {

            if (currentBalance > 0) {

                status.textContent =
                    "🟢 Treasury Status: Healthy";

                status.style.color = "#16a34a";

            }

            else if (currentBalance === 0) {

                status.textContent =
                    "🟡 Treasury Status: Balanced";

                status.style.color = "#ca8a04";

            }

            else {

                status.textContent =
                    "🔴 Treasury Status: Deficit";

                status.style.color = "#dc2626";

            }

        }

    }

    catch (error) {

        console.error("Financial Summary Error:", error);

    }

}

// ========================================
// QUICK ANALYTICS
// ========================================

function getExpensePercentage(collections, expenses) {

    if (collections === 0) return 0;

    return ((expenses / collections) * 100).toFixed(2);

}

// ========================================
// DASHBOARD OVERVIEW
// ========================================

async function updateDashboardAnalytics() {

    const collectionsSnap =
        await getDocs(collection(db, "collections"));

    const expensesSnap =
        await getDocs(collection(db, "expenses"));

    let income = 0;
    let expense = 0;

    collectionsSnap.forEach(doc => {

        income += Number(doc.data().amount || 0);

    });

    expensesSnap.forEach(doc => {

        expense += Number(doc.data().amount || 0);

    });

    const percent =
        getExpensePercentage(income, expense);

    const analytics =
        document.getElementById("expensePercentage");

    if (analytics) {

        analytics.textContent =
            `${percent}% of collected funds have been spent.`;

    }

}

// ========================================
// LOAD ANALYTICS
// ========================================

async function loadAnalytics() {

    await Promise.all([

        loadFinancialSummary(),

        updateDashboardAnalytics()

    ]);

}
// ========================================
// DALUBWIKAAN TREASURY SYSTEM
// FINAL UTILITIES
// ========================================

// ========================================
// DARK MODE
// ========================================

const themeButton = document.getElementById("themeToggle");

if (themeButton) {

    const savedTheme =
        localStorage.getItem("theme") || "light";

    document.body.classList.toggle(
        "dark",
        savedTheme === "dark"
    );

    themeButton.textContent =
        savedTheme === "dark"
            ? "☀ Light Mode"
            : "🌙 Dark Mode";

    themeButton.addEventListener("click", () => {

        document.body.classList.toggle("dark");

        const dark =
            document.body.classList.contains("dark");

        localStorage.setItem(
            "theme",
            dark ? "dark" : "light"
        );

        themeButton.textContent =
            dark
                ? "☀ Light Mode"
                : "🌙 Dark Mode";

    });

}

// ========================================
// EXPORT RECORDS (CSV)
// ========================================

window.exportCSV = () => {

    const table =
        document.getElementById("records");

    if (!table) return;

    let csv = [];

    table.querySelectorAll("tr").forEach(row => {

        const cols = [...row.querySelectorAll("td,th")];

        csv.push(

            cols
                .map(col =>
                    `"${col.innerText.replace(/"/g, '""')}"`
                )
                .join(",")

        );

    });

    const blob = new Blob(

        [csv.join("\n")],

        { type: "text/csv;charset=utf-8;" }

    );

    const link =
        document.createElement("a");

    link.href =
        URL.createObjectURL(blob);

    link.download =
        `Treasury_Report_${Date.now()}.csv`;

    link.click();

};

// ========================================
// AUTO REFRESH
// ========================================

setInterval(async () => {

    try {

        await refresh();

        await loadAnalytics();

    }

    catch (error) {

        console.error(error);

    }

}, 30000);

// ========================================
// SYSTEM INITIALIZATION
// ========================================

async function initializeDashboard() {

    try {

        await Promise.all([

            refresh(),

            loadAnalytics()

        ]);

        console.log(
            "Dalubwikaan Treasury System Ready."
        );

    }

    catch (error) {

        console.error(
            "Initialization Error:",
            error
        );

    }

}

initializeDashboard();

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

window.addEventListener("error", event => {

    console.error(

        "Unexpected Error:",

        event.error

    );

});

// ========================================
// UNHANDLED PROMISES
// ========================================

window.addEventListener(

    "unhandledrejection",

    event => {

        console.error(

            "Unhandled Promise:",

            event.reason

        );

    }

);

// ========================================
// SECURITY
// ========================================

// Disable right-click (optional)
document.addEventListener("contextmenu", e => {
    e.preventDefault();
});

// Disable common developer shortcuts (optional)
document.addEventListener("keydown", e => {

    if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && e.key.toUpperCase() === "U")
    ) {

        e.preventDefault();

    }

});

// ========================================
// VERSION
// ========================================

console.log(`
=========================================
DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
Version: 2.0
Firebase + Authentication
Firestore CRUD
Storage
Analytics
Audit Trail
Dark Mode
CSV Export
=========================================
`);
