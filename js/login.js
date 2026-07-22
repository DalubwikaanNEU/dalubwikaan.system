import {db} from "./firebase.js";


import {


getAuth,

signInWithEmailAndPassword


}

from

"https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";




import {


initializeApp


}

from

"https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";





const firebaseConfig = {


apiKey: "AIzaSyBzo7AfReNUHrXf0FEqfAW5h0oQ-fN1ij8",

authDomain:"dalubwikaan-system.firebaseapp.com",

projectId:"dalubwikaan-system",

storageBucket:"dalubwikaan-system.firebasestorage.app",

messagingSenderId:"74868534824",

appId:"1:74868534824:web:06b15dacd299d69e754f1d"


};





const app =
initializeApp(firebaseConfig);



const auth =
getAuth(app);








document
.getElementById("loginBtn")
.addEventListener("click",()=>{





let email =
document.getElementById("email").value;



let password =
document.getElementById("password").value;





signInWithEmailAndPassword(

auth,

email,

password

)



.then(()=>{


window.location.href="admin.html";


})



.catch((error)=>{


document
.getElementById("message")
.innerHTML =

"Invalid login details";


console.log(error);



});



});
