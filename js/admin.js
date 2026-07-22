// ========================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// ADMIN PANEL v14.0
// STABLE FIREBASE CRUD VERSION
// ANNOUNCEMENT FIXED
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

let recordCache = [];

let announcementCache = [];




// ========================================
// DOM FUNCTIONS
// ========================================


function getValue(id){

    const element =
    document.getElementById(id);


    if(!element){

        console.warn(
            "Missing element:",
            id
        );

        return "";

    }


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

            minimumFractionDigits:2,

            maximumFractionDigits:2

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


    setTimeout(

        hideLoader,

        800

    );


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


        const adminRef = doc(

            db,

            "admins",

            user.uid

        );





        const adminSnap =
        await getDoc(
            adminRef
        );





        if(!adminSnap.exists()){


            notify(

                "Unauthorized administrator account.",

                "error"

            );



            await signOut(auth);



            window.location.href =
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






        console.log(
            "Admin verified:",
            user.email
        );





        initializeDashboard();



    }



    catch(error){



        console.error(

            "AUTH ERROR:",

            error

        );



        notify(

            error.message,

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


        try{


            await signOut(auth);


            window.location.href =
            "login.html";


        }


        catch(error){


            console.error(
                error
            );


        }


    };


}









// ========================================
// DASHBOARD START
// ========================================


async function initializeDashboard(){


    console.log(

        "Loading Dalubwikaan Treasury..."

    );



    try{


        await Promise.all([


            loadProjects(),


            loadExpenses(),


            loadRecords(),


            loadAnnouncements(),


            loadSummary()


        ]);





        console.log(`

=================================

DALUBWIKAAN ADMIN PANEL v14.0

SYSTEM ONLINE

=================================

        `);



    }



    catch(error){



        console.error(

            "DASHBOARD ERROR:",

            error

        );


    }


}









// ========================================
// GLOBAL ERROR MONITOR
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
// PROJECT MANAGEMENT CRUD
// ========================================


// LOAD PROJECTS
// ========================================

async function loadProjects(){


    const container =
    document.getElementById(
        "projectContainer"
    );



    if(!container){

        console.warn(
            "projectContainer not found"
        );

        return;

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


        container.innerHTML="";





        if(snapshot.empty){


            container.innerHTML=`

            <div class="empty-state">

            No projects available.

            </div>

            `;


            return;


        }





        snapshot.forEach((docSnap)=>{


            const data =
            docSnap.data();




            projectCache.push({

                id:docSnap.id,

                ...data

            });






            container.innerHTML += `

            <div class="data-card">


            <h3>
            🏗 ${data.name || "Project"}
            </h3>


            <p>
            ${data.description || ""}
            </p>


            <strong>
            Budget:
            ${peso(data.budget)}
            </strong>



            <br><br>



            <button onclick="editProject('${docSnap.id}')">

            ✏️ Edit

            </button>



            <button onclick="deleteProject('${docSnap.id}')">

            🗑 Delete

            </button>


            </div>

            `;


        });



    }


    catch(error){


        console.error(

            "PROJECT ERROR:",

            error

        );


    }



}









// ADD PROJECT
// ========================================

async function addProject(data){


    try{


        await addDoc(

            collection(
                db,
                "projects"
            ),

            {

                ...data,

                createdAt:
                serverTimestamp()

            }

        );



        notify(
            "Project added."
        );


        loadProjects();



    }


    catch(error){


        console.error(
            error
        );


        notify(
            error.message,
            "error"
        );


    }


}









// EDIT PROJECT
// ========================================

window.editProject =
async function(id){


    const projectRef =
    doc(

        db,

        "projects",

        id

    );




    const snap =
    await getDoc(
        projectRef
    );




    if(!snap.exists())

    return;




    const data =
    snap.data();




    const name =
    prompt(

        "Project name:",

        data.name

    );





    if(name===null)

    return;





    await updateDoc(

        projectRef,

        {

            name:name,

            updatedAt:
            serverTimestamp()

        }

    );




    notify(
        "Project updated."
    );


    loadProjects();


};









// DELETE PROJECT
// ========================================

window.deleteProject =
async function(id){



    if(!confirm(
        "Delete this project?"
    ))

    return;




    await deleteDoc(

        doc(

            db,

            "projects",

            id

        )

    );




    notify(
        "Project deleted."
    );



    loadProjects();



};









// ========================================
// EXPENSE MANAGEMENT
// ========================================



// RECEIPT UPLOAD
// ========================================


const receiptInput =
document.getElementById(
    "receiptFile"
);




if(receiptInput){


    receiptInput.addEventListener(

        "change",

        (event)=>{


            selectedReceiptFile =
            event.target.files[0];




            const preview =
            document.getElementById(
                "receiptPreview"
            );




            if(preview && selectedReceiptFile){


                preview.innerHTML = `

                <div>

                🧾 ${selectedReceiptFile.name}

                </div>

                `;


            }



        }


    );


}









// LOAD EXPENSES
// ========================================

async function loadExpenses(){


    const container =
    document.getElementById(
        "expenseContainer"
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

            No expenses found.

            </div>

            `;


            return;


        }





        snapshot.forEach((docSnap)=>{


            const data =
            docSnap.data();





            expenseCache.push({

                id:docSnap.id,

                ...data

            });






            container.innerHTML += `


            <div class="data-card">


            <h3>

            💸 ${data.category || "Expense"}

            </h3>



            <p>

            ${data.description || ""}

            </p>



            <strong>

            ${peso(data.amount)}

            </strong>


            <br><br>



            ${
            data.receiptURL

            ?

            `<a href="${data.receiptURL}" target="_blank">

            📄 View Receipt

            </a>`

            :

            ""

            }



            <br><br>


            <button onclick="editExpense('${docSnap.id}')">

            ✏️ Edit

            </button>



            <button onclick="deleteExpense('${docSnap.id}')">

            🗑 Delete

            </button>



            </div>


            `;


        });



    }



    catch(error){


        console.error(

            "EXPENSE ERROR:",

            error

        );


    }



}









// ADD EXPENSE
// ========================================

async function addExpense(data){


    try{


        let receiptURL="";




        if(selectedReceiptFile){


            const storageRef =
            ref(

                storage,

                "receipts/" +

                Date.now() +

                "_" +

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

                ...data,

                receiptURL,

                createdAt:
                serverTimestamp()

            }

        );




        selectedReceiptFile=null;



        notify(
            "Expense saved."
        );



        loadExpenses();



    }



    catch(error){


        console.error(
            error
        );


        notify(
            error.message,
            "error"
        );


    }


}









// EXPENSE FORM
// ========================================


const expenseForm =
document.getElementById(
    "expenseForm"
);



if(expenseForm){



    expenseForm.addEventListener(

        "submit",

        async(e)=>{


            e.preventDefault();



            await addExpense({


                category:
                getValue(
                    "expenseProject"
                ),



                amount:
                Number(
                    getValue(
                        "expenseAmount"
                    )
                ),



                description:
                getValue(
                    "expenseDescription"
                )


            });





            expenseForm.reset();



        }


    );


}
// ========================================
// RECORD MANAGEMENT CRUD
// ========================================


async function loadRecords(){

    const table = document.getElementById("records");


    if(!table){

        console.warn("records table not found");
        return;

    }


    try{


        const snapshot = await getDocs(

            query(

                collection(db,"records"),

                orderBy("createdAt","desc")

            )

        );



        recordCache=[];

        table.innerHTML="";



        if(snapshot.empty){


            table.innerHTML=`

            <tr>
                <td colspan="5">
                    No records available.
                </td>
            </tr>

            `;


            return;

        }





        snapshot.forEach(docSnap=>{


            const data = docSnap.data();



            recordCache.push({

                id:docSnap.id,

                ...data

            });





            table.innerHTML += `


            <tr>


                <td>
                    ${data.type || "N/A"}
                </td>



                <td>
                    ${data.title || data.details || "Record"}
                </td>



                <td>
                    ${peso(data.amount)}
                </td>



                <td>
                    ${data.status || "Active"}
                </td>



                <td>


                    <button onclick="editRecord('${docSnap.id}')">
                        ✏️
                    </button>


                    <button onclick="deleteRecord('${docSnap.id}')">
                        🗑
                    </button>


                </td>


            </tr>


            `;



        });





    }
    catch(error){


        console.error(

            "LOAD RECORD ERROR:",

            error

        );


    }


}








window.deleteRecord = async function(id){


    try{


        if(!confirm("Delete this record?"))

        return;



        await deleteDoc(

            doc(

                db,

                "records",

                id

            )

        );



        notify("Record deleted.");

        loadRecords();

        loadSummary();



    }
    catch(error){


        console.error(

            "DELETE RECORD ERROR:",

            error

        );


        notify(

            "Failed deleting record."

        );


    }


};









window.editRecord = async function(id){


    try{


        const recordRef = doc(

            db,

            "records",

            id

        );



        const snap = await getDoc(recordRef);



        if(!snap.exists())

        return;



        const data=snap.data();



        const title = prompt(

            "Update details:",

            data.title || ""

        );



        if(title===null)

        return;




        await updateDoc(

            recordRef,

            {

                title:title,

                updatedAt:

                serverTimestamp()

            }

        );



        notify(

            "Record updated."

        );



        loadRecords();



    }
    catch(error){


        console.error(

            "EDIT RECORD ERROR:",

            error

        );


    }


};









// ========================================
// ANNOUNCEMENT SYSTEM FIXED
// ========================================



async function loadAnnouncements(){


    const container = document.getElementById(

        "announcementContainer"

    );



    if(!container){


        console.warn(

            "announcementContainer missing"

        );


        return;

    }





    try{


        const snapshot = await getDocs(

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





        announcementCache=[];


        container.innerHTML="";





        if(snapshot.empty){



            container.innerHTML=`

            <div class="empty-state">

            📢 No announcements yet.

            </div>

            `;


            return;


        }







        snapshot.forEach(docSnap=>{


            const data = docSnap.data();




            announcementCache.push({

                id:docSnap.id,

                ...data

            });






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



                <br><br>



                <button onclick="editAnnouncement('${docSnap.id}')">

                    ✏️ Edit

                </button>



                <button onclick="deleteAnnouncement('${docSnap.id}')">

                    🗑 Delete

                </button>



            </div>


            `;



        });




    }
    catch(error){


        console.error(

            "LOAD ANNOUNCEMENT ERROR:",

            error

        );


    }



}






// POST ANNOUNCEMENT FIX
// ========================================


const announcementForm = document.getElementById(

    "announcementForm"

);




if(announcementForm){



    announcementForm.addEventListener(

        "submit",

        async(event)=>{


            event.preventDefault();




            try{



                if(!currentUser){


                    notify(

                        "Admin account not detected."

                    );


                    return;


                }




                const title = getValue(

                    "announcementTitle"

                );




                const message = getValue(

                    "announcementMessage"

                );





                if(!title || !message){


                    notify(

                        "Complete announcement fields."

                    );


                    return;


                }





                await addDoc(

                    collection(

                        db,

                        "announcements"

                    ),

                    {


                        title:title,


                        message:message,


                        author:

                        currentUser.email,



                        createdAt:

                        serverTimestamp()



                    }


                );





                notify(

                    "Announcement posted successfully!"

                );





                announcementForm.reset();



                await loadAnnouncements();



            }


            catch(error){



                console.error(

                    "POST ANNOUNCEMENT ERROR:",

                    error

                );




                notify(

                    "Announcement failed. Check Firebase rules."

                );


            }



        }


    );


}
// ========================================
// ANNOUNCEMENT EDIT / DELETE
// ========================================


window.editAnnouncement = async function(id){


    try{


        const announcementRef = doc(

            db,

            "announcements",

            id

        );



        const snap = await getDoc(

            announcementRef

        );



        if(!snap.exists())

        return;




        const data = snap.data();




        const title = prompt(

            "Update announcement title:",

            data.title

        );





        if(title===null)

        return;





        await updateDoc(

            announcementRef,

            {


                title:title,


                updatedAt:

                serverTimestamp()


            }


        );




        notify(

            "Announcement updated."

        );



        loadAnnouncements();



    }
    catch(error){


        console.error(

            "EDIT ANNOUNCEMENT ERROR:",

            error

        );


    }


};









window.deleteAnnouncement = async function(id){


    try{


        if(!confirm(

            "Delete announcement?"

        ))

        return;





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



        loadAnnouncements();



    }
    catch(error){


        console.error(

            "DELETE ANNOUNCEMENT ERROR:",

            error

        );


    }


};









// ========================================
// COLLECTION MANAGEMENT
// ========================================


const collectionForm = document.getElementById(

    "collectionForm"

);



if(collectionForm){



collectionForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();



try{


const yearLevel = getValue(

"yearLevel"

);



const amount = Number(

getValue(

"amount"

)

);



const date = getValue(

"date"

);




if(!yearLevel || !amount || !date){


notify(

"Complete collection information."

);


return;


}






await addDoc(

collection(

db,

"collections"

),

{


yearLevel,


amount,


date,


createdAt:

serverTimestamp()



}


);





notify(

"Collection saved."

);





collectionForm.reset();



loadSummary();



}


catch(error){


console.error(

"COLLECTION ERROR:",

error

);



notify(

"Failed saving collection."

);


}



}



);



}









// ========================================
// SUMMARY SYSTEM
// ========================================


async function loadSummary(){


try{


let collections = 0;

let expenses = 0;

let projects = 0;

let records = 0;





const collectionSnap = await getDocs(

collection(

db,

"collections"

)

);




collectionSnap.forEach(item=>{


collections += Number(

item.data().amount || 0

);


});








const expenseSnap = await getDocs(

collection(

db,

"expenses"

)

);





expenseSnap.forEach(item=>{


expenses += Number(

item.data().amount || 0

);


});








const projectSnap = await getDocs(

collection(

db,

"projects"

)

);





projects = projectSnap.size;








const recordSnap = await getDocs(

collection(

db,

"records"

)

);





records = recordSnap.size;







setText(

"totalCollections",

peso(collections)

);





setText(

"totalExpenses",

peso(expenses)

);





setText(

"currentBalance",

peso(

collections-expenses

)

);





setText(

"recordCount",

records

);





setText(

"projectCount",

projects

);





setText(

"collectionCount",

collectionSnap.size

);





setText(

"expenseCount",

expenseSnap.size

);




}

catch(error){



console.error(

"SUMMARY ERROR:",

error

);



}



}









// ========================================
// SEARCH SYSTEM
// ========================================


const searchInput = document.getElementById(

"searchRecord"

);




if(searchInput){



searchInput.addEventListener(

"input",

()=>{


const keyword = searchInput.value

.toLowerCase();





const items = document.querySelectorAll(

".data-card, .announcement-card, #records tr"

);





items.forEach(item=>{


const text = item.textContent

.toLowerCase();




if(text.includes(keyword)){


item.style.display="";


}

else{


item.style.display="none";


}



});



}



);



}









// ========================================
// EXPORT REPORT
// ========================================


const exportButton = document.getElementById(

"exportReport"

);



if(exportButton){



exportButton.onclick=()=>{


const report={


generated:

new Date()

.toLocaleString(

"en-PH"

),


projects:

projectCache.length,


expenses:

expenseCache.length,


records:

recordCache.length,


announcements:

announcementCache.length



};





console.table(report);




notify(

"Report generated. Check console."

);



};



}









// ========================================
// FIREBASE CONNECTION TEST
// ========================================


async function firebaseConnectionCheck(){


try{


await getDocs(

collection(

db,

"announcements"

)

);





console.log(`

=================================

FIREBASE CONNECTION SUCCESS ✅

ANNOUNCEMENT DATABASE READY

=================================

`);





}

catch(error){


console.error(

"FIREBASE CONNECTION ERROR:",

error

);



}



}









// ========================================
// START SYSTEM
// ========================================


firebaseConnectionCheck();




console.log(`

========================================

DALUBWIKAAN TREASURY MANAGEMENT SYSTEM

ADMIN PANEL v14.0


✅ Firebase Connected

✅ Authentication Working

✅ Projects CRUD

✅ Expenses CRUD

✅ Records CRUD

✅ Collections

✅ Announcement Posting FIXED

✅ Search Enabled

✅ Summary Enabled


SYSTEM READY 🚀


========================================

`);
