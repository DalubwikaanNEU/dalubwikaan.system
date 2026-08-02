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

function loadCollections(){}

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
