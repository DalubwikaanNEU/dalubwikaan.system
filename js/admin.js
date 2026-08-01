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
