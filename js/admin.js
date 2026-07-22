// =================================
// DALUBWIKAAN ADMIN PANEL
// FIREBASE VERSION
// =================================


import { db } from "./firebase.js";


import {

    collection,
    addDoc,
    getDocs,
    serverTimestamp

}

from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";





// ===============================
// ADD COLLECTION
// ===============================


document
.getElementById("collectionForm")
.addEventListener("submit", async function(e){


e.preventDefault();



let year =
document.getElementById("yearLevel").value;



let amount =
Number(document.getElementById("amount").value);



let date =
document.getElementById("date").value;




try{


await addDoc(

collection(db,"collections"),

{

year: year,

amount: amount,

date: date,

type:"Collection",

createdAt: serverTimestamp()

}


);



alert("Collection Added Successfully!");



this.reset();



loadRecords();



}

catch(error){


console.error(error);


alert("Error saving collection");


}



});









// ===============================
// ADD PROJECT
// ===============================


document
.getElementById("projectForm")
.addEventListener("submit", async function(e){


e.preventDefault();



let project =
document.getElementById("projectName").value;



let budget =
Number(document.getElementById("projectBudget").value);



let description =
document.getElementById("description").value;




try{


await addDoc(

collection(db,"projects"),

{


name: project,


budget: budget,


description: description,


type:"Project",


createdAt: serverTimestamp()


}


);



alert("Project Saved Successfully!");



this.reset();



loadRecords();



}



catch(error){


console.error(error);


alert("Error saving project");


}



});









// ===============================
// LOAD RECORDS FROM FIRESTORE
// ===============================



async function loadRecords(){


let table =
document.getElementById("records");



table.innerHTML="";



try{


// COLLECTIONS

let collectionsSnapshot =
await getDocs(
collection(db,"collections")
);



collectionsSnapshot.forEach((doc)=>{


let data = doc.data();



table.innerHTML += `

<tr>

<td>
${data.type}
</td>


<td>
${data.year} Collection
<br>
<small>${data.date}</small>
</td>


<td>
₱${data.amount.toLocaleString()}
</td>


</tr>

`;



});







// PROJECTS


let projectsSnapshot =
await getDocs(
collection(db,"projects")
);



projectsSnapshot.forEach((doc)=>{


let data = doc.data();



table.innerHTML += `

<tr>

<td>
${data.type}
</td>


<td>

<b>${data.name}</b>

<br>

<small>
${data.description}
</small>

</td>


<td>
₱${data.budget.toLocaleString()}
</td>


</tr>

`;



});



}


catch(error){


console.error(error);


}



}








// LOAD DATA WHEN PAGE OPENS


loadRecords();
