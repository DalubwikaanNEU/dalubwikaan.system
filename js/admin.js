// ========================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// ADMIN PANEL v9.1
// EDIT + DELETE RECORD ENABLED
// CLEAN FIREBASE CRUD VERSION
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




// ========================================
// LOADER
// ========================================


function hideLoader(){


    const loader =
    document.getElementById("loader");



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
// AUTH SYSTEM
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

DALUBWIKAAN TREASURY ADMIN v9.1

SYSTEM ONLINE

EDIT + DELETE ACTIVE

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





if(isNaN(amount) || amount <=0){


notify(

"Invalid collection amount.",

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

"Project saved successfully."

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








projectCache=[];






snapshot.forEach(docSnap=>{


const project = docSnap.data();



projectCache.push({

id:docSnap.id,

...project

});





if(table){


table.innerHTML +=`


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

${peso(project.budget)}

</td>



<td>

${project.description || "No description"}

</td>


</tr>


`;



}



});







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









// ========================================
// RECEIPT UPLOAD PREVIEW
// ========================================


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

"Receipt must be an image file.",

"warning"

);


receiptInput.value="";


return;


}





if(file.size > 5 * 1024 * 1024){


notify(

"Receipt must be below 5MB.",

"warning"

);


receiptInput.value="";


return;


}





selectedReceiptFile=file;


if(receiptPreview){


receiptPreview.innerHTML = `


<div class="receipt-preview-card">


<h3>

🧾 Receipt Preview

</h3>


<p>

${file.name}

</p>


<button

type="button"

id="removeReceipt"

>

❌ Remove

</button>


</div>


`;



document

.getElementById(
"removeReceipt"
)

.onclick=()=>{


selectedReceiptFile=null;


receiptInput.value="";


receiptPreview.innerHTML="";


};



}



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



const filename =

Date.now()

+

"_"

+

selectedReceiptFile.name;




const storageRef =

ref(

storage,

"receipts/" + filename

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
// LOAD EXPENSES
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



container.innerHTML="";






if(snapshot.empty){


container.innerHTML=`


<div class="empty-state">

🧾 No expenses recorded.

</div>


`;

return;


}







snapshot.forEach(docSnap=>{


const expense = docSnap.data();



expenseCache.push({

id:docSnap.id,

...expense

});




container.innerHTML +=`



<div class="expense-card">


<h3>

🧾 ${expense.project}

</h3>



<p>

Amount:

<strong>

${peso(expense.amount)}

</strong>

</p>




<p>

${expense.description || "No description"}

</p>




${
expense.receipt

?

`

<img

src="${expense.receipt}"

width="150"

>


`

:

"⚠ No receipt"

}



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
// LOAD RECORDS WITH EDIT + DELETE
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







// COLLECTIONS

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

amount:data.amount

});


});








// PROJECTS


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

amount:data.budget

});


});








// EXPENSES


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

amount:data.amount

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

✔ Verified

</td>




<td>



<button

class="edit-btn"

onclick="editRecord('${record.collection}','${record.id}')"

>

✏️ Edit

</button>




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





}



catch(error){


console.error(

"Records Error:",

error

);


}



}
// ========================================
// DELETE RECORD SYSTEM
// ========================================


window.deleteRecord = async function(

collectionName,

id

){



const confirmDelete = confirm(

`⚠️ Delete this ${collectionName} record?

This action cannot be undone.`

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
// EDIT RECORD SYSTEM
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





const data = snapshot.data();







let newAmount = prompt(

"💰 Enter new amount:",

data.amount

);






if(newAmount===null)

return;







newAmount = Number(newAmount);






if(isNaN(newAmount) || newAmount <=0){


notify(

"Invalid amount.",

"warning"

);


return;


}









let newDetails = prompt(

"📝 Enter new details:",

data.year ||

data.name ||

data.project ||

""

);







if(newDetails===null)

return;








let updateData = {


amount:newAmount,


updatedAt:serverTimestamp()


};







if(collectionName==="collections"){


updateData.year = newDetails;


}







if(collectionName==="projects"){


updateData.name = newDetails;


}







if(collectionName==="expenses"){


updateData.project = newDetails;


}









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

"Failed updating record.",

"error"

);


}



};









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






let totalCollection = 0;

let totalExpense = 0;






collectionSnap.forEach(docSnap=>{


totalCollection +=

Number(

docSnap.data().amount || 0

);



});








expenseSnap.forEach(docSnap=>{


totalExpense +=

Number(

docSnap.data().amount || 0

);



});







const balance =

totalCollection - totalExpense;







setText(

"totalCollections",

peso(totalCollection)

);







setText(

"totalExpenses",

peso(totalExpense)

);







setText(

"currentBalance",

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
// ANNOUNCEMENTS
// ========================================


async function loadAnnouncements(){



const container =

document.getElementById(

"adminAnnouncementContainer"

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


container.innerHTML=

`

<div class="empty-state">

📢 No announcements yet.

</div>

`;

return;


}







container.innerHTML="";





snapshot.forEach(docSnap=>{


const data = docSnap.data();




container.innerHTML +=`


<div class="announcement-card">


<h3>

📢 ${data.title}

</h3>


<p>

${data.message}

</p>


</div>


`;



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
// SEARCH RECORDS
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

searchInput.value.toLowerCase();







document

.querySelectorAll(

"#records tr"

)

.forEach(row=>{


const text =

row.innerText.toLowerCase();




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







themeButton.onclick=()=>{


document.body.classList.toggle(

"dark"

);




const dark =

document.body.classList.contains(

"dark"

);




localStorage.setItem(

"theme",

dark

?

"dark"

:

"light"

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
// AUTO SYNC
// ========================================


setInterval(()=>{


initializeDashboard();



console.log(

"Dalubwikaan Treasury Auto Sync..."

);



},30000);









// ========================================
// BUTTON STYLE SUPPORT
// ========================================


const actionStyle = document.createElement("style");


actionStyle.innerHTML = `


.edit-btn{


background:#d4af37;

color:#3b2415;

border:none;

padding:8px 14px;

border-radius:10px;

cursor:pointer;

font-weight:bold;

}



.delete-btn{


background:#dc3545;

color:white;

border:none;

padding:8px 14px;

border-radius:10px;

cursor:pointer;

font-weight:bold;

}



.edit-btn:hover,

.delete-btn:hover{


transform:translateY(-2px);

}



`;



document.head.appendChild(actionStyle);









console.log(`

=================================

DALUBWIKAAN TREASURY ADMIN v9.1

✓ Firebase Authentication

✓ Collections

✓ Projects

✓ Expenses

✓ Receipt Upload

✓ Edit Records

✓ Delete Records

✓ Search System

✓ Dark Mode

✓ Financial Summary


SYSTEM READY 🚀

=================================

`);
