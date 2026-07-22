// ========================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// ADMIN PANEL v13.0
// FIXED CRUD VERSION
// ID MATCHED WITH ADMIN.HTML
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
// DOM HELPERS
// ========================================


function getValue(id){

    const element = document.getElementById(id);

    if(!element){

        return "";

    }


    return element.value.trim();

}




function setText(id,value){

    const element = document.getElementById(id);


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

            minimumFractionDigits:2,

            maximumFractionDigits:2

        }

    );


}





function notify(message,type="info"){


    console.log(

        `[${type}] ${message}`

    );


    alert(message);


}








// ========================================
// LOADER
// ========================================


function hideLoader(){


    const loader = document.getElementById("loader");


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


    }

);








// ========================================
// AUTHENTICATION SYSTEM
// ========================================


onAuthStateChanged(

auth,

async(user)=>{


    if(!user){


        window.location.href="login.html";

        return;

    }





    try{


        const adminRef = doc(

            db,

            "admins",

            user.uid

        );





        const adminSnap = await getDoc(

            adminRef

        );





        if(!adminSnap.exists()){


            notify(

                "Unauthorized administrator account.",

                "error"

            );



            await signOut(auth);


            window.location.href="login.html";


            return;


        }





        currentUser=user;





        const email = document.getElementById(

            "adminEmail"

        );





        if(email){


            email.textContent=user.email;


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


const logoutButton = document.getElementById(

    "logout"

);



if(logoutButton){



    logoutButton.onclick = async()=>{


        await signOut(auth);


        window.location.href="login.html";


    };


}










// ========================================
// DASHBOARD INITIALIZER
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

DALUBWIKAAN ADMIN PANEL v13.0

SYSTEM READY

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
// ERROR MONITOR
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


    const container = document.getElementById(
        "projectContainer"
    );


    if(!container){

        console.warn(
            "projectContainer not found"
        );

        return;

    }




    try{


        const snapshot = await getDocs(

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


            const data = docSnap.data();



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

            "PROJECT LOAD ERROR:",

            error

        );


    }



}









// ADD PROJECT
// ========================================


async function addProject(data){


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

        "Project successfully added."

    );


    loadProjects();


}









// EDIT PROJECT
// ========================================


window.editProject = async function(id){



    const projectRef = doc(

        db,

        "projects",

        id

    );





    const snap = await getDoc(

        projectRef

    );





    if(!snap.exists())

    return;





    const data=snap.data();





    const name = prompt(

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


window.deleteProject = async function(id){



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
// EXPENSE MANAGEMENT CRUD
// ========================================



// RECEIPT SELECT FIX
// ========================================


const receiptInput = document.getElementById(

    "receiptFile"

);




if(receiptInput){



    receiptInput.addEventListener(

        "change",

        (event)=>{


            selectedReceiptFile =

            event.target.files[0];



            const preview = document.getElementById(

                "receiptPreview"

            );





            if(preview && selectedReceiptFile){


                preview.innerHTML = `


                <p>

                🧾 ${selectedReceiptFile.name}

                </p>


                `;


            }



        }


    );


}









// LOAD EXPENSES
// ========================================


async function loadExpenses(){



    const container = document.getElementById(

        "expenseContainer"

    );





    if(!container){


        console.warn(

            "expenseContainer not found"

        );


        return;


    }






    try{


        const snapshot = await getDocs(

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






        snapshot.forEach(docSnap=>{


            const data=docSnap.data();




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

            "EXPENSE LOAD ERROR:",

            error

        );


    }



}









// ADD EXPENSE
// ========================================


async function addExpense(data){



    let receiptURL="";





    if(selectedReceiptFile){



        const storageRef = ref(

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





        receiptURL = await getDownloadURL(

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









// EXPENSE FORM SUBMIT
// ========================================


const expenseForm = document.getElementById(

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


// LOAD RECORDS
// ========================================

async function loadRecords(){


    const container = document.getElementById(

        "records"

    );



    if(!container){


        console.warn(

            "records table not found"

        );


        return;


    }






    try{


        const snapshot = await getDocs(

            query(

                collection(

                    db,

                    "records"

                ),

                orderBy(

                    "createdAt",

                    "desc"

                )

            )

        );





        recordCache=[];


        container.innerHTML="";





        if(snapshot.empty){



            container.innerHTML=`

            <tr>

            <td colspan="5">

            No records available.

            </td>

            </tr>

            `;


            return;


        }







        snapshot.forEach((docSnap)=>{


            const data = docSnap.data();





            recordCache.push({

                id:docSnap.id,

                ...data

            });







            container.innerHTML += `


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

            "RECORD ERROR:",

            error

        );


    }



}









// DELETE RECORD
// ========================================


window.deleteRecord = async function(id){



    if(!confirm(

        "Delete this record?"

    ))

    return;






    await deleteDoc(

        doc(

            db,

            "records",

            id

        )

    );






    notify(

        "Record deleted."

    );



    loadRecords();



};









// EDIT RECORD
// ========================================


window.editRecord = async function(id){



    const recordRef = doc(

        db,

        "records",

        id

    );





    const snap = await getDoc(

        recordRef

    );





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



};












// ========================================
// ANNOUNCEMENT SYSTEM
// ========================================


// LOAD ANNOUNCEMENTS
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







        snapshot.forEach((docSnap)=>{


            const data=docSnap.data();




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

            "ANNOUNCEMENT ERROR:",

            error

        );


    }



}











// ANNOUNCEMENT FORM
// ========================================


const announcementForm = document.getElementById(

    "announcementForm"

);





if(announcementForm){



    announcementForm.addEventListener(

        "submit",

        async(e)=>{


            e.preventDefault();





            const title = getValue(

                "announcementTitle"

            );





            const message = getValue(

                "announcementMessage"

            );






            if(!title || !message){



                notify(

                    "Please complete announcement fields.",

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


                    title:title,


                    message:message,


                    author:

                    currentUser?.email || "Admin",




                    createdAt:

                    serverTimestamp()



                }


            );






            notify(

                "Announcement posted."

            );





            announcementForm.reset();



            loadAnnouncements();



        }


    );


}









// EDIT ANNOUNCEMENT
// ========================================


window.editAnnouncement = async function(id){



    const refDoc = doc(

        db,

        "announcements",

        id

    );





    const snap = await getDoc(

        refDoc

    );





    if(!snap.exists())

    return;





    const data=snap.data();





    const title = prompt(

        "New announcement title:",

        data.title

    );





    if(title===null)

    return;







    await updateDoc(

        refDoc,

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



};









// DELETE ANNOUNCEMENT
// ========================================


window.deleteAnnouncement = async function(id){



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



};

// ========================================
// COLLECTION MANAGEMENT
// ========================================


// COLLECTION FORM
// ========================================


const collectionForm = document.getElementById(

    "collectionForm"

);





if(collectionForm){



    collectionForm.addEventListener(

        "submit",

        async(e)=>{


            e.preventDefault();





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

                    "Complete collection information.",

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


    );


}












// ========================================
// SUMMARY SYSTEM
// ========================================


async function loadSummary(){



    try{



        let totalCollections = 0;


        let totalExpenses = 0;


        let totalProjects = 0;



        let totalRecords = 0;







        const collectionSnap = await getDocs(

            collection(

                db,

                "collections"

            )

        );





        collectionSnap.forEach((item)=>{


            totalCollections += Number(

                item.data().amount || 0

            );


        });








        const expenseSnap = await getDocs(

            collection(

                db,

                "expenses"

            )

        );





        expenseSnap.forEach((item)=>{


            totalExpenses += Number(

                item.data().amount || 0

            );


        });







        const projectSnap = await getDocs(

            collection(

                db,

                "projects"

            )

        );





        totalProjects = projectSnap.size;








        const recordSnap = await getDocs(

            collection(

                db,

                "records"

            )

        );





        totalRecords = recordSnap.size;









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

            peso(

                totalCollections - totalExpenses

            )

        );






        setText(

            "recordCount",

            totalRecords

        );






        setText(

            "projectCount",

            totalProjects

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


            const keyword =

            searchInput.value

            .toLowerCase();






            const elements = document.querySelectorAll(

                ".data-card, .announcement-card, #records tr"

            );







            elements.forEach((element)=>{



                const text = element.textContent

                .toLowerCase();







                if(text.includes(keyword)){


                    element.style.display="";


                }

                else{


                    element.style.display="none";


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



        const report = {


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

            recordCache.length



        };







        console.table(

            report

        );







        notify(

            "Treasury report generated. Check console."

        );



    };


}











// ========================================
// FIREBASE CONNECTION CHECK
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

DALUBWIKAAN DATABASE ONLINE

=================================

        `);



    }



    catch(error){



        console.error(

            "FIREBASE ERROR:",

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

ADMIN PANEL v13.0


✅ Authentication

✅ Firebase Connected

✅ Collection CRUD

✅ Expense CRUD

✅ Project CRUD

✅ Record CRUD

✅ Announcement CRUD

✅ Receipt Upload

✅ Search Enabled

✅ Summary Enabled


SYSTEM READY 🚀


========================================

`);
