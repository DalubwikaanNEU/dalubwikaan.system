// ======================================================
// DALUBWIKAAN TREASURY DASHBOARD
// VERSION 19.0
// PART 1 - CORE SYSTEM
// ======================================================

// ======================================================
// FIREBASE
// ======================================================

import { db } from "./firebase.js";

import {

    collection,
    query,
    orderBy,
    onSnapshot

} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


// ======================================================
// GLOBAL CACHE
// ======================================================

const cache = {

    collections: [],
    projects: [],
    expenses: [],
    announcements: []

};


// ======================================================
// DASHBOARD STATE
// ======================================================

const dashboard = {

    totalCollections: 0,
    totalExpenses: 0,
    totalBudget: 0,
    remainingBalance: 0

};


// ======================================================
// HELPERS
// ======================================================

function $(id){

    return document.getElementById(id);

}

function setText(id,value){

    const element = $(id);

    if(element){

        element.textContent = value;

    }

}

function peso(value){

    return "₱" +

    Number(value || 0).toLocaleString(

        "en-PH",

        {

            minimumFractionDigits:2,
            maximumFractionDigits:2

        }

    );

}

function notify(message){

    console.log(message);

}


// ======================================================
// LOADER
// ======================================================

function hideLoader(){

    const loader = $("loader");

    if(!loader) return;

    loader.style.opacity = "0";

    setTimeout(()=>{

        loader.style.display="none";

    },400);

}


// ======================================================
// INITIALIZER
// ======================================================

function initializeDashboard(){

    console.log("Loading Dashboard v19...");

    loadCollections();

    loadProjects();

    loadExpenses();

    loadAnnouncements();

}


// ======================================================
// COLLECTIONS MODULE
// VERSION 19.0
// PART 2
// ======================================================

function loadCollections(){

    const q = query(

        collection(db,"collections"),

        orderBy("createdAt","desc")

    );

    onSnapshot(q,(snapshot)=>{

        cache.collections = [];

        let totalCollections = 0;

        const yearlyTotals = {

            "First Year":0,
            "Second Year":0,
            "Third Year":0,
            "Fourth Year":0

        };

        const table = $("transactionTable");

        if(table){

            table.innerHTML = "";

        }

        snapshot.forEach(docSnap=>{

            const data = docSnap.data();

            cache.collections.push({

                id:docSnap.id,

                ...data

            });

            const amount = Number(data.amount || 0);

            totalCollections += amount;

            const year = data.yearLevel || "";

            if(yearlyTotals[year] !== undefined){

                yearlyTotals[year] += amount;

            }

            if(table){

                table.innerHTML += `

                <tr>

                    <td>${data.date || "-"}</td>

                    <td>${year || "-"}</td>

                    <td>${peso(amount)}</td>

                    <td>${data.paymentType || "-"}</td>

                </tr>

                `;

            }

        });

        if(table && snapshot.empty){

            table.innerHTML = `

            <tr>

                <td colspan="4">

                    No collections found.

                </td>

            </tr>

            `;

        }

        dashboard.totalCollections = totalCollections;

        setText(

            "totalFunds",

            peso(totalCollections)

        );

        setText(

            "firstYear",

            peso(yearlyTotals["First Year"])

        );

        setText(

            "secondYear",

            peso(yearlyTotals["Second Year"])

        );

        setText(

            "thirdYear",

            peso(yearlyTotals["Third Year"])

        );

        setText(

            "fourthYear",

            peso(yearlyTotals["Fourth Year"])

        );

        loadSummary();

        renderCharts();

    },

    (error)=>{

        console.error(error);

    });

}

// ======================================================
// START SYSTEM
// ======================================================

window.addEventListener("load",()=>{

    initializeDashboard();

    setTimeout(hideLoader,800);

});


// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

window.addEventListener("error",(event)=>{

    console.error(event.error);

});

window.addEventListener("unhandledrejection",(event)=>{

    console.error(event.reason);

});


console.log("Dashboard Core Ready.");

// ======================================================
// EXPENSES MODULE
// VERSION 19.0
// PART 3
// ======================================================

// ======================================================
// LOAD EXPENSES (REALTIME)
// ======================================================

function loadExpenses() {

    const container = $("expenseContainer");

    if (!container) return;

    const q = query(
        collection(db, "expenses"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {

        cache.expenses = [];

        snapshot.forEach(docSnap => {

            cache.expenses.push({

                id: docSnap.id,

                ...docSnap.data()

            });

        });

        renderExpenses();

        loadSummary();

    }, (error) => {

        console.error(error);

        notify(error.message, "error");

    });

}

// ======================================================
// RENDER EXPENSES
// ======================================================

function renderExpenses() {

    const container = $("expenseContainer");

    if (!container) return;

    if (cache.expenses.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                No expenses found.
            </div>
        `;

        return;

    }

    container.innerHTML = "";

    cache.expenses.forEach(expense => {

        container.innerHTML += `

        <div class="data-card">

            <h3>${expense.project || "Expense"}</h3>

            <p>${expense.description || ""}</p>

            <p>
                <strong>Amount:</strong>
                ${peso(expense.amount)}
            </p>

            <button onclick="deleteExpense('${expense.id}')">
                Delete
            </button>

        </div>

        `;

    });

}

// ======================================================
// ADD EXPENSE
// ======================================================

async function addExpense(data) {

    try {

        await addDoc(

            collection(db, "expenses"),

            {

                ...data,

                createdAt: serverTimestamp()

            }

        );

        notify("Expense added.");

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

}

// ======================================================
// DELETE EXPENSE
// ======================================================

window.deleteExpense = async function(id){

    if(!confirm("Delete expense?")) return;

    try{

        await deleteDoc(

            doc(db,"expenses",id)

        );

        notify("Expense deleted.");

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

};

// ======================================================
// EXPENSE FORM
// ======================================================

const expenseForm = $("expenseForm");

if(expenseForm){

    expenseForm.addEventListener("submit", async(e)=>{

        e.preventDefault();

        await addExpense({

            project: getValue("expenseProject"),

            description: getValue("expenseDescription"),

            amount: Number(
                getValue("expenseAmount")
            )

        });

        expenseForm.reset();

    });

}

// ======================================================
// COLLECTIONS MODULE
// VERSION 19.0
// PART 4
// ======================================================

// ======================================================
// LOAD COLLECTIONS (REALTIME)
// ======================================================

function loadCollections() {

    const container = $("collectionContainer");

    if (!container) return;

    const q = query(
        collection(db, "collections"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {

        cache.collections = [];

        snapshot.forEach(docSnap => {

            cache.collections.push({

                id: docSnap.id,

                ...docSnap.data()

            });

        });

        renderCollections();

        loadSummary();

    }, (error) => {

        console.error(error);

        notify(error.message, "error");

    });

}

// ======================================================
// RENDER COLLECTIONS
// ======================================================

function renderCollections() {

    const container = $("collectionContainer");

    if (!container) return;

    if (cache.collections.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                No collections found.
            </div>
        `;

        return;

    }

    container.innerHTML = "";

    cache.collections.forEach(item => {

        container.innerHTML += `

        <div class="data-card">

            <h3>${item.studentName || "Student"}</h3>

            <p>
                <strong>Year:</strong>
                ${item.yearLevel || "-"}
            </p>

            <p>
                <strong>Payment:</strong>
                ${item.paymentType || "-"}
            </p>

            <p>
                <strong>Amount:</strong>
                ${peso(item.amount)}
            </p>

            <p>
                <strong>Date:</strong>
                ${item.date || "-"}
            </p>

            <button onclick="deleteCollection('${item.id}')">
                Delete
            </button>

        </div>

        `;

    });

}

// ======================================================
// ADD COLLECTION
// ======================================================

async function addCollection(data){

    try{

        await addDoc(

            collection(db,"collections"),

            {

                ...data,

                createdAt: serverTimestamp()

            }

        );

        notify("Collection saved.");

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

}

// ======================================================
// DELETE COLLECTION
// ======================================================

window.deleteCollection = async function(id){

    if(!confirm("Delete collection?")) return;

    try{

        await deleteDoc(

            doc(db,"collections",id)

        );

        notify("Collection deleted.");

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

};

// ======================================================
// COLLECTION FORM
// ======================================================

const collectionForm = $("collectionForm");

if(collectionForm){

    collectionForm.addEventListener("submit", async(e)=>{

        e.preventDefault();

        await addCollection({

            studentName: getValue("studentName"),

            studentId: getValue("studentId"),

            course: getValue("course"),

            yearLevel: getValue("yearLevel"),

            paymentType: getValue("paymentType"),

            amount: Number(
                getValue("amount")
            ),

            date: getValue("date"),

            remarks: getValue("remarks")

        });

        collectionForm.reset();

    });

}

// =====================================================
// DASHBOARD SUMMARY
// VERSION 19.0
// PART 5
// =====================================================

function loadSummary() {

    // -------------------------
    // COLLECTIONS
    // -------------------------

    const totalCollections = cache.collections.reduce(

        (sum, item) =>

            sum + Number(item.amount || 0),

        0

    );

    // -------------------------
    // EXPENSES
    // -------------------------

    const manualExpenses = cache.expenses.reduce(

        (sum, item) =>

            sum + Number(item.amount || 0),

        0

    );

    // -------------------------
    // PROJECT ACTUAL EXPENSES
    // -------------------------

    const projectExpenses = cache.projects.reduce(

        (sum, project) =>

            sum + Number(project.actualExpenses || 0),

        0

    );

    const totalExpenses =
        manualExpenses +
        projectExpenses;

    const currentBalance =
        totalCollections -
        totalExpenses;

    // -------------------------
    // COUNTS
    // -------------------------

    setText(
        "projectCount",
        cache.projects.length
    );

    setText(
        "expenseCount",
        cache.expenses.length
    );

    setText(
        "collectionCount",
        cache.collections.length
    );

    // -------------------------
    // MONEY
    // -------------------------

    setText(
        "totalCollections",
        peso(totalCollections)
    );

    setText(
        "totalExpenses",
        peso(totalExpenses)
    );

    setText(
        "currentBalance",
        peso(currentBalance)
    );

    // -------------------------
    // YEAR LEVEL TOTALS
    // -------------------------

    let firstYear = 0;
    let secondYear = 0;
    let thirdYear = 0;
    let fourthYear = 0;

    cache.collections.forEach(item=>{

        const year =
            String(item.yearLevel || "")
            .toLowerCase();

        const amount =
            Number(item.amount || 0);

        if(
            year.includes("1") ||
            year.includes("first")
        ){

            firstYear += amount;

        }

        else if(
            year.includes("2") ||
            year.includes("second")
        ){

            secondYear += amount;

        }

        else if(
            year.includes("3") ||
            year.includes("third")
        ){

            thirdYear += amount;

        }

        else if(
            year.includes("4") ||
            year.includes("fourth")
        ){

            fourthYear += amount;

        }

    });

    setText(
        "firstYearCollection",
        peso(firstYear)
    );

    setText(
        "secondYearCollection",
        peso(secondYear)
    );

    setText(
        "thirdYearCollection",
        peso(thirdYear)
    );

    setText(
        "fourthYearCollection",
        peso(fourthYear)
    );

    // -------------------------
    // STATUS
    // -------------------------

    const status =
        $("dashboardStatus");

    if(status){

        if(currentBalance < 0){

            status.textContent =
                "🔴 Deficit";

        }

        else if(currentBalance === 0){

            status.textContent =
                "🟡 Balanced";

        }

        else{

            status.textContent =
                "🟢 Healthy";

        }

    }

    console.log("Dashboard Summary Updated");

}
// =====================================================
// ANNOUNCEMENTS MODULE
// VERSION 19.0
// PART 6
// =====================================================

// =====================================================
// LOAD ANNOUNCEMENTS (REALTIME)
// =====================================================

function loadAnnouncements() {

    const container = $("announcementContainer");

    if (!container) return;

    const q = query(
        collection(db, "announcements"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {

        cache.announcements = [];

        snapshot.forEach(docSnap => {

            cache.announcements.push({

                id: docSnap.id,

                ...docSnap.data()

            });

        });

        renderAnnouncements();

    }, (error) => {

        console.error(error);

        notify(error.message, "error");

    });

}

// =====================================================
// RENDER ANNOUNCEMENTS
// =====================================================

function renderAnnouncements() {

    const container = $("announcementContainer");

    if (!container) return;

    if (cache.announcements.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                No announcements available.
            </div>
        `;

        return;

    }

    container.innerHTML = "";

    cache.announcements.forEach(item => {

        container.innerHTML += `

            <div class="announcement-card">

                <h3>${item.title || "Announcement"}</h3>

                <p>${item.message || ""}</p>

                <small>

                    ${item.author || "Administrator"}

                </small>

            </div>

        `;

    });

}

// =====================================================
// ADD ANNOUNCEMENT
// =====================================================

async function addAnnouncement(data){

    try{

        await addDoc(

            collection(db,"announcements"),

            {

                ...data,

                author: auth.currentUser?.email || "Admin",

                createdAt: serverTimestamp()

            }

        );

        notify("Announcement posted.");

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

}

// =====================================================
// DELETE ANNOUNCEMENT
// =====================================================

window.deleteAnnouncement = async function(id){

    if(!confirm("Delete announcement?")) return;

    try{

        await deleteDoc(

            doc(db,"announcements",id)

        );

        notify("Announcement deleted.");

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

};

// =====================================================
// ANNOUNCEMENT FORM
// =====================================================

const announcementForm = $("announcementForm");

if(announcementForm){

    announcementForm.addEventListener("submit", async(e)=>{

        e.preventDefault();

        await addAnnouncement({

            title: getValue("announcementTitle"),

            message: getValue("announcementMessage")

        });

        announcementForm.reset();

    });

}

// =====================================================
// DASHBOARD STARTUP
// VERSION 19.0
// PART 7 (FINAL)
// =====================================================

// =====================================================
// OPTIONAL CHART PLACEHOLDER
// =====================================================

function renderCharts(){

    if(typeof Chart === "undefined"){

        console.log("Chart.js not loaded.");

        return;

    }

    console.log("Charts ready.");

}

// =====================================================
// REFRESH DASHBOARD
// =====================================================

function refreshDashboard(){

    loadProjects();

    loadExpenses();

    loadCollections();

    loadAnnouncements();

    loadSummary();

    renderCharts();

    console.log("Dashboard refreshed.");

}

// =====================================================
// SYSTEM INITIALIZER
// =====================================================

function initializeDashboard(){

    console.log("--------------------------------");

    console.log("DALUBWIKAAN DASHBOARD");

    console.log("Version 19.0");

    console.log("--------------------------------");

    loadProjects();

    loadExpenses();

    loadCollections();

    loadAnnouncements();

    renderCharts();

}

// =====================================================
// AUTH
// =====================================================

onAuthStateChanged(auth,(user)=>{

    if(!user){

        window.location.href="login.html";

        return;

    }

    initializeDashboard();

});

// =====================================================
// OPTIONAL REFRESH BUTTON
// =====================================================

const refreshButton = $("refreshDashboard");

if(refreshButton){

    refreshButton.addEventListener(

        "click",

        refreshDashboard

    );

}

// =====================================================
// SEARCH
// =====================================================

const searchInput = $("searchInput");

if(searchInput){

    searchInput.addEventListener("input",()=>{

        const keyword =
        searchInput.value.toLowerCase();

        document
        .querySelectorAll(
            ".data-card,.announcement-card"
        )
        .forEach(card=>{

            card.style.display =
            card.innerText
            .toLowerCase()
            .includes(keyword)
            ? ""
            : "none";

        });

    });

}

// =====================================================
// WINDOW ERROR LOGGER
// =====================================================

window.addEventListener("error",(event)=>{

    console.error(

        "Dashboard Error:",

        event.error

    );

});

window.addEventListener(

    "unhandledrejection",

    event=>{

        console.error(

            "Promise Error:",

            event.reason

        );

    }

);

// =====================================================
// READY
// =====================================================

console.log("Dashboard.js loaded successfully.");
