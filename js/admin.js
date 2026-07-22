// =================================
// DALUBWIKAAN ADMIN PANEL
// FIREBASE + AUTH VERSION
// =================================



import { db } from "./firebase.js";



import {

collection,
addDoc,
getDocs,
serverTimestamp

}

from

"https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";




import {


getAuth,
onAuthStateChanged,
signOut


}

from

"https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";





// ===============================
// AUTHENTICATION CHECK
// ===============================


const auth = getAuth();




onAuthStateChanged(auth,(user)=>{


if(!user){


window.location.href="login.html";


}


});









// ===============================
// LOGOUT
// ===============================



const logoutBtn =
document.getElementById("logout");



if(logoutBtn){


logoutBtn.addEventListener("click",()=>{


signOut(auth)

.then(()=>{


window.location.href="login.html";


});


});


}









// ===============================
// ADD COLLECTION
// ===============================


document
.getElementById("collectionForm")
.addEventListener("submit", async function(e){



e.preventDefault();





let year =
document
.getElementById("yearLevel")
.value;





let amount =
Number(
document.getElementById("amount").value
);





let date =
document
.getElementById("date")
.value;







try{



await addDoc(

collection(db,"collections"),

{


year:year,


amount:amount,


date:date,


type:"Collection",


createdAt:
serverTimestamp()


}


);





alert(
"Collection Added Successfully!"
);




this.reset();



loadRecords();



}



catch(error){



console.error(error);



alert(
"Error adding collection"
);



}



});









// ===============================
// ADD PROJECT
// ===============================


document
.getElementById("projectForm")
.addEventListener("submit", async function(e){



e.preventDefault();






let name =
document
.getElementById("projectName")
.value;





let budget =
Number(
document
.getElementById("projectBudget")
.value
);





let description =
document
.getElementById("description")
.value;







try{



await addDoc(

collection(db,"projects"),

{


name:name,


budget:budget,


description:description,


type:"Project",


createdAt:
serverTimestamp()


}


);





alert(
"Project Added Successfully!"
);





this.reset();



loadRecords();



}



catch(error){



console.error(error);



alert(
"Error saving project"
);



}



});









// ===============================
// DISPLAY RECORDS
// ===============================



async function loadRecords(){



let table =
document.getElementById("records");



if(!table) return;




table.innerHTML="";







// COLLECTION RECORDS


let collectionData =
await getDocs(
collection(db,"collections")
);






collectionData.forEach((doc)=>{


let data =
doc.data();





table.innerHTML += `


<tr>


<td>

Collection

</td>



<td>

${data.year}

<br>

<small>
${data.date}
</small>

</td>




<td>

₱${Number(data.amount).toLocaleString()}

</td>


</tr>


`;



});








// PROJECT RECORDS



let projectData =
await getDocs(
collection(db,"projects")
);






projectData.forEach((doc)=>{


let data =
doc.data();





table.innerHTML += `


<tr>


<td>

Project

</td>



<td>

<b>
${data.name}
</b>

<br>

<small>
${data.description}
</small>


</td>



<td>

₱${Number(data.budget).toLocaleString()}

</td>


</tr>


`;



});





}









// LOAD WHEN OPENING PAGE


loadRecords();
