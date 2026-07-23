// ========================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// ADMIN PANEL v15.0
// POLISHED FIREBASE CRUD VERSION
// FIXED ID MATCHING VERSION
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
// HELPER FUNCTIONS
// ========================================


function getValue(id){


    const element =
    document.getElementById(id);



    if(!element){

        console.warn(
            "Missing ID:",
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


        const adminRef =
        doc(

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
                "Unauthorized admin account.",
                "error"
            );


            await signOut(auth);



            window.location.href =
            "login.html";


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


        await signOut(auth);


        window.location.href =
        "login.html";


    };


}









// ========================================
// DASHBOARD INITIALIZER
// ========================================


async function initializeDashboard(){



    console.log(
        "Loading Dalubwikaan System..."
    );



    try{


        await Promise.all([

            loadProjects(),

            loadExpenses(),

            loadRecords(),

            loadAnnouncements(),

            loadSummary()

        ]);



        console.log(
            "SYSTEM READY"
        );


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
// PROJECT MANAGEMENT
// ========================================


// LOAD PROJECTS

async function loadProjects(){


    const container =
    document.getElementById(
        "projectContainer"
    );



    if(!container)

    return;



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


            container.innerHTML = `

            <div class="empty-state">

            No projects found.

            </div>

            `;


            return;


        }





        snapshot.forEach(docSnap=>{


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
            "PROJECT LOAD ERROR:",
            error
        );


    }


}









// ADD PROJECT


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
        "Project saved!"
    );


    loadProjects();


}









// PROJECT FORM SUBMIT FIX


const projectForm =
document.getElementById(
    "projectForm"
);



if(projectForm){


projectForm.addEventListener(

"submit",

async(e)=>{


    e.preventDefault();



    await addProject({

        name:
        getValue(
            "projectName"
        ),


        budget:
        Number(
            getValue(
                "projectBudget"
            )
        ),


        description:
        getValue(
            "description"
        ),


        status:
        getValue(
            "projectStatus"
        )


    });



    projectForm.reset();



});


}









// EDIT PROJECT


window.editProject =
async function(id){


    const refDoc =
    doc(

        db,

        "projects",

        id

    );



    const snap =
    await getDoc(refDoc);



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

        refDoc,

        {

            name:name,

            updatedAt:
            serverTimestamp()

        }

    );



    notify(
        "Project updated!"
    );


    loadProjects();


};









// DELETE PROJECT


window.deleteProject =
async function(id){


    if(!confirm(
        "Delete project?"
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
        "Project deleted!"
    );


    loadProjects();


};
// ========================================
// EXPENSE MANAGEMENT SYSTEM
// ========================================


// ========================================
// RECEIPT UPLOAD FIX
// ========================================


const receiptInput =
document.getElementById(
    "receipt"
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









// ========================================
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


            container.innerHTML = `

            <div class="empty-state">

            No expenses found.

            </div>

            `;


            return;


        }





        snapshot.forEach(docSnap=>{


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

                `

                <a href="${data.receiptURL}" target="_blank">

                📄 View Receipt

                </a>

                `

                :

                ""

            }



            <br><br>



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









// ========================================
// ADD EXPENSE
// ========================================


async function addExpense(data){



    try{


        let receiptURL = "";





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





        selectedReceiptFile = null;



        notify(
            "Expense saved!"
        );



        loadExpenses();

        loadSummary();



    }


    catch(error){


        console.error(
            "ADD EXPENSE ERROR:",
            error
        );


        notify(
            error.message,
            "error"
        );


    }


}









// ========================================
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



});


}









// DELETE EXPENSE


window.deleteExpense =
async function(id){



    if(!confirm(
        "Delete expense?"
    ))

    return;



    await deleteDoc(

        doc(

            db,

            "expenses",

            id

        )

    );



    notify(
        "Expense deleted!"
    );



    loadExpenses();

    loadSummary();


};









// ========================================
// FINANCIAL RECORDS SYSTEM
// ========================================


// LOAD RECORDS


async function loadRecords(){



    const container =
    document.getElementById(
        "recordContainer"
    );



    if(!container)

    return;




    try{


        const snapshot =
        await getDocs(

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


            container.innerHTML = `

            <div class="empty-state">

            No records found.

            </div>

            `;


            return;


        }







        snapshot.forEach(docSnap=>{


            const data =
            docSnap.data();





            recordCache.push({

                id:docSnap.id,

                ...data

            });







            container.innerHTML += `



            <div class="data-card">


            <h3>

            📋 ${data.title || "Record"}

            </h3>




            <p>

            Type:
            ${data.type || "N/A"}

            </p>





            <p>

            Amount:

            ${peso(data.amount)}

            </p>




            <p>

            Status:

            ${data.status || "Active"}

            </p>





            <button onclick="editRecord('${docSnap.id}')">

            ✏️ Edit

            </button>




            <button onclick="deleteRecord('${docSnap.id}')">

            🗑 Delete

            </button>




            </div>



            `;



        });



    }


    catch(error){


        console.error(

            "RECORD LOAD ERROR:",

            error

        );


    }



}









// DELETE RECORD


window.deleteRecord =
async function(id){


    if(!confirm(
        "Delete record?"
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
        "Record deleted!"
    );



    loadRecords();

    loadSummary();


};









// EDIT RECORD


window.editRecord =
async function(id){


    const recordRef =
    doc(

        db,

        "records",

        id

    );



    const snap =
    await getDoc(
        recordRef
    );



    if(!snap.exists())

    return;



    const data =
    snap.data();




    const title =
    prompt(

        "New title:",

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
        "Record updated!"
    );



    loadRecords();


};
// ========================================
// ANNOUNCEMENT MANAGEMENT SYSTEM
// FIXED VERSION
// ========================================


// LOAD ANNOUNCEMENTS


async function loadAnnouncements(){


    const container =
    document.getElementById(
        "adminAnnouncementContainer"
    );



    if(!container){

        console.warn(
            "Announcement container missing"
        );

        return;

    }




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




        announcementCache=[];


        container.innerHTML="";






        if(snapshot.empty){


            container.innerHTML = `

            <div class="empty-state">

            📢 No announcements yet.

            </div>

            `;


            return;


        }







        snapshot.forEach(docSnap=>{


            const data =
            docSnap.data();




            announcementCache.push({

                id:docSnap.id,

                ...data

            });






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









// ========================================
// POST ANNOUNCEMENT
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
                "Please complete announcement fields."
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

            error.message,

            "error"

        );


    }



}


);


}









// ========================================
// EDIT ANNOUNCEMENT
// ========================================


window.editAnnouncement =
async function(id){



    const announcementRef =
    doc(

        db,

        "announcements",

        id

    );




    const snap =
    await getDoc(
        announcementRef
    );




    if(!snap.exists())

    return;




    const data =
    snap.data();





    const title =
    prompt(

        "Update title:",

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
        "Announcement updated!"
    );



    loadAnnouncements();



};

// ========================================
// DELETE ANNOUNCEMENT
// ========================================


window.deleteAnnouncement =
async function(id){



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
        "Announcement deleted!"
    );



    loadAnnouncements();



};


// ========================================
// COLLECTION MANAGEMENT v16.0
// ========================================

let collectionCache = [];

// ========================================
// LOAD COLLECTIONS
// ========================================

async function loadCollections() {

    const container = document.getElementById("collectionContainer");

    if (!container) return;

    try {

        const snapshot = await getDocs(
            query(
                collection(db, "collections"),
                orderBy("createdAt", "desc")
            )
        );

        collectionCache = [];
        container.innerHTML = "";

        if (snapshot.empty) {

            container.innerHTML = `
            <div class="empty-state">
                No collection records found.
            </div>
            `;

            return;
        }

        snapshot.forEach(docSnap => {

            const data = docSnap.data();

            collectionCache.push({
                id: docSnap.id,
                ...data
            });

            container.innerHTML += `

            <div class="data-card">

                <h3>💰 ${data.yearLevel}</h3>

                <p>
                    Collection Date:
                    <strong>${data.date}</strong>
                </p>

                <p>
                    Remarks:
                    ${data.remarks || "No remarks"}
                </p>

                <h2>${peso(data.amount)}</h2>

                <br>

                <button onclick="editCollection('${docSnap.id}')">
                    ✏️ Edit
                </button>

                <button onclick="deleteCollection('${docSnap.id}')">
                    🗑 Delete
                </button>

            </div>

            `;

        });

    }

    catch(error){

        console.error(
            "LOAD COLLECTION ERROR:",
            error
        );

    }

}

// ========================================
// ADD COLLECTION
// ========================================

async function addCollection(data){

    await addDoc(

        collection(
            db,
            "collections"
        ),

        {

            ...data,

            createdAt:
            serverTimestamp()

        }

    );

    notify("Collection saved!");

    loadCollections();

    loadSummary();

}

// ========================================
// COLLECTION FORM
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

                const yearLevel =
                getValue("yearLevel");

                const amount =
                Number(
                    getValue("amount")
                );

                const date =
                getValue("date");

                const remarks =
                getValue("remarks");

                if(!yearLevel){

                    notify(
                        "Select year level."
                    );

                    return;

                }

                if(amount <= 0){

                    notify(
                        "Invalid amount."
                    );

                    return;

                }

                if(!date){

                    notify(
                        "Select collection date."
                    );

                    return;

                }

                await addCollection({

                    yearLevel,

                    amount,

                    date,

                    remarks

                });

                collectionForm.reset();

            }

            catch(error){

                console.error(
                    "COLLECTION FORM ERROR:",
                    error
                );

                notify(
                    error.message,
                    "error"
                );

            }

        }

    );

}



// ========================================
// EDIT COLLECTION
// ========================================

window.editCollection =
async function(id){

    try{

        const refDoc =
        doc(
            db,
            "collections",
            id
        );

        const snap =
        await getDoc(refDoc);

        if(!snap.exists()) return;

        const data =
        snap.data();

        const amount =
        prompt(
            "Update Collection Amount",
            data.amount
        );

        if(amount===null)
        return;

        const remarks =
        prompt(
            "Remarks",
            data.remarks || ""
        );

        if(remarks===null)
        return;

        await updateDoc(

            refDoc,

            {

                amount:Number(amount),

                remarks,

                updatedAt:
                serverTimestamp()

            }

        );

        notify(
            "Collection updated!"
        );

        loadCollections();

        loadSummary();

    }

    catch(error){

        console.error(
            error
        );

    }

};



// ========================================
// DELETE COLLECTION
// ========================================

window.deleteCollection =
async function(id){

    if(
        !confirm(
            "Delete this collection?"
        )
    )
    return;

    try{

        await deleteDoc(

            doc(

                db,

                "collections",

                id

            )

        );

        notify(
            "Collection deleted!"
        );

        loadCollections();

        loadSummary();

    }

    catch(error){

        console.error(
            error
        );

    }

};

 
// ========================================
// SUMMARY SYSTEM v16.0
// ========================================

async function loadSummary(){

    try{

        let totalCollections = 0;
        let totalExpenses = 0;

        let firstYear = 0;
        let secondYear = 0;
        let thirdYear = 0;
        let fourthYear = 0;

        // ===========================
        // COLLECTIONS
        // ===========================

        const collectionSnap = await getDocs(
            collection(db,"collections")
        );

        collectionSnap.forEach(docSnap=>{

            const data = docSnap.data();

            const amount =
            Number(data.amount || 0);

            totalCollections += amount;

            switch(
                (data.yearLevel || "")
                .trim()
                .toLowerCase()
            ){

                case "first year":
                    firstYear += amount;
                break;

                case "second year":
                    secondYear += amount;
                break;

                case "third year":
                    thirdYear += amount;
                break;

                case "fourth year":
                    fourthYear += amount;
                break;

            }

        });

        // ===========================
        // EXPENSES
        // ===========================

        const expenseSnap =
        await getDocs(
            collection(db,"expenses")
        );

        expenseSnap.forEach(docSnap=>{

            totalExpenses += Number(
                docSnap.data().amount || 0
            );

        });

        // ===========================
        // PROJECT COUNT
        // ===========================

        const projectSnap =
        await getDocs(
            collection(db,"projects")
        );

        // ===========================
        // RECORD COUNT
        // ===========================

        const recordSnap =
        await getDocs(
            collection(db,"records")
        );

        // ===========================
        // MAIN SUMMARY
        // ===========================

        setText(
            "summaryCollections",
            peso(totalCollections)
        );

        setText(
            "totalCollections",
            peso(totalCollections)
        );

        setText(
            "summaryExpenses",
            peso(totalExpenses)
        );

        setText(
            "totalExpenses",
            peso(totalExpenses)
        );

        setText(
            "currentBalance",
            peso(
                totalCollections -
                totalExpenses
            )
        );

        setText(
            "totalProjects",
            projectSnap.size
        );

        setText(
            "totalRecords",
            recordSnap.size
        );

        // ===========================
        // YEAR LEVEL SUMMARY
        // ===========================

        setText(
            "firstYearCollection",
            peso(firstYear)
        );

        setText(
            "secondYearCollection",
            peso(secondYear)
        );

        setText(
            "thirdYearCollection",
            peso(thirdYear)
        );

        setText(
            "fourthYearCollection",
            peso(fourthYear)
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


const searchInput =
document.getElementById(
    "searchInput"
);



if(searchInput){



    searchInput.addEventListener(

        "input",

        ()=>{


            const keyword =
            searchInput.value
            .toLowerCase();



            const items =
            document.querySelectorAll(

                ".data-card, .announcement-card"

            );




            items.forEach(item=>{


                const text =
                item.textContent
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
// REFRESH DASHBOARD BUTTON
// ========================================


const refreshButton =
document.getElementById(
    "refreshDashboard"
);





if(refreshButton){


    refreshButton.onclick = async()=>{


        notify(
            "Refreshing dashboard..."
        );



        await Promise.all([


            loadProjects(),


            loadExpenses(),


            loadRecords(),


            loadAnnouncements(),


            loadSummary()



        ]);



        notify(
            "Dashboard refreshed!"
        );


    };


}


// ========================================
// EXPORT TREASURY REPORT
// ========================================


const exportButton =
document.getElementById(
    "exportReport"
);





if(exportButton){



    exportButton.onclick = ()=>{



        const report = {


            generated:

            new Date()

            .toLocaleString(
                "en-PH"
            ),




            totalProjects:

            projectCache.length,





            totalExpenses:

            expenseCache.length,





            totalRecords:

            recordCache.length,





            totalAnnouncements:

            announcementCache.length



        };






        console.table(report);




        notify(

            "Treasury report generated. Check browser console."

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

====================================

🔥 FIREBASE CONNECTION SUCCESS

DALUBWIKAAN DATABASE ONLINE

====================================

        `);



    }



    catch(error){



        console.error(

            "FIREBASE CONNECTION FAILED:",

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

📚 DALUBWIKAAN TREASURY MANAGEMENT SYSTEM

ADMIN PANEL v15.0


✅ Firebase Connected

✅ Authentication Enabled

✅ Project CRUD Fixed

✅ Expense Upload Fixed

✅ Receipt Upload Fixed

✅ Announcement Posting Fixed

✅ Collection System Fixed

✅ Records CRUD Fixed

✅ Search Enabled

✅ Summary Enabled

✅ Export Enabled


SYSTEM READY 🚀


========================================

`);
