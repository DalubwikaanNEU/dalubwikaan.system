// ======================================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// ADMIN PANEL
// VERSION 1.0 REBUILT
// PART 1 - CORE SYSTEM
// ======================================================


// ======================================================
// FIREBASE
// ======================================================

import { db, storage } from "./firebase.js";

import {
    collection,
    addDoc,
    deleteDoc,
    updateDoc,
    getDoc,
    getDocs,
    doc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
}
from
"https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


import {
    ref,
    uploadBytes,
    getDownloadURL
}
from
"https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";


import {
    getAuth,
    onAuthStateChanged,
    signOut
}
from
"https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";



// ======================================================
// AUTH
// ======================================================

const auth = getAuth();

let currentUser = null;



// ======================================================
// GLOBAL CACHE
// ======================================================

const cache = {

    collections: [],

    projects: [],

    expenses: [],

    records: [],

    announcements: [],

    students: []

};



let selectedReceiptFile = null;



// ======================================================
// SHORTCUT
// ======================================================

const $ = (id) => document.getElementById(id);



// ======================================================
// HELPERS
// ======================================================

function value(id){

    const element = $(id);

    return element ? element.value.trim() : "";

}


function setText(id,text){

    const element = $(id);

    if(element){

        element.textContent = text;

    }

}


function peso(number){

    return "₱" +

    Number(number || 0)

    .toLocaleString(

        "en-PH",

        {

            minimumFractionDigits:2,

            maximumFractionDigits:2

        }

    );

}



// ======================================================
// SIMPLE NOTIFICATION
// ======================================================

function notify(message,type="info"){

    console.log(`[${type}] ${message}`);

    alert(message);

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

    },500);

}



// ======================================================
// LOGOUT
// ======================================================

const logoutButton = $("logout");

if(logoutButton){

    logoutButton.onclick = async()=>{

        await signOut(auth);

        location.href="login.html";

    };

}



// ======================================================
// AUTH CHECK
// ======================================================

onAuthStateChanged(auth,async(user)=>{

    if(!user){

        location.href="login.html";

        return;

    }

    currentUser = user;

    if($("adminEmail")){

        $("adminEmail").textContent = user.email;

    }

    initializeSystem();

});



// ======================================================
// INITIALIZE SYSTEM
// ======================================================

async function initializeSystem(){

    console.log("Initializing Treasury Admin...");

    loadProjects();

    loadExpenses();

    loadCollections();

    loadAnnouncements();

    loadSummary();

    hideLoader();

}



// ======================================================
// ERROR HANDLER
// ======================================================

window.addEventListener("error",(event)=>{

    console.error(event.error);

});

window.addEventListener("unhandledrejection",(event)=>{

    console.error(event.reason);

});



console.log("Admin Core Loaded.");

// =====================================================
// PROJECTS MODULE
// VERSION 20.0
// PART 2
// =====================================================

const projectForm = $("projectForm");
const projectContainer = $("projectContainer");

// -----------------------------------------------------
// LOAD PROJECTS
// -----------------------------------------------------

function loadProjects() {

    if (!projectContainer) return;

    const q = query(
        collection(db, "projects"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {

        cache.projects = [];

        snapshot.forEach((docSnap) => {

            cache.projects.push({
                id: docSnap.id,
                ...docSnap.data()
            });

        });

        renderProjects();

        loadSummary();

    });

}

// -----------------------------------------------------
// RENDER PROJECTS
// -----------------------------------------------------

function renderProjects() {

    if (!projectContainer) return;

    projectContainer.innerHTML = "";

    if (cache.projects.length === 0) {

        projectContainer.innerHTML = `
            <div class="empty-state">
                No projects found.
            </div>
        `;

        return;

    }

    cache.projects.forEach(project => {

        const remaining =
            Number(project.budget || 0) -
            Number(project.actualExpenses || 0);

        projectContainer.innerHTML += `

        <div class="card">

            <h3>${project.name}</h3>

            <p>${project.description || ""}</p>

            <p>
                <strong>Status:</strong>
                ${project.status || "Planning"}
            </p>

            <p>
                <strong>Budget:</strong>
                ${peso(project.budget)}
            </p>

            <p>
                <strong>Actual Expenses:</strong>
                ${peso(project.actualExpenses)}
            </p>

            <p>
                <strong>Remaining:</strong>
                ${peso(remaining)}
            </p>

            <button
                class="btn-primary"
                onclick="editProject('${project.id}')">

                Edit

            </button>

            <button
                class="btn-danger"
                onclick="deleteProject('${project.id}')">

                Delete

            </button>

        </div>

        `;

    });

}

// -----------------------------------------------------
// SAVE PROJECT
// -----------------------------------------------------

if (projectForm) {

    projectForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name = $("projectName").value.trim();

        const description =
            $("description").value.trim();

        const budget =
            Number($("projectBudget").value);

        const status =
            $("projectStatus").value;

        const actualExpenses =
            Number(
                $("actualExpensesInput")?.value || 0
            );

        const utilizationStatus =
            $("utilizationStatusInput")?.value ||
            "0%";

        if (!name) {

            notify("Project name required.");

            return;

        }

        try {

            await addDoc(
                collection(db, "projects"),
                {

                    name,

                    description,

                    budget,

                    status,

                    actualExpenses,

                    utilizationStatus,

                    createdAt: serverTimestamp()

                }
            );

            notify("Project added.");

            projectForm.reset();

        }

        catch (error) {

            console.error(error);

            notify(error.message, "error");

        }

    });

}

// -----------------------------------------------------
// DELETE PROJECT
// -----------------------------------------------------

window.deleteProject = async function(id) {

    if (!confirm("Delete this project?")) return;

    try {

        await deleteDoc(
            doc(db, "projects", id)
        );

        notify("Project deleted.");

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

};

// -----------------------------------------------------
// EDIT PROJECT
// -----------------------------------------------------

window.editProject = async function(id){

    const project =
        cache.projects.find(p => p.id === id);

    if(!project) return;

    const name =
        prompt("Project Name", project.name);

    if(name === null) return;

    const budget =
        prompt("Budget", project.budget);

    if(budget === null) return;

    const description =
        prompt(
            "Description",
            project.description || ""
        );

    const status =
        prompt(
            "Status",
            project.status || "Planning"
        );

    const actualExpenses =
        prompt(
            "Actual Expenses",
            project.actualExpenses || 0
        );

    try{

        await updateDoc(

            doc(db,"projects",id),

            {

                name,

                description,

                budget:Number(budget),

                status,

                actualExpenses:Number(actualExpenses),

                updatedAt:serverTimestamp()

            }

        );

        notify("Project updated.");

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

};

// =====================================================
// EXPENSES MODULE
// VERSION 20.0
// PART 3
// =====================================================

const expenseForm = $("expenseForm");
const expenseContainer = $("expenseContainer");

let selectedReceiptFile = null;

// -----------------------------------------------------
// RECEIPT INPUT
// -----------------------------------------------------

const receiptInput = $("receipt");

if (receiptInput) {

    receiptInput.addEventListener("change", (e) => {

        selectedReceiptFile =
            e.target.files[0] || null;

    });

}

// -----------------------------------------------------
// LOAD EXPENSES
// -----------------------------------------------------

function loadExpenses() {

    if (!expenseContainer) return;

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

    });

}

// -----------------------------------------------------
// RENDER EXPENSES
// -----------------------------------------------------

function renderExpenses() {

    expenseContainer.innerHTML = "";

    if (cache.expenses.length === 0) {

        expenseContainer.innerHTML = `

            <div class="empty-state">

                No expenses found.

            </div>

        `;

        return;

    }

    cache.expenses.forEach(expense => {

        expenseContainer.innerHTML += `

        <div class="card">

            <h3>${expense.project}</h3>

            <p>${expense.description || ""}</p>

            <p>

                <strong>Amount:</strong>

                ${peso(expense.amount)}

            </p>

            ${expense.receiptURL ?

            `

            <a href="${expense.receiptURL}" target="_blank">

                View Receipt

            </a>

            `

            : ""}

            <br><br>

            <button

                class="btn-danger"

                onclick="deleteExpense('${expense.id}')">

                Delete

            </button>

        </div>

        `;

    });

}

// -----------------------------------------------------
// SAVE EXPENSE
// -----------------------------------------------------

if (expenseForm) {

    expenseForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const project =
            $("expenseProject").value;

        const amount =
            Number($("expenseAmount").value);

        const description =
            $("expenseDescription").value.trim();

        if (!project) {

            notify("Select a project.");

            return;

        }

        if (amount <= 0) {

            notify("Invalid amount.");

            return;

        }

        let receiptURL = "";

        try {

            if (selectedReceiptFile) {

                const storageRef = ref(

                    storage,

                    "receipts/" +

                    Date.now() +

                    "_" +

                    selectedReceiptFile.name

                );

                await uploadBytes(

                    storageRef,

                    selectedReceiptFile

                );

                receiptURL =

                    await getDownloadURL(storageRef);

            }

            await addDoc(

                collection(db, "expenses"),

                {

                    project,

                    amount,

                    description,

                    receiptURL,

                    createdAt: serverTimestamp()

                }

            );

            const projectDoc = cache.projects.find(

                p => p.name === project

            );

            if (projectDoc) {

                await updateDoc(

                    doc(db, "projects", projectDoc.id),

                    {

                        actualExpenses:

                        Number(projectDoc.actualExpenses || 0)

                        + amount

                    }

                );

            }

            notify("Expense added.");

            expenseForm.reset();

            selectedReceiptFile = null;

            if (receiptInput) {

                receiptInput.value = "";

            }

        }

        catch(error){

            console.error(error);

            notify(error.message,"error");

        }

    });

}

// -----------------------------------------------------
// DELETE EXPENSE
// -----------------------------------------------------

window.deleteExpense = async function(id){

    if(!confirm("Delete expense?"))

        return;

    try{

        const expense = cache.expenses.find(

            item => item.id === id

        );

        if(expense){

            const project = cache.projects.find(

                p => p.name === expense.project

            );

            if(project){

                await updateDoc(

                    doc(db,"projects",project.id),

                    {

                        actualExpenses:

                        Math.max(

                            0,

                            Number(project.actualExpenses || 0)

                            -

                            Number(expense.amount || 0)

                        )

                    }

                );

            }

        }

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

// =====================================================
// COLLECTIONS MODULE
// VERSION 20.0
// PART 4
// =====================================================

const collectionForm = $("collectionForm");
const collectionContainer = $("collectionContainer");

// -----------------------------------------------------
// LOAD COLLECTIONS
// -----------------------------------------------------

function loadCollections() {

    if (!collectionContainer) return;

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

    });

}

// -----------------------------------------------------
// RENDER COLLECTIONS
// -----------------------------------------------------

function renderCollections() {

    collectionContainer.innerHTML = "";

    if (cache.collections.length === 0) {

        collectionContainer.innerHTML = `

            <div class="empty-state">

                No collections yet.

            </div>

        `;

        return;

    }

    cache.collections.forEach(item => {

        collectionContainer.innerHTML += `

        <div class="card">

            <h3>${item.studentName || "Unknown Student"}</h3>

            <p>

                <strong>Student ID:</strong>

                ${item.studentId || "-"}

            </p>

            <p>

                <strong>Course:</strong>

                ${item.course || "-"}

            </p>

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

            <button

                class="btn-primary"

                onclick="editCollection('${item.id}')">

                Edit

            </button>

            <button

                class="btn-danger"

                onclick="deleteCollection('${item.id}')">

                Delete

            </button>

        </div>

        `;

    });

}

// -----------------------------------------------------
// SAVE COLLECTION
// -----------------------------------------------------

if (collectionForm) {

    collectionForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const data = {

            studentName:
                $("studentName")?.value.trim() || "",

            studentId:
                $("studentId")?.value.trim() || "",

            course:
                $("course")?.value.trim() || "",

            yearLevel:
                $("yearLevel")?.value || "",

            paymentType:
                $("paymentType")?.value || "",

            amount:
                Number($("amount")?.value || 0),

            date:
                $("date")?.value || "",

            remarks:
                $("remarks")?.value.trim() || "",

            createdAt:
                serverTimestamp()

        };

        if (!data.studentName) {

            notify("Student name required.");

            return;

        }

        if (data.amount <= 0) {

            notify("Invalid amount.");

            return;

        }

        try {

            await addDoc(

                collection(db, "collections"),

                data

            );

            notify("Collection saved.");

            collectionForm.reset();

        }

        catch(error){

            console.error(error);

            notify(error.message,"error");

        }

    });

}

// -----------------------------------------------------
// DELETE COLLECTION
// -----------------------------------------------------

window.deleteCollection = async function(id){

    if(!confirm("Delete collection?"))

        return;

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

// -----------------------------------------------------
// EDIT COLLECTION
// -----------------------------------------------------

window.editCollection = async function(id){

    const item = cache.collections.find(

        c => c.id === id

    );

    if(!item) return;

    const amount = prompt(

        "Amount",

        item.amount

    );

    if(amount === null) return;

    const remarks = prompt(

        "Remarks",

        item.remarks || ""

    );

    try{

        await updateDoc(

            doc(db,"collections",id),

            {

                amount:Number(amount),

                remarks,

                updatedAt:serverTimestamp()

            }

        );

        notify("Collection updated.");

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

};

// =====================================================
// STUDENTS MODULE
// VERSION 20.0
// PART 5
// =====================================================

const studentForm = $("studentForm");
const studentContainer = $("studentContainer");
const studentSelect = $("studentSelect");

// -----------------------------------------------------
// LOAD STUDENTS
// -----------------------------------------------------

function loadStudents() {

    if (!studentContainer && !studentSelect) return;

    const q = query(
        collection(db, "students"),
        orderBy("studentName")
    );

    onSnapshot(q, (snapshot) => {

        cache.students = [];

        snapshot.forEach(docSnap => {

            cache.students.push({

                id: docSnap.id,

                ...docSnap.data()

            });

        });

        renderStudents();

        populateStudentDropdown();

    });

}

// -----------------------------------------------------
// RENDER STUDENTS
// -----------------------------------------------------

function renderStudents() {

    if (!studentContainer) return;

    studentContainer.innerHTML = "";

    if (cache.students.length === 0) {

        studentContainer.innerHTML = `

            <div class="empty-state">

                No students found.

            </div>

        `;

        return;

    }

    cache.students.forEach(student => {

        studentContainer.innerHTML += `

        <div class="card">

            <h3>${student.studentName}</h3>

            <p>

                <strong>ID:</strong>

                ${student.studentId}

            </p>

            <p>

                <strong>Course:</strong>

                ${student.course}

            </p>

            <p>

                <strong>Year:</strong>

                ${student.yearLevel}

            </p>

            <button
                class="btn-primary"
                onclick="editStudent('${student.id}')">

                Edit

            </button>

            <button
                class="btn-danger"
                onclick="deleteStudent('${student.id}')">

                Delete

            </button>

        </div>

        `;

    });

}

// -----------------------------------------------------
// ADD STUDENT
// -----------------------------------------------------

if (studentForm) {

    studentForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const studentName =
            $("studentName").value.trim();

        const studentId =
            $("studentId").value.trim();

        const course =
            $("course").value.trim();

        const yearLevel =
            $("yearLevel").value;

        if (!studentName) {

            notify("Student name required.");

            return;

        }

        try {

            await addDoc(

                collection(db, "students"),

                {

                    studentName,

                    studentId,

                    course,

                    yearLevel,

                    createdAt: serverTimestamp()

                }

            );

            notify("Student added.");

            studentForm.reset();

        }

        catch (error) {

            console.error(error);

            notify(error.message, "error");

        }

    });

}

// -----------------------------------------------------
// EDIT STUDENT
// -----------------------------------------------------

window.editStudent = async function(id) {

    const student = cache.students.find(

        s => s.id === id

    );

    if (!student) return;

    const studentName =
        prompt("Student Name", student.studentName);

    if (studentName === null) return;

    const studentId =
        prompt("Student ID", student.studentId);

    if (studentId === null) return;

    const course =
        prompt("Course", student.course);

    if (course === null) return;

    const yearLevel =
        prompt("Year Level", student.yearLevel);

    if (yearLevel === null) return;

    try {

        await updateDoc(

            doc(db, "students", id),

            {

                studentName,

                studentId,

                course,

                yearLevel,

                updatedAt: serverTimestamp()

            }

        );

        notify("Student updated.");

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

};

// -----------------------------------------------------
// DELETE STUDENT
// -----------------------------------------------------

window.deleteStudent = async function(id){

    if(!confirm("Delete student?"))

        return;

    try{

        await deleteDoc(

            doc(db,"students",id)

        );

        notify("Student deleted.");

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

};

// -----------------------------------------------------
// POPULATE DROPDOWN
// -----------------------------------------------------

function populateStudentDropdown(){

    if(!studentSelect) return;

    studentSelect.innerHTML =

        `<option value="">Select Student</option>`;

    cache.students.forEach(student => {

        studentSelect.innerHTML += `

        <option value="${student.id}">

            ${student.studentName}

        </option>

        `;

    });

}

// -----------------------------------------------------
// AUTO FILL COLLECTION FORM
// -----------------------------------------------------

if(studentSelect){

    studentSelect.addEventListener(

        "change",

        () => {

            const student = cache.students.find(

                s => s.id === studentSelect.value

            );

            if(!student) return;

            if($("studentName"))
                $("studentName").value =
                    student.studentName;

            if($("studentId"))
                $("studentId").value =
                    student.studentId;

            if($("course"))
                $("course").value =
                    student.course;

            if($("yearLevel"))
                $("yearLevel").value =
                    student.yearLevel;

        }

    );

}

// =====================================================
// SUMMARY & DASHBOARD ENGINE
// VERSION 20.0
// PART 6
// =====================================================

// -----------------------------------------------------
// LOAD SUMMARY
// -----------------------------------------------------

function loadSummary() {

    // ---------- COLLECTIONS ----------

    const totalCollections = cache.collections.reduce(

        (sum, item) =>

            sum + Number(item.amount || 0),

        0

    );

    // ---------- EXPENSES ----------

    const totalExpenses = cache.expenses.reduce(

        (sum, item) =>

            sum + Number(item.amount || 0),

        0

    );

    // ---------- PROJECT BUDGET ----------

    const totalProjectBudget = cache.projects.reduce(

        (sum, item) =>

            sum + Number(item.budget || 0),

        0

    );

    // ---------- PROJECT ACTUAL EXPENSES ----------

    const totalProjectExpenses = cache.projects.reduce(

        (sum, item) =>

            sum + Number(item.actualExpenses || 0),

        0

    );

    // ---------- BALANCE ----------

    const currentBalance =
        totalCollections -
        totalExpenses;

    // -------------------------------------------------
    // COUNTS
    // -------------------------------------------------

    setText("projectCount", cache.projects.length);

    setText("expenseCount", cache.expenses.length);

    setText("collectionCount", cache.collections.length);

    setText("studentCount", cache.students.length);

    // -------------------------------------------------
    // FINANCIAL
    // -------------------------------------------------

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

    setText(

        "projectBudget",

        peso(totalProjectBudget)

    );

    setText(

        "projectExpenses",

        peso(totalProjectExpenses)

    );

    // -------------------------------------------------
    // DASHBOARD CARDS
    // -------------------------------------------------

    setText(

        "totalCollectionsDisplay",

        peso(totalCollections)

    );

    setText(

        "totalExpensesDisplay",

        peso(totalExpenses)

    );

    setText(

        "remainingBudgetDisplay",

        peso(currentBalance)

    );

    // -------------------------------------------------
    // YEAR LEVEL TOTALS
    // -------------------------------------------------

    let first = 0;

    let second = 0;

    let third = 0;

    let fourth = 0;

    cache.collections.forEach(item => {

        const amount =
            Number(item.amount || 0);

        const level =
            (item.yearLevel || "")
            .toLowerCase();

        if (
            level.includes("1") ||
            level.includes("first")
        ) {

            first += amount;

        }

        else if (
            level.includes("2") ||
            level.includes("second")
        ) {

            second += amount;

        }

        else if (
            level.includes("3") ||
            level.includes("third")
        ) {

            third += amount;

        }

        else if (
            level.includes("4") ||
            level.includes("fourth")
        ) {

            fourth += amount;

        }

    });

    setText(

        "firstYearCollection",

        peso(first)

    );

    setText(

        "secondYearCollection",

        peso(second)

    );

    setText(

        "thirdYearCollection",

        peso(third)

    );

    setText(

        "fourthYearCollection",

        peso(fourth)

    );

    // -------------------------------------------------
    // TREASURY STATUS
    // -------------------------------------------------

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

    console.log("Summary Updated");

}

// =====================================================
// FINAL MODULE
// VERSION 20.0
// PART 7
// =====================================================


// =====================================================
// RECORDS
// =====================================================

function loadRecords() {

    const container = $("recordContainer");

    if (!container) return;

    onSnapshot(

        query(

            collection(db,"records"),

            orderBy("createdAt","desc")

        ),

        snapshot=>{

            cache.records=[];

            snapshot.forEach(doc=>{

                cache.records.push({

                    id:doc.id,

                    ...doc.data()

                });

            });

            container.innerHTML="";

            cache.records.forEach(record=>{

                container.innerHTML+=`

                <div class="card">

                    <h3>${record.title}</h3>

                    <p>${record.type}</p>

                    <p>${peso(record.amount)}</p>

                </div>

                `;

            });

            setText(

                "recordCount",

                cache.records.length

            );

        }

    );

}



// =====================================================
// ANNOUNCEMENTS
// =====================================================

function loadAnnouncements(){

    const container=$("announcementContainer");

    if(!container) return;

    onSnapshot(

        query(

            collection(db,"announcements"),

            orderBy("createdAt","desc")

        ),

        snapshot=>{

            cache.announcements=[];

            snapshot.forEach(doc=>{

                cache.announcements.push({

                    id:doc.id,

                    ...doc.data()

                });

            });

            container.innerHTML="";

            cache.announcements.forEach(post=>{

                container.innerHTML+=`

                <div class="announcement">

                    <h3>${post.title}</h3>

                    <p>${post.message}</p>

                </div>

                `;

            });

        }

    );

}



// =====================================================
// SEARCH
// =====================================================

const searchInput=$("searchInput");

if(searchInput){

    searchInput.addEventListener(

        "keyup",

        ()=>{

            const keyword=

            searchInput.value

            .toLowerCase();

            document

            .querySelectorAll(

                ".card,.announcement"

            )

            .forEach(card=>{

                card.style.display=

                card.innerText

                .toLowerCase()

                .includes(keyword)

                ?

                ""

                :

                "none";

            });

        }

    );

}



// =====================================================
// EXPORT REPORT
// =====================================================

window.exportReport=function(){

    const report={

        generated:new Date()

        .toLocaleString(),

        collections:

        cache.collections,

        projects:

        cache.projects,

        expenses:

        cache.expenses,

        students:

        cache.students,

        records:

        cache.records

    };

    const blob=new Blob(

        [

            JSON.stringify(

                report,

                null,

                2

            )

        ],

        {

            type:"application/json"

        }

    );

    const url=

    URL.createObjectURL(blob);

    const a=

    document.createElement("a");

    a.href=url;

    a.download=

    "TreasuryReport.json";

    a.click();

    URL.revokeObjectURL(url);

}



// =====================================================
// REFRESH
// =====================================================

window.refreshDashboard=function(){

    loadSummary();

    notify(

        "Dashboard refreshed."

    );

}



// =====================================================
// START SYSTEM
// =====================================================

async function initializeSystem(){

    loadProjects();

    loadExpenses();

    loadCollections();

    loadStudents();

    loadRecords();

    loadAnnouncements();

    loadSummary();

    console.log(

        "%cDALUBWIKAAN TREASURY SYSTEM READY",

        "color:green;font-weight:bold;font-size:14px;"

    );

}

initializeSystem();



// =====================================================
// END OF ADMIN.JS
// VERSION 20.0
// =====================================================

