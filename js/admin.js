// ========================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// ADMIN PANEL v3.0
// Firebase Authentication
// Firestore CRUD
// Firebase Storage
// Announcement System
// Receipt Enhancement
// ========================================


import { db, storage } from "./firebase.js";


import {

    collection,
    addDoc,
    getDocs,
    getDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    orderBy

}

from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";



import {

    ref,
    uploadBytes,
    getDownloadURL

}

from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";



import {

    getAuth,
    onAuthStateChanged,
    signOut

}

from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";



// ========================================
// INITIALIZATION
// ========================================


const auth = getAuth();

let currentUser = null;



// ========================================
// LOADER
// ========================================


window.addEventListener("load",()=>{


    setTimeout(()=>{


        document
        .getElementById("loader")
        ?.remove();


    },800);


});



// ========================================
// HELPERS
// ========================================


const value = (id)=>

document
.getElementById(id)
?.value
.trim() || "";



const peso = (amount)=>

`₱${Number(amount || 0).toLocaleString()}`;



const notify = (message)=>

alert(message);



// ========================================
// AUTHENTICATION
// ========================================


onAuthStateChanged(auth, async(user)=>{


    if(!user){


        location.href="login.html";

        return;


    }



    try{


        const adminRef = doc(
            db,
            "admins",
            user.uid
        );



        const adminDoc =
        await getDoc(adminRef);



        if(!adminDoc.exists()){


            alert(
            "Access denied."
            );


            await signOut(auth);


            location.href="login.html";


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



        await refresh();



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


    location.href="login.html";


});



// ========================================
// ANNOUNCEMENT SYSTEM
// ========================================



async function createAnnouncement(
title,
message
){


    try{


        await addDoc(
        collection(
            db,
            "announcements"
        ),
        {


            title,


            message,


            postedBy:
            currentUser?.email ||
            "Administrator",



            createdAt:
            serverTimestamp()


        });


    }


    catch(error){


        console.error(
        "Announcement Error:",
        error
        );


    }


}



// ========================================
// ANNOUNCEMENT FORM
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



    const title =
    value(
    "announcementTitle"
    );



    const message =
    value(
    "announcementMessage"
    );



    if(!title || !message){


        notify(
        "Please complete announcement fields."
        );


        return;


    }



    await createAnnouncement(
        title,
        message
    );



    notify(
    "Announcement posted successfully."
    );



    announcementForm.reset();



    await refresh();



});


}




// ========================================
// COLLECTION MODULE
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
value("yearLevel");



const amount =
Number(
value("amount")
);



const date =
value("date");





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
"Enter valid amount."
);


return;


}



if(!date){


notify(
"Please select date."
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
"Collection successfully added."
);



collectionForm.reset();



await refresh();



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
// PROJECT MODULE
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
value(
"projectName"
);



const budget =
Number(
value(
"projectBudget"
)
);



const description =
value(
"description"
);




if(!name){


notify(
"Please enter project name."
);


return;


}



if(
isNaN(budget) ||
budget <= 0
){


notify(
"Enter valid project budget."
);


return;


}



if(!description){


notify(
"Please provide description."
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


status:
"Planned",


type:
"Project",


createdAt:
serverTimestamp()


}

);




notify(
"Project successfully added."
);



projectForm.reset();



await refresh();



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
// EXPENSE MODULE
// FIREBASE STORAGE + RECEIPT SYSTEM
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


receiptPreview.innerHTML="";



const file =
receiptInput.files[0];



if(!file) return;




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




const maxSize =
5 * 1024 * 1024;




if(file.size > maxSize){


notify(
"Receipt must be below 5MB."
);


receiptInput.value="";


return;


}





receiptPreview.innerHTML = `


<div class="receipt-card">


<h4>
🧾 Receipt Preview
</h4>


<img src="${URL.createObjectURL(file)}">


<div class="receipt-info">


<p>
<strong>File:</strong>
${file.name}
</p>


<p>
<strong>Size:</strong>
${(
file.size / 1024
).toFixed(2)}
KB
</p>


</div>


</div>


`;



});


}




// ========================================
// SAVE EXPENSE
// ========================================



if(expenseForm){


expenseForm.addEventListener(
"submit",
async(e)=>{


e.preventDefault();



try{


const project =
value(
"expenseProject"
);



const amount =
Number(
value(
"expenseAmount"
)
);



const description =
value(
"expenseDescription"
);





if(!project){


notify(
"Enter project name."
);


return;


}



if(
isNaN(amount) ||
amount <= 0
){


notify(
"Enter valid expense amount."
);


return;


}



if(!description){


notify(
"Enter expense description."
);


return;


}





let receiptURL = "";




const file =
receiptInput?.files[0];




if(file){


const fileName =

`${Date.now()}_${file.name}`;



const storageRef =

ref(
storage,
`receipts/${fileName}`
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



status:
"Approved",



type:
"Expense",



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




await refresh();



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
// LOAD TREASURY RECORDS
// ========================================


async function loadRecords(){


const table =
document.getElementById(
"records"
);



if(!table) return;



table.innerHTML = `

<tr>

<td colspan="4">

Loading records...

</td>

</tr>

`;



try{


const collectionsQuery =
query(

collection(
db,
"collections"
),

orderBy(
"createdAt",
"desc"
)

);



const projectsQuery =
query(

collection(
db,
"projects"
),

orderBy(
"createdAt",
"desc"
)

);



const expensesQuery =
query(

collection(
db,
"expenses"
),

orderBy(
"createdAt",
"desc"
)

);




const [

collectionsSnap,

projectsSnap,

expensesSnap

] = await Promise.all([


getDocs(collectionsQuery),

getDocs(projectsQuery),

getDocs(expensesQuery)


]);




const records = [];





// ========================================
// COLLECTION RECORDS
// ========================================


collectionsSnap.forEach(
(docSnap)=>{


const data =
docSnap.data();



records.push({


id:
docSnap.id,


collection:
"collections",


type:
"Collection",


title:
data.year,


details:
data.date,


amount:
data.amount,


receipt:""



});


});




// ========================================
// PROJECT RECORDS
// ========================================


projectsSnap.forEach(
(docSnap)=>{


const data =
docSnap.data();



records.push({


id:
docSnap.id,


collection:
"projects",


type:
"Project",


title:
data.name,


details:
data.description,


amount:
data.budget,


receipt:""



});


});




// ========================================
// EXPENSE RECORDS
// ========================================


expensesSnap.forEach(
(docSnap)=>{


const data =
docSnap.data();



records.push({


id:
docSnap.id,


collection:
"expenses",


type:
"Expense",


title:
data.project,


details:
data.description,


amount:
data.amount,


receipt:
data.receipt || ""


});


});





updateStats(records);




if(records.length === 0){


table.innerHTML = `

<tr>

<td colspan="4">

No records available.

</td>

</tr>

`;


return;


}







table.innerHTML =

records.map(record=>`



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



${
record.receipt

?

`

<br><br>


<div class="receipt-link">


<a

href="${record.receipt}"

target="_blank"

>

🧾 View Receipt

</a>


</div>


`

:

""

}



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



`).join("");



}



catch(error){


console.error(
"Load Records Error:",
error
);



table.innerHTML = `

<tr>

<td colspan="4">

Failed to load records.

</td>

</tr>

`;



}


}






// ========================================
// DASHBOARD STATISTICS
// ========================================



function updateStats(records){



const totalRecords =
records.length;



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




document
.getElementById(
"recordCount"
)
.textContent =
totalRecords;




document
.getElementById(
"collectionCount"
)
.textContent =
collections;




document
.getElementById(
"projectCount"
)
.textContent =
projects;




document
.getElementById(
"expenseCount"
)
.textContent =
expenses;



}






// ========================================
// ANNOUNCEMENT DISPLAY
// ========================================



async function loadAnnouncements(){


const container =
document.getElementById(
"announcementContainer"
);



if(!container) return;




try{


const announcementQuery =

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

await getDocs(
announcementQuery
);





if(snapshot.empty){


container.innerHTML = `


<div class="empty-state">


<p>

📢 No announcements yet.

</p>


</div>


`;



return;


}






container.innerHTML =



snapshot.docs.map(
(docSnap)=>{


const data =
docSnap.data();




return `



<div class="announcement-card">


<h3>

📢 ${data.title}

</h3>



<p>

${data.message}

</p>




<small>

Posted by:

${data.postedBy || "Admin"}

</small>



</div>



`;



}

).join("");



}



catch(error){


console.error(

"Announcement Load Error:",

error

);



}



}






// ========================================
// DELETE RECORD
// ========================================



window.deleteRecord = async(

collectionName,

documentId

)=>{



const confirmDelete =

confirm(

"Delete this record?"

);




if(!confirmDelete)

return;





try{



await deleteDoc(

doc(

db,

collectionName,

documentId

)

);





notify(

"Record deleted successfully."

);




await refresh();



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
// SEARCH RECORDS
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

.toLowerCase()

.trim();




document

.querySelectorAll(
"#records tr"
)

.forEach(row=>{



const text =

row.textContent

.toLowerCase();





row.style.display =

text.includes(keyword)

?

""

:

"none";



});



});



}

// ========================================
// REFRESH SYSTEM
// ========================================


async function refresh(){


try{


await Promise.all([


loadRecords(),


loadAnnouncements(),


loadFinancialSummary()


]);



}



catch(error){



console.error(

"Refresh Error:",

error

);



}



}







// ========================================
// FINANCIAL SUMMARY
// ========================================


async function loadFinancialSummary(){



try{



const [

collectionsSnap,

expensesSnap

] = await Promise.all([



getDocs(

collection(
db,
"collections"
)

),



getDocs(

collection(
db,
"expenses"
)

)



]);





let totalCollections = 0;

let totalExpenses = 0;





collectionsSnap.forEach(
(docSnap)=>{



const data =
docSnap.data();



totalCollections +=

Number(
data.amount || 0
);



});







expensesSnap.forEach(
(docSnap)=>{



const data =
docSnap.data();



totalExpenses +=

Number(
data.amount || 0
);



});








const balance =

totalCollections -
totalExpenses;





const collectionDisplay =

document.getElementById(
"totalCollections"
);




const expenseDisplay =

document.getElementById(
"totalExpenses"
);




const balanceDisplay =

document.getElementById(
"currentBalance"
);







if(collectionDisplay){


collectionDisplay.textContent =

peso(totalCollections);


}







if(expenseDisplay){


expenseDisplay.textContent =

peso(totalExpenses);


}







if(balanceDisplay){


balanceDisplay.textContent =

peso(balance);


}






}



catch(error){



console.error(

"Financial Summary Error:",

error

);



}



}








// ========================================
// DARK / LIGHT MODE
// ========================================



const themeButton =

document.getElementById(
"themeToggle"
);




if(themeButton){



const savedTheme =

localStorage.getItem(
"theme"
)

|| "light";





if(savedTheme==="dark"){



document.body.classList.add(
"dark"
);



themeButton.textContent =

"☀ Light Mode";



}





themeButton.addEventListener(
"click",
()=>{





document.body.classList.toggle(
"dark"
);






const darkMode =

document.body.classList.contains(
"dark"
);







localStorage.setItem(

"theme",

darkMode

?

"dark"

:

"light"

);







themeButton.textContent =

darkMode

?

"☀ Light Mode"

:

"🌙 Dark Mode";




});



}







// ========================================
// EXPORT TREASURY RECORDS CSV
// ========================================



window.exportCSV = ()=>{



const table =

document.getElementById(
"records"
);




if(!table)

return;






let csv = [];





table

.querySelectorAll(
"tr"
)

.forEach(row=>{



const columns =

[

...row.querySelectorAll(
"td,th"
)

];





csv.push(



columns

.map(

col=>

`"${col.innerText
.replace(/"/g,'""')}"`

)

.join(",")



);



});







const blob =

new Blob(

[

csv.join("\n")

],

{

type:

"text/csv;charset=utf-8;"

}

);







const link =

document.createElement(
"a"
);






link.href =

URL.createObjectURL(
blob
);






link.download =

`Dalubwikaan_Treasury_${Date.now()}.csv`;






link.click();





};









// ========================================
// AUTO REFRESH
// ========================================



setInterval(

async()=>{


await refresh();


},

30000

);








// ========================================
// SYSTEM INITIALIZATION
// ========================================



async function initializeDashboard(){



try{



await refresh();





console.log(`

=========================================

DALUBWIKAAN TREASURY MANAGEMENT SYSTEM

Version: 3.0


Firebase Authentication

Firestore CRUD

Storage Receipt Upload

Announcement System

Financial Analytics

Dark Mode

CSV Export


SYSTEM READY

=========================================

`);




}



catch(error){



console.error(

"Initialization Error:",

error

);



}



}





initializeDashboard();








// ========================================
// GLOBAL ERROR HANDLER
// ========================================



window.addEventListener(

"error",

(event)=>{



console.error(

"System Error:",

event.error

);



}

);






window.addEventListener(

"unhandledrejection",

(event)=>{



console.error(

"Unhandled Promise:",

event.reason

);



}

);







// ========================================
// OPTIONAL SECURITY
// ========================================



document.addEventListener(

"contextmenu",

(e)=>{


e.preventDefault();


}

);




document.addEventListener(

"keydown",

(e)=>{



if(

e.key==="F12"

||


(
e.ctrlKey

&&

e.shiftKey

&&

[

"I",

"J",

"C"

]

.includes(
e.key.toUpperCase()
)

)

){


e.preventDefault();


}



}

);
