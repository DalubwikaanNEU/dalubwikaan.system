// ========================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// ADMIN PANEL
// Firebase Authentication
// Firestore CRUD
// Firebase Storage
// Announcement System
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
.trim()
|| "";



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


        const adminRef =

        doc(
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



        currentUser=user;



        const email =

        document
        .getElementById(
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


                user:

                currentUser?.email
                ||
                "Administrator",



                createdAt:

                serverTimestamp()



            }

        );



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

document
.getElementById(
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



await loadAnnouncements();



}


);



}
// ========================================
// LOAD ANNOUNCEMENTS
// ========================================


async function loadAnnouncements(){


    const container =

    document
    .getElementById(
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
                No announcements yet.
                </p>

            </div>

            `;


            return;


        }



        container.innerHTML =

        snapshot.docs.map(docSnap=>{


            const data =
            docSnap.data();



            return `


            <div class="panel announcement-card">


                <h3>
                    📢 ${data.title}
                </h3>



                <p>
                    ${data.message}
                </p>



                <small>

                    Posted by:
                    ${data.user || "Administrator"}

                </small>



            </div>


            `;


        }).join("");



    }


    catch(error){


        console.error(

            "Announcement Load Error:",
            error

        );



        container.innerHTML = `


        <div class="empty-state">

            <p>
            Failed to load announcements.
            </p>


        </div>


        `;


    }


}




// ========================================
// COLLECTION FORM
// ========================================


const collectionForm =

document
.getElementById(
"collectionForm"
);



if(collectionForm){


collectionForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();



try{


const year =

value(
"yearLevel"
);



const amount =

Number(
value(
"amount"
)
);



const date =

value(
"date"
);



// VALIDATION


if(!year){


notify(
"Please select a year level."
);


return;


}



if(isNaN(amount) || amount <= 0){


notify(
"Enter a valid collection amount."
);


return;


}



if(!date){


notify(
"Please select collection date."
);


return;


}



// SAVE COLLECTION


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




// SUCCESS


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



}



);



}





// ========================================
// COLLECTION HELPERS
// ========================================


function resetCollectionForm(){


    collectionForm?.reset();


}



function validateCollection(amount){


    return (

        !isNaN(amount)

        &&

        amount > 0

    );


}



// ========================================
// PROJECT MODULE
// ========================================


const projectForm =

document
.getElementById(
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




// VALIDATION


if(!name){


notify(
"Please enter project name."
);


return;


}



if(isNaN(budget) || budget <=0){


notify(
"Enter valid project budget."
);


return;


}



if(!description){


notify(
"Please provide project description."
);


return;


}



// SAVE PROJECT


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



}



);



}
// ========================================
// EXPENSE MODULE
// Firebase Storage + Firestore
// ========================================


const expenseForm =

document
.getElementById(
"expenseForm"
);



const receiptInput =

document
.getElementById(
"receiptFile"
);



const receiptPreview =

document
.getElementById(
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



if(!file.type.startsWith("image/")){


notify(
"Only image files are allowed."
);



receiptInput.value="";

return;


}




const MAX_SIZE =

5 * 1024 * 1024;



if(file.size > MAX_SIZE){


notify(
"Receipt image must not exceed 5MB."
);



receiptInput.value="";


return;


}




receiptPreview.innerHTML = `


<img

src="${URL.createObjectURL(file)}"

alt="Receipt Preview"

style="

width:220px;

border-radius:12px;

margin-top:15px;

"

>


`;



}



);



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




// VALIDATION


if(!project){


notify(
"Please enter project name."
);


return;


}



if(isNaN(amount) || amount<=0){


notify(
"Please enter valid amount."
);


return;


}



if(!description){


notify(
"Please enter expense details."
);


return;


}




let receiptURL="";




// UPLOAD RECEIPT


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




// SAVE EXPENSE


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
"Expense successfully recorded."
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



}



);



}




// ========================================
// LOAD TREASURY RECORDS
// ========================================


async function loadRecords(){


const table =

document
.getElementById(
"records"
);



if(!table) return;



table.innerHTML=`

<tr>

<td colspan="4">

Loading records...

</td>

</tr>

`;



try{


const [

collectionsSnap,

projectsSnap,

expensesSnap


] = await Promise.all([



getDocs(

query(

collection(
db,
"collections"
),

orderBy(
"createdAt",
"desc"
)

)

),




getDocs(

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

),




getDocs(

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

)


]);




const records=[];




collectionsSnap.forEach(docSnap=>{


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





projectsSnap.forEach(docSnap=>{


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





expensesSnap.forEach(docSnap=>{


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



${record.receipt ? `


<br><br>


<a href="${record.receipt}"

target="_blank">

🧾 View Receipt

</a>


`:""}



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

"Records Error:",
error

);



table.innerHTML=`

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



    const totalCollections =
    records.filter(
        r=>r.type==="Collection"
    ).length;



    const totalProjects =
    records.filter(
        r=>r.type==="Project"
    ).length;



    const totalExpenses =
    records.filter(
        r=>r.type==="Expense"
    ).length;



    document
    .getElementById("recordCount")
    ?.textContent = totalRecords;



    document
    .getElementById("collectionCount")
    ?.textContent = totalCollections;



    document
    .getElementById("projectCount")
    ?.textContent = totalProjects;



    document
    .getElementById("expenseCount")
    ?.textContent = totalExpenses;


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
"Are you sure you want to delete this record?"
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

document
.getElementById(
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



const rows =

document
.querySelectorAll(
"#records tr"
);



rows.forEach(row=>{


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



}



);



}






// ========================================
// FINANCIAL SUMMARY
// ========================================


async function loadFinancialSummary(){


try{


const [

collectionsSnap,

expensesSnap


]=await Promise.all([



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



collectionsSnap.forEach(doc=>{


totalCollections +=

Number(
doc.data().amount || 0
);



});





expensesSnap.forEach(doc=>{


totalExpenses +=

Number(
doc.data().amount || 0
);



});





const balance =

totalCollections -
totalExpenses;




document
.getElementById(
"totalCollections"
)
?.textContent =

peso(totalCollections);





document
.getElementById(
"totalExpenses"
)
?.textContent =

peso(totalExpenses);





document
.getElementById(
"currentBalance"
)
?.textContent =

peso(balance);





}



catch(error){


console.error(

"Financial Summary Error:",

error

);



}



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
// DARK / LIGHT MODE
// ========================================


const themeButton =

document
.getElementById(
"themeToggle"
);



if(themeButton){


const savedTheme =

localStorage.getItem(
"theme"
)
||
"light";



document.body.classList.toggle(

"dark",

savedTheme==="dark"

);




themeButton.textContent =

savedTheme==="dark"

?

"☀ Light Mode"

:

"🌙 Dark Mode";




themeButton.addEventListener(

"click",

()=>{


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

"☀ Light Mode"

:

"🌙 Dark Mode";



}



);



}







// ========================================
// EXPORT CSV
// ========================================


window.exportCSV = ()=>{


const table =

document
.getElementById(
"records"
);



if(!table)
return;



let csv=[];



table
.querySelectorAll("tr")
.forEach(row=>{


const cols =

[
...row.querySelectorAll(
"td,th"
)
];



csv.push(

cols.map(col=>

`"${col.innerText.replace(/"/g,'""')}"`

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
// INITIALIZATION
// ========================================


async function initializeDashboard(){


try{


await refresh();



console.log(`

================================

DALUBWIKAAN TREASURY SYSTEM

VERSION 3.0

Firebase Authentication

Firestore CRUD

Storage Receipt Upload

Announcement Board

Analytics

Dark Mode

CSV Export

================================

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
// ERROR HANDLER
// ========================================


window.addEventListener(

"unhandledrejection",

event=>{


console.error(

"Unhandled Promise:",

event.reason

);



}

);
