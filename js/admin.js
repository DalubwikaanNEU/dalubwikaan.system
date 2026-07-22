// ========================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// ADMIN PANEL v4.0
// Firebase Authentication
// Firestore CRUD
// Storage Receipt System
// Project Transparency
// Announcement Management
// ========================================


import { 
    db, 
    storage 
} from "./firebase.js";



import {

    collection,
    addDoc,
    getDocs,
    getDoc,
    deleteDoc,
    updateDoc,
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





// ========================================
// INITIALIZATION
// ========================================


const auth = getAuth();


let currentUser = null;





// ========================================
// HELPERS
// ========================================


const getValue = (id)=>{

    return document
    .getElementById(id)
    ?.value
    .trim() || "";

};





const peso = (amount)=>{

    return "₱" +
    Number(amount || 0)
    .toLocaleString(
        "en-PH",
        {
            minimumFractionDigits:2
        }
    );

};






const notify = (message)=>{

    alert(message);

};








// ========================================
// LOADER
// ========================================


window.addEventListener(
"load",
()=>{


setTimeout(()=>{


const loader =
document.getElementById("loader");


if(loader){

loader.remove();

}



},800);



});








// ========================================
// AUTHENTICATION
// ========================================


onAuthStateChanged(
auth,
async(user)=>{


if(!user){


window.location.href =
"login.html";


return;


}




try{


const adminRef =
doc(
db,
"admins",
user.uid
);



const adminSnap =
await getDoc(adminRef);





if(!adminSnap.exists()){



alert(
"Unauthorized account."
);



await signOut(auth);



window.location.href =
"login.html";


return;


}





currentUser = user;





const email =
document.getElementById(
"adminEmail"
);




if(email){

email.textContent =
user.email;

}





initializeSystem();



}

catch(error){


console.error(
"Authentication Error:",
error
);



notify(
"Unable to verify administrator."
);


}



});









// ========================================
// LOGOUT
// ========================================


document
.getElementById("logout")
?.addEventListener(
"click",
async()=>{


await signOut(auth);



window.location.href =
"login.html";



});







// ========================================
// SYSTEM START
// ========================================


async function initializeSystem(){


await Promise.all([


loadRecords(),


loadAnnouncements(),


loadSummary()


]);



console.log(
"Dalubwikaan Treasury Admin v4.0 Ready"
);



}



// ========================================
// COLLECTION MANAGEMENT
// ========================================


const collectionForm =
document.getElementById(
"collectionForm"
);



if(collectionForm){


collectionForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



try{



const year =
getValue("yearLevel");



const amount =
Number(
getValue("amount")
);



const date =
getValue("date");





if(!year){


notify(
"Please select year level."
);


return;


}




if(
isNaN(amount) ||
amount <= 0
){


notify(
"Invalid collection amount."
);



return;


}




if(!date){


notify(
"Please select collection date."
);



return;


}






await addDoc(

collection(
db,
"collections"
),

{


year,


amount,


date,


type:
"Collection",


createdAt:
serverTimestamp()


}

);






notify(
"Collection added successfully."
);





collectionForm.reset();





await loadRecords();


await loadSummary();




}



catch(error){



console.error(
"Collection Error:",
error
);



notify(
"Failed to save collection."
);



}



});



}









// ========================================
// PROJECT MANAGEMENT
// ========================================


const projectForm =
document.getElementById(
"projectForm"
);






if(projectForm){



projectForm.addEventListener(
"submit",
async(e)=>{



e.preventDefault();





try{





const name =
getValue(
"projectName"
);



const budget =
Number(
getValue(
"projectBudget"
)
);





const description =
getValue(
"description"
);






const status =
getValue(
"projectStatus"
)
||
"Planning";







if(!name){


notify(
"Project name is required."
);



return;


}







if(
isNaN(budget) ||
budget <=0
){


notify(
"Enter valid project budget."
);



return;


}








await addDoc(

collection(
db,
"projects"
),

{


name,


budget,


description,



status,



type:
"Project",



createdAt:
serverTimestamp()



}



);









notify(

"Project added successfully."

);








projectForm.reset();





await loadRecords();


await loadSummary();





}




catch(error){



console.error(
"Project Error:",
error
);



notify(
"Unable to save project."
);



}



});



}









// ========================================
// EXPENSE MANAGEMENT
// ========================================


const expenseForm =
document.getElementById(
"expenseForm"
);



const receiptInput =
document.getElementById(
"receiptFile"
);



const receiptPreview =
document.getElementById(
"receiptPreview"
);









// ========================================
// RECEIPT PREVIEW
// ========================================


if(receiptInput){



receiptInput.addEventListener(
"change",
()=>{


if(receiptPreview){

receiptPreview.innerHTML="";

}



const file =
receiptInput.files[0];





if(!file){

return;

}





if(
!file.type.startsWith(
"image/"
)
){



notify(
"Only image receipts allowed."
);



receiptInput.value="";


return;


}





if(
file.size >
5 * 1024 * 1024
){



notify(
"Receipt must be below 5MB."
);



receiptInput.value="";


return;


}







const image =
document.createElement(
"img"
);



image.src =
URL.createObjectURL(
file
);



image.style.width =
"260px";



image.style.borderRadius =
"15px";



image.style.marginTop =
"15px";



image.style.boxShadow =
"0 5px 15px rgba(0,0,0,.2)";





receiptPreview
.appendChild(
image
);



});



}



// ========================================
// EXPENSE MANAGEMENT SAVE
// ========================================


if(expenseForm){


expenseForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



try{



const project =
getValue(
"expenseProject"
);



const amount =
Number(
getValue(
"expenseAmount"
)
);




const description =
getValue(
"expenseDescription"
);






if(!project){


notify(
"Expense name required."
);


return;


}




if(
isNaN(amount) ||
amount<=0
){


notify(
"Invalid expense amount."
);



return;


}





if(!description){


notify(
"Expense description required."
);



return;


}






let receiptURL="";






const file =
receiptInput?.files[0];







// ===============================
// UPLOAD RECEIPT
// ===============================


if(file){



const fileName =

Date.now()
+
"_"
+
file.name;






const storageRef =
ref(

storage,

"receipts/"
+
fileName

);





await uploadBytes(

storageRef,

file

);





receiptURL =
await getDownloadURL(
storageRef
);



}







// ===============================
// SAVE EXPENSE
// ===============================



await addDoc(

collection(
db,
"expenses"
),

{


project,


amount,


description,



receipt:
receiptURL,



type:
"Expense",



status:
"Approved",



date:
new Date()
.toLocaleDateString(),



createdAt:
serverTimestamp()



}



);








notify(
"Expense recorded successfully."
);






expenseForm.reset();






if(receiptPreview){

receiptPreview.innerHTML="";

}





await loadRecords();


await loadSummary();





}



catch(error){



console.error(
"Expense Error:",
error
);



notify(
"Failed to save expense."
);



}



});



}









// ========================================
// ANNOUNCEMENT SYSTEM
// ========================================


const announcementForm =
document.getElementById(
"announcementForm"
);









if(announcementForm){



announcementForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();






try{



const title =
getValue(
"announcementTitle"
);





const message =
getValue(
"announcementMessage"
);






if(!title ||
!message
){



notify(
"Complete announcement details."
);



return;


}









await addDoc(

collection(
db,
"announcements"
),

{


title,


message,



author:
currentUser?.email
||
"Administrator",



createdAt:
serverTimestamp()



}



);








notify(
"Announcement published."
);






announcementForm.reset();





await loadAnnouncements();





}



catch(error){



console.error(
"Announcement Error:",
error
);



notify(
"Failed to publish announcement."
);



}



});



}









// ========================================
// LOAD ANNOUNCEMENTS
// ========================================


async function loadAnnouncements(){



const container =

document.getElementById(
"adminAnnouncementContainer"
);




if(!container)return;





try{



const q =

query(

collection(
db,
"announcements"
),


orderBy(
"createdAt",
"desc"
)


);







const snapshot =
await getDocs(q);







if(snapshot.empty){



container.innerHTML=`

<div class="empty-state">

<p>

📢 No announcements yet.

</p>

</div>

`;



return;



}








container.innerHTML="";







snapshot.forEach((item)=>{





const data =
item.data();






container.innerHTML += `



<div class="announcement-card">



<h3>

📢 ${data.title}

</h3>




<p>

${data.message}

</p>




<small>

Posted by:
${data.author || "Admin"}

</small>





<button

class="delete-btn"

onclick="deleteAnnouncement('${item.id}')"

>


🗑 Delete

</button>




</div>



`;



});






}



catch(error){



console.error(
"Announcement Load Error:",
error
);



container.innerHTML=

`
<p>

Unable to load announcements.

</p>
`;



}



}









// ========================================
// DELETE ANNOUNCEMENT
// ========================================


window.deleteAnnouncement =
async(id)=>{


const confirmDelete =
confirm(
"Delete this announcement?"
);




if(!confirmDelete)return;







try{


await deleteDoc(

doc(

db,

"announcements",

id

)

);






notify(
"Announcement deleted."
);






await loadAnnouncements();





}



catch(error){



console.error(
"Delete Announcement Error:",
error
);



}



};



// ========================================
// LOAD ALL TREASURY RECORDS
// ========================================


async function loadRecords(){



const table =
document.getElementById(
"records"
);



if(!table)return;





try{



table.innerHTML = `

<tr>

<td colspan="4">

Loading records...

</td>

</tr>

`;







const collections =
await getDocs(
collection(
db,
"collections"
)
);





const projects =
await getDocs(
collection(
db,
"projects"
)
);






const expenses =
await getDocs(
collection(
db,
"expenses"
)
);







let records=[];









collections.forEach(
(item)=>{


const data =
item.data();




records.push({


id:item.id,


collection:"collections",


type:"Collection",


title:data.year,


details:data.date,


amount:data.amount


});



});








projects.forEach(
(item)=>{


const data =
item.data();




records.push({


id:item.id,


collection:"projects",


type:"Project",


title:data.name,


details:
`

${data.description || ""}

<br>

Status:

${data.status || "Planning"}

`,


amount:data.budget


});



});








expenses.forEach(
(item)=>{


const data =
item.data();




records.push({


id:item.id,


collection:"expenses",


type:"Expense",


title:data.project,


details:data.description,


amount:data.amount


});



});










if(records.length===0){



table.innerHTML=`

<tr>

<td colspan="4">

No records found.

</td>

</tr>

`;



return;


}








table.innerHTML = "";









records.forEach(
(record)=>{





table.innerHTML += `



<tr>



<td>

${record.type}

</td>




<td>

<strong>

${record.title}

</strong>


<br>


${record.details}



</td>





<td>

${peso(record.amount)}

</td>







<td>



<button

class="delete-btn"

onclick="deleteRecord('${record.collection}','${record.id}')"

>


🗑 Delete


</button>



</td>



</tr>



`;



});






updateCounters(records);





}



catch(error){



console.error(
"Records Error:",
error
);



table.innerHTML=`

<tr>

<td colspan="4">

Failed loading records.

</td>

</tr>

`;



}



}









// ========================================
// UPDATE DASHBOARD COUNTERS
// ========================================


function updateCounters(records){



const collections =

records.filter(
r=>r.type==="Collection"
).length;





const projects =

records.filter(
r=>r.type==="Project"
).length;





const expenses =

records.filter(
r=>r.type==="Expense"
).length;









setText(
"recordCount",
records.length
);




setText(
"collectionCount",
collections
);




setText(
"projectCount",
projects
);




setText(
"expenseCount",
expenses
);



}









// ========================================
// DELETE RECORD
// ========================================


window.deleteRecord =
async(
collectionName,
id
)=>{



const confirmDelete =
confirm(
"Delete this record?"
);





if(!confirmDelete)return;








try{



await deleteDoc(

doc(

db,

collectionName,

id

)

);






notify(
"Record deleted."
);






await loadRecords();

await loadSummary();






}



catch(error){



console.error(
"Delete Error:",
error
);



notify(
"Unable to delete record."
);



}



};









// ========================================
// FINANCIAL SUMMARY
// ========================================


async function loadSummary(){



try{



const collections =
await getDocs(
collection(
db,
"collections"
)
);





const expenses =
await getDocs(
collection(
db,
"expenses"
)
);








let totalCollections=0;

let totalExpenses=0;









collections.forEach(
(item)=>{


totalCollections +=

Number(
item.data().amount || 0
);



});









expenses.forEach(
(item)=>{


totalExpenses +=

Number(
item.data().amount || 0
);



});










const balance =

totalCollections -
totalExpenses;







setText(

"totalCollections",

peso(totalCollections)

);







setText(

"totalExpenses",

peso(totalExpenses)

);







setText(

"currentBalance",

peso(balance)

);








const status =
document.getElementById(
"dashboardStatus"
);





if(status){



if(balance>0){



status.innerHTML =
"🟢 Healthy";



}



else if(balance===0){



status.innerHTML =
"🟡 Balanced";



}



else{


status.innerHTML =
"🔴 Deficit";


}



}





}





catch(error){



console.error(
"Summary Error:",
error
);



}



}









// ========================================
// SEARCH SYSTEM
// ========================================


const searchInput =

document.getElementById(
"searchRecord"
);






if(searchInput){



searchInput.addEventListener(
"keyup",
()=>{



const keyword =

searchInput.value
.toLowerCase();







const rows =

document.querySelectorAll(
"#records tr"
);






rows.forEach(
(row)=>{



row.style.display =

row.innerText
.toLowerCase()
.includes(keyword)

?

""

:

"none";



});





});



}









// ========================================
// SAFE TEXT UPDATE
// ========================================


function setText(
id,
value
){



const element =

document.getElementById(id);





if(element){


element.innerHTML=value;


}



}









// ========================================
// AUTO UPDATE
// ========================================


setInterval(
async()=>{


await loadRecords();


await loadSummary();


},
30000
);









console.log(`

===================================

DALUBWIKAAN TREASURY ADMIN v4.0

✔ Firebase Authentication

✔ Firestore CRUD

✔ Receipt Storage

✔ Project Transparency

✔ Announcement System

✔ Financial Summary

===================================

`);
