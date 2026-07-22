// =================================
// DALUBWIKAAN ADMIN PANEL
// FIREBASE CRUD + AUTH + STORAGE
// WITH AUDIT TRAIL SYSTEM
// =================================



import {db, storage} from "./firebase.js";



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








const auth=getAuth();



let currentUser=null;









// ===============================
// AUTH CHECK
// ===============================


onAuthStateChanged(auth,(user)=>{


if(!user){


window.location.href="login.html";


return;


}


currentUser=user;


});









// ===============================
// LOGOUT
// ===============================


const logout=document.getElementById("logout");



if(logout){


logout.onclick=async()=>{


await signOut(auth);


window.location.href="login.html";


};


}









// ===============================
// FORMAT MONEY
// ===============================


function peso(value){


return "₱"+Number(value).toLocaleString();


}









// ===============================
// AUDIT LOGGER
// ===============================


async function createAudit(action,details){



await addDoc(

collection(db,"audit"),

{


action:action,


details:details,


user:
currentUser?.email || "Admin",


date:
new Date().toLocaleString(),


createdAt:
serverTimestamp()


}


);



}









// ===============================
// COLLECTION ADD
// ===============================


const collectionForm=
document.getElementById("collectionForm");



if(collectionForm){



collectionForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();



let button=
collectionForm.querySelector("button");


button.disabled=true;

button.innerHTML="Saving...";





try{



let data={


year:
yearLevel.value,


amount:
Number(amount.value),


date:
date.value,


type:"Collection",


createdAt:
serverTimestamp()


};





await addDoc(

collection(db,"collections"),

data

);






await createAudit(

"Added Collection",

`${data.year} collection ₱${data.amount}`

);






alert(
"Collection successfully added!"
);



collectionForm.reset();


loadRecords();


}

catch(error){


console.error(error);


alert(
"Unable to save collection"
);


}



button.disabled=false;

button.innerHTML="Save Collection";


});


}









// ===============================
// PROJECT ADD
// ===============================



const projectForm=
document.getElementById("projectForm");



if(projectForm){



projectForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();




try{



let data={


name:
projectName.value,


budget:
Number(projectBudget.value),


description:
description.value,


status:"Planned",


type:"Project",


createdAt:
serverTimestamp()


};





await addDoc(

collection(db,"projects"),

data

);






await createAudit(

"Added Project",

`${data.name} - ₱${data.budget}`

);





alert(
"Project Added Successfully!"
);



projectForm.reset();


loadRecords();


}



catch(error){


console.error(error);


alert(
"Project saving failed"
);


}



});


}









// ===============================
// EXPENSE UPLOAD
// ===============================


const expenseForm=
document.getElementById("expenseForm");



if(expenseForm){



expenseForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();



try{



let file=
receiptFile.files[0];



let receiptURL="";





if(file){



if(file.size > 5000000){


alert(
"Receipt must be below 5MB"
);


return;


}





let fileRef=
ref(

storage,

"receipts/"+Date.now()+"_"+file.name

);



await uploadBytes(

fileRef,

file

);



receiptURL=
await getDownloadURL(fileRef);



}







let data={



project:
expenseProject.value,


amount:
Number(expenseAmount.value),


description:
expenseDescription.value,


receipt:
receiptURL,


status:"Approved",


date:
new Date().toLocaleDateString(),


type:"Expense",


createdAt:
serverTimestamp()



};







await addDoc(

collection(db,"expenses"),

data

);






await createAudit(

"Added Expense",

`${data.project} ₱${data.amount}`

);







alert(
"Expense saved!"
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









// ===============================
// LOAD RECORDS
// ===============================



async function loadRecords(){



let table=
document.getElementById("records");



if(!table)
return;




table.innerHTML="";



let records=[];





let lists=[

{
name:"collections",
type:"Collection"
},

{
name:"projects",
type:"Project"
},

{
name:"expenses",
type:"Expense"
}

];






for(let list of lists){



let snapshot=
await getDocs(

collection(db,list.name)

);




snapshot.forEach(item=>{


let data=item.data();



records.push({


id:item.id,


collection:list.name,


type:list.type,


title:
data.name ||
data.year ||
data.project,


details:
data.description ||
data.date,


amount:
data.amount,


receipt:
data.receipt



});



});



}








if(records.length===0){


table.innerHTML=`

<tr>

<td colspan="4">

No records available.

</td>

</tr>

`;

return;


}







records.forEach(record=>{


table.innerHTML+=`


<tr>


<td>

${record.type}

</td>




<td>

<b>${record.title}</b>

<br>

<small>${record.details}</small>


${record.receipt ?

`

<br>

<a href="${record.receipt}" target="_blank">

🧾 View Receipt

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


🗑 Delete


</button>


</td>



</tr>


`;



});



}









// ===============================
// DELETE
// ===============================



window.deleteRecord=
async function(collectionName,id){



let confirmDelete=
confirm(

"Are you sure you want to delete this?"

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






await createAudit(

"Deleted Record",

collectionName+" : "+id

);






alert(
"Record deleted successfully"
);



loadRecords();



}









// ===============================
// START SYSTEM
// ===============================



loadRecords();
