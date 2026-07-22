// ========================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// ADMIN PANEL v8.0
// CLEAN + POLISHED + RECEIPT READY
// ========================================


// ========================================
// FIREBASE IMPORTS
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
// GLOBAL VARIABLES
// ========================================


const auth = getAuth();



let currentUser = null;



let selectedReceiptFile = null;



let projectCache = [];

let expenseCache = [];






// ========================================
// DOM HELPER FUNCTIONS
// ========================================


function getValue(id){

    const element =
    document.getElementById(id);


    if(!element)
    return "";


    return element.value.trim();

}






function setText(id,value){

    const element =
    document.getElementById(id);


    if(element){

        element.textContent = value;

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







function notify(message,type="info"){


    console.log(
        `${type.toUpperCase()}:`,
        message
    );


    alert(message);

}







function formatDate(value){


    if(!value)
    return "No Date";


    try{


        return new Date(value)

        .toLocaleDateString(
            "en-PH",
            {

                year:"numeric",

                month:"long",

                day:"numeric"

            }

        );


    }


    catch{

        return "Invalid Date";

    }


}









// ========================================
// LOADER SYSTEM
// ========================================


function hideLoader(){


    const loader =

    document.getElementById(
        "loader"
    );



    if(loader){


        loader.style.opacity="0";



        setTimeout(()=>{


            loader.style.display="none";


        },300);



    }


}






window.addEventListener(

"load",

()=>{


    setTimeout(()=>{


        hideLoader();


    },800);



});









// ========================================
// AUTHENTICATION SYSTEM
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


        const adminSnapshot =


        await getDoc(

            doc(

                db,

                "admins",

                user.uid

            )

        );







        if(!adminSnapshot.exists()){


            notify(

            "Unauthorized admin access.",

            "error"

            );



            await signOut(auth);



            window.location.href =
            "login.html";


            return;


        }







        currentUser = user;








        const emailDisplay =

        document.getElementById(
            "adminEmail"
        );







        if(emailDisplay){


            emailDisplay.textContent =

            user.email;


        }







        initializeDashboard();



    }



    catch(error){



        console.error(

            "AUTH ERROR:",

            error

        );



        notify(

            "Authentication failed.",

            "error"

        );



    }




});









// ========================================
// LOGOUT SYSTEM
// ========================================


const logoutButton =

document.getElementById(
    "logout"
);







if(logoutButton){



    logoutButton.addEventListener(

    "click",

    async()=>{


        await signOut(auth);



        window.location.href =
        "login.html";


    }


    );


}









// ========================================
// START DASHBOARD
// ========================================


async function initializeDashboard(){



    try{


        console.log(
            "Loading Dalubwikaan Treasury..."
        );







        await Promise.all([


            loadProjects(),


            loadExpenses(),


            loadRecords(),


            loadAnnouncements(),


            loadSummary()



        ]);








        console.log(`

=================================

DALUBWIKAAN TREASURY ADMIN v8.0

SYSTEM ONLINE

=================================

        `);



    }



    catch(error){



        console.error(

            "Dashboard Initialization Error:",

            error

        );



    }


}









// ========================================
// SAFE FIREBASE ERROR HANDLER
// ========================================


window.addEventListener(

"error",

(event)=>{


    console.error(

        "ADMIN PANEL ERROR:",

        event.error

    );


});





window.addEventListener(

"unhandledrejection",

(event)=>{


    console.error(

        "PROMISE ERROR:",

        event.reason

    );


});
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
    "Please select year level.",
    "warning"
);


return;


}







if(

isNaN(amount)

||

amount <= 0

){


notify(
    "Enter valid collection amount.",
    "warning"
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


type:"Collection",


createdAt:

serverTimestamp()


}


);







notify(
    "Collection saved successfully."
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

"Failed saving collection.",

"error"

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

"Project name required.",

"warning"

);


return;


}









if(

isNaN(budget)

||

budget <= 0

){


notify(

"Invalid project budget.",

"warning"

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



type:"Project",



createdAt:

serverTimestamp()


}


);







notify(

"Project created successfully."

);







projectForm.reset();






await loadProjects();

await loadRecords();



}



catch(error){



console.error(

"Project Save Error:",

error

);



notify(

"Failed creating project.",

"error"

);



}



});


}









// ========================================
// PROJECT STATUS BADGE
// ========================================


function projectStatusBadge(status){



switch(status){



case "Completed":


return `


<span class="status completed">

🟢 Completed

</span>


`;





case "Ongoing":


return `


<span class="status ongoing">

🔵 Ongoing

</span>


`;






default:


return `


<span class="status planning">

🟡 Planning

</span>


`;



}



}









// ========================================
// PROJECT FINANCIAL STATUS
// ========================================


function financialStatus(

budget,

spent

){



const remaining =

budget - spent;







if(remaining < 0){


return `


<p class="danger-status">

🔴 Over Budget:

${peso(
Math.abs(remaining)
)}

</p>


`;



}





return `


<p class="success-status">

🟢 Remaining:

${peso(remaining)}

</p>


`;



}









// ========================================
// PROJECT PROGRESS BAR
// ========================================


function projectProgress(

budget,

spent

){



if(!budget)

return 0;







let progress =

(spent / budget) * 100;







if(progress > 100)

progress = 100;







return Math.round(progress);



}









// ========================================
// LOAD PROJECTS
// PROJECT TRANSPARENCY DASHBOARD
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



const projectsSnapshot =


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







const expensesSnapshot =


await getDocs(

collection(

db,

"expenses"

)

);








let expenseMap = {};







expensesSnapshot.forEach(docSnap=>{



const expense =

docSnap.data();






if(!expenseMap[expense.project]){


expenseMap[expense.project]=0;


}






expenseMap[expense.project]

+=

Number(

expense.amount || 0

);



});









projectCache=[];









projectsSnapshot.forEach(docSnap=>{



const project =

docSnap.data();








const budget =

Number(

project.budget || 0

);







const spent =

expenseMap[project.name]

||

0;








const progress =

projectProgress(

budget,

spent

);







projectCache.push({

...project,

spent,

progress


});








if(table){



table.innerHTML += `



<tr>



<td>


<strong>

${project.name}

</strong>


<br>


${projectStatusBadge(

project.status || "Planning"

)}



</td>







<td>


<p>

Allocated:

<strong>

${peso(budget)}

</strong>

</p>



<p>

Spent:

<strong>

${peso(spent)}

</strong>

</p>



${financialStatus(

budget,

spent

)}





<div class="progress-container">



<div class="progress-bar">


<div

class="progress-fill"

style="width:${progress}%">

</div>


</div>



<small>

Budget Used:

${progress}%

</small>



</div>




</td>







<td>


${

project.description

||

"No description available."

}



</td>





</tr>



`;



}




});









if(projectsSnapshot.empty && table){



table.innerHTML=`



<tr>

<td colspan="3">

No projects available.

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



notify(

"Unable to load projects.",

"error"

);



}



}
// ========================================
// EXPENSE MANAGEMENT
// RECEIPT SYSTEM v8.0
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
// RECEIPT FILE SELECT
// ========================================


if(receiptInput){



receiptInput.addEventListener(

"change",

()=>{



const file =

receiptInput.files[0];





if(!file)

return;







// CHECK IMAGE


if(

!file.type.startsWith("image/")

){


notify(

"Receipt must be an image file.",

"warning"

);



receiptInput.value="";


return;


}








// CHECK SIZE


if(

file.size >

5 * 1024 * 1024

){


notify(

"Receipt must be below 5MB.",

"warning"

);



receiptInput.value="";


return;


}







selectedReceiptFile = file;





renderReceiptPreview(file);





});


}











// ========================================
// RECEIPT PREVIEW DESIGN
// ========================================


function renderReceiptPreview(file){



if(!receiptPreview)

return;







const imageURL =

URL.createObjectURL(file);








receiptPreview.innerHTML = `



<div class="receipt-preview-card">



<div class="receipt-preview-header">


🧾 Receipt Preview


</div>







<div class="receipt-image-wrapper">


<img

src="${imageURL}"

class="receipt-preview-image"

>


</div>







<div class="receipt-file-info">



<p>

<strong>

Filename:

</strong>

<br>

${file.name}

</p>






<p>

<strong>

Size:

</strong>

<br>

${(

file.size / 1024

).toFixed(1)}

KB

</p>



</div>








<button

type="button"

id="removeReceipt"

class="remove-receipt"

>


❌ Remove Receipt


</button>




</div>



`;









document

.getElementById(

"removeReceipt"

)

?.addEventListener(

"click",

()=>{



selectedReceiptFile=null;


receiptInput.value="";


receiptPreview.innerHTML="";



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

"Please select project.",

"warning"

);



return;


}








if(

isNaN(amount)

||

amount <= 0

){



notify(

"Invalid expense amount.",

"warning"

);



return;


}










let receiptURL="";










// =================================
// UPLOAD RECEIPT
// =================================


if(selectedReceiptFile){



const cleanName =

selectedReceiptFile.name

.replace(

/[^a-zA-Z0-9.]/g,

"_"

);







const storagePath =


"receipts/" +

Date.now()

+

"_"

+

cleanName;








const storageRef =

ref(

storage,

storagePath

);







await uploadBytes(

storageRef,

selectedReceiptFile

);







receiptURL =

await getDownloadURL(

storageRef

);



}











// =================================
// SAVE EXPENSE DATA
// =================================


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



createdAt:

serverTimestamp()



}


);








notify(

"Expense saved successfully."

);







expenseForm.reset();



selectedReceiptFile=null;







if(receiptPreview){


receiptPreview.innerHTML="";


}









await loadExpenses();


await loadProjects();


await loadRecords();


await loadSummary();



}



catch(error){



console.error(

"Expense Save Error:",

error

);



notify(

"Failed saving expense.",

"error"

);



}



});


}









// ========================================
// LOAD EXPENSES
// RECEIPT TRANSPARENCY VIEW
// ========================================


async function loadExpenses(){



const container =

document.getElementById(

"expensePreview"

);






if(!container)

return;








try{



const snapshot =


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









if(snapshot.empty){



container.innerHTML=`



<div class="empty-state">


🧾 No expenses recorded.


</div>



`;



return;


}







container.innerHTML="";









snapshot.forEach(docSnap=>{



const expense =

docSnap.data();





expenseCache.push(expense);









container.innerHTML += `



<div class="expense-card">





<div class="expense-header">


<h3>

🧾 ${expense.project || "Unknown Project"}

</h3>


</div>







<div class="expense-content">



<div class="expense-info">



<p>

<strong>

Amount

</strong>

<br>

${peso(expense.amount)}

</p>







<p>

<strong>

Purpose

</strong>

<br>

${

expense.description ||

"No description provided."

}

</p>







<p>

<strong>

Status

</strong>

<br>


<span class="status completed">

✔ Approved

</span>


</p>



</div>









<div class="receipt-box">



${
expense.receipt

?


`

<img

src="${expense.receipt}"

class="receipt-thumbnail"

>


<a

href="${expense.receipt}"

target="_blank"

class="receipt-btn"

>


🧾 View Full Receipt


</a>


`

:


`

<span class="no-receipt">


⚠ No Receipt Uploaded


</span>


`



}



</div>







</div>







</div>



`;



});






}



catch(error){



console.error(

"Expense Load Error:",

error

);



}



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
    "Please complete announcement details.",
    "warning"
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

currentUser?.email ||

"Administrator",



createdAt:

serverTimestamp()



}



);





notify(
    "Announcement posted successfully."
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
    "Failed posting announcement.",
    "error"
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



if(!container)

return;






try{


const snapshot =

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







if(snapshot.empty){


container.innerHTML = `


<div class="empty-state">

📢 No announcements yet.

</div>


`;

return;


}





container.innerHTML = "";






snapshot.forEach((docSnap)=>{


const data =
docSnap.data();




container.innerHTML += `



<div class="announcement-card">


<h3>

📢 ${data.title || "Announcement"}

</h3>



<p>

${data.message || ""}

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

"Announcement Loading Error:",

error

);



}



}









// ========================================
// LOAD RECORDS
// ========================================


async function loadRecords(){



const table =

document.getElementById(
    "records"
);



if(!table)

return;





try{


table.innerHTML = "";



let records = [];





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







collections.forEach(docSnap=>{


const data =
docSnap.data();



records.push({


type:"Collection",


details:data.year,


amount:data.amount


});


});








projects.forEach(docSnap=>{


const data =
docSnap.data();



records.push({


type:"Project",


details:data.name,


amount:data.budget


});


});







expenses.forEach(docSnap=>{


const data =
docSnap.data();



records.push({


type:"Expense",


details:data.project,


amount:data.amount


});


});








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

<span class="verified">

✔ Verified

</span>

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







let funds = 0;

let expenses = 0;







collectionSnap.forEach(docSnap=>{


funds +=

Number(

docSnap.data().amount || 0

);



});







expenseSnap.forEach(docSnap=>{


expenses +=

Number(

docSnap.data().amount || 0

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







// OLD DASHBOARD COMPATIBILITY


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

"Financial Summary Error:",

error

);



}



}









// ========================================
// DELETE RECORD SYSTEM
// ========================================


window.deleteRecord =

async(

collectionName,

id

)=>{



const confirmation =

confirm(

"Are you sure you want to delete this record?"

);






if(!confirmation)

return;







try{


await deleteDoc(

doc(

db,

collectionName,

id

)

);






notify(

"Record deleted successfully."

);







await initializeDashboard();





}



catch(error){



console.error(

"Delete Error:",

error

);



notify(

"Failed deleting record.",

"error"

);



}



};











// ========================================
// SEARCH RECORD SYSTEM
// ========================================


const searchInput =

document.getElementById(
    "searchRecord"
);






if(searchInput){



searchInput.addEventListener(

"input",

()=>{


const keyword =

searchInput.value

.toLowerCase();






document

.querySelectorAll(

"#records tr"

)

.forEach(row=>{



const text =

row.innerText

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
);






if(savedTheme === "dark"){


document.body.classList.add(
    "dark"
);



themeButton.textContent="☀";


}







themeButton.onclick = ()=>{



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

"☀"

:

"🌙";



};



}









// ========================================
// AUTO SYNCHRONIZATION
// ========================================


setInterval(()=>{


initializeDashboard();



console.log(

"Dalubwikaan Treasury Auto Sync Running..."

);



},30000);









// ========================================
// GLOBAL ERROR HANDLING
// ========================================


window.addEventListener(

"error",

(event)=>{


console.error(

"Admin Panel Error:",

event.error

);



});







window.addEventListener(

"unhandledrejection",

(event)=>{


console.error(

"Unhandled Promise Error:",

event.reason

);



});









// ========================================
// FINAL SYSTEM MESSAGE
// ========================================


console.log(`


========================================


DALUBWIKAAN TREASURY ADMIN v7.0


✓ Firebase Authentication

✓ Firestore CRUD

✓ Collection Management

✓ Project Monitoring

✓ Budget Tracking

✓ Expense Management

✓ Receipt Upload System

✓ Receipt Preview Fix

✓ Announcement Board

✓ Search System

✓ Financial Summary

✓ Dark / Light Mode


SYSTEM READY 🚀


========================================


`);
