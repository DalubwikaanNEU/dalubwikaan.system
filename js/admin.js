// ======================================================
// DALUBWIKAAN TREASURY SYSTEM
// ADMIN PANEL
// VERSION 20.0
// PART 1 - CORE
// ======================================================

import {
    db,
    auth,
    storage
} from "./firebase.js";

import {

    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import {

    onAuthStateChanged,
    signOut

} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {

    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject

} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";


// ======================================================
// GLOBAL CACHE
// ======================================================

const cache = {

    students: [],
    collections: [],
    projects: [],
    expenses: [],
    records: [],
    announcements: [],
    receipts: []

};


// ======================================================
// SHORTCUT
// ======================================================

const $ = id => document.getElementById(id);


// ======================================================
// FORMAT MONEY
// ======================================================

function peso(value = 0){

    return new Intl.NumberFormat(

        "en-PH",

        {

            style:"currency",

            currency:"PHP"

        }

    ).format(Number(value));

}


// ======================================================
// SET TEXT
// ======================================================

function setText(id,value){

    const el=$(id);

    if(el){

        el.textContent=value;

    }

}


// ======================================================
// GET VALUE
// ======================================================

function getValue(id){

    const el=$(id);

    return el ? el.value.trim() : "";

}


// ======================================================
// NOTIFICATION
// ======================================================

function notify(message,type="success"){

    console.log(`[${type.toUpperCase()}] ${message}`);

    alert(message);

}


// ======================================================
// LOADING
// ======================================================

function showLoading(show=true){

    const loader=$("loadingOverlay");

    if(loader){

        loader.style.display=

            show ? "flex" : "none";

    }

}


// ======================================================
// LOGOUT
// ======================================================

window.logout=async()=>{

    if(!confirm("Logout?")) return;

    await signOut(auth);

};


// ======================================================
// AUTH CHECK
// ======================================================

onAuthStateChanged(auth,user=>{

    if(!user){

        location.href="login.html";

        return;

    }

    initializeSystem();

});


// ======================================================
// PLACEHOLDERS
// (Real code will come in the next parts.)
// ======================================================

function loadStudents(){}

function loadProjects(){}

function loadExpenses(){}

function loadRecords(){}

function loadAnnouncements(){}

function loadSummary(){}


// ======================================================
// INITIALIZER
// ======================================================

function initializeSystem(){

    console.log("DALUBWIKAAN ADMIN v20");

    loadStudents();

    loadCollections();

    loadProjects();

    loadExpenses();

    loadRecords();

    loadAnnouncements();

    loadSummary();

}
// ======================================================
// STUDENTS MODULE
// VERSION 20.0
// PART 2
// ======================================================

// ------------------------------------------------------
// LOAD STUDENTS (Realtime)
// ------------------------------------------------------

function loadStudents() {

    const container = $("studentContainer");

    const q = query(

        collection(db, "students"),

        orderBy("studentName")

    );

    onSnapshot(q, (snapshot) => {

        cache.students = [];

        if (container) {

            container.innerHTML = "";

        }

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            cache.students.push({

                id: docSnap.id,

                ...data

            });

            if (container) {

                container.innerHTML += `

                <div class="data-card">

                    <h3>${data.studentName || "-"}</h3>

                    <p><b>ID:</b> ${data.studentId || "-"}</p>

                    <p><b>Course:</b> ${data.course || "-"}</p>

                    <p><b>Year:</b> ${data.yearLevel || "-"}</p>

                    <div class="action-buttons">

                        <button onclick="editStudent('${docSnap.id}')">

                            Edit

                        </button>

                        <button onclick="deleteStudent('${docSnap.id}')">

                            Delete

                        </button>

                    </div>

                </div>

                `;

            }

        });

        populateStudentDropdown();

    }, (error) => {

        console.error(error);

        notify(error.message, "error");

    });

}

// ------------------------------------------------------
// ADD STUDENT
// ------------------------------------------------------

async function addStudent(data) {

    try {

        await addDoc(

            collection(db, "students"),

            {

                ...data,

                createdAt: serverTimestamp()

            }

        );

        notify("Student added.");

    }

    catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

}

// ------------------------------------------------------
// STUDENT FORM
// ------------------------------------------------------

const studentForm = $("studentForm");

if (studentForm) {

    studentForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        await addStudent({

            studentName: getValue("studentName"),

            studentId: getValue("studentId"),

            course: getValue("course"),

            yearLevel: getValue("yearLevel")

        });

        studentForm.reset();

    });

}

// ------------------------------------------------------
// EDIT STUDENT
// ------------------------------------------------------

window.editStudent = async function(id) {

    const refDoc = doc(db, "students", id);

    const snap = await getDoc(refDoc);

    if (!snap.exists()) return;

    const data = snap.data();

    const studentName = prompt(

        "Student Name",

        data.studentName

    );

    if (studentName === null) return;

    await updateDoc(

        refDoc,

        {

            studentName,

            updatedAt: serverTimestamp()

        }

    );

    notify("Student updated.");

};

// ------------------------------------------------------
// DELETE STUDENT
// ------------------------------------------------------

window.deleteStudent = async function(id) {

    if (!confirm("Delete this student?")) return;

    await deleteDoc(

        doc(db, "students", id)

    );

    notify("Student deleted.");

};

// ------------------------------------------------------
// POPULATE STUDENT DROPDOWN
// ------------------------------------------------------

function populateStudentDropdown() {

    const select = $("studentSelect");

    if (!select) return;

    select.innerHTML = `

        <option value="">

            Select Student

        </option>

    `;

    cache.students.forEach(student => {

        select.innerHTML += `

        <option value="${student.id}">

            ${student.studentName}

        </option>

        `;

    });

}
// ======================================================
// COLLECTIONS MODULE
// VERSION 20.0
// PART 3
// ======================================================

// ------------------------------------------------------
// LOAD COLLECTIONS (Realtime)
// ------------------------------------------------------

function loadCollections() {

    const container = $("collectionContainer");

    const q = query(
        collection(db, "collections"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {

        cache.collections = [];

        if (container) {

            container.innerHTML = "";

        }

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            cache.collections.push({

                id: docSnap.id,

                ...data

            });

            if (container) {

                container.innerHTML += `

                <div class="data-card">

                    <h3>${data.studentName || "Unknown Student"}</h3>

                    <p><b>Student ID:</b> ${data.studentId || "-"}</p>

                    <p><b>Course:</b> ${data.course || "-"}</p>

                    <p><b>Year:</b> ${data.yearLevel || "-"}</p>

                    <p><b>Payment:</b> ${data.paymentType || "-"}</p>

                    <p><b>Amount:</b> ${peso(data.amount || 0)}</p>

                    <p><b>Date:</b> ${data.date || "-"}</p>

                    <div class="action-buttons">

                        <button onclick="editCollection('${docSnap.id}')">

                            Edit

                        </button>

                        <button onclick="deleteCollection('${docSnap.id}')">

                            Delete

                        </button>

                    </div>

                </div>

                `;

            }

        });

        loadSummary();

    }, (error) => {

        console.error(error);

        notify(error.message, "error");

    });

}

// ------------------------------------------------------
// ADD COLLECTION
// ------------------------------------------------------

async function addCollection(data) {

    try {

        await addDoc(

            collection(db, "collections"),

            {

                ...data,

                createdAt: serverTimestamp()

            }

        );

        notify("Collection saved.");

    }

    catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

}

// ------------------------------------------------------
// COLLECTION FORM
// ------------------------------------------------------

const collectionForm = $("collectionForm");

if (collectionForm) {

    collectionForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        await addCollection({

            studentName: getValue("studentName"),

            studentId: getValue("studentId"),

            course: getValue("course"),

            yearLevel: getValue("yearLevel"),

            paymentType: getValue("paymentType"),

            amount: Number(getValue("amount")),

            date: getValue("date"),

            remarks: getValue("remarks")

        });

        collectionForm.reset();

    });

}

// ------------------------------------------------------
// EDIT COLLECTION
// ------------------------------------------------------

window.editCollection = async function(id) {

    const refDoc = doc(db, "collections", id);

    const snap = await getDoc(refDoc);

    if (!snap.exists()) return;

    const data = snap.data();

    const amount = prompt(

        "Collection Amount",

        data.amount

    );

    if (amount === null) return;

    const remarks = prompt(

        "Remarks",

        data.remarks || ""

    );

    if (remarks === null) return;

    await updateDoc(

        refDoc,

        {

            amount: Number(amount),

            remarks,

            updatedAt: serverTimestamp()

        }

    );

    notify("Collection updated.");

};

// ------------------------------------------------------
// DELETE COLLECTION
// ------------------------------------------------------

window.deleteCollection = async function(id) {

    if (!confirm("Delete this collection?")) return;

    await deleteDoc(

        doc(db, "collections", id)

    );

    notify("Collection deleted.");

};
// ======================================================
// PROJECTS MODULE
// VERSION 20.0
// PART 4
// ======================================================

// ------------------------------------------------------
// LOAD PROJECTS
// ------------------------------------------------------

function loadProjects() {

    const container = $("projectContainer");

    const q = query(
        collection(db, "projects"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {

        cache.projects = [];

        if (container) {

            container.innerHTML = "";

        }

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            cache.projects.push({

                id: docSnap.id,

                ...data

            });

            const budget = Number(data.budget || 0);
            const actual = Number(data.actualExpenses || 0);
            const remaining = budget - actual;

            if (container) {

                container.innerHTML += `

                <div class="data-card">

                    <h3>${data.name || "Untitled Project"}</h3>

                    <p><b>Status:</b> ${data.status || "Planning"}</p>

                    <p><b>Budget:</b> ${peso(budget)}</p>

                    <p><b>Actual Expenses:</b> ${peso(actual)}</p>

                    <p><b>Remaining:</b> ${peso(remaining)}</p>

                    <button onclick="editProject('${docSnap.id}')">
                        Edit
                    </button>

                    <button onclick="deleteProject('${docSnap.id}')">
                        Delete
                    </button>

                </div>

                `;

            }

        });

        loadSummary();

    });

}

// ------------------------------------------------------
// ADD PROJECT
// ------------------------------------------------------

async function addProject(data){

    try{

        await addDoc(

            collection(db,"projects"),

            {

                ...data,

                budget:Number(data.budget||0),

                actualExpenses:Number(data.actualExpenses||0),

                createdAt:serverTimestamp()

            }

        );

        notify("Project added.");

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

}

// ------------------------------------------------------
// PROJECT FORM
// ------------------------------------------------------

const projectForm = $("projectForm");

if(projectForm){

    projectForm.addEventListener("submit",async(e)=>{

        e.preventDefault();

        await addProject({

            name:getValue("projectName"),

            description:getValue("projectDescription"),

            status:getValue("projectStatus"),

            budget:getValue("projectBudget"),

            actualExpenses:getValue("projectActualExpenses")

        });

        projectForm.reset();

    });

}

// ------------------------------------------------------
// EDIT PROJECT
// ------------------------------------------------------

window.editProject = async function(id){

    const refDoc = doc(db,"projects",id);

    const snap = await getDoc(refDoc);

    if(!snap.exists()) return;

    const data = snap.data();

    const budget = prompt(

        "Budget",

        data.budget

    );

    if(budget===null) return;

    const actual = prompt(

        "Actual Expenses",

        data.actualExpenses || 0

    );

    if(actual===null) return;

    const status = prompt(

        "Status",

        data.status || "Planning"

    );

    if(status===null) return;

    await updateDoc(

        refDoc,

        {

            budget:Number(budget),

            actualExpenses:Number(actual),

            status,

            updatedAt:serverTimestamp()

        }

    );

    notify("Project updated.");

};

// ------------------------------------------------------
// DELETE PROJECT
// ------------------------------------------------------

window.deleteProject = async function(id){

    if(!confirm("Delete this project?")) return;

    await deleteDoc(

        doc(db,"projects",id)

    );

    notify("Project deleted.");

};

// ======================================================
// SUMMARY
// ======================================================

function loadSummary(){

    const totalCollections = cache.collections.reduce(

        (sum,item)=>sum+Number(item.amount||0),

        0

    );

    const projectExpenses = cache.projects.reduce(

        (sum,item)=>sum+Number(item.actualExpenses||0),

        0

    );

    const manualExpenses = cache.expenses.reduce(

        (sum,item)=>sum+Number(item.amount||0),

        0

    );

    const totalExpenses =

        projectExpenses +

        manualExpenses;

    const balance =

        totalCollections -

        totalExpenses;

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

    setText(

        "projectCount",

        cache.projects.length

    );

    setText(

        "collectionCount",

        cache.collections.length

    );

    setText(

        "expenseCount",

        cache.expenses.length

    );

}
// ======================================================
// EXPENSES MODULE
// VERSION 20.0
// PART 5
// ======================================================

// ------------------------------------------------------
// LOAD EXPENSES
// ------------------------------------------------------

function loadExpenses() {

    const container = $("expenseContainer");

    const q = query(

        collection(db, "expenses"),

        orderBy("createdAt", "desc")

    );

    onSnapshot(q, (snapshot) => {

        cache.expenses = [];

        if (container) {

            container.innerHTML = "";

        }

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            cache.expenses.push({

                id: docSnap.id,

                ...data

            });

            if (container) {

                container.innerHTML += `

                <div class="data-card">

                    <h3>${data.category || "Expense"}</h3>

                    <p><b>Description:</b> ${data.description || "-"}</p>

                    <p><b>Amount:</b> ${peso(data.amount || 0)}</p>

                    <p><b>Date:</b> ${data.date || "-"}</p>

                    <p><b>Receipt:</b>

                        ${
                            data.receiptURL

                            ? `<a href="${data.receiptURL}" target="_blank">View</a>`

                            : "None"

                        }

                    </p>

                    <button onclick="editExpense('${docSnap.id}')">

                        Edit

                    </button>

                    <button onclick="deleteExpense('${docSnap.id}')">

                        Delete

                    </button>

                </div>

                `;

            }

        });

        loadSummary();

    }, (error) => {

        console.error(error);

        notify(error.message, "error");

    });

}

// ------------------------------------------------------
// ADD EXPENSE
// ------------------------------------------------------

async function addExpense(data) {

    try {

        await addDoc(

            collection(db, "expenses"),

            {

                ...data,

                amount: Number(data.amount || 0),

                createdAt: serverTimestamp()

            }

        );

        notify("Expense added.");

    }

    catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

}

// ------------------------------------------------------
// EXPENSE FORM
// ------------------------------------------------------

const expenseForm = $("expenseForm");

if (expenseForm) {

    expenseForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        let receiptURL = "";

        const file = $("expenseReceipt")?.files[0];

        if (file) {

            const storageRef = ref(

                storage,

                `expenses/${Date.now()}_${file.name}`

            );

            await uploadBytes(

                storageRef,

                file

            );

            receiptURL = await getDownloadURL(

                storageRef

            );

        }

        await addExpense({

            category: getValue("expenseCategory"),

            description: getValue("expenseDescription"),

            amount: getValue("expenseAmount"),

            date: getValue("expenseDate"),

            receiptURL

        });

        expenseForm.reset();

    });

}

// ------------------------------------------------------
// EDIT EXPENSE
// ------------------------------------------------------

window.editExpense = async function(id) {

    const refDoc = doc(

        db,

        "expenses",

        id

    );

    const snap = await getDoc(refDoc);

    if (!snap.exists()) return;

    const data = snap.data();

    const amount = prompt(

        "Expense Amount",

        data.amount

    );

    if (amount === null) return;

    const description = prompt(

        "Description",

        data.description || ""

    );

    if (description === null) return;

    await updateDoc(

        refDoc,

        {

            amount: Number(amount),

            description,

            updatedAt: serverTimestamp()

        }

    );

    notify("Expense updated.");

};

// ------------------------------------------------------
// DELETE EXPENSE
// ------------------------------------------------------

window.deleteExpense = async function(id) {

    if (!confirm("Delete this expense?")) return;

    try {

        const refDoc = doc(

            db,

            "expenses",

            id

        );

        const snap = await getDoc(refDoc);

        if (snap.exists()) {

            const data = snap.data();

            if (data.receiptURL) {

                try {

                    const path = decodeURIComponent(

                        data.receiptURL.split("/o/")[1].split("?")[0]

                    );

                    await deleteObject(

                        ref(storage, path)

                    );

                }

                catch (e) {

                    console.warn("Receipt not removed from storage.");

                }

            }

        }

        await deleteDoc(refDoc);

        notify("Expense deleted.");

    }

    catch (error) {

        console.error(error);

        notify(error.message, "error");

    }

};

// ------------------------------------------------------
// TOTAL EXPENSES
// ------------------------------------------------------

function getTotalExpenses() {

    return cache.expenses.reduce(

        (sum, item) =>

            sum + Number(item.amount || 0),

        0

    );

}
// ======================================================
// RECORDS & ANNOUNCEMENTS MODULE
// VERSION 20.0
// PART 6
// ======================================================

// ------------------------------------------------------
// LOAD RECORDS
// ------------------------------------------------------

function loadRecords() {

    const container = $("recordContainer");

    const q = query(
        collection(db, "records"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {

        cache.records = [];

        if (container) {

            container.innerHTML = "";

        }

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            cache.records.push({

                id: docSnap.id,

                ...data

            });

            if (container) {

                container.innerHTML += `

                <div class="data-card">

                    <h3>${data.title || "Record"}</h3>

                    <p>${data.description || "-"}</p>

                    <p><b>Date:</b> ${data.date || "-"}</p>

                    <button onclick="editRecord('${docSnap.id}')">

                        Edit

                    </button>

                    <button onclick="deleteRecord('${docSnap.id}')">

                        Delete

                    </button>

                </div>

                `;

            }

        });

        setText("recordCount", cache.records.length);

    }, error => {

        console.error(error);

        notify(error.message, "error");

    });

}

// ------------------------------------------------------
// ADD RECORD
// ------------------------------------------------------

async function addRecord(data){

    try{

        await addDoc(

            collection(db,"records"),

            {

                ...data,

                createdAt:serverTimestamp()

            }

        );

        notify("Record added.");

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

}

// ------------------------------------------------------
// RECORD FORM
// ------------------------------------------------------

const recordForm = $("recordForm");

if(recordForm){

    recordForm.addEventListener("submit",async(e)=>{

        e.preventDefault();

        await addRecord({

            title:getValue("recordTitle"),

            description:getValue("recordDescription"),

            date:getValue("recordDate")

        });

        recordForm.reset();

    });

}

// ------------------------------------------------------
// EDIT RECORD
// ------------------------------------------------------

window.editRecord = async function(id){

    const refDoc = doc(db,"records",id);

    const snap = await getDoc(refDoc);

    if(!snap.exists()) return;

    const data = snap.data();

    const title = prompt(

        "Title",

        data.title

    );

    if(title===null) return;

    const description = prompt(

        "Description",

        data.description || ""

    );

    if(description===null) return;

    await updateDoc(

        refDoc,

        {

            title,

            description,

            updatedAt:serverTimestamp()

        }

    );

    notify("Record updated.");

};

// ------------------------------------------------------
// DELETE RECORD
// ------------------------------------------------------

window.deleteRecord = async function(id){

    if(!confirm("Delete this record?")) return;

    await deleteDoc(

        doc(db,"records",id)

    );

    notify("Record deleted.");

};

// ======================================================
// ANNOUNCEMENTS
// ======================================================

function loadAnnouncements(){

    const container = $("announcementContainer");

    const q = query(

        collection(db,"announcements"),

        orderBy("createdAt","desc")

    );

    onSnapshot(q,(snapshot)=>{

        cache.announcements=[];

        if(container){

            container.innerHTML="";

        }

        snapshot.forEach(docSnap=>{

            const data = docSnap.data();

            cache.announcements.push({

                id:docSnap.id,

                ...data

            });

            if(container){

                container.innerHTML += `

                <div class="announcement-card">

                    <h3>${data.title || "-"}</h3>

                    <p>${data.message || "-"}</p>

                    <small>${data.date || "-"}</small>

                    <br><br>

                    <button onclick="editAnnouncement('${docSnap.id}')">

                        Edit

                    </button>

                    <button onclick="deleteAnnouncement('${docSnap.id}')">

                        Delete

                    </button>

                </div>

                `;

            }

        });

        setText(

            "announcementCount",

            cache.announcements.length

        );

    },error=>{

        console.error(error);

        notify(error.message,"error");

    });

}

// ------------------------------------------------------
// ADD ANNOUNCEMENT
// ------------------------------------------------------

async function addAnnouncement(data){

    try{

        await addDoc(

            collection(db,"announcements"),

            {

                ...data,

                createdAt:serverTimestamp()

            }

        );

        notify("Announcement posted.");

    }

    catch(error){

        console.error(error);

        notify(error.message,"error");

    }

}

// ------------------------------------------------------
// ANNOUNCEMENT FORM
// ------------------------------------------------------

const announcementForm = $("announcementForm");

if(announcementForm){

    announcementForm.addEventListener("submit",async(e)=>{

        e.preventDefault();

        await addAnnouncement({

            title:getValue("announcementTitle"),

            message:getValue("announcementMessage"),

            date:getValue("announcementDate")

        });

        announcementForm.reset();

    });

}

// ------------------------------------------------------
// EDIT ANNOUNCEMENT
// ------------------------------------------------------

window.editAnnouncement = async function(id){

    const refDoc = doc(db,"announcements",id);

    const snap = await getDoc(refDoc);

    if(!snap.exists()) return;

    const data = snap.data();

    const title = prompt(

        "Title",

        data.title

    );

    if(title===null) return;

    const message = prompt(

        "Message",

        data.message

    );

    if(message===null) return;

    await updateDoc(

        refDoc,

        {

            title,

            message,

            updatedAt:serverTimestamp()

        }

    );

    notify("Announcement updated.");

};

// ------------------------------------------------------
// DELETE ANNOUNCEMENT
// ------------------------------------------------------

window.deleteAnnouncement = async function(id){

    if(!confirm("Delete this announcement?")) return;

    await deleteDoc(

        doc(db,"announcements",id)

    );

    notify("Announcement deleted.");

};
// ======================================================
// ADMIN FINAL MODULE
// VERSION 20.0
// PART 7
// ======================================================


// ======================================================
// DASHBOARD ANALYTICS
// ======================================================

function updateAnalytics(){

    setText("studentCount",cache.students.length);

    setText("collectionCount",cache.collections.length);

    setText("projectCount",cache.projects.length);

    setText("expenseCount",cache.expenses.length);

    setText("recordCount",cache.records.length);

    setText("announcementCount",cache.announcements.length);

}


// ======================================================
// REFRESH ALL
// ======================================================

window.refreshDashboard=function(){

    loadStudents();

    loadCollections();

    loadProjects();

    loadExpenses();

    loadRecords();

    loadAnnouncements();

    loadSummary();

    updateAnalytics();

    console.log("Dashboard refreshed.");

}


// ======================================================
// EXPORT COLLECTION CSV
// ======================================================

window.exportCollections=function(){

    if(cache.collections.length===0){

        notify("No collections.");

        return;

    }

    let csv="Student,Student ID,Course,Year Level,Payment Type,Amount,Date\n";

    cache.collections.forEach(item=>{

        csv+=`"${item.studentName||""}","${item.studentId||""}","${item.course||""}","${item.yearLevel||""}","${item.paymentType||""}","${item.amount||0}","${item.date||""}"\n`;

    });

    const blob=new Blob(

        [csv],

        {

            type:"text/csv"

        }

    );

    const url=URL.createObjectURL(blob);

    const a=document.createElement("a");

    a.href=url;

    a.download="Collections.csv";

    a.click();

    URL.revokeObjectURL(url);

}


// ======================================================
// EXPORT PROJECT CSV
// ======================================================

window.exportProjects=function(){

    if(cache.projects.length===0){

        notify("No projects.");

        return;

    }

    let csv="Project,Budget,Actual Expenses,Status\n";

    cache.projects.forEach(item=>{

        csv+=`"${item.name||""}","${item.budget||0}","${item.actualExpenses||0}","${item.status||""}"\n`;

    });

    const blob=new Blob(

        [csv],

        {

            type:"text/csv"

        }

    );

    const url=URL.createObjectURL(blob);

    const a=document.createElement("a");

    a.href=url;

    a.download="Projects.csv";

    a.click();

    URL.revokeObjectURL(url);

}


// ======================================================
// EXPORT EXPENSE CSV
// ======================================================

window.exportExpenses=function(){

    if(cache.expenses.length===0){

        notify("No expenses.");

        return;

    }

    let csv="Category,Description,Amount,Date\n";

    cache.expenses.forEach(item=>{

        csv+=`"${item.category||""}","${item.description||""}","${item.amount||0}","${item.date||""}"\n`;

    });

    const blob=new Blob(

        [csv],

        {

            type:"text/csv"

        }

    );

    const url=URL.createObjectURL(blob);

    const a=document.createElement("a");

    a.href=url;

    a.download="Expenses.csv";

    a.click();

    URL.revokeObjectURL(url);

}


// ======================================================
// SYSTEM REPORT
// ======================================================

window.exportSystemReport=function(){

    const report={

        generated:new Date().toLocaleString(),

        students:cache.students.length,

        collections:cache.collections.length,

        projects:cache.projects.length,

        expenses:cache.expenses.length,

        records:cache.records.length,

        announcements:cache.announcements.length,

        totalCollections:cache.collections.reduce(

            (a,b)=>a+Number(b.amount||0),

            0

        ),

        totalExpenses:

            cache.expenses.reduce(

                (a,b)=>a+Number(b.amount||0),

                0

            )+

            cache.projects.reduce(

                (a,b)=>a+Number(b.actualExpenses||0),

                0

            )

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

    const url=URL.createObjectURL(blob);

    const a=document.createElement("a");

    a.href=url;

    a.download="SystemReport.json";

    a.click();

    URL.revokeObjectURL(url);

}


// ======================================================
// INITIALIZE COUNTS
// ======================================================

setInterval(()=>{

    updateAnalytics();

},3000);


// ======================================================
// READY
// ======================================================

console.log("===================================");

console.log("DALUBWIKAAN TREASURY ADMIN");

console.log("Version 20.0");

console.log("System Ready");

console.log("===================================");
