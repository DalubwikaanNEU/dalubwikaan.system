// ========================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// ADMIN PANEL v6.0
// Firebase Authentication
// Firestore CRUD
// Receipt Storage Enhanced
// Project Transparency
// Budget Monitoring
// Announcement System
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



let projectCache = [];

let expenseCache = [];









// ========================================
// HELPER FUNCTIONS
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

        document.getElementById(
            "loader"
        );



        if(loader){


            loader.style.opacity="0";



            setTimeout(()=>{


                loader.style.display="none";


            },300);


        }



    },800);



});









// ========================================
// AUTHENTICATION SYSTEM
// ========================================


onAuthStateChanged(

auth,

async(user)=>{


    if(!user){


        location.href="login.html";


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

                "Unauthorized admin access."

            );



            await signOut(auth);



            location.href="login.html";


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

            "Authentication Error:",

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



    location.href="login.html";



});









// ========================================
// SYSTEM INITIALIZATION
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

    `

    =================================

    DALUBWIKAAN TREASURY ADMIN v6.0

    SYSTEM ONLINE

    =================================

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

        "Please select year level."

        );

        return;


    }







    if(

        !amount ||

        amount <=0 ||

        isNaN(amount)

    ){



        notify(

        "Please enter a valid amount."

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

    "Collection successfully saved."

    );







    collectionForm.reset();






    await loadRecords();


    await loadSummary();





}



catch(error){



    console.error(

        "Collection Save Error:",

        error

    );



    notify(

    "Unable to save collection."

    );



}



});



}
// ========================================
// PROJECT MANAGEMENT
// PROJECT STATUS + BUDGET MONITORING
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






// IMPORTANT
// DO NOT AUTO SET COMPLETED


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

isNaN(budget)

||

budget <= 0

){



notify(

"Please enter valid project budget."

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

"Failed creating project."

);



}



});



}












// ========================================
// EXPENSE MANAGEMENT
// RECEIPT SYSTEM ENHANCED
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







let selectedReceiptFile = null;









// ========================================
// RECEIPT IMAGE PREVIEW
// ========================================


if(receiptInput){



receiptInput.addEventListener(

"change",

()=>{



const file =

receiptInput.files[0];







if(!file)

return;








// IMAGE ONLY


if(

!file.type.startsWith(

"image/"

)

){



notify(

"Receipt must be an image file."

);



receiptInput.value="";



return;


}







// MAX 5MB


if(

file.size >

5 * 1024 * 1024

){



notify(

"Receipt size must be below 5MB."

);



receiptInput.value="";



return;


}






selectedReceiptFile=file;








if(receiptPreview){



receiptPreview.innerHTML = `


<div class="receipt-preview-card">



<div class="receipt-header">


🧾 Receipt Preview

</div>





<img

src="${URL.createObjectURL(file)}"

class="receipt-preview-image"

>






<p>

<strong>

File:

</strong>

${file.name}

</p>







<button

type="button"

id="removeReceipt"

class="remove-receipt"

>

❌ Remove Receipt

</button>




</div>


`;









const removeButton =

document.getElementById(

"removeReceipt"

);







removeButton?.addEventListener(

"click",

()=>{


receiptInput.value="";


selectedReceiptFile=null;



receiptPreview.innerHTML="";



});





}







});



}









// ========================================
// SAVE EXPENSE WITH RECEIPT
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

"Expense project is required."

);



return;


}








if(

isNaN(amount)

||

amount <=0

){



notify(

"Invalid expense amount."

);



return;


}







let receiptURL="";









// UPLOAD RECEIPT


if(selectedReceiptFile){



const storageRef =


ref(

storage,


"receipts/" +

Date.now()

+

"_"

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

"Expense successfully recorded."

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

"Please complete announcement details."

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





if(!container)

return;









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



container.innerHTML = `



<div class="empty-state">


📢 No announcements yet.


</div>



`;



return;



}







container.innerHTML="";









snap.forEach((docSnap)=>{



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



const projectSnapshot =


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









expenseSnapshot.forEach((docSnap)=>{



const expense =

docSnap.data();





const projectName =

expense.project;






if(!expenseMap[projectName]){


expenseMap[projectName]=0;


}







expenseMap[projectName]

+=

Number(

expense.amount || 0

);



});









projectCache=[];









projectSnapshot.forEach((docSnap)=>{



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








const remaining =

budget - spent;








const status =

project.status

||

"Planning";








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


<br><br>



<span class="project-status ${status.toLowerCase()}">

${

status === "Completed"

?

"🟢 Completed"

:

status === "Ongoing"

?

"🔵 Ongoing"

:

"🟡 Planning"

}



</span>



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






<p class="${remaining < 0 ? "danger-status":"success-status"}">



${

remaining < 0

?

"🔴 Abonado: "

+

peso(Math.abs(remaining))

:

"🟢 Remaining: "

+

peso(remaining)



}



</p>



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









if(projectSnapshot.empty && table){



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
// LOAD EXPENSE TRANSPARENCY
// RECEIPT DISPLAY SYSTEM
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


No expense records available.


</div>


`;



return;



}







container.innerHTML="";









snap.forEach((docSnap)=>{



const data =

docSnap.data();






expenseCache.push(data);








container.innerHTML += `



<div class="expense-card">



<div class="expense-header">


🧾

<strong>

${data.project || "Unknown Project"}

</strong>


</div>







<div class="expense-body">



<p>

Amount:

<strong>

${peso(data.amount)}

</strong>


</p>






<p>

${

data.description

||

"No description provided."

}

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


`

<span class="no-receipt">


📄 No Receipt Uploaded


</span>

`

}




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
// LOAD ALL RECORDS
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








collections.forEach(docSnap=>{



const data=

docSnap.data();



records.push({


type:"Collection",


details:data.year,


amount:data.amount


});



});








projects.forEach(docSnap=>{



const data=

docSnap.data();



records.push({


type:"Project",


details:data.name,


amount:data.budget


});



});








expenses.forEach(docSnap=>{



const data=

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
// TOTAL FUNDS / EXPENSES / BALANCE
// ========================================


async function loadSummary(){



try{



const collectionSnapshot =


await getDocs(



collection(

db,

"collections"

)



);







const expenseSnapshot =


await getDocs(



collection(

db,

"expenses"

)



);








let totalFunds = 0;


let totalExpenses = 0;








collectionSnapshot.forEach((docSnap)=>{



const data = docSnap.data();





totalFunds +=

Number(

data.amount || 0

);



});








expenseSnapshot.forEach((docSnap)=>{



const data = docSnap.data();





totalExpenses +=

Number(

data.amount || 0

);



});









const balance =

totalFunds - totalExpenses;








setText(

"totalCollections",

peso(totalFunds)

);





setText(

"totalExpenses",

peso(totalExpenses)

);





setText(

"currentBalance",

peso(balance)

);








// DASHBOARD COMPATIBILITY


setText(

"totalFunds",

peso(totalFunds)

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
// DELETE RECORD
// ========================================


window.deleteRecord =

async(

collectionName,

id

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

id

)



);







notify(

"Record deleted successfully."

);







await startDashboard();





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
// AUTO SYNCHRONIZATION
// ========================================


setInterval(()=>{



startDashboard();



console.log(

"Dalubwikaan Treasury Auto Sync"

);



},30000);












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







const isDark =


document.body.classList.contains(

"dark"

);







localStorage.setItem(



"theme",



isDark

?

"dark"

:

"light"



);








themeButton.textContent =


isDark

?

"☀"

:

"🌙";





};



}











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


"Promise Error:",


event.reason



);



});











// ========================================
// FINAL SYSTEM MESSAGE
// ========================================


console.log(`


========================================

DALUBWIKAAN TREASURY ADMIN v6.0


✓ Firebase Authentication

✓ Firestore CRUD

✓ Project Status Monitoring

✓ Budget Transparency

✓ Expense Tracking

✓ Receipt Upload System

✓ Receipt Preview Enhancement

✓ Announcement Management

✓ Abonado Detection

✓ Financial Summary

✓ Dark / Light Mode


SYSTEM READY 🚀


========================================


`);
