// =================================
// DALUBWIKAAN ADMIN PANEL
// FIREBASE CRUD + AUTH + STORAGE
// ADVANCED TREASURY MANAGEMENT
// =================================



import {db, storage} from "./firebase.js";



import {

collection,
addDoc,
getDocs,
deleteDoc,
doc,
serverTimestamp,
query,
orderBy

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









// =================================
// AUTHENTICATION
// =================================


onAuthStateChanged(auth,(user)=>{


if(!user){


window.location.href="login.html";


return;


}


currentUser=user;



let emailBox=
document.getElementById("adminEmail");



if(emailBox){

emailBox.innerHTML=user.email;

}


});









// =================================
// LOGOUT
// =================================


const logout=
document.getElementById("logout");



if(logout){



logout.onclick=async()=>{


await signOut(auth);


window.location.href="login.html";


};


}









// =================================
// HELPERS
// =================================



function peso(value){


return "₱"+Number(value || 0).toLocaleString();


}







function notify(message,type="success"){



alert(message);


}









function getValue(id){



let element=
document.getElementById(id);


return element ? element.value.trim() : "";



}









// =================================
// AUDIT SYSTEM
// =================================



async function createAudit(action,details){



try{


await addDoc(

collection(db,"audit"),

{


action,


details,


user:
currentUser?.email || "Admin",


date:
new Date().toLocaleString(),


createdAt:
serverTimestamp()


}


);



}

catch(error){


console.log(
"Audit error:",
error
);


}



}









// =================================
// ADD COLLECTION
// =================================



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



year:getValue("yearLevel"),


amount:Number(getValue("amount")),


date:getValue("date"),


type:"Collection",


createdAt:serverTimestamp()



};




if(!data.year || !data.amount){


notify(
"Please complete all fields",
"error"
);


return;


}






await addDoc(

collection(db,"collections"),

data

);






await createAudit(

"Added Collection",

`${data.year} - ${peso(data.amount)}`

);






notify(
"Collection Added Successfully!"
);



collectionForm.reset();


await loadRecords();


}



catch(error){


console.error(error);


notify(
"Saving failed"
);


}





button.disabled=false;

button.innerHTML="Save Collection";



});


}









// =================================
// ADD PROJECT
// =================================



const projectForm=
document.getElementById("projectForm");



if(projectForm){



projectForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();



try{


let data={



name:getValue("projectName"),


budget:Number(getValue("projectBudget")),


description:getValue("description"),


status:"Planned",


type:"Project",


createdAt:serverTimestamp()



};







await addDoc(

collection(db,"projects"),

data

);







await createAudit(

"Added Project",

`${data.name} ${peso(data.budget)}`

);






notify(
"Project Added!"
);



projectForm.reset();



loadRecords();



}



catch(error){


console.log(error);


notify(
"Project failed"
);


}



});


}









// =================================
// EXPENSE + RECEIPT
// =================================



const expenseForm=
document.getElementById("expenseForm");



if(expenseForm){



expenseForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();



try{



let file=
document.getElementById("receiptFile")
?.files[0];



let receiptURL="";






if(file){



if(file.size > 5000000){


notify(
"Maximum file size is 5MB"
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



project:getValue("expenseProject"),


amount:Number(getValue("expenseAmount")),


description:getValue("expenseDescription"),


receipt:receiptURL,


status:"Approved",


date:
new Date().toLocaleDateString(),


type:"Expense",


createdAt:serverTimestamp()



};







await addDoc(

collection(db,"expenses"),

data

);






await createAudit(

"Added Expense",

`${data.project} ${peso(data.amount)}`

);






notify(
"Expense Added!"
);



expenseForm.reset();


loadRecords();



}





catch(error){



console.error(error);


notify(
"Expense failed"
);


}



});


}









// =================================
// LOAD RECORDS
// =================================



async function loadRecords(){



let table=
document.getElementById("records");



if(!table)return;





table.innerHTML="";



let records=[];



let sources=[

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





for(let source of sources){



let snapshot=
await getDocs(

collection(db,source.name)

);




snapshot.forEach(item=>{


let data=item.data();



records.push({


id:item.id,


collection:source.name,


type:source.type,


title:
data.name ||
data.year ||
data.project,


details:
data.description ||
data.date,


amount:data.amount,


receipt:data.receipt,


created:data.createdAt


});



});


}







records.reverse();





updateCounters(records);







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


${
record.receipt ?

`

<br>

<a href="${record.receipt}" target="_blank">

🧾 Receipt

</a>

`

:""

}


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









// =================================
// ADMIN COUNTERS
// =================================



function updateCounters(records){



let total=
document.getElementById("recordCount");



if(total){


total.innerHTML=
records.length;


}



}









// =================================
// DELETE
// =================================



window.deleteRecord=
async function(collectionName,id){



if(!confirm(
"Delete this record?"
))

return;




try{



await deleteDoc(

doc(

db,

collectionName,

id

)

);






await createAudit(

"Deleted Record",

collectionName+" "+id

);






notify(
"Deleted Successfully"
);



loadRecords();



}



catch(error){


console.log(error);


notify(
"Delete failed"
);


}



}









// =================================
// SEARCH FUNCTION
// =================================



const search=
document.getElementById("searchRecord");



if(search){



search.addEventListener(

"keyup",

()=>{


let value=
search.value.toLowerCase();



document
.querySelectorAll("#records tr")
.forEach(row=>{


row.style.display=

row.innerText
.toLowerCase()
.includes(value)

?

""

:

"none";



});


});


}









// =================================
// START
// =================================


loadRecords();
