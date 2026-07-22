// =================================
// DALUBWIKAAN ADMIN PANEL
// FIREBASE + AUTH + STORAGE + CRUD VERSION
// =================================



import { db, storage } from "./firebase.js";



import {

collection,
addDoc,
getDocs,
deleteDoc,
doc,
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








const auth = getAuth();







// =================================
// AUTH CHECK
// =================================


onAuthStateChanged(auth,(user)=>{


if(!user){


window.location.href="login.html";


}


});









// =================================
// LOGOUT
// =================================


const logout =
document.getElementById("logout");



if(logout){


logout.onclick=()=>{


signOut(auth)

.then(()=>{


window.location.href="login.html";


});


};


}









// =================================
// FORMAT PESO
// =================================


function peso(value){


return "₱"+Number(value).toLocaleString();


}









// =================================
// COLLECTION ADD
// =================================


const collectionForm =
document.getElementById("collectionForm");



if(collectionForm){


collectionForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();




let btn =
collectionForm.querySelector("button");


btn.disabled=true;


btn.innerHTML="Saving...";





try{


await addDoc(

collection(db,"collections"),

{


year:
document.getElementById("yearLevel").value,


amount:
Number(document.getElementById("amount").value),


date:
document.getElementById("date").value,


type:"Collection",


createdAt:serverTimestamp()


}



);





alert(
"Collection Added Successfully!"
);



collectionForm.reset();



loadRecords();



}


catch(error){


console.error(error);


alert(
"Failed saving collection"
);


}



btn.disabled=false;


btn.innerHTML="Save Collection";



});


}









// =================================
// PROJECT ADD
// =================================



const projectForm =
document.getElementById("projectForm");



if(projectForm){



projectForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();




try{


await addDoc(

collection(db,"projects"),

{


name:
document.getElementById("projectName").value,


budget:
Number(document.getElementById("projectBudget").value),


description:
document.getElementById("description").value,


status:"Planned",


type:"Project",


createdAt:serverTimestamp()


}


);





alert(
"Project Added!"
);



projectForm.reset();


loadRecords();



}


catch(error){


console.log(error);


alert(
"Project failed"
);


}



});


}









// =================================
// EXPENSE + RECEIPT UPLOAD
// =================================



const expenseForm =
document.getElementById("expenseForm");




if(expenseForm){



expenseForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();




try{



let file =
document.getElementById("receiptFile")
.files[0];



let receiptURL="";





if(file){


let fileRef =
ref(

storage,

"receipts/"+Date.now()+"_"+file.name

);



await uploadBytes(

fileRef,

file

);



receiptURL =
await getDownloadURL(fileRef);



}








await addDoc(

collection(db,"expenses"),

{


project:
document.getElementById("expenseProject").value,


amount:
Number(document.getElementById("expenseAmount").value),


description:
document.getElementById("expenseDescription").value,


receipt:
receiptURL,


date:
new Date().toLocaleDateString(),


status:"Approved",


type:"Expense",


createdAt:
serverTimestamp()


}


);






alert(
"Expense Saved Successfully!"
);



expenseForm.reset();



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









// =================================
// LOAD ALL RECORDS
// =================================


async function loadRecords(){



let table =
document.getElementById("records");



if(!table)
return;





table.innerHTML="";





let allRecords=[];









// COLLECTIONS


let collections =
await getDocs(

collection(db,"collections")

);





collections.forEach((item)=>{


let data=item.data();


allRecords.push({

id:item.id,

type:"Collection",

title:data.year,

details:data.date,

amount:data.amount,

collection:"collections"

});


});









// PROJECTS


let projects =
await getDocs(

collection(db,"projects")

);





projects.forEach((item)=>{


let data=item.data();


allRecords.push({

id:item.id,

type:"Project",

title:data.name,

details:data.description,

amount:data.budget,

collection:"projects"

});


});









// EXPENSES


let expenses =
await getDocs(

collection(db,"expenses")

);





expenses.forEach((item)=>{


let data=item.data();


allRecords.push({

id:item.id,

type:"Expense",

title:data.project,

details:data.description,

amount:data.amount,

receipt:data.receipt,

collection:"expenses"

});


});









// DISPLAY



if(allRecords.length===0){


table.innerHTML=`

<tr>

<td colspan="4">

No records available.

</td>

</tr>

`;

return;


}








allRecords.forEach((record)=>{


table.innerHTML += `

<tr>


<td>

${record.type}

</td>




<td>


<b>

${record.title}

</b>


<br>


<small>

${record.details}

</small>



${record.receipt ? 

`

<br>

<a href="${record.receipt}" target="_blank">

🧾 Receipt

</a>

`

:""}



</td>




<td>

${peso(record.amount)}

</td>




<td>


<button 

class="delete-btn"

onclick="deleteRecord('${record.collection}','${record.id}')">


Delete


</button>



</td>



</tr>

`;


});




}









// =================================
// DELETE RECORD
// =================================



window.deleteRecord =
async function(collectionName,id){



let confirmDelete =
confirm(
"Delete this record?"
);



if(!confirmDelete)
return;




await deleteDoc(

doc(

db,

collectionName,

id

)

);





alert(
"Record deleted"
);



loadRecords();



}









// =================================
// START
// =================================


loadRecords();
