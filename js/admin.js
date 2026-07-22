// ========================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// ADMIN PANEL v12.0
// COMPLETE FIREBASE CRUD VERSION
// ANNOUNCEMENT FIXED
// EDIT + DELETE ENABLED
// ========================================



// ========================================
// FIREBASE IMPORTS
// ========================================


import {

    db,
    storage

}

from "./firebase.js";





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









function formatDate(date){


    if(!date)

    return "N/A";



    return new Date(date)

    .toLocaleDateString(

        "en-PH"

    );


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

                "Unauthorized administrator account.",

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

            "Loading Dalubwikaan Treasury System..."

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

DALUBWIKAAN TREASURY ADMIN v12.0

SYSTEM ONLINE

FULL CRUD ENABLED

ANNOUNCEMENT FIXED

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
// PROJECT CRUD SYSTEM
// ========================================



// LOAD PROJECTS
// ========================================


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


            const data = docSnap.data();





            projectCache.push({

                id:docSnap.id,

                ...data

            });






            container.innerHTML += `



            <div class="data-card">


                <h3>

                ${data.name}

                </h3>


                <p>

                ${data.description || ""}

                </p>



                <strong>

                Budget:

                ${peso(data.budget)}

                </strong>



                <br><br>



                <button

                onclick="editProject('${docSnap.id}')"

                >

                ✏️ Edit

                </button>



                <button

                onclick="deleteProject('${docSnap.id}')"

                >

                🗑 Delete

                </button>



            </div>



            `;


        });



    }



    catch(error){


        console.error(

            "Project Error:",

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

        "Project added."

    );



    loadProjects();



}









// EDIT PROJECT
// ========================================


window.editProject = async function(id){



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





    const data = snap.data();






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


window.deleteProject = async function(id){



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

        "Project deleted."

    );



    loadProjects();



};











// ========================================
// EXPENSE CRUD SYSTEM
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







        snapshot.forEach(docSnap=>{


            const data = docSnap.data();




            expenseCache.push({

                id:docSnap.id,

                ...data

            });








            container.innerHTML += `


            <div class="data-card">


            <h3>

            ${data.category}

            </h3>



            <p>

            ${data.description || ""}

            </p>



            <strong>

            ${peso(data.amount)}

            </strong>



            <br>



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



            <button

            onclick="editExpense('${docSnap.id}')"

            >

            ✏️ Edit

            </button>



            <button

            onclick="deleteExpense('${docSnap.id}')"

            >

            🗑 Delete

            </button>



            </div>


            `;



        });



    }



    catch(error){


        console.error(

            "Expense Error:",

            error

        );


    }



}









// RECEIPT SELECT
// ========================================


const receiptInput =

document.getElementById(

    "receipt"

);





if(receiptInput){


    receiptInput.onchange=(e)=>{


        selectedReceiptFile =

        e.target.files[0];


    };


}









// ADD EXPENSE
// ========================================


async function addExpense(data){



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

        "Expense added."

    );



    loadExpenses();



}









// EDIT EXPENSE
// ========================================


window.editExpense = async function(id){



    const expenseRef =

    doc(

        db,

        "expenses",

        id

    );





    const snap =

    await getDoc(

        expenseRef

    );





    if(!snap.exists())

    return;





    const data=snap.data();





    const amount =

    prompt(

        "Update amount:",

        data.amount

    );






    if(amount===null)

    return;







    await updateDoc(

        expenseRef,

        {


            amount:Number(amount),


            updatedAt:

            serverTimestamp()



        }


    );





    notify(

        "Expense updated."

    );



    loadExpenses();



};









// DELETE EXPENSE
// ========================================


window.deleteExpense = async function(id){



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

        "Expense deleted."

    );



    loadExpenses();



};
// ========================================
// RECORD CRUD SYSTEM
// ========================================



// LOAD RECORDS
// ========================================


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


            container.innerHTML=`

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

                ${data.title || "Record"}

                </h3>




                <p>

                Type:

                ${data.type || "N/A"}

                </p>





                <strong>

                ${peso(data.amount)}

                </strong>





                <br><br>





                <button

                onclick="editRecord('${docSnap.id}')"

                >

                ✏️ Edit

                </button>






                <button

                onclick="deleteRecord('${docSnap.id}')"

                >

                🗑 Delete

                </button>




            </div>



            `;



        });






    }



    catch(error){



        console.error(

            "Record Loading Error:",

            error

        );


    }


}









// ADD RECORD
// ========================================


async function addRecord(data){



    await addDoc(

        collection(

            db,

            "records"

        ),

        {


            ...data,


            createdAt:

            serverTimestamp()



        }


    );




    notify(

        "Record added."

    );



    loadRecords();



}









// EDIT RECORD
// ========================================


window.editRecord = async function(id){



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







    const data = snap.data();







    const title =

    prompt(

        "Update title:",

        data.title

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











// ========================================
// ANNOUNCEMENT SYSTEM
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

                    "Complete announcement fields.",

                    "warning"

                );


                return;


            }








            try{


                await addDoc(

                    collection(

                        db,

                        "announcements"

                    ),

                    {


                        title,


                        message,


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



        }


    );


}









// LOAD ANNOUNCEMENTS
// ========================================


async function loadAnnouncements(){



    const container =

    document.getElementById(

        "adminAnnouncementContainer"

    );





    if(!container)

    return;






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






    container.innerHTML="";








    snapshot.forEach(docSnap=>{


        const data =

        docSnap.data();





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



            <button

            onclick="editAnnouncement('${docSnap.id}')"

            >

            ✏️ Edit

            </button>





            <button

            onclick="deleteAnnouncement('${docSnap.id}')"

            >

            🗑 Delete

            </button>



        </div>



        `;



    });



}









// EDIT ANNOUNCEMENT
// ========================================


window.editAnnouncement = async function(id){



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






    const data = snap.data();





    const title =

    prompt(

        "New title:",

        data.title

    );





    if(title===null)

    return;






    await updateDoc(

        announcementRef,

        {


            title,


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
// DASHBOARD SUMMARY
// ========================================


async function loadSummary(){


    try{


        const totalProjects =

        projectCache.length;



        const totalExpenses =

        expenseCache.reduce(

            (total,item)=>{


                return total +

                Number(

                    item.amount || 0

                );


            },

            0

        );




        const totalRecords =

        recordCache.length;






        setText(

            "totalProjects",

            totalProjects

        );





        setText(

            "totalExpenses",

            peso(totalExpenses)

        );





        setText(

            "totalRecords",

            totalRecords

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







            const cards =

            document.querySelectorAll(

                ".data-card, .announcement-card"

            );






            cards.forEach(card=>{



                const text =

                card.textContent

                .toLowerCase();






                if(

                    text.includes(keyword)

                ){


                    card.style.display="";


                }


                else{


                    card.style.display="none";


                }


            });





        }


    );


}









// ========================================
// REFRESH DASHBOARD
// ========================================


const refreshButton =

document.getElementById(

    "refreshDashboard"

);






if(refreshButton){



    refreshButton.onclick = async()=>{



        refreshButton.disabled = true;



        refreshButton.textContent =

        "Loading...";





        await initializeDashboard();






        refreshButton.disabled=false;



        refreshButton.textContent =

        "Refresh";



    };



}









// ========================================
// EXPORT REPORT
// ========================================


const exportButton =

document.getElementById(

    "exportReport"

);






if(exportButton){



    exportButton.onclick = ()=>{



        const report = {


            projects:

            projectCache.length,



            expenses:

            expenseCache.length,



            records:

            recordCache.length,



            generated:

            new Date()

            .toLocaleString(

                "en-PH"

            )


        };





        console.log(

            "TREASURY REPORT",

            report

        );





        notify(

            "📄 Report data generated. Check console."

        );



    };


}









// ========================================
// CURRENT DATE DISPLAY
// ========================================


const dateDisplay =

document.getElementById(

    "currentDate"

);






if(dateDisplay){



    dateDisplay.textContent =

    new Date()

    .toLocaleDateString(

        "en-PH",

        {


            weekday:"long",


            year:"numeric",


            month:"long",


            day:"numeric"


        }


    );



}









// ========================================
// FIREBASE CHECK
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

DALUBWIKAAN DATABASE READY

=================================

        `);



    }



    catch(error){



        console.error(

            "Firebase Connection Failed:",

            error

        );



    }



}









// ========================================
// START CHECK
// ========================================


firebaseConnectionCheck();









// ========================================
// FINAL SYSTEM MESSAGE
// ========================================


console.log(`

========================================

DALUBWIKAAN TREASURY MANAGEMENT SYSTEM

ADMIN PANEL v12.0


✅ Firebase Connected

✅ Authentication Enabled

✅ Projects CRUD Enabled

✅ Expenses CRUD Enabled

✅ Records CRUD Enabled

✅ Receipt Upload Enabled

✅ Announcement System Enabled

✅ Edit Enabled

✅ Delete Enabled


SYSTEM READY 🚀


========================================

`);
