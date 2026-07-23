// ========================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// ADMIN PANEL v16.0
// PART 1 - CORE SYSTEM
// ========================================

// ========================================
// FIREBASE IMPORTS
// ========================================

import { db, storage } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    deleteDoc,
    updateDoc,
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

// ========================================
// GLOBAL VARIABLES
// ========================================

const auth = getAuth();

let currentUser = null;
let selectedReceiptFile = null;

// Cache
let projectCache = [];
let expenseCache = [];
let recordCache = [];
let announcementCache = [];
let collectionCache = [];

// ========================================
// HELPER FUNCTIONS
// ========================================

function getValue(id) {
    const element = document.getElementById(id);

    if (!element) {
        console.warn(`Missing element: ${id}`);
        return "";
    }

    return element.value.trim();
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function peso(value) {
    return "₱" + Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function notify(message, type = "info") {

    console.log(`[${type}] ${message}`);

    // Replace this with Toastify/SweetAlert later if desired.
    alert(message);
}

// ========================================
// LOADER
// ========================================

function hideLoader() {

    const loader = document.getElementById("loader");

    if (!loader) return;

    loader.style.opacity = "0";

    setTimeout(() => {

        loader.style.display = "none";

    }, 300);
}

window.addEventListener("load", () => {

    setTimeout(hideLoader, 800);

});

// ========================================
// AUTHENTICATION
// ========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {

        const adminRef = doc(db, "admins", user.uid);
        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {

            notify("Unauthorized admin account.", "error");

            await signOut(auth);

            window.location.href = "login.html";

            return;
        }

        currentUser = user;

        const email = document.getElementById("adminEmail");

        if (email) {
            email.textContent = user.email;
        }

        await initializeDashboard();

    } catch (error) {

        console.error("AUTH ERROR:", error);

        notify(error.message, "error");
    }
});

// ========================================
// LOGOUT
// ========================================

const logoutButton = document.getElementById("logout");

if (logoutButton) {

    logoutButton.onclick = async () => {

        await signOut(auth);

        window.location.href = "login.html";

    };

}

// ========================================
// DASHBOARD INITIALIZER
// ========================================

async function initializeDashboard() {

    console.log("Loading Dalubwikaan Treasury System...");

    try {

        await Promise.all([

            loadProjects(),

            loadExpenses(),

            loadRecords(),

            loadAnnouncements(),

            // We'll create this in Part 6
            typeof loadCollections === "function"
                ? loadCollections()
                : Promise.resolve(),

            loadSummary()

        ]);

        console.log("SYSTEM READY");

    } catch (error) {

        console.error("Dashboard Error:", error);

        notify("Failed to initialize dashboard.", "error");
    }

}

// ========================================
// GLOBAL ERROR MONITOR
// ========================================

window.addEventListener("error", (event) => {

    console.error("JavaScript Error:", event.error);

});

window.addEventListener("unhandledrejection", (event) => {

    console.error("Unhandled Promise:", event.reason);

});
// ========================================
// PROJECT MANAGEMENT
// v16.0
// ========================================

// Cache
projectCache = [];

// ========================================
// LOAD PROJECTS
// ========================================

async function loadProjects() {

    const container = document.getElementById("projectContainer");

    if (!container) return;

    try {

        const snapshot = await getDocs(
            query(
                collection(db, "projects"),
                orderBy("createdAt", "desc")
            )
        );

        projectCache = [];

        container.innerHTML = "";

        if (snapshot.empty) {

            container.innerHTML = `
                <div class="empty-state">
                    No projects found.
                </div>
            `;

            return;
        }

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            projectCache.push({
                id: docSnap.id,
                ...data
            });

            container.innerHTML += `
                <div class="data-card">

                    <h3>🏗 ${data.name || "Project"}</h3>

                    <p>${data.description || ""}</p>

                    <p>
                        <strong>Status:</strong>
                        ${data.status || "N/A"}
                    </p>

                    <p>
                        <strong>Budget:</strong>
                        ${peso(data.budget)}
                    </p>

                    <br>

                    <button onclick="editProject('${docSnap.id}')">
                        ✏ Edit
                    </button>

                    <button onclick="deleteProject('${docSnap.id}')">
                        🗑 Delete
                    </button>

                </div>
            `;
        });

    } catch (error) {

        console.error("LOAD PROJECT ERROR:", error);

        notify(error.message, "error");
    }

}

// ========================================
// ADD PROJECT
// ========================================

async function addProject(data) {

    try {

        await addDoc(
            collection(db, "projects"),
            {
                ...data,
                createdAt: serverTimestamp()
            }
        );

        notify("Project saved!");

        await loadProjects();

        await loadSummary();

    } catch (error) {

        console.error(error);

        notify(error.message, "error");
    }

}

// ========================================
// PROJECT FORM
// ========================================

const projectForm = document.getElementById("projectForm");

if (projectForm) {

    projectForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name = getValue("projectName");
        const budget = Number(getValue("projectBudget"));
        const description = getValue("description");
        const status = getValue("projectStatus");

        if (!name) {
            notify("Project name is required.");
            return;
        }

        if (budget < 0 || isNaN(budget)) {
            notify("Invalid project budget.");
            return;
        }

        await addProject({
            name,
            budget,
            description,
            status
        });

        projectForm.reset();

    });

}

// ========================================
// EDIT PROJECT
// ========================================

window.editProject = async function(id) {

    try {

        const refDoc = doc(db, "projects", id);

        const snap = await getDoc(refDoc);

        if (!snap.exists()) return;

        const data = snap.data();

        const name = prompt(
            "Project Name",
            data.name || ""
        );

        if (name === null) return;

        const budget = prompt(
            "Project Budget",
            data.budget || 0
        );

        if (budget === null) return;

        const description = prompt(
            "Description",
            data.description || ""
        );

        if (description === null) return;

        const status = prompt(
            "Status",
            data.status || ""
        );

        if (status === null) return;

        await updateDoc(refDoc, {

            name,

            budget: Number(budget),

            description,

            status,

            updatedAt: serverTimestamp()

        });

        notify("Project updated!");

        await loadProjects();

        await loadSummary();

    } catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

};

// ========================================
// DELETE PROJECT
// ========================================

window.deleteProject = async function(id) {

    if (!confirm("Delete this project?")) return;

    try {

        await deleteDoc(
            doc(db, "projects", id)
        );

        notify("Project deleted!");

        await loadProjects();

        await loadSummary();

    } catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

};
// ========================================
// EXPENSE MANAGEMENT
// v16.0
// ========================================

// Cache
expenseCache = [];

selectedReceiptFile = null;

// ========================================
// RECEIPT INPUT
// ========================================

const receiptInput = document.getElementById("receipt");

if (receiptInput) {

    receiptInput.addEventListener("change", (event) => {

        selectedReceiptFile = event.target.files[0] || null;

        const preview = document.getElementById("receiptPreview");

        if (!preview) return;

        if (selectedReceiptFile) {

            preview.innerHTML = `
                <div>
                    🧾 ${selectedReceiptFile.name}
                </div>
            `;

        } else {

            preview.innerHTML = "";

        }

    });

}

// ========================================
// LOAD EXPENSES
// ========================================

async function loadExpenses() {

    const container = document.getElementById("expenseContainer");

    if (!container) return;

    try {

        const snapshot = await getDocs(
            query(
                collection(db, "expenses"),
                orderBy("createdAt", "desc")
            )
        );

        expenseCache = [];

        container.innerHTML = "";

        if (snapshot.empty) {

            container.innerHTML = `
                <div class="empty-state">
                    No expenses found.
                </div>
            `;

            return;

        }

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            expenseCache.push({
                id: docSnap.id,
                ...data
            });

            container.innerHTML += `

                <div class="data-card">

                    <h3>💸 ${data.category || "Expense"}</h3>

                    <p>${data.description || ""}</p>

                    <p>
                        <strong>Amount:</strong>
                        ${peso(data.amount)}
                    </p>

                    ${
                        data.receiptURL
                        ?
                        `<p>
                            <a href="${data.receiptURL}" target="_blank">
                                📄 View Receipt
                            </a>
                        </p>`
                        :
                        ""
                    }

                    <button onclick="deleteExpense('${docSnap.id}')">
                        🗑 Delete
                    </button>

                </div>

            `;

        });

    } catch (error) {

        console.error("LOAD EXPENSE ERROR:", error);

        notify(error.message, "error");

    }

}

// ========================================
// ADD EXPENSE
// ========================================

async function addExpense(data) {

    try {

        let receiptURL = "";

        if (selectedReceiptFile) {

            const storageRef = ref(

                storage,

                `receipts/${Date.now()}_${selectedReceiptFile.name}`

            );

            await uploadBytes(storageRef, selectedReceiptFile);

            receiptURL = await getDownloadURL(storageRef);

        }

        await addDoc(

            collection(db, "expenses"),

            {

                ...data,

                receiptURL,

                createdAt: serverTimestamp()

            }

        );

        selectedReceiptFile = null;

        if (receiptInput) receiptInput.value = "";

        const preview = document.getElementById("receiptPreview");

        if (preview) preview.innerHTML = "";

        notify("Expense saved!");

        await loadExpenses();

        await loadSummary();

    }

    catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

}

// ========================================
// EXPENSE FORM
// ========================================

const expenseForm = document.getElementById("expenseForm");

if (expenseForm) {

    expenseForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const category = getValue("expenseProject");

        const amount = Number(getValue("expenseAmount"));

        const description = getValue("expenseDescription");

        if (!category) {

            notify("Select an expense category.");

            return;

        }

        if (isNaN(amount) || amount <= 0) {

            notify("Invalid amount.");

            return;

        }

        await addExpense({

            category,

            amount,

            description

        });

        expenseForm.reset();

    });

}

// ========================================
// DELETE EXPENSE
// ========================================

window.deleteExpense = async function(id) {

    if (!confirm("Delete this expense?")) return;

    try {

        await deleteDoc(

            doc(db, "expenses", id)

        );

        notify("Expense deleted!");

        await loadExpenses();

        await loadSummary();

    }

    catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

};
// ========================================
// FINANCIAL RECORDS SYSTEM
// v16.0
// ========================================

// Cache
recordCache = [];

// ========================================
// LOAD RECORDS
// ========================================

async function loadRecords() {

    const container = document.getElementById("recordContainer");

    if (!container) return;

    try {

        const snapshot = await getDocs(
            query(
                collection(db, "records"),
                orderBy("createdAt", "desc")
            )
        );

        recordCache = [];

        container.innerHTML = "";

        if (snapshot.empty) {

            container.innerHTML = `
                <div class="empty-state">
                    No records found.
                </div>
            `;

            return;

        }

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            recordCache.push({
                id: docSnap.id,
                ...data
            });

            container.innerHTML += `

                <div class="data-card">

                    <h3>
                        📋 ${data.title || "Untitled Record"}
                    </h3>

                    <p>
                        <strong>Type:</strong>
                        ${data.type || "N/A"}
                    </p>

                    <p>
                        <strong>Amount:</strong>
                        ${peso(data.amount)}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${data.status || "Active"}
                    </p>

                    <br>

                    <button onclick="editRecord('${docSnap.id}')">
                        ✏ Edit
                    </button>

                    <button onclick="deleteRecord('${docSnap.id}')">
                        🗑 Delete
                    </button>

                </div>

            `;

        });

    }

    catch (error) {

        console.error("LOAD RECORDS ERROR:", error);

        notify(error.message, "error");

    }

}

// ========================================
// ADD RECORD
// ========================================

async function addRecord(data) {

    try {

        await addDoc(

            collection(db, "records"),

            {

                ...data,

                createdAt: serverTimestamp()

            }

        );

        notify("Record added successfully!");

        await loadRecords();

        await loadSummary();

    }

    catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

}

// ========================================
// RECORD FORM
// ========================================

const recordForm = document.getElementById("recordForm");

if (recordForm) {

    recordForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const title = getValue("recordTitle");

        const type = getValue("recordType");

        const amount = Number(getValue("recordAmount"));

        const status = getValue("recordStatus");

        if (!title) {

            notify("Record title is required.");

            return;

        }

        if (isNaN(amount) || amount < 0) {

            notify("Invalid amount.");

            return;

        }

        await addRecord({

            title,

            type,

            amount,

            status

        });

        recordForm.reset();

    });

}

// ========================================
// EDIT RECORD
// ========================================

window.editRecord = async function(id) {

    try {

        const recordRef = doc(db, "records", id);

        const snap = await getDoc(recordRef);

        if (!snap.exists()) return;

        const data = snap.data();

        const title = prompt(
            "Record Title",
            data.title || ""
        );

        if (title === null) return;

        const type = prompt(
            "Record Type",
            data.type || ""
        );

        if (type === null) return;

        const amount = prompt(
            "Amount",
            data.amount || 0
        );

        if (amount === null) return;

        const status = prompt(
            "Status",
            data.status || "Active"
        );

        if (status === null) return;

        await updateDoc(recordRef, {

            title,

            type,

            amount: Number(amount),

            status,

            updatedAt: serverTimestamp()

        });

        notify("Record updated!");

        await loadRecords();

        await loadSummary();

    }

    catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

};

// ========================================
// DELETE RECORD
// ========================================

window.deleteRecord = async function(id) {

    if (!confirm("Delete this record?")) return;

    try {

        await deleteDoc(

            doc(db, "records", id)

        );

        notify("Record deleted!");

        await loadRecords();

        await loadSummary();

    }

    catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

};
// ========================================
// ANNOUNCEMENT MANAGEMENT SYSTEM
// v16.0
// ========================================

// Cache
announcementCache = [];

// ========================================
// LOAD ANNOUNCEMENTS
// ========================================

async function loadAnnouncements() {

    const container = document.getElementById("adminAnnouncementContainer");

    if (!container) return;

    try {

        const snapshot = await getDocs(
            query(
                collection(db, "announcements"),
                orderBy("createdAt", "desc")
            )
        );

        announcementCache = [];

        container.innerHTML = "";

        if (snapshot.empty) {

            container.innerHTML = `
                <div class="empty-state">
                    📢 No announcements yet.
                </div>
            `;

            return;
        }

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            announcementCache.push({
                id: docSnap.id,
                ...data
            });

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
                        <strong>${data.author || "Admin"}</strong>
                    </small>

                    <br><br>

                    <button onclick="editAnnouncement('${docSnap.id}')">
                        ✏ Edit
                    </button>

                    <button onclick="deleteAnnouncement('${docSnap.id}')">
                        🗑 Delete
                    </button>

                </div>

            `;

        });

    }

    catch (error) {

        console.error("LOAD ANNOUNCEMENT ERROR:", error);

        notify(error.message, "error");

    }

}

// ========================================
// ADD ANNOUNCEMENT
// ========================================

async function addAnnouncement(data) {

    try {

        await addDoc(

            collection(db, "announcements"),

            {

                ...data,

                author: currentUser?.email || "Admin",

                createdAt: serverTimestamp()

            }

        );

        notify("Announcement posted!");

        await loadAnnouncements();

    }

    catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

}

// ========================================
// ANNOUNCEMENT FORM
// ========================================

const announcementForm = document.getElementById("announcementForm");

if (announcementForm) {

    announcementForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const title = getValue("announcementTitle");

        const message = getValue("announcementMessage");

        if (!title) {

            notify("Announcement title is required.");

            return;

        }

        if (!message) {

            notify("Announcement message is required.");

            return;

        }

        await addAnnouncement({

            title,

            message

        });

        announcementForm.reset();

    });

}

// ========================================
// EDIT ANNOUNCEMENT
// ========================================

window.editAnnouncement = async function(id) {

    try {

        const announcementRef = doc(db, "announcements", id);

        const snap = await getDoc(announcementRef);

        if (!snap.exists()) return;

        const data = snap.data();

        const title = prompt(
            "Announcement Title",
            data.title || ""
        );

        if (title === null) return;

        const message = prompt(
            "Announcement Message",
            data.message || ""
        );

        if (message === null) return;

        await updateDoc(

            announcementRef,

            {

                title,

                message,

                updatedAt: serverTimestamp()

            }

        );

        notify("Announcement updated!");

        await loadAnnouncements();

    }

    catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

};

// ========================================
// DELETE ANNOUNCEMENT
// ========================================

window.deleteAnnouncement = async function(id) {

    if (!confirm("Delete this announcement?")) return;

    try {

        await deleteDoc(

            doc(db, "announcements", id)

        );

        notify("Announcement deleted!");

        await loadAnnouncements();

    }

    catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

};
// ========================================
// COLLECTION MANAGEMENT
// v16.0 (FIXED)
// ========================================

// Cache
collectionCache = [];

// ========================================
// LOAD COLLECTIONS
// ========================================

async function loadCollections() {

    const container = document.getElementById("collectionContainer");

    if (!container) return;

    try {

        const snapshot = await getDocs(
            query(
                collection(db, "collections"),
                orderBy("createdAt", "desc")
            )
        );

        collectionCache = [];

        container.innerHTML = "";

        if (snapshot.empty) {

            container.innerHTML = `
                <div class="empty-state">
                    No collections found.
                </div>
            `;

            return;
        }

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            collectionCache.push({
                id: docSnap.id,
                ...data
            });

            container.innerHTML += `

                <div class="data-card">

                    <h3>👤 ${data.studentName || "Unknown Student"}</h3>

                    <p>
                        <strong>Student ID:</strong>
                        ${data.studentId || "N/A"}
                    </p>

                    <p>
                        <strong>Course:</strong>
                        ${data.course || "N/A"}
                    </p>

                    <p>
                        <strong>Year Level:</strong>
                        ${data.yearLevel || "N/A"}
                    </p>

                    <p>
                        <strong>Payment Type:</strong>
                        ${data.paymentType || "N/A"}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${data.date || "-"}
                    </p>

                    <p>
                        <strong>Amount:</strong>
                        ${peso(data.amount)}
                    </p>

                    <p>
                        <strong>Remarks:</strong>
                        ${data.remarks || "-"}
                    </p>

                    <br>

                    <button onclick="editCollection('${docSnap.id}')">
                        ✏ Edit
                    </button>

                    <button onclick="deleteCollection('${docSnap.id}')">
                        🗑 Delete
                    </button>

                </div>

            `;

        });

    }

    catch(error){

        console.error("LOAD COLLECTION ERROR:", error);

        notify(error.message,"error");

    }

}

// ========================================
// ADD COLLECTION
// ========================================

async function addCollection(data){

    try{

        await addDoc(

            collection(db,"collections"),

            {

                ...data,

                createdAt: serverTimestamp()

            }

        );

        notify("Collection saved!");

        await loadCollections();

        await loadSummary();

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

}

// ========================================
// COLLECTION FORM
// ========================================

const collectionForm =
document.getElementById("collectionForm");

if(collectionForm){

    collectionForm.addEventListener("submit",async(e)=>{

        e.preventDefault();

        //const studentName =
        //getValue("studentName");

        const studentId =
        getValue("studentId");

        const course =
        getValue("course");

        const yearLevel =
        getValue("yearLevel");

        //const paymentType =
        //getValue("paymentType");

        const amount =
        Number(getValue("amount"));

        const date =
        getValue("date");

        const remarks =
        getValue("remarks");

        //if(!studentName){

        //    notify("Student name is required.");

        //    return;

        //}

        if(isNaN(amount) || amount<=0){

            notify("Invalid amount.");

            return;

        }

        await addCollection({

            //studentName,

            //studentId,

            //course,

            yearLevel,

            //paymentType,

            amount,

            date,

            remarks

        });

        collectionForm.reset();

    });

}

// ========================================
// EDIT COLLECTION
// ========================================

window.editCollection =
async function(id){

    try{

        const refDoc =
        doc(db,"collections",id);

        const snap =
        await getDoc(refDoc);

        if(!snap.exists()) return;

        const data =
        snap.data();

        const amount =
        prompt(
            "Collection Amount",
            data.amount
        );

        if(amount===null) return;

        const remarks =
        prompt(
            "Remarks",
            data.remarks || ""
        );

        if(remarks===null) return;

        await updateDoc(

            refDoc,

            {

                amount:Number(amount),

                remarks,

                updatedAt:serverTimestamp()

            }

        );

        notify("Collection updated!");

        await loadCollections();

        await loadSummary();

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

};

// ========================================
// DELETE COLLECTION
// ========================================

window.deleteCollection =
async function(id){

    if(!confirm("Delete this collection?"))
        return;

    try{

        await deleteDoc(

            doc(db,"collections",id)

        );

        notify("Collection deleted!");

        await loadCollections();

        await loadSummary();

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

};
// ========================================
// SUMMARY SYSTEM
// v16.0
// ========================================

async function loadSummary() {

    try {

        // ----------------------------
        // Totals
        // ----------------------------

        let totalCollections = 0;
        let totalExpenses = 0;

        let firstYear = 0;
        let secondYear = 0;
        let thirdYear = 0;
        let fourthYear = 0;

        // ----------------------------
        // COLLECTIONS
        // ----------------------------

        const collectionSnap = await getDocs(
            collection(db, "collections")
        );

        collectionSnap.forEach(docSnap => {

            const data = docSnap.data();

            const amount = Number(data.amount) || 0;

            totalCollections += amount;

            const level = (data.yearLevel || "").toLowerCase();

            if (
                level.includes("1") ||
                level.includes("first")
            ) {

                firstYear += amount;

            }

            else if (
                level.includes("2") ||
                level.includes("second")
            ) {

                secondYear += amount;

            }

            else if (
                level.includes("3") ||
                level.includes("third")
            ) {

                thirdYear += amount;

            }

            else if (
                level.includes("4") ||
                level.includes("fourth")
            ) {

                fourthYear += amount;

            }

        });

        // ----------------------------
        // EXPENSES
        // ----------------------------

        const expenseSnap = await getDocs(
            collection(db, "expenses")
        );

        expenseSnap.forEach(docSnap => {

            const data = docSnap.data();

            totalExpenses += Number(data.amount) || 0;

        });

        // ----------------------------
        // PROJECT COUNT
        // ----------------------------

        const projectSnap = await getDocs(
            collection(db, "projects")
        );

        // ----------------------------
        // RECORD COUNT
        // ----------------------------

        const recordSnap = await getDocs(
            collection(db, "records")
        );

        // ----------------------------
        // ANNOUNCEMENT COUNT
        // ----------------------------

        const announcementSnap = await getDocs(
            collection(db, "announcements")
        );

        // ----------------------------
        // BALANCE
        // ----------------------------

        const balance = totalCollections - totalExpenses;

        // ----------------------------
        // MAIN SUMMARY
        // ----------------------------

        setText(
            "summaryCollections",
            peso(totalCollections)
        );

        setText(
            "totalCollections",
            peso(totalCollections)
        );

        setText(
            "summaryExpenses",
            peso(totalExpenses)
        );

        setText(
            "totalExpenses",
            peso(totalExpenses)
        );

        setText(
            "currentBalance",
            peso(balance)
        );

        setText(
            "totalProjects",
            projectSnap.size
        );

        setText(
            "totalRecords",
            recordSnap.size
        );

        setText(
            "totalAnnouncements",
            announcementSnap.size
        );

        // ----------------------------
        // YEAR LEVEL SUMMARY
        // ----------------------------

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

        console.log("Summary Updated.");

    }

    catch (error) {

        console.error(
            "SUMMARY ERROR:",
            error
        );

        notify(
            error.message,
            "error"
        );

    }

}
// ========================================
// ADVANCED SEARCH SYSTEM
// v16.0
// ========================================

const searchInput = document.getElementById("searchInput");

if (searchInput) {

    searchInput.addEventListener("input", performSearch);

}

// ========================================
// SEARCH FUNCTION
// ========================================

function performSearch() {

    const keyword = searchInput.value
        .trim()
        .toLowerCase();

    const cards = document.querySelectorAll(
        ".data-card, .announcement-card"
    );

    let visibleCount = 0;

    cards.forEach(card => {

        const text = card.textContent.toLowerCase();

        if (
            keyword === "" ||
            text.includes(keyword)
        ) {

            card.style.display = "";

            visibleCount++;

        }

        else {

            card.style.display = "none";

        }

    });

    showSearchResult(visibleCount);

}

// ========================================
// SEARCH RESULT
// ========================================

function showSearchResult(count) {

    let result = document.getElementById("searchResult");

    if (!result) {

        result = document.createElement("div");

        result.id = "searchResult";

        result.className = "search-result";

        const parent =
            searchInput.parentElement;

        parent.appendChild(result);

    }

    if (searchInput.value.trim() === "") {

        result.textContent = "";

        return;

    }

    if (count === 0) {

        result.innerHTML = `
            <p style="color:red;">
                ❌ No results found.
            </p>
        `;

    }

    else {

        result.innerHTML = `
            <p>
                ✅ ${count} result(s) found.
            </p>
        `;

    }

}

// ========================================
// CLEAR SEARCH
// ========================================

function clearSearch() {

    if (!searchInput) return;

    searchInput.value = "";

    performSearch();

}

// ========================================
// OPTIONAL ESC SHORTCUT
// ========================================

document.addEventListener("keydown", (event) => {

    if (
        event.key === "Escape" &&
        document.activeElement === searchInput
    ) {

        clearSearch();

    }

});
// ========================================
// EXPORT TREASURY REPORT
// v16.0
// ========================================

const exportButton = document.getElementById("exportReport");

if (exportButton) {

    exportButton.addEventListener("click", exportTreasuryReport);

}

async function exportTreasuryReport() {

    try {

        notify("Generating treasury report...");

        const report = {

            generatedAt: new Date().toLocaleString("en-PH"),

            projects: projectCache.length,

            expenses: expenseCache.length,

            records: recordCache.length,

            announcements: announcementCache.length,

            collections: collectionCache.length,

            totals: {

                collections:
                    document.getElementById("totalCollections")?.textContent || "₱0.00",

                expenses:
                    document.getElementById("totalExpenses")?.textContent || "₱0.00",

                balance:
                    document.getElementById("currentBalance")?.textContent || "₱0.00"

            },

            breakdown: {

                firstYear:
                    document.getElementById("firstYearCollection")?.textContent || "₱0.00",

                secondYear:
                    document.getElementById("secondYearCollection")?.textContent || "₱0.00",

                thirdYear:
                    document.getElementById("thirdYearCollection")?.textContent || "₱0.00",

                fourthYear:
                    document.getElementById("fourthYearCollection")?.textContent || "₱0.00"

            }

        };

        console.table(report);

        console.log(report);

        // Download JSON report

        const blob = new Blob(

            [
                JSON.stringify(report, null, 4)
            ],

            {
                type: "application/json"
            }

        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download =
            "Dalubwikaan_Treasury_Report_" +
            Date.now() +
            ".json";

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        notify("Treasury report exported successfully.");

    }

    catch (error) {

        console.error(
            "EXPORT ERROR:",
            error
        );

        notify(
            error.message,
            "error"
        );

    }

}
// ========================================
// FIREBASE CONNECTION & SYSTEM STARTUP
// v16.0
// ========================================

async function firebaseConnectionCheck() {

    try {

        console.log("Checking Firebase connection...");

        // Firestore Test
        await getDocs(
            collection(db, "announcements")
        );

        console.log("✅ Firestore Connected");

        // Authentication Test
        if (auth.currentUser) {

            console.log(
                `✅ Logged in as ${auth.currentUser.email}`
            );

        } else {

            console.warn(
                "⚠ No authenticated user."
            );

        }

        console.log("✅ Firebase Ready");

        return true;

    }

    catch (error) {

        console.error(
            "❌ FIREBASE CONNECTION FAILED",
            error
        );

        notify(
            "Unable to connect to Firebase.",
            "error"
        );

        return false;

    }

}

// ========================================
// RELOAD DASHBOARD
// ========================================

async function reloadDashboard() {

    try {

        notify("Refreshing dashboard...");

        await Promise.all([

            loadProjects(),

            loadExpenses(),

            loadRecords(),

            loadAnnouncements(),

            loadCollections(),

            loadSummary()

        ]);

        notify("Dashboard updated.");

    }

    catch (error) {

        console.error(
            "Dashboard Reload Error:",
            error
        );

        notify(
            error.message,
            "error"
        );

    }

}

// ========================================
// START SYSTEM
// ========================================

(async function startSystem() {

    const connected =
        await firebaseConnectionCheck();

    if (!connected) {

        console.warn(
            "System startup cancelled."
        );

        return;

    }

    console.log(`

========================================

📚 DALUBWIKAAN TREASURY SYSTEM

Version: 16.0

========================================

✅ Firebase Connected
✅ Authentication Ready
✅ Dashboard Ready
✅ Projects Ready
✅ Expenses Ready
✅ Records Ready
✅ Announcements Ready
✅ Collections Ready
✅ Summary Ready
✅ Search Ready
✅ Export Ready

🚀 SYSTEM ONLINE

========================================

`);

})();

// ========================================
// OPTIONAL MANUAL REFRESH BUTTON
// ========================================

const refreshButton =
document.getElementById("refreshDashboard");

if (refreshButton) {

    refreshButton.addEventListener(

        "click",

        reloadDashboard

    );

}
// ========================================
// DASHBOARD ANALYTICS
// v16.0
// ========================================

// Analytics Data
const analytics = {
    collections: 0,
    expenses: 0,
    balance: 0,
    projects: 0,
    records: 0,
    announcements: 0
};

// ========================================
// UPDATE ANALYTICS
// ========================================

function updateAnalytics() {

    analytics.collections = collectionCache.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );

    analytics.expenses = expenseCache.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );

    analytics.balance =
        analytics.collections -
        analytics.expenses;

    analytics.projects =
        projectCache.length;

    analytics.records =
        recordCache.length;

    analytics.announcements =
        announcementCache.length;

    displayAnalytics();

}

// ========================================
// DISPLAY ANALYTICS
// ========================================

function displayAnalytics() {

    setText(
        "analyticsCollections",
        peso(analytics.collections)
    );

    setText(
        "analyticsExpenses",
        peso(analytics.expenses)
    );

    setText(
        "analyticsBalance",
        peso(analytics.balance)
    );

    setText(
        "analyticsProjects",
        analytics.projects
    );

    setText(
        "analyticsRecords",
        analytics.records
    );

    setText(
        "analyticsAnnouncements",
        analytics.announcements
    );

}

// ========================================
// YEAR LEVEL ANALYTICS
// ========================================

function getYearLevelStats() {

    const stats = {
        first: 0,
        second: 0,
        third: 0,
        fourth: 0
    };

    collectionCache.forEach(item => {

        const level =
            (item.yearLevel || "").toLowerCase();

        const amount =
            Number(item.amount || 0);

        if (level.includes("1") || level.includes("first")) {

            stats.first += amount;

        } else if (level.includes("2") || level.includes("second")) {

            stats.second += amount;

        } else if (level.includes("3") || level.includes("third")) {

            stats.third += amount;

        } else if (level.includes("4") || level.includes("fourth")) {

            stats.fourth += amount;

        }

    });

    return stats;

}

// ========================================
// TOP COLLECTION YEAR
// ========================================

function getTopYearLevel() {

    const stats = getYearLevelStats();

    let top = "First Year";
    let highest = stats.first;

    if (stats.second > highest) {

        highest = stats.second;
        top = "Second Year";

    }

    if (stats.third > highest) {

        highest = stats.third;
        top = "Third Year";

    }

    if (stats.fourth > highest) {

        highest = stats.fourth;
        top = "Fourth Year";

    }

    setText("topYearLevel", top);

    setText("topYearAmount", peso(highest));

}

// ========================================
// REFRESH ANALYTICS
// ========================================

async function refreshAnalytics() {

    updateAnalytics();

    getTopYearLevel();

    console.log("Analytics Updated");

}
// ========================================
// STUDENT MANAGEMENT SYSTEM
// v16.0
// ========================================

let studentCache = [];

// ========================================
// LOAD STUDENTS
// ========================================

async function loadStudents() {

    const container =
        document.getElementById("studentContainer");

    try {

        const snapshot = await getDocs(
            query(
                collection(db, "students"),
                orderBy("studentName")
            )
        );

        studentCache = [];

        if (container) {

            container.innerHTML = "";

        }

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            studentCache.push({
                id: docSnap.id,
                ...data
            });

            if (container) {

                container.innerHTML += `

                <div class="data-card">

                    <h3>👤 ${data.studentName}</h3>

                    <p><strong>ID:</strong> ${data.studentId}</p>

                    <p><strong>Course:</strong> ${data.course}</p>

                    <p><strong>Year:</strong> ${data.yearLevel}</p>

                    <button onclick="editStudent('${docSnap.id}')">
                        ✏ Edit
                    </button>

                    <button onclick="deleteStudent('${docSnap.id}')">
                        🗑 Delete
                    </button>

                </div>

                `;

            }

        });

        populateStudentDropdown();

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

}

// ========================================
// ADD STUDENT
// ========================================

async function addStudent(data){

    try{

        await addDoc(

            collection(db,"students"),

            {

                ...data,

                createdAt: serverTimestamp()

            }

        );

        notify("Student added.");

        await loadStudents();

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

}

// ========================================
// STUDENT FORM
// ========================================

const studentForm =
document.getElementById("studentForm");

if(studentForm){

    studentForm.addEventListener("submit",async(e)=>{

        e.preventDefault();

        await addStudent({

            studentName:
                getValue("studentName"),

            studentId:
                getValue("studentId"),

            course:
                getValue("course"),

            yearLevel:
                getValue("yearLevel")

        });

        studentForm.reset();

    });

}

// ========================================
// EDIT STUDENT
// ========================================

window.editStudent =
async function(id){

    try{

        const refDoc =
            doc(db,"students",id);

        const snap =
            await getDoc(refDoc);

        if(!snap.exists()) return;

        const data =
            snap.data();

        const studentName =
            prompt(
                "Student Name",
                data.studentName
            );

        if(studentName===null)
            return;

        await updateDoc(

            refDoc,

            {

                studentName,

                updatedAt:
                    serverTimestamp()

            }

        );

        notify("Student updated.");

        await loadStudents();

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

};

// ========================================
// DELETE STUDENT
// ========================================

window.deleteStudent =
async function(id){

    if(!confirm("Delete student?"))
        return;

    try{

        await deleteDoc(
            doc(db,"students",id)
        );

        notify("Student deleted.");

        await loadStudents();

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

};

// ========================================
// POPULATE DROPDOWN
// ========================================

function populateStudentDropdown(){

    const select =
        document.getElementById("studentSelect");

    if(!select) return;

    select.innerHTML =
        '<option value="">Select Student</option>';

    studentCache.forEach(student=>{

        select.innerHTML += `

        <option value="${student.id}">

            ${student.studentName}

        </option>

        `;

    });

}
// ========================================
// COLLECTION STUDENT AUTO-FILL
// v16.0
// ========================================

const studentSelect =
document.getElementById("studentSelect");

if(studentSelect){

    studentSelect.addEventListener(
        "change",
        fillStudentInformation
    );

}

function fillStudentInformation(){

    const id = studentSelect.value;

    if(!id){

        clearStudentFields();

        return;

    }

    const student = studentCache.find(
        item => item.id === id
    );

    if(!student) return;

    const name =
    document.getElementById("studentName");

    const studentId =
    document.getElementById("studentId");

    const course =
    document.getElementById("course");

    const yearLevel =
    document.getElementById("yearLevel");

    if(name)
        name.value = student.studentName || "";

    if(studentId)
        studentId.value = student.studentId || "";

    if(course)
        course.value = student.course || "";

    if(yearLevel)
        yearLevel.value = student.yearLevel || "";

}

// ========================================
// CLEAR STUDENT FIELDS
// ========================================

function clearStudentFields(){

    const ids = [

        "studentName",

        "studentId",

        "course",

        "yearLevel"

    ];

    ids.forEach(id=>{

        const input =
        document.getElementById(id);

        if(input){

            input.value="";

        }

    });

}

// ========================================
// COLLECTION VALIDATION
// ========================================

function validateCollectionForm(){

    if(!getValue("studentName")){

        notify("Student name is required.");

        return false;

    }

    if(!getValue("studentId")){

        notify("Student ID is required.");

        return false;

    }

    if(!getValue("course")){

        notify("Course is required.");

        return false;

    }

    if(!getValue("yearLevel")){

        notify("Year Level is required.");

        return false;

    }

    const amount =
    Number(getValue("amount"));

    if(isNaN(amount) || amount<=0){

        notify("Invalid payment amount.");

        return false;

    }

    if(!getValue("paymentType")){

        notify("Select payment type.");

        return false;

    }

    if(!getValue("date")){

        notify("Collection date is required.");

        return false;

    }

    return true;

}
// ========================================
// STUDENT PAYMENT HISTORY
// v16.0
// ========================================

async function viewStudentHistory(studentId){

    const container =
    document.getElementById("paymentHistory");

    if(!container) return;

    try{

        const snapshot =
        await getDocs(

            query(
                collection(db,"collections"),
                orderBy("createdAt","desc")
            )

        );

        container.innerHTML="";

        let totalPaid = 0;

        let paymentCount = 0;

        let latestDate = "-";

        snapshot.forEach(docSnap=>{

            const data = docSnap.data();

            if(data.studentId !== studentId)
                return;

            paymentCount++;

            totalPaid += Number(data.amount || 0);

            if(latestDate === "-")
                latestDate = data.date || "-";

            container.innerHTML += `

            <div class="history-card">

                <h4>${data.paymentType}</h4>

                <p><strong>Date:</strong> ${data.date}</p>

                <p><strong>Amount:</strong> ${peso(data.amount)}</p>

                <p><strong>Remarks:</strong> ${data.remarks || "-"}</p>

            </div>

            `;

        });

        if(paymentCount===0){

            container.innerHTML=`

            <div class="empty-state">

                No payment history.

            </div>

            `;

        }

        updateHistorySummary(
            totalPaid,
            paymentCount,
            latestDate
        );

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

}
// ========================================
// TREASURER RECEIPT GENERATOR
// v16.0
// ========================================

function generateReceiptNumber() {

    const now = new Date();

    return "DLB-" +
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0") +
        "-" +
        Date.now().toString().slice(-6);

}

// ========================================
// GENERATE RECEIPT
// ========================================

function generateReceipt(data) {

    const receiptNumber = generateReceiptNumber();

    const receipt = document.getElementById("receiptOutput");

    if (!receipt) return;

    receipt.innerHTML = `

    <div class="receipt-paper">

        <h2 style="text-align:center;">
            DALUBWIKAAN
        </h2>

        <h3 style="text-align:center;">
            Treasury Receipt
        </h3>

        <hr>

        <p>
            <strong>Receipt No:</strong>
            ${receiptNumber}
        </p>

        <p>
            <strong>Date:</strong>
            ${data.date}
        </p>

        <p>
            <strong>Year:</strong>
            ${data.yearLevel}
        </p>

        <p>
            <strong>Payment:</strong>
            ${data.paymentType}
        </p>

        <p>
            <strong>Amount:</strong>
            ${peso(data.amount)}
        </p>

        <p>
            <strong>Remarks:</strong>
            ${data.remarks || "-"}
        </p>

        <hr>

        <p>

            Received By:

            <br><br>

            ______________________

            <br>

            Treasurer

        </p>

        <button onclick="printReceipt()">

            🖨 Print Receipt

        </button>

    </div>

    `;

}
// ========================================
// RECEIPT ARCHIVE SYSTEM
// v16.0
// ========================================

let receiptCache = [];

// ========================================
// LOAD RECEIPTS
// ========================================

async function loadReceipts(){

    const container =
    document.getElementById("receiptContainer");

    if(!container) return;

    try{

        const snapshot =
        await getDocs(

            query(
                collection(db,"receipts"),
                orderBy("createdAt","desc")
            )

        );

        receiptCache=[];

        container.innerHTML="";

        if(snapshot.empty){

            container.innerHTML=`

            <div class="empty-state">

                No receipts found.

            </div>

            `;

            return;

        }

        snapshot.forEach(docSnap=>{

            const data=docSnap.data();

            receiptCache.push({

                id:docSnap.id,

                ...data

            });

            container.innerHTML+=`

            <div class="data-card">

                <h3>${data.receiptNumber}</h3>

                <p><strong>Student:</strong> ${data.studentName}</p>

                <p><strong>Amount:</strong> ${peso(data.amount)}</p>

                <p><strong>Date:</strong> ${data.date}</p>

                <button onclick="viewReceipt('${docSnap.id}')">

                    👁 View

                </button>

                <button onclick="deleteReceipt('${docSnap.id}')">

                    🗑 Delete

                </button>

            </div>

            `;

        });

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

}
// ========================================
// PDF RECEIPT GENERATOR
// v16.0
// ========================================

window.downloadReceiptPDF = function () {

    if (!window.jspdf) {

        notify("jsPDF library not found.", "error");

        return;

    }

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF();

    const receiptNumber =
        document.getElementById("receiptNumber")?.textContent || "-";

    const receiptDate =
        document.getElementById("receiptDate")?.textContent || "-";

    const year =
        document.getElementById("receiptYear")?.textContent || "-";

    const amount =
        document.getElementById("receiptAmount")?.textContent || "-";

    const remarks =
        document.getElementById("receiptRemarks")?.textContent || "-";

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("DALUBWIKAAN", 105, 20, { align: "center" });

    pdf.setFontSize(14);
    pdf.text("Treasury Receipt", 105, 30, { align: "center" });

    pdf.setLineWidth(0.5);
    pdf.line(20, 36, 190, 36);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    let y = 48;

    pdf.text(`Receipt No: ${receiptNumber}`, 20, y); y += 10;
    pdf.text(`Date: ${receiptDate}`, 20, y); y += 10;
    pdf.text(`Year Level: ${year}`, 20, y); y += 10;
    pdf.text(`Amount: ${amount}`, 20, y); y += 10;
    pdf.text(`Remarks: ${remarks}`, 20, y); y += 20;

    pdf.line(20, y, 190, y);

    y += 18;

    pdf.text("Received By:", 20, y);

    y += 25;

    pdf.text("__________________________", 20, y);

    y += 8;

    pdf.text("Treasurer", 20, y);

    pdf.save(`${receiptNumber}.pdf`);

    notify("Receipt PDF downloaded.");

};
// ========================================
// EXCEL & CSV EXPORT SYSTEM
// v16.0
// ========================================

window.exportCollectionsCSV = function () {

    exportCSV(
        "Collections_Report.csv",
        collectionCache,
        [
            "studentName",
            "studentId",
            "course",
            "yearLevel",
            "paymentType",
            "amount",
            "date",
            "remarks"
        ]
    );

};

window.exportExpensesCSV = function () {

    exportCSV(
        "Expenses_Report.csv",
        expenseCache,
        [
            "category",
            "description",
            "amount",
            "receiptURL"
        ]
    );

};

window.exportProjectsCSV = function () {

    exportCSV(
        "Projects_Report.csv",
        projectCache,
        [
            "name",
            "description",
            "status",
            "budget"
        ]
    );

};

window.exportStudentsCSV = function () {

    exportCSV(
        "Students_Report.csv",
        studentCache,
        [
            "studentName",
            "studentId",
            "course",
            "yearLevel"
        ]
    );

};
// ========================================
// AUDIT LOG SYSTEM
// v16.0
// ========================================

let auditCache = [];

// ========================================
// WRITE AUDIT LOG
// ========================================

async function writeAuditLog(action, details = "") {

    try {

        await addDoc(

            collection(db, "auditLogs"),

            {

                action,

                details,

                adminEmail:
                    auth.currentUser?.email || "Unknown",

                adminUID:
                    auth.currentUser?.uid || "",

                createdAt:
                    serverTimestamp()

            }

        );

    }

    catch(error){

        console.error(
            "AUDIT ERROR:",
            error
        );

    }

}
// ========================================
// BACKUP & RESTORE SYSTEM
// v16.0
// ========================================

window.backupSystem = async function () {

    try {

        notify("Creating backup...");

        const backup = {

            version: "16.0",

            createdAt: new Date().toISOString(),

            projects: projectCache,

            expenses: expenseCache,

            records: recordCache,

            collections: collectionCache,

            announcements: announcementCache,

            students: studentCache,

            receipts: receiptCache,

            auditLogs: auditCache

        };

        const blob = new Blob(

            [

                JSON.stringify(
                    backup,
                    null,
                    2
                )

            ],

            {

                type: "application/json"

            }

        );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            `Treasury_Backup_${Date.now()}.json`;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        notify("Backup completed.");

        await writeAuditLog(

            "System Backup",

            "Backup file downloaded"

        );

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

};
// ========================================
// NOTIFICATION CENTER
// v16.0
// ========================================

let notificationCache = [];

// Add Notification
function addNotification(title, message, type = "info") {

    const notification = {
        id: Date.now(),
        title,
        message,
        type,
        time: new Date().toLocaleString()
    };

    notificationCache.unshift(notification);

    renderNotifications();

}

// Render Notifications
function renderNotifications() {

    const container =
        document.getElementById("notificationContainer");

    if (!container) return;

    container.innerHTML = "";

    if (notificationCache.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                No notifications.
            </div>
        `;

        updateNotificationCount();

        return;

    }

    notificationCache.forEach(item => {

        container.innerHTML += `

        <div class="notification-card ${item.type}">

            <h4>${item.title}</h4>

            <p>${item.message}</p>

            <small>${item.time}</small>

        </div>

        `;

    });

    updateNotificationCount();

}

// Badge Count
function updateNotificationCount() {

    const badge =
        document.getElementById("notificationCount");

    if (!badge) return;

    badge.textContent =
        notificationCache.length;

}

// Clear Notifications
window.clearNotifications = function () {

    notificationCache = [];

    renderNotifications();

    notify("Notifications cleared.");

};
function checkLowBalance() {

    const collections =
        collectionCache.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
        );

    const expenses =
        expenseCache.reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
        );

    const balance =
        collections - expenses;

    if (balance < 1000) {

        addNotification(

            "⚠ Low Balance",

            `Remaining balance is ${peso(balance)}`,

            "warning"

        );

    }

}
