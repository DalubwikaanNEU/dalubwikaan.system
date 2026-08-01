// =====================================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// ADMIN PANEL
// VERSION 18.0
// PART 1 - CORE SYSTEM
// =====================================================


// =====================================================
// FIREBASE IMPORTS
// =====================================================

import { db, storage } from "./firebase.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";

import {
    getAuth,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";


// =====================================================
// AUTH
// =====================================================

const auth = getAuth();

let currentUser = null;


// =====================================================
// GLOBAL CACHE
// =====================================================

const cache = {

    projects: [],

    expenses: [],

    collections: [],

    announcements: [],

    records: [],

    students: [],

    receipts: [],

    auditLogs: []

};


// =====================================================
// SYSTEM STATE
// =====================================================

const state = {

    totalCollections: 0,

    totalExpenses: 0,

    totalProjectExpenses: 0,

    availableBalance: 0

};


// =====================================================
// FILE STATE
// =====================================================

let selectedReceiptFile = null;


// =====================================================
// HELPER FUNCTIONS
// =====================================================

function $(id){

    return document.getElementById(id);

}


function getValue(id){

    const el = $(id);

    if(!el) return "";

    return el.value.trim();

}


function setValue(id,value){

    const el = $(id);

    if(el){

        el.value = value;

    }

}


function setText(id,value){

    const el = $(id);

    if(el){

        el.textContent = value;

    }

}


function peso(value){

    return "₱" +

    Number(value || 0)

    .toLocaleString(

        "en-PH",

        {

            minimumFractionDigits:2,

            maximumFractionDigits:2

        }

    );

}


// =====================================================
// TOAST NOTIFICATION
// =====================================================

function notify(message,type="success"){

    if(window.Toastify){

        Toastify({

            text:message,

            duration:3000,

            gravity:"top",

            position:"right",

            close:true,

            style:{

                background:

                    type==="error"

                    ? "#dc2626"

                    : "#15803d"

            }

        }).showToast();

    }

    else{

        alert(message);

    }

}


// =====================================================
// LOADER
// =====================================================

function hideLoader(){

    const loader = $("loader");

    if(!loader) return;

    loader.style.opacity="0";

    setTimeout(()=>{

        loader.style.display="none";

    },300);

}

window.addEventListener("load",()=>{

    setTimeout(hideLoader,700);

});


// =====================================================
// LOGOUT
// =====================================================

window.logout = async function(){

    if(!confirm("Logout?")) return;

    try{

        await signOut(auth);

        location.href="login.html";

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

};


// =====================================================
// AUTH CHECK
// =====================================================

onAuthStateChanged(auth, async(user)=>{

    if(!user){

        location.href="login.html";

        return;

    }

    currentUser = user;

    const email = $("adminEmail");

    if(email){

        email.textContent = user.email;

    }

    console.log("Admin:",user.email);

    await initializeSystem();

});


// =====================================================
// FIREBASE TEST
// =====================================================

async function checkFirebase(){

    try{

        await getDocs(

            collection(db,"announcements")

        );

        console.log("Firestore Connected");

        return true;

    }

    catch(error){

        console.error(error);

        notify("Unable to connect to Firebase.","error");

        return false;

    }

}


// =====================================================
// INITIALIZER
// =====================================================

async function initializeSystem(){

    const connected = await checkFirebase();

    if(!connected) return;

    try{

        await Promise.all([

            loadProjects(),

            loadExpenses(),

            loadCollections(),

            loadStudents(),

            loadRecords(),

            loadAnnouncements(),

            loadReceipts()

        ]);

        await loadSummary();

        console.log("SYSTEM READY");

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

}


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

window.addEventListener("error",(event)=>{

    console.error(event.error);

});

window.addEventListener("unhandledrejection",(event)=>{

    console.error(event.reason);

});


// =====================================================
// PLACEHOLDERS
// (These will be implemented in the next parts.)
// =====================================================

async function loadProjects(){}

async function loadExpenses(){}

async function loadCollections(){}

async function loadStudents(){}

async function loadRecords(){}

async function loadAnnouncements(){}

async function loadReceipts(){}

async function loadSummary(){}

// =====================================================
// PROJECTS MODULE
// VERSION 18.0
// PART 2A
// =====================================================


// =====================================================
// LOAD PROJECTS (REALTIME)
// =====================================================

function loadProjects() {

    const container = $("projectContainer");

    if (!container) return;

    const q = query(
        collection(db, "projects"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {

        cache.projects = [];

        snapshot.forEach(docSnap => {

            cache.projects.push({

                id: docSnap.id,

                ...docSnap.data()

            });

        });

        renderProjects();

        loadSummary();

    }, (error) => {

        console.error(error);

        notify(error.message, "error");

    });

}


// =====================================================
// RENDER PROJECTS
// =====================================================

function renderProjects() {

    const container = $("projectContainer");

    if (!container) return;

    container.innerHTML = "";

    if (cache.projects.length === 0) {

        container.innerHTML = `

        <div class="empty-state">

            No projects found.

        </div>

        `;

        return;

    }

    cache.projects.forEach(project => {

        const budget =
            Number(project.budget || 0);

        const actualExpenses =
            Number(project.actualExpenses || 0);

        const remaining =
            budget - actualExpenses;

        container.innerHTML += `

        <div class="data-card">

            <h3>${project.name || "Untitled Project"}</h3>

            <p>

                <strong>Budget:</strong>

                ${peso(budget)}

            </p>

            <p>

                <strong>Actual Expenses:</strong>

                ${peso(actualExpenses)}

            </p>

            <p>

                <strong>Remaining:</strong>

                ${peso(remaining)}

            </p>

            <p>

                <strong>Status:</strong>

                ${project.status || "Planning"}

            </p>

            <p>

                ${project.description || ""}

            </p>

            <div class="card-actions">

                <button onclick="editProject('${project.id}')">

                    ✏ Edit

                </button>

                <button onclick="deleteProject('${project.id}')">

                    🗑 Delete

                </button>

            </div>

        </div>

        `;

    });

}


// =====================================================
// ADD PROJECT
// =====================================================

async function addProject(data) {

    try {

        await addDoc(

            collection(db, "projects"),

            {

                name:
                    data.name,

                budget:
                    Number(data.budget),

                actualExpenses:
                    Number(data.actualExpenses || 0),

                status:
                    data.status || "Planning",

                description:
                    data.description || "",

                utilizationStatus:
                    data.utilizationStatus || "0%",

                createdAt:
                    serverTimestamp()

            }

        );

        notify("Project added successfully.");

    }

    catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

}

// =====================================================
// PROJECT FORM
// =====================================================

const projectForm = $("projectForm");

if (projectForm) {

    projectForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name = getValue("projectName");
        const budget = Number(getValue("projectBudget"));
        const status = getValue("projectStatus");
        const description = getValue("projectDescription");

        if (!name) {

            notify("Project name is required.", "error");
            return;

        }

        if (isNaN(budget) || budget <= 0) {

            notify("Invalid budget amount.", "error");
            return;

        }

        await addProject({

            name,
            budget,
            status,
            description,
            actualExpenses: 0,
            utilizationStatus: "0%"

        });

        projectForm.reset();

    });

}



// =====================================================
// EDIT PROJECT
// =====================================================

window.editProject = async function (id) {

    try {

        const project = cache.projects.find(p => p.id === id);

        if (!project) return;

        const name = prompt(
            "Project Name",
            project.name
        );

        if (name === null) return;

        const budget = prompt(
            "Budget",
            project.budget
        );

        if (budget === null) return;

        const status = prompt(
            "Status",
            project.status
        );

        if (status === null) return;

        const description = prompt(
            "Description",
            project.description || ""
        );

        if (description === null) return;

        await updateDoc(

            doc(db, "projects", id),

            {

                name,

                budget: Number(budget),

                status,

                description,

                updatedAt: serverTimestamp()

            }

        );

        notify("Project updated.");

    }

    catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

};



// =====================================================
// DELETE PROJECT
// =====================================================

window.deleteProject = async function (id) {

    if (!confirm("Delete this project?"))
        return;

    try {

        await deleteDoc(

            doc(db, "projects", id)

        );

        notify("Project deleted.");

    }

    catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

};



// =====================================================
// PROJECT STATISTICS
// =====================================================

function getTotalProjectBudget() {

    return cache.projects.reduce(

        (sum, project) =>

            sum + Number(project.budget || 0),

        0

    );

}

function getTotalProjectExpenses() {

    return cache.projects.reduce(

        (sum, project) =>

            sum + Number(project.actualExpenses || 0),

        0

    );

}

function getRemainingProjectBudget() {

    return getTotalProjectBudget() -

        getTotalProjectExpenses();

}



// =====================================================
// PROJECT DASHBOARD
// =====================================================

function refreshProjectDashboard() {

    setText(

        "projectCount",

        cache.projects.length

    );

    setText(

        "projectBudget",

        peso(getTotalProjectBudget())

    );

    setText(

        "projectExpenses",

        peso(getTotalProjectExpenses())

    );

    setText(

        "projectRemaining",

        peso(getRemainingProjectBudget())

    );

}

// =====================================================
// EXPENSES MODULE
// VERSION 18.0
// PART 3A
// =====================================================


// =====================================================
// RECEIPT FILE
// =====================================================

const receiptInput = $("receipt");

if (receiptInput) {

    receiptInput.addEventListener("change", (e) => {

        selectedReceiptFile =
            e.target.files[0] || null;

        const preview = $("receiptPreview");

        if (!preview) return;

        if (selectedReceiptFile) {

            preview.innerHTML = `

                <div class="receipt-preview">

                    📄 ${selectedReceiptFile.name}

                </div>

            `;

        } else {

            preview.innerHTML = "";

        }

    });

}



// =====================================================
// LOAD EXPENSES
// =====================================================

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

    });

}



// =====================================================
// RENDER EXPENSES
// =====================================================

function renderExpenses() {

    const container = $("expenseContainer");

    if (!container) return;

    container.innerHTML = "";

    if (cache.expenses.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                No expenses found.

            </div>

        `;

        return;

    }

    cache.expenses.forEach(expense => {

        container.innerHTML += `

        <div class="data-card">

            <h3>

                ${expense.project || "Project"}

            </h3>

            <p>

                <strong>Amount:</strong>

                ${peso(expense.amount)}

            </p>

            <p>

                <strong>Description:</strong>

                ${expense.description || "-"}

            </p>

            <p>

                <strong>Date:</strong>

                ${expense.date || "-"}

            </p>

            ${expense.receiptURL ?

            `<p>

                <a href="${expense.receiptURL}"

                target="_blank">

                📄 View Receipt

                </a>

            </p>`

            : ""}

            <div class="card-actions">

                <button onclick="editExpense('${expense.id}')">

                    ✏ Edit

                </button>

                <button onclick="deleteExpense('${expense.id}')">

                    🗑 Delete

                </button>

            </div>

        </div>

        `;

    });

}



// =====================================================
// ADD EXPENSE
// =====================================================

async function addExpense(data) {

    try {

        let receiptURL = "";

        if (selectedReceiptFile) {

            const storageRef = ref(

                storage,

                `receipts/${Date.now()}_${selectedReceiptFile.name}`

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

                project:

                    data.project,

                amount:

                    Number(data.amount),

                description:

                    data.description || "",

                date:

                    data.date || "",

                receiptURL,

                createdAt:

                    serverTimestamp()

            }

        );

        notify("Expense added.");

        selectedReceiptFile = null;

        if (receiptInput)
            receiptInput.value = "";

        if ($("receiptPreview"))
            $("receiptPreview").innerHTML = "";

    }

    catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

}

// ======================================================
// PART 3B
// REAL-TIME DASHBOARD SUMMARY
// ======================================================

async function loadSummary() {

    try {

        // -------------------------
        // COLLECTIONS
        // -------------------------

        const collectionSnapshot =
            await getDocs(collection(db, "collections"));

        let totalCollections = 0;

        collectionSnapshot.forEach(doc => {

            const data = doc.data();

            totalCollections += Number(data.amount || 0);

        });

        // -------------------------
        // PROJECTS
        // -------------------------

        const projectSnapshot =
            await getDocs(collection(db, "projects"));

        let totalBudget = 0;

        let totalProjectExpenses = 0;

        projectSnapshot.forEach(doc => {

            const data = doc.data();

            totalBudget += Number(data.budget || 0);

            totalProjectExpenses +=
                Number(data.actualExpenses || 0);

        });

        // -------------------------
        // MANUAL EXPENSES
        // -------------------------

        const expenseSnapshot =
            await getDocs(collection(db, "expenses"));

        let manualExpenses = 0;

        expenseSnapshot.forEach(doc => {

            const data = doc.data();

            manualExpenses +=
                Number(data.amount || 0);

        });

        // -------------------------
        // COMPUTE
        // -------------------------

        const totalExpenses =
            manualExpenses +
            totalProjectExpenses;

        const balance =
            totalCollections -
            totalExpenses;

        // -------------------------
        // COUNTS
        // -------------------------

        setText(
            "projectCount",
            projectCache.length
        );

        setText(
            "expenseCount",
            expenseCache.length
        );

        setText(
            "collectionCount",
            collectionCache.length
        );

        // -------------------------
        // MONEY
        // -------------------------

        setText(
            "totalBudget",
            peso(totalBudget)
        );

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
            peso(balance)
        );

        // -------------------------
        // STATUS
        // -------------------------

        const status =
            document.getElementById(
                "dashboardStatus"
            );

        if (status) {

            if (balance < 0) {

                status.textContent =
                    "🔴 Deficit";

            }

            else if (balance === 0) {

                status.textContent =
                    "🟡 Balanced";

            }

            else {

                status.textContent =
                    "🟢 Healthy";

            }

        }

        console.log("Summary Updated");

    }

    catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

}
// ======================================================
// PART 4A
// ANNOUNCEMENT MANAGEMENT
// ======================================================

let announcementCache = [];

// ======================================================
// LOAD ANNOUNCEMENTS
// ======================================================

async function loadAnnouncements() {

    const container =
        document.getElementById("announcementContainer");

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
                    No announcements yet.
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

                <div class="data-card">

                    <h3>${data.title || "Announcement"}</h3>

                    <p>${data.message || ""}</p>

                    <small>
                        ${data.author || "Admin"}
                    </small>

                    <br><br>

                    <button
                        onclick="editAnnouncement('${docSnap.id}')">

                        ✏ Edit

                    </button>

                    <button
                        onclick="deleteAnnouncement('${docSnap.id}')">

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

// ======================================================
// ADD ANNOUNCEMENT
// ======================================================

async function addAnnouncement(data){

    try{

        await addDoc(

            collection(db,"announcements"),

            {

                title: data.title,

                message: data.message,

                author: auth.currentUser?.email || "Admin",

                createdAt: serverTimestamp()

            }

        );

        notify("Announcement posted.");

        await loadAnnouncements();

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

}

// ======================================================
// ANNOUNCEMENT FORM
// ======================================================

const announcementForm =
document.getElementById("announcementForm");

if(announcementForm){

    announcementForm.addEventListener(
        "submit",
        async(e)=>{

            e.preventDefault();

            const title =
                getValue("announcementTitle");

            const message =
                getValue("announcementMessage");

            if(!title){

                notify("Enter title.");

                return;

            }

            if(!message){

                notify("Enter message.");

                return;

            }

            await addAnnouncement({

                title,

                message

            });

            announcementForm.reset();

        }

    );

}
// ======================================================
// PART 4B
// EDIT & DELETE ANNOUNCEMENTS
// ======================================================

// ======================================================
// EDIT ANNOUNCEMENT
// ======================================================

window.editAnnouncement = async function(id){

    try{

        const announcementRef =
            doc(db,"announcements",id);

        const snapshot =
            await getDoc(announcementRef);

        if(!snapshot.exists()){

            notify("Announcement not found.","error");

            return;

        }

        const data = snapshot.data();

        const title = prompt(
            "Announcement Title",
            data.title || ""
        );

        if(title === null) return;

        const message = prompt(
            "Announcement Message",
            data.message || ""
        );

        if(message === null) return;

        await updateDoc(

            announcementRef,

            {

                title,

                message,

                updatedAt: serverTimestamp()

            }

        );

        notify("Announcement updated.");

        await loadAnnouncements();

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

};

// ======================================================
// DELETE ANNOUNCEMENT
// ======================================================

window.deleteAnnouncement = async function(id){

    if(!confirm("Delete this announcement?"))
        return;

    try{

        await deleteDoc(
            doc(db,"announcements",id)
        );

        announcementCache =
            announcementCache.filter(
                item => item.id !== id
            );

        notify("Announcement deleted.");

        await loadAnnouncements();

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

};

// ======================================================
// REFRESH ANNOUNCEMENTS
// ======================================================

async function refreshAnnouncements(){

    await loadAnnouncements();

    console.log(
        "Announcements refreshed."
    );

}

// ======================================================
// PART 5
// STUDENT MANAGEMENT SYSTEM
// ======================================================

let studentCache = [];

// ======================================================
// LOAD STUDENTS
// ======================================================

async function loadStudents() {

    const container =
        document.getElementById("studentContainer");

    const select =
        document.getElementById("studentSelect");

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

        if (select) {

            select.innerHTML =
                `<option value="">Select Student</option>`;

        }

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            const student = {

                id: docSnap.id,

                ...data

            };

            studentCache.push(student);

            if (container) {

                container.innerHTML += `

                <div class="data-card">

                    <h3>${student.studentName}</h3>

                    <p>
                        <strong>ID:</strong>
                        ${student.studentId || "-"}
                    </p>

                    <p>
                        <strong>Course:</strong>
                        ${student.course || "-"}
                    </p>

                    <p>
                        <strong>Year:</strong>
                        ${student.yearLevel || "-"}
                    </p>

                    <button
                        onclick="editStudent('${student.id}')">

                        ✏ Edit

                    </button>

                    <button
                        onclick="deleteStudent('${student.id}')">

                        🗑 Delete

                    </button>

                </div>

                `;

            }

            if (select) {

                select.innerHTML += `

                <option value="${student.id}">

                    ${student.studentName}

                </option>

                `;

            }

        });

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

}

// ======================================================
// ADD STUDENT
// ======================================================

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

// ======================================================
// STUDENT FORM
// ======================================================

const studentForm =
document.getElementById("studentForm");

if(studentForm){

    studentForm.addEventListener(
        "submit",
        async(e)=>{

            e.preventDefault();

            const studentName =
                getValue("studentName");

            const studentId =
                getValue("studentId");

            const course =
                getValue("course");

            const yearLevel =
                getValue("yearLevel");

            if(!studentName){

                notify("Student name is required.");

                return;

            }

            await addStudent({

                studentName,

                studentId,

                course,

                yearLevel

            });

            studentForm.reset();

        }

    );

}

// ======================================================
// EDIT STUDENT
// ======================================================

window.editStudent = async function(id){

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

        if(studentName===null) return;

        const studentId =
            prompt(
                "Student ID",
                data.studentId || ""
            );

        if(studentId===null) return;

        const course =
            prompt(
                "Course",
                data.course || ""
            );

        if(course===null) return;

        const yearLevel =
            prompt(
                "Year Level",
                data.yearLevel || ""
            );

        if(yearLevel===null) return;

        await updateDoc(

            refDoc,

            {

                studentName,

                studentId,

                course,

                yearLevel,

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

// ======================================================
// DELETE STUDENT
// ======================================================

window.deleteStudent = async function(id){

    if(!confirm("Delete this student?"))
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
// ======================================================
// PART 5A
// STUDENT AUTO-FILL FOR COLLECTIONS
// ======================================================

const studentSelect =
document.getElementById("studentSelect");

if(studentSelect){

    studentSelect.addEventListener(
        "change",
        fillStudentInformation
    );

}

// ======================================================
// FILL STUDENT INFORMATION
// ======================================================

function fillStudentInformation(){

    const studentId =
        studentSelect.value;

    if(!studentId){

        clearStudentInformation();

        return;

    }

    const student =
        studentCache.find(
            item => item.id === studentId
        );

    if(!student){

        clearStudentInformation();

        return;

    }

    setInputValue(
        "studentName",
        student.studentName || ""
    );

    setInputValue(
        "studentId",
        student.studentId || ""
    );

    setInputValue(
        "course",
        student.course || ""
    );

    setInputValue(
        "yearLevel",
        student.yearLevel || ""
    );

}

// ======================================================
// SET INPUT VALUE
// ======================================================

function setInputValue(id,value){

    const input =
        document.getElementById(id);

    if(input){

        input.value = value;

    }

}

// ======================================================
// CLEAR STUDENT INFORMATION
// ======================================================

function clearStudentInformation(){

    [

        "studentName",

        "studentId",

        "course",

        "yearLevel"

    ].forEach(id=>{

        const input =
            document.getElementById(id);

        if(input){

            input.value = "";

        }

    });

}

// ======================================================
// COLLECTION FORM VALIDATION
// ======================================================

function validateCollectionForm(){

    if(!getValue("studentName")){

        notify("Please select a student.");

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

    if(isNaN(amount) || amount <= 0){

        notify("Invalid payment amount.");

        return false;

    }

    if(!getValue("paymentType")){

        notify("Please select a payment type.");

        return false;

    }

    if(!getValue("date")){

        notify("Please select a payment date.");

        return false;

    }

    return true;

}

// ======================================================
// UPDATE COLLECTION FORM
// ======================================================

if(collectionForm){

    collectionForm.addEventListener(
        "submit",
        function(e){

            if(!validateCollectionForm()){

                e.preventDefault();

                return;

            }

        },
        true
    );

}
// ======================================================
// PART 6
// RECEIPT SYSTEM
// ======================================================

let receiptCache = [];

// ======================================================
// GENERATE RECEIPT NUMBER
// ======================================================

function generateReceiptNumber() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");

    const random = Math.floor(
        1000 + Math.random() * 9000
    );

    return `DLB-${year}${month}${day}-${random}`;

}

// ======================================================
// SAVE RECEIPT
// ======================================================

async function saveReceipt(data){

    try{

        const receipt = {

            receiptNumber:
                generateReceiptNumber(),

            studentName:
                data.studentName || "",

            studentId:
                data.studentId || "",

            course:
                data.course || "",

            yearLevel:
                data.yearLevel || "",

            paymentType:
                data.paymentType || "",

            amount:
                Number(data.amount || 0),

            remarks:
                data.remarks || "",

            date:
                data.date || "",

            createdAt:
                serverTimestamp()

        };

        await addDoc(

            collection(db,"receipts"),

            receipt

        );

        notify("Receipt generated.");

        await loadReceipts();

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

}

// ======================================================
// LOAD RECEIPTS
// ======================================================

async function loadReceipts(){

    const container =
        document.getElementById(
            "receiptContainer"
        );

    if(!container) return;

    try{

        const snapshot =
            await getDocs(

                query(

                    collection(
                        db,
                        "receipts"
                    ),

                    orderBy(
                        "createdAt",
                        "desc"
                    )

                )

            );

        receiptCache = [];

        container.innerHTML = "";

        if(snapshot.empty){

            container.innerHTML = `

                <div class="empty-state">

                    No receipts found.

                </div>

            `;

            return;

        }

        snapshot.forEach(docSnap=>{

            const data = docSnap.data();

            receiptCache.push({

                id: docSnap.id,

                ...data

            });

            container.innerHTML += `

                <div class="data-card">

                    <h3>

                        ${data.receiptNumber}

                    </h3>

                    <p>

                        <strong>Student:</strong>

                        ${data.studentName}

                    </p>

                    <p>

                        <strong>Amount:</strong>

                        ${peso(data.amount)}

                    </p>

                    <p>

                        <strong>Date:</strong>

                        ${data.date}

                    </p>

                    <button
                        onclick="viewReceipt('${docSnap.id}')">

                        👁 View

                    </button>

                    <button
                        onclick="deleteReceipt('${docSnap.id}')">

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

// ======================================================
// VIEW RECEIPT
// ======================================================

window.viewReceipt = function(id){

    const receipt =
        receiptCache.find(
            item => item.id === id
        );

    if(!receipt) return;

    alert(

`Receipt Number : ${receipt.receiptNumber}

Student : ${receipt.studentName}

Student ID : ${receipt.studentId}

Course : ${receipt.course}

Year Level : ${receipt.yearLevel}

Payment : ${receipt.paymentType}

Amount : ${peso(receipt.amount)}

Date : ${receipt.date}

Remarks : ${receipt.remarks || "-"}`

    );

};

// ======================================================
// DELETE RECEIPT
// ======================================================

window.deleteReceipt = async function(id){

    if(!confirm("Delete receipt?"))
        return;

    try{

        await deleteDoc(

            doc(db,"receipts",id)

        );

        notify("Receipt deleted.");

        await loadReceipts();

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

};

// ======================================================
// AUTO RECEIPT AFTER COLLECTION
// ======================================================

async function createReceiptFromCollection(collectionData){

    await saveReceipt({

        studentName:
            collectionData.studentName,

        studentId:
            collectionData.studentId,

        course:
            collectionData.course,

        yearLevel:
            collectionData.yearLevel,

        paymentType:
            collectionData.paymentType,

        amount:
            collectionData.amount,

        remarks:
            collectionData.remarks,

        date:
            collectionData.date

    });

}
// ======================================================
// PART 7
// DASHBOARD ANALYTICS ENGINE
// ======================================================

const analytics = {

    collections: 0,

    expenses: 0,

    projectExpenses: 0,

    budget: 0,

    balance: 0,

    projects: 0,

    students: 0,

    announcements: 0

};

// ======================================================
// REFRESH ANALYTICS
// ======================================================

async function refreshAnalytics(){

    try{

        analytics.collections =

            collectionCache.reduce(

                (sum,item)=>

                    sum + Number(item.amount || 0),

                0

            );

        analytics.expenses =

            expenseCache.reduce(

                (sum,item)=>

                    sum + Number(item.amount || 0),

                0

            );

        analytics.projectExpenses =

            projectCache.reduce(

                (sum,item)=>

                    sum + Number(item.actualExpenses || 0),

                0

            );

        analytics.budget =

            projectCache.reduce(

                (sum,item)=>

                    sum + Number(item.budget || 0),

                0

            );

        analytics.balance =

            analytics.collections -

            analytics.expenses -

            analytics.projectExpenses;

        analytics.projects =

            projectCache.length;

        analytics.students =

            studentCache.length;

        analytics.announcements =

            announcementCache.length;

        updateAnalyticsCards();

        updateYearLevelTotals();

        updateTreasuryHealth();

        console.log("Analytics Updated");

    }

    catch(error){

        console.error(error);

    }

}

// ======================================================
// UPDATE DASHBOARD CARDS
// ======================================================

function updateAnalyticsCards(){

    setText(

        "analyticsCollections",

        peso(analytics.collections)

    );

    setText(

        "analyticsExpenses",

        peso(

            analytics.expenses +

            analytics.projectExpenses

        )

    );

    setText(

        "analyticsBalance",

        peso(analytics.balance)

    );

    setText(

        "analyticsBudget",

        peso(analytics.budget)

    );

    setText(

        "analyticsProjects",

        analytics.projects

    );

    setText(

        "analyticsStudents",

        analytics.students

    );

    setText(

        "analyticsAnnouncements",

        analytics.announcements

    );

}

// ======================================================
// YEAR LEVEL TOTALS
// ======================================================

function updateYearLevelTotals(){

    let first = 0;

    let second = 0;

    let third = 0;

    let fourth = 0;

    collectionCache.forEach(item=>{

        const amount =

            Number(item.amount || 0);

        const level =

            String(

                item.yearLevel || ""

            ).toLowerCase();

        if(

            level.includes("1") ||

            level.includes("first")

        ){

            first += amount;

        }

        else if(

            level.includes("2") ||

            level.includes("second")

        ){

            second += amount;

        }

        else if(

            level.includes("3") ||

            level.includes("third")

        ){

            third += amount;

        }

        else if(

            level.includes("4") ||

            level.includes("fourth")

        ){

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

}

// ======================================================
// TREASURY HEALTH
// ======================================================

function updateTreasuryHealth(){

    const health =

        document.getElementById(

            "treasuryHealth"

        );

    if(!health) return;

    if(analytics.balance < 0){

        health.textContent =

            "🔴 Critical";

    }

    else if(

        analytics.balance < 5000

    ){

        health.textContent =

            "🟡 Low Balance";

    }

    else{

        health.textContent =

            "🟢 Healthy";

    }

}

// ======================================================
// TOP COLLECTION YEAR
// ======================================================

function getTopYearLevel(){

    const totals = {

        first:

            Number(

                document

                .getElementById(

                    "firstYearCollection"

                )

                ?.textContent

                ?.replace(/[₱,]/g,"") || 0

            ),

        second:

            Number(

                document

                .getElementById(

                    "secondYearCollection"

                )

                ?.textContent

                ?.replace(/[₱,]/g,"") || 0

            ),

        third:

            Number(

                document

                .getElementById(

                    "thirdYearCollection"

                )

                ?.textContent

                ?.replace(/[₱,]/g,"") || 0

            ),

        fourth:

            Number(

                document

                .getElementById(

                    "fourthYearCollection"

                )

                ?.textContent

                ?.replace(/[₱,]/g,"") || 0

            )

    };

    let winner =

        "First Year";

    let highest =

        totals.first;

    Object.entries(totals)

        .forEach(([key,value])=>{

            if(value > highest){

                highest = value;

                winner =

                    key

                    .charAt(0)

                    .toUpperCase()

                    +

                    key.slice(1)

                    +

                    " Year";

            }

        });

    setText(

        "topYearLevel",

        winner

    );

    setText(

        "topYearAmount",

        peso(highest)

    );

}

// ======================================================
// AUTO REFRESH
// ======================================================

setInterval(()=>{

    refreshAnalytics();

},10000);
