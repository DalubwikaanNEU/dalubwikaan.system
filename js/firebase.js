// Firebase App
import { initializeApp } 
from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";


// Firebase Firestore
import { getFirestore } 
from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";




// Your Firebase Configuration

const firebaseConfig = {

  apiKey: "AIzaSyBzo7AfReNUHrXf0FEqfAW5h0oQ-fN1ij8",

  authDomain: "dalubwikaan-system.firebaseapp.com",

  projectId: "dalubwikaan-system",

  storageBucket: "dalubwikaan-system.firebasestorage.app",

  messagingSenderId: "74868534824",

  appId: "1:74868534824:web:06b15dacd299d69e754f1d"

};




// Initialize Firebase

const app = initializeApp(firebaseConfig);




// Initialize Firestore Database

const db = getFirestore(app);




// Export Database

export { db };
