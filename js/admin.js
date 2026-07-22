// ========================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// ADMIN PANEL v5.0
// Firebase Authentication
// Firestore CRUD
// Receipt Storage
// Project Transparency
// Budget Monitoring
// Announcement System
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
// INITIAL VARIABLES
// ========================================


const auth = getAuth();


let currentUser = null;



let projectCache = [];

let expenseCache = [];







// ========================================
// HELPERS
// ========================================


function getValue(id){


const element =
document.getElementById(id);



return element
?
element.value.trim()
:
"";


}







function setText(id,value){


const element =
document.getElementById(id);



if(element){

element.innerHTML=value;

}


}







function peso(value){


return "₱" +

Number(value || 0)
.toLocaleString(
"en-PH",
{
minimumFractionDigits:2
}
);


}







function notify(message){


alert(message);


}









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

loader.style.display="none";

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


location.href =
"login.html";


return;


}





try{


const adminSnap =

await getDoc(

doc(
db,
"admins",
user.uid
)

);






if(!adminSnap.exists()){



notify(
"Unauthorized access."
);



await signOut(auth);



location.href =
"login.html";



return;


}






currentUser=user;





const email =
document.getElementById(
"adminEmail"
);





if(email){

email.textContent =
user.email;


}







startDashboard();





}



catch(error){


console.error(
"Auth Error:",
error
);



notify(
"Authentication failed."
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



location.href =
"login.html";



});









// ========================================
// SYSTEM START
// ========================================


async function startDashboard(){



await Promise.all([


loadProjects(),


loadExpenses(),


loadRecords(),


loadAnnouncements(),


loadSummary()


]);



console.log(

"Dalubwikaan Treasury Admin v5.0 Running"

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
getValue(
"yearLevel"
);



const amount =
Number(
getValue(
"amount"
)
);



const date =
getValue(
"date"
);






if(!year){


notify(
"Select year level first."
);



return;


}







if(
isNaN(amount)
||
amount <= 0
){


notify(
"Enter valid amount."
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
"Collection saved."
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
"Failed saving collection."
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






// IMPORTANT FIX
// NEVER DEFAULT TO COMPLETED


const status =

getValue(
"projectStatus"
)
||
"Planning";










if(!name){


notify(
"Project name required."
);



return;


}







if(
isNaN(budget)
||
budget <=0
){


notify(
"Invalid project budget."
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

"Project successfully created."

);






projectForm.reset();






await loadProjects();


await loadRecords();





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









// RECEIPT PREVIEW


if(receiptInput){



receiptInput.addEventListener(
"change",
()=>{


const file =
receiptInput.files[0];



if(!file)return;







if(
!file.type.startsWith(
"image/"
)
){



notify(
"Only image files allowed."
);



receiptInput.value="";



return;


}






if(
file.size >
5*1024*1024
){


notify(
"Maximum receipt size is 5MB."
);



receiptInput.value="";



return;


}







if(receiptPreview){



receiptPreview.innerHTML = `


<img

src="${URL.createObjectURL(file)}"

style="

width:260px;

border-radius:15px;

margin-top:15px;

"

>


`;



}




});



}









// SAVE EXPENSE


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
"Project name required."
);



return;


}






if(
isNaN(amount)
||
amount<=0
){



notify(
"Invalid expense amount."
);



return;


}








let receipt="";







const file =
receiptInput?.files[0];







if(file){



const storageRef =

ref(

storage,

"receipts/"
+
Date.now()
+
"_"
+
file.name

);







await uploadBytes(

storageRef,

file

);







receipt =
await getDownloadURL(
storageRef
);



}









await addDoc(

collection(
db,
"expenses"
),

{


project,


amount,


description,



receipt,



status:
"Approved",



type:
"Expense",



createdAt:
serverTimestamp()



}



);









notify(
"Expense recorded."
);







expenseForm.reset();





if(receiptPreview){

receiptPreview.innerHTML="";


}





await loadExpenses();


await loadRecords();


await loadSummary();






}



catch(error){



console.error(
"Expense Error:",
error
);



notify(
"Failed saving expense."
);



}



});



}
// ========================================
// ANNOUNCEMENT MANAGEMENT
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







if(!title || !message){


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



createdBy:

currentUser?.email
||
"Administrator",



createdAt:

serverTimestamp()



}



);






notify(
"Announcement posted."
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
"Failed posting announcement."
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
"announcementContainer"
);





if(!container)return;







try{



const snap =

await getDocs(

query(

collection(
db,
"announcements"
),

orderBy(
"createdAt",
"desc"
)

)

);






if(snap.empty){



container.innerHTML=`

<div class="empty-state">

📢 No announcements yet.

</div>

`;



return;


}








container.innerHTML="";







snap.forEach((doc)=>{



const data =
doc.data();






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
${data.createdBy || "Admin"}

</small>



</div>


`;



});







}



catch(error){



console.error(
"Announcement Load Error:",
error
);



}



}









// ========================================
// LOAD PROJECTS
// PROJECT TRANSPARENCY SYSTEM
// ========================================


async function loadProjects(){



const table =

document.getElementById(
"projectTable"
);





if(table){



table.innerHTML="";



}








try{



const projectSnap =

await getDocs(

query(

collection(
db,
"projects"
),

orderBy(
"createdAt",
"desc"
)

)

);






const expenseSnap =

await getDocs(

collection(
db,
"expenses"

)

);







// STORE EXPENSE TOTAL


let expensesMap = {};







expenseSnap.forEach((doc)=>{



const expense =
doc.data();




const project =
expense.project;





if(!expensesMap[project]){


expensesMap[project]=0;


}






expensesMap[project]

+=

Number(
expense.amount
||
0
);



});









projectCache=[];








projectSnap.forEach((doc)=>{



const project =
doc.data();






const spent =

expensesMap[
project.name
]
||
0;







const budget =

Number(
project.budget
||
0
);






const remaining =

budget -
spent;








let financialStatus;





if(remaining < 0){



financialStatus =

`
<span class="danger-status">

🔴 Abonado 
${peso(Math.abs(remaining))}

</span>
`;



}

else{


financialStatus =

`
<span class="success-status">

🟢 Remaining
${peso(remaining)}

</span>
`;



}









// STATUS FIX


const status =

project.status
||
"Planning";







let statusBadge;






if(status==="Completed"){


statusBadge=

`
<span class="completed">

🟢 Completed

</span>
`;



}

else if(status==="Ongoing"){


statusBadge=

`
<span class="ongoing">

🔵 Ongoing

</span>
`;



}

else{


statusBadge=

`
<span class="planning">

🟡 Planning

</span>
`;



}








projectCache.push({

...project,

spent,

remaining

});









if(table){



table.innerHTML += `


<tr>


<td>


<strong>

${project.name}

</strong>


<br>


${statusBadge}


</td>





<td>


Allocated:

<br>

${peso(budget)}



<br><br>


Spent:

<br>

${peso(spent)}



<br><br>


${financialStatus}



</td>





<td>

${project.description || ""}

</td>



</tr>


`;



}





});







if(projectSnap.empty && table){



table.innerHTML=`

<tr>

<td colspan="3">

No projects recorded.

</td>

</tr>

`;



}






}



catch(error){



console.error(
"Project Loading Error:",
error
);



}



}
// ========================================
// LOAD EXPENSES
// ========================================


async function loadExpenses(){



const container =

document.getElementById(
"expensePreview"
);





if(!container)return;







try{



const snap =

await getDocs(

query(

collection(
db,
"expenses"
),

orderBy(
"createdAt",
"desc"
)

)

);






expenseCache=[];






if(snap.empty){



container.innerHTML=`

<p>

No expense records available.

</p>

`;



return;


}








container.innerHTML="";







snap.forEach((doc)=>{



const data =
doc.data();





expenseCache.push(data);







container.innerHTML += `


<div class="expense-card">


<h3>

🧾 ${data.project}

</h3>



<p>

Amount:

<strong>

${peso(data.amount)}

</strong>

</p>



<p>

${data.description || ""}

</p>



${
data.receipt

?

`

<a 

href="${data.receipt}"

target="_blank"

class="receipt-btn">

🧾 View Receipt

</a>

`

:

""

}



</div>



`;





});







}



catch(error){



console.error(
"Expense Error:",
error
);



}



}









// ========================================
// LOAD ALL RECORDS
// ========================================


async function loadRecords(){



const table =

document.getElementById(
"records"
);





if(!table)return;








try{



table.innerHTML="";





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








collections.forEach(doc=>{


const data =
doc.data();



records.push({

type:"Collection",

details:

data.year,


amount:

data.amount

});



});







projects.forEach(doc=>{


const data =
doc.data();



records.push({

type:"Project",

details:

data.name,


amount:

data.budget

});



});







expenses.forEach(doc=>{


const data =
doc.data();



records.push({

type:"Expense",

details:

data.project,


amount:

data.amount

});



});








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



table.innerHTML += `


<tr>


<td>

${record.type}

</td>



<td>

${record.details}

</td>



<td>

${peso(record.amount)}

</td>




<td>

Verified

</td>



</tr>


`;



});






}



catch(error){



console.error(
"Records Error:",
error
);



}



}









// ========================================
// FINANCIAL SUMMARY
// ========================================


async function loadSummary(){



try{



const collectionSnap =

await getDocs(

collection(
db,
"collections"
)

);





const expenseSnap =

await getDocs(

collection(
db,
"expenses"
)

);







let funds=0;

let expenses=0;







collectionSnap.forEach(doc=>{


funds +=

Number(
doc.data().amount
||
0
);



});








expenseSnap.forEach(doc=>{


expenses +=

Number(
doc.data().amount
||
0
);



});







const balance =

funds - expenses;








setText(

"totalCollections",

peso(funds)

);




setText(

"totalExpenses",

peso(expenses)

);




setText(

"currentBalance",

peso(balance)

);







// PUBLIC DASHBOARD COMPATIBILITY


setText(

"totalFunds",

peso(funds)

);



setText(

"remainingBalance",

peso(balance)

);







}



catch(error){



console.error(
"Summary Error:",
error
);



}



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
"Deleted successfully."
);






await startDashboard();






}



catch(error){



console.error(
"Delete Error:",
error
);



}



};









// ========================================
// SEARCH RECORDS
// ========================================


const search =

document.getElementById(
"searchRecord"
);





if(search){



search.addEventListener(
"input",
()=>{


const keyword =

search.value
.toLowerCase();






document

.querySelectorAll(
"#records tr"
)

.forEach(row=>{



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
// AUTO UPDATE
// ========================================


setInterval(()=>{



startDashboard();



},30000);









// ========================================
// THEME BUTTON
// ========================================


const themeButton =

document.getElementById(
"themeToggle"
);





if(themeButton){



themeButton.onclick=()=>{



document.body.classList.toggle(
"dark"
);





localStorage.setItem(

"theme",

document.body.classList.contains(
"dark"
)

?

"dark"

:

"light"

);



};



}









console.log(`

================================

DALUBWIKAAN TREASURY ADMIN v5.0

✔ Firebase Authentication

✔ Firestore CRUD

✔ Receipt Upload

✔ Announcement System

✔ Project Transparency

✔ Budget Monitoring

✔ Abonado Detection

================================

`);
