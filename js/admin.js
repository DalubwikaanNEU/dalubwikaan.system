// ========================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// ADMIN PANEL v9.0
// EDIT + DELETE RECORD ENABLED
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
// GLOBAL VARIABLES
// ========================================


const auth = getAuth();


let currentUser = null;


let selectedReceiptFile = null;


let projectCache = [];

let expenseCache = [];

let currentEdit = {

    collection:null,

    id:null

};









// ========================================
// DOM HELPERS
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

        element.textContent=value;

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

        `[${type}] ${message}`

    );


    alert(message);


}







function formatDate(value){


    if(!value)

    return "N/A";



    try{


        return new Date(value)

        .toLocaleDateString(
            "en-PH"
        );


    }


    catch{


        return "Invalid Date";


    }


}









// ========================================
// LOADER
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
// DASHBOARD INITIALIZER
// ========================================


async function initializeDashboard(){


    try{


        console.log(

        "Starting Dalubwikaan Treasury System..."

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

DALUBWIKAAN TREASURY ADMIN v9.0

SYSTEM ONLINE

EDIT + DELETE ENABLED

=================================

        `);



    }



    catch(error){


        console.error(

            "Dashboard Error:",

            error

        );


    }


}









// ========================================
// GLOBAL ERROR HANDLER
// ========================================


window.addEventListener(

"error",

(event)=>{


console.error(

"ADMIN ERROR:",

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

"Please enter valid amount.",

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

"Project name is required.",

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

"Project Error:",

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



if(status==="Completed"){


return `

<span class="status completed">

🟢 Completed

</span>

`;


}





if(status==="Ongoing"){


return `

<span class="status ongoing">

🔵 Ongoing

</span>

`;


}





return `

<span class="status planning">

🟡 Planning

</span>

`;



}









// ========================================
// FINANCIAL STATUS
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
// PROJECT PROGRESS
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



const snapshot =


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






const expenseSnapshot =


await getDocs(

collection(

db,

"expenses"

)

);






let expenseMap={};






expenseSnapshot.forEach(docSnap=>{


const data =
docSnap.data();




if(!expenseMap[data.project]){


expenseMap[data.project]=0;


}




expenseMap[data.project]

+=

Number(

data.amount || 0

);



});








projectCache=[];









snapshot.forEach(docSnap=>{


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

id:docSnap.id,

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

project.status

)}


</td>





<td>


Allocated:

${peso(budget)}

<br>


Spent:

${peso(spent)}



<br>


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

Used:

${progress}%

</small>


</div>


</td>






<td>


${

project.description ||

"No description"

}


</td>



</tr>


`;



}




});







if(snapshot.empty && table){


table.innerHTML=`

<tr>

<td colspan="3">

No projects found.

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









if(receiptInput){



receiptInput.addEventListener(

"change",

()=>{


const file =

receiptInput.files[0];




if(!file)

return;






if(!file.type.startsWith("image/")){


notify(

"Receipt must be image.",

"warning"

);


receiptInput.value="";


return;


}







if(file.size > 5*1024*1024){


notify(

"Maximum size is 5MB.",

"warning"

);


receiptInput.value="";


return;


}






selectedReceiptFile=file;


renderReceiptPreview(file);



});


}







function renderReceiptPreview(file){



if(!receiptPreview)

return;



const url =

URL.createObjectURL(file);





receiptPreview.innerHTML=`

<div class="receipt-preview-card">


<h3>

🧾 Receipt Preview

</h3>


<img

src="${url}"

class="receipt-preview-image"

>


<p>

${file.name}

</p>



<button

type="button"

id="removeReceipt"

class="remove-receipt"

>

Remove

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





if(!project || amount<=0){


notify(

"Complete expense details.",

"warning"

);


return;


}






let receiptURL="";





if(selectedReceiptFile){



const fileName =

Date.now()

+

"_"

+

selectedReceiptFile.name;





const storageRef =

ref(

storage,

"receipts/"+fileName

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







await addDoc(

collection(

db,

"expenses"

),

{


project,


amount,


description,


receipt:receiptURL,


status:"Approved",


type:"Expense",


createdAt:

serverTimestamp()


}


);





notify(

"Expense saved successfully."

);



expenseForm.reset();


selectedReceiptFile=null;


if(receiptPreview)

receiptPreview.innerHTML="";



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

"Failed saving expense.",

"error"

);


}



});


}
// ========================================
// LOAD RECORDS WITH EDIT + DELETE BUTTONS
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




// =========================
// LOAD COLLECTIONS
// =========================


const collections =

await getDocs(

collection(
    db,
    "collections"
)

);



collections.forEach(docSnap=>{


const data = docSnap.data();



records.push({

id:docSnap.id,

collection:"collections",

type:"Collection",

details:data.year,

amount:data.amount,

date:data.date || ""

});


});






// =========================
// LOAD PROJECTS
// =========================


const projects =

await getDocs(

collection(
    db,
    "projects"
)

);



projects.forEach(docSnap=>{


const data = docSnap.data();



records.push({

id:docSnap.id,

collection:"projects",

type:"Project",

details:data.name,

amount:data.budget,

date:""


});


});






// =========================
// LOAD EXPENSES
// =========================


const expenses =

await getDocs(

collection(
    db,
    "expenses"
)

);



expenses.forEach(docSnap=>{


const data = docSnap.data();



records.push({

id:docSnap.id,

collection:"expenses",

type:"Expense",

details:data.project,

amount:data.amount,

date:""


});


});








if(records.length===0){


table.innerHTML=`

<tr>

<td colspan="5">

No records available.

</td>

</tr>

`;


return;


}







// =========================
// DISPLAY RECORDS
// =========================


records.forEach(record=>{



table.innerHTML +=`


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






<td>


<button

class="edit-btn"

onclick="editRecord(

'${record.collection}',

'${record.id}'

)"

>

✏️ Edit

</button>





<button

class="delete-btn"

onclick="deleteRecord(

'${record.collection}',

'${record.id}'

)"

>

🗑 Delete

</button>



</td>



</tr>



`;



});





}



catch(error){



console.error(

"Record Loading Error:",

error

);



notify(

"Failed loading records.",

"error"

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

"Delete this record permanently?"

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

"Delete failed.",

"error"

);



}



};









// ========================================
// EDIT RECORD SYSTEM
// ========================================


window.editRecord =

async(

collectionName,

id

)=>{


try{


const recordRef =

doc(

db,

collectionName,

id

);






const snapshot =

await getDoc(

recordRef

);






if(!snapshot.exists()){


notify(

"Record not found.",

"error"

);


return;


}






const data =

snapshot.data();







let newAmount =

prompt(

"Enter new amount:",

data.amount

);







if(newAmount===null)

return;







newAmount =

Number(newAmount);







if(isNaN(newAmount) || newAmount<=0){


notify(

"Invalid amount.",

"warning"

);


return;


}









let newDetails =

prompt(

"Enter new details:",

data.year ||

data.name ||

data.project ||

""

);






if(newDetails===null)

return;









let updateData={

amount:newAmount

};







// UPDATE BASED ON TYPE


if(collectionName==="collections"){


updateData.year = newDetails;


}




if(collectionName==="projects"){


updateData.name = newDetails;


}





if(collectionName==="expenses"){


updateData.project = newDetails;


}









const {updateDoc}=await import(

"https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js"

);








await updateDoc(

recordRef,

updateData

);









notify(

"Record updated successfully."

);






await initializeDashboard();





}



catch(error){



console.error(

"Edit Error:",

error

);



notify(

"Failed editing record.",

"error"

);



}



};

// ========================================
// RECORD ACTION BUTTON STYLE SUPPORT
// ========================================


const style = document.createElement("style");


style.innerHTML = `


.edit-btn{


    background:

    linear-gradient(
        135deg,
        #c89b3c,
        #f1d27a
    );


    color:#3b2415;


    border:none;


    padding:8px 15px;


    border-radius:12px;


    cursor:pointer;


    font-weight:600;


    margin-right:8px;


    transition:.3s;


}





.edit-btn:hover{


    transform:translateY(-3px);


    box-shadow:

    0 8px 18px rgba(200,155,60,.35);


}







.delete-btn{


    background:

    linear-gradient(
        135deg,
        #b02a37,
        #dc3545
    );


    color:white;


    border:none;


    padding:8px 15px;


    border-radius:12px;


    cursor:pointer;


    font-weight:600;


    transition:.3s;


}





.delete-btn:hover{


    transform:translateY(-3px);


    box-shadow:

    0 8px 18px rgba(176,42,55,.35);


}





.record-actions{


    display:flex;


    gap:10px;


    flex-wrap:wrap;


}



`;



document.head.appendChild(style);








// ========================================
// FIX TABLE RESPONSIVENESS
// ========================================


window.addEventListener(

"resize",

()=>{


const table =

document.getElementById(
    "records"
);




if(table && window.innerWidth < 700){


table.style.fontSize="13px";


}

else if(table){


table.style.fontSize="15px";


}



}

);









// ========================================
// FORCE REFRESH AFTER UPDATE
// ========================================


async function refreshRecords(){


await loadRecords();


await loadProjects();


await loadExpenses();


await loadSummary();



}





// ========================================
// IMPROVED DELETE CONFIRMATION
// ========================================


window.deleteRecord = async function(

collectionName,

id

){



const answer = confirm(

`
⚠️ WARNING

This action cannot be undone.

Delete this ${collectionName} record?
`

);





if(!answer)

return;







try{



await deleteDoc(

doc(

db,

collectionName,

id

)

);







alert(

"✅ Record successfully deleted."

);






await refreshRecords();




}

catch(error){



console.error(

"DELETE FAILED:",

error

);



alert(

"❌ Unable to delete record."

);



}



};









// ========================================
// IMPROVED EDIT FUNCTION
// ========================================


window.editRecord = async function(

collectionName,

id

){



try{



const recordRef =

doc(

db,

collectionName,

id

);







const recordSnap =

await getDoc(

recordRef

);







if(!recordSnap.exists()){


alert(

"Record does not exist."

);


return;


}







const data =

recordSnap.data();








let updatedAmount = prompt(

"💰 Update Amount:",

data.amount

);







if(updatedAmount===null)

return;








updatedAmount = Number(updatedAmount);







if(

isNaN(updatedAmount)

||

updatedAmount<=0

){



alert(

"Invalid amount."

);


return;


}








let updatedName = prompt(

"📝 Update Name / Details:",

data.year ||

data.name ||

data.project ||

""

);







if(updatedName===null)

return;







const {

updateDoc

}=

await import(

"https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js"

);









let changes={



amount:updatedAmount



};









if(collectionName==="collections"){


changes.year = updatedName;


}





if(collectionName==="projects"){


changes.name = updatedName;


}





if(collectionName==="expenses"){


changes.project = updatedName;


}









await updateDoc(

recordRef,

changes

);







alert(

"✅ Record updated successfully."

);







await refreshRecords();



}



catch(error){



console.error(

"EDIT ERROR:",

error

);



alert(

"❌ Failed updating record."

);



}



};









// ========================================
// FINAL INITIALIZATION CHECK
// ========================================


console.log(`


====================================

DALUBWIKAAN TREASURY ADMIN v8.0

EDIT / DELETE SYSTEM ACTIVE

✓ Firebase CRUD

✓ Update Records

✓ Delete Records

✓ Receipt System

✓ Expense Monitoring

✓ Budget Tracking

✓ Search

✓ Dark Mode


SYSTEM READY 🚀

====================================


`);
