// ========================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// ADMIN PANEL v7.0
// CLEAN + POLISHED VERSION
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
// DOM HELPERS
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
        `[${type}]`,
        message
    );


    alert(message);

}








function formatDate(date){

    if(!date)
    return "N/A";


    return new Date(date)

    .toLocaleDateString(
        "en-PH"
    );

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
                "Unauthorized access.",
                "error"
            );


            await signOut(auth);



            window.location.href =
            "login.html";


            return;


        }






        currentUser=user;







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
            "Authentication Error:",
            error
        );


        notify(
            "Authentication failed.",
            "error"
        );


    }



});









// ========================================
// LOGOUT
// ========================================


const logoutButton =

document.getElementById(
    "logout"
);





if(logoutButton){


logoutButton.onclick = async()=>{


    await signOut(auth);



    window.location.href =
    "login.html";


};


}









// ========================================
// DASHBOARD START
// ========================================


async function initializeDashboard(){



    console.log(
        "Starting Dalubwikaan Treasury..."
    );





    await Promise.all([



        loadProjects(),


        loadExpenses(),


        loadRecords(),


        loadAnnouncements(),


        loadSummary()



    ]);





    console.log(

    `

    ==================================

    DALUBWIKAAN TREASURY ADMIN v7.0

    SYSTEM ONLINE

    ==================================

    `

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
    "Please enter a valid amount.",
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



type:

"Collection",



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
// PROJECT STATUS SYSTEM
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









// STATUS SELECTOR
// Planning Default

const status =

getValue(
    "projectStatus"
)

||

"Planning";









if(!name){



notify(

"Project name is required.",

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

"Project Save Error:",

error

);



notify(

"Unable to create project.",

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


<span class="project-status completed">


🟢 Completed


</span>


`;






case "Ongoing":



return `


<span class="project-status ongoing">


🔵 Ongoing


</span>


`;







default:



return `


<span class="project-status planning">


🟡 Planning


</span>


`;



}



}












// ========================================
// CALCULATE PROJECT FINANCIAL STATUS
// ========================================


function financialBadge(

budget,

spent

){



const remaining =

budget - spent;








if(remaining < 0){



return `



<span class="danger-status">


🔴 Abonado:

${peso(
Math.abs(remaining)
)}



</span>



`;



}








return `



<span class="success-status">


🟢 Remaining:

${peso(remaining)}



</span>



`;



}











// ========================================
// PROJECT PROGRESS
// ========================================


function calculateProgress(

budget,

spent

){



if(!budget)

return 0;






let progress =

(spent / budget) * 100;






if(progress > 100)

progress = 100;







return progress.toFixed(0);



}









// ========================================
// UPDATE PROJECT STATUS AUTOMATICALLY
// ========================================


function autoProjectStatus(

status,

progress

){



// HINDI BABAGUHIN ANG ADMIN STATUS
// Manual pa rin ang Completed


if(status)

return status;





if(progress >= 100)

return "Completed";





if(progress > 0)

return "Ongoing";





return "Planning";


}
// ========================================
// EXPENSE MANAGEMENT
// ENHANCED RECEIPT SYSTEM
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
// RECEIPT PREVIEW HANDLER
// ========================================


if(receiptInput){



receiptInput.addEventListener(

"change",

()=>{



const file =

receiptInput.files[0];






if(!file)

return;








// IMAGE CHECK


if(

!file.type.startsWith(
    "image/"
)

){


notify(

"Receipt must be an image.",

"warning"

);



receiptInput.value="";


return;


}









// SIZE CHECK

if(

file.size >

5 * 1024 * 1024

){



notify(

"Maximum receipt size is 5MB.",

"warning"

);



receiptInput.value="";


return;


}






selectedReceiptFile=file;







showReceiptPreview(file);





});


}











// ========================================
// RECEIPT PREVIEW UI
// ========================================


function showReceiptPreview(file){



if(!receiptPreview)

return;







const imageURL =

URL.createObjectURL(file);







receiptPreview.innerHTML = `



<div class="receipt-preview-card">



<div class="receipt-title">

🧾 Receipt Preview

</div>







<img

src="${imageURL}"

class="receipt-preview-image"

>




<div class="receipt-info">


<p>

<strong>
File:
</strong>

${file.name}

</p>



<p>

<strong>
Size:
</strong>

${

(
file.size / 1024

)

.toFixed(1)

}

KB

</p>


</div>







<button

type="button"

class="remove-receipt"

id="removeReceipt"


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


receiptInput.value="";


selectedReceiptFile=null;



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

"Expense project is required.",

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









let receiptURL = "";









// =================================
// UPLOAD RECEIPT TO STORAGE
// =================================



if(selectedReceiptFile){



const storageRef =


ref(

storage,

"receipts/" +

Date.now()

+

"-"

+

selectedReceiptFile.name



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

"Expense recorded successfully."

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
// LOAD EXPENSE TRANSPARENCY
// ========================================


async function loadExpenses(){



const container =

document.getElementById(
    "expensePreview"
);






if(!container)

return;









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



container.innerHTML = `



<div class="empty-state">


🧾 No expenses recorded yet.


</div>



`;



return;


}








container.innerHTML="";









snap.forEach((docSnap)=>{



const data =

docSnap.data();







expenseCache.push(data);








const receiptHTML =



data.receipt

?

`


<a

href="${data.receipt}"

target="_blank"

class="receipt-btn"


>

🧾 Open Official Receipt


</a>


`



:

`


<span class="no-receipt">


⚠ No Receipt Uploaded


</span>


`;









container.innerHTML += `



<div class="expense-card">



<div class="expense-header">


<h3>

💸 ${data.project || "Unknown Project"}

</h3>


</div>







<div class="expense-details">



<p>

<strong>

Amount:

</strong>


${peso(data.amount)}


</p>








<p>

${

data.description ||

"No description."

}


</p>







<div class="receipt-area">


${receiptHTML}


</div>





</div>






</div>



`;







});





}



catch(error){



console.error(

"Expense Loading Error:",

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

"Complete announcement details.",

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








container.innerHTML="";








snapshot.forEach(docSnap=>{



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

"Announcement Load Error:",

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



table.innerHTML="";






let records=[];






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

✔ Verified

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







// PUBLIC DASHBOARD IDS


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







if(!confirmDelete)

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

"Deleted successfully."

);







await initializeDashboard();





}



catch(error){



console.error(

"Delete Error:",

error

);



notify(

"Delete failed.",

"error"

);



}



};












// ========================================
// SEARCH SYSTEM
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







if(savedTheme==="dark"){



document.body.classList.add(
    "dark"
);



themeButton.textContent="☀";


}









themeButton.onclick = ()=>{



document.body.classList.toggle(
    "dark"
);







const dark =

document.body.classList.contains(
    "dark"
);








localStorage.setItem(

"theme",

dark ? "dark" : "light"

);






themeButton.textContent =

dark

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

"Dalubwikaan Treasury Sync..."

);



},30000);











// ========================================
// ERROR HANDLING
// ========================================


window.addEventListener(

"error",

(event)=>{


console.error(

"Dashboard Error:",

event.error

);



});








window.addEventListener(

"unhandledrejection",

(event)=>{



console.error(

"Promise Error:",

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

✓ Project Status System

✓ Budget Monitoring

✓ Expense Tracking

✓ Receipt Preview

✓ Receipt Upload

✓ Announcement Board

✓ Financial Summary

✓ Search System

✓ Dark Mode


SYSTEM READY 🚀


========================================


`);
