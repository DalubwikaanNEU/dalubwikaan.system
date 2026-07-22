// =================================
// DALUBWIKAAN ADMIN PANEL
// FIREBASE + AUTH + STORAGE VERSION
// =================================



import { db, storage } from "./firebase.js";



import {

collection,
addDoc,
getDocs,
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


const collectionForm =
document.getElementById("collectionForm");



if(collectionForm){


collectionForm.addEventListener("submit",async function(e){


e.preventDefault();



let year =
document.getElementById("yearLevel").value;



let amount =
Number(
document.getElementById("amount").value
);



let date =
document.getElementById("date").value;





try{


await addDoc(

collection(db,"collections"),

{


year:year,

amount:amount,

date:date,

type:"Collection",

createdAt:serverTimestamp()


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


}









// ===============================
// ADD PROJECT
// ===============================


const projectForm =
document.getElementById("projectForm");



if(projectForm){


projectForm.addEventListener("submit",async function(e){


e.preventDefault();




let name =
document.getElementById("projectName").value;



let budget =
Number(
document.getElementById("projectBudget").value
);



let description =
document.getElementById("description").value;





try{


await addDoc(

collection(db,"projects"),

{


name:name,

budget:budget,

description:description,

type:"Project",

createdAt:serverTimestamp()


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


}









// ===============================
// ADD EXPENSE + RECEIPT
// ===============================



const expenseForm =
document.getElementById("expenseForm");



if(expenseForm){


expenseForm.addEventListener("submit",async function(e){


e.preventDefault();




let project =
document.getElementById("expenseProject").value;



let amount =
Number(
document.getElementById("expenseAmount").value
);



let description =
document.getElementById("expenseDescription").value;



let file =
document.getElementById("receiptFile").files[0];





try{


let receiptURL = "";



// upload receipt if available

if(file){


let storageRef =
ref(

storage,

"receipts/"+Date.now()+"_"+file.name

);



await uploadBytes(

storageRef,

file

);



receiptURL =
await getDownloadURL(storageRef);


}







await addDoc(

collection(db,"expenses"),

{


project:project,

amount:amount,

description:description,

receipt:receiptURL,

date:new Date().toLocaleDateString(),

type:"Expense",

createdAt:serverTimestamp()


}


);





alert(
"Expense Saved Successfully!"
);



this.reset();



loadRecords();



}



catch(error){


console.error(error);


alert(
"Expense upload failed"
);


}



});


}









// ===============================
// DISPLAY RECORDS
// ===============================


async function loadRecords(){



let table =
document.getElementById("records");



if(!table) return;




table.innerHTML="";









// COLLECTIONS


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









// PROJECTS


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

<b>${data.name}</b>

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









// EXPENSES


let expenseData =
await getDocs(

collection(db,"expenses")

);





expenseData.forEach((doc)=>{


let data =
doc.data();




table.innerHTML += `


<tr>


<td>
Expense
</td>



<td>

<b>${data.project}</b>

<br>

<small>
${data.description}</small>


<br>


${
data.receipt

?

`<a href="${data.receipt}" target="_blank">
View Receipt
</a>`

:

"No Receipt"

}



</td>



<td>

₱${Number(data.amount).toLocaleString()}

</td>


</tr>


`;



});




}









// ===============================
// INITIAL LOAD
// ===============================


loadRecords();
