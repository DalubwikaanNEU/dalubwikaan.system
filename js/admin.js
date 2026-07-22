// ========================================
// DALUBWIKAAN TREASURY MANAGEMENT SYSTEM
// ADMIN PANEL v10.0
// COMPLETE FIREBASE CRUD
// ANNOUNCEMENT FIXED
// EDIT + DELETE ENABLED
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
// LOADING SCREEN
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

        await getDoc(adminRef);







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
// DASHBOARD START
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

================================

DALUBWIKAAN TREASURY ADMIN v10.0

SYSTEM ONLINE

ANNOUNCEMENT FIX ENABLED

EDIT DELETE ENABLED

================================

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
// ERROR HANDLING
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
// ANNOUNCEMENT MANAGEMENT SYSTEM
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


postedBy:

currentUser?.email || "Admin",


type:"Announcement",


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

"Announcement Submit Error:",

error

);





if(error.code==="permission-denied"){



notify(

"Firestore permission denied. Check your Firestore Rules.",

"error"

);



}

else{



notify(

"Failed posting announcement.",

"error"

);



}




}



});


}









// ========================================
// LOAD ANNOUNCEMENTS
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








container.innerHTML="";








if(snapshot.empty){


container.innerHTML=`

<div class="empty-state">


<p>

📢 No announcements yet.

</p>


</div>

`;

return;


}








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

${data.postedBy || "Admin"}

</small>



<br>



<button

class="edit-btn"

onclick="editAnnouncement('${docSnap.id}')"

>

✏️ Edit

</button>




<button

class="delete-btn"

onclick="deleteAnnouncement('${docSnap.id}')"

>

🗑 Delete

</button>



</div>


`;



});






}



catch(error){



console.error(

"Load Announcement Error:",

error

);




container.innerHTML=`

<div class="empty-state">

❌ Failed loading announcements.

</div>

`;



}



}









// ========================================
// DELETE ANNOUNCEMENT
// ========================================


window.deleteAnnouncement = async function(id){



const confirmDelete = confirm(

"Delete this announcement?"

);





if(!confirmDelete)

return;






try{



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






await loadAnnouncements();



}



catch(error){


console.error(

"Delete Announcement Error:",

error

);



notify(

"Failed deleting announcement.",

"error"

);



}



};









// ========================================
// EDIT ANNOUNCEMENT
// ========================================


window.editAnnouncement = async function(id){



try{



const announcementRef =

doc(

db,

"announcements",

id

);






const snapshot =

await getDoc(

announcementRef

);







if(!snapshot.exists()){



notify(

"Announcement not found.",

"error"

);



return;


}







const data = snapshot.data();








const newTitle = prompt(

"📢 Update announcement title:",

data.title

);







if(newTitle===null)

return;









const newMessage = prompt(

"📝 Update announcement message:",

data.message

);






if(newMessage===null)

return;








await updateDoc(

announcementRef,

{


title:newTitle,


message:newMessage,


updatedAt:

serverTimestamp()



}

);







notify(

"Announcement updated successfully."

);







await loadAnnouncements();



}



catch(error){



console.error(

"Edit Announcement Error:",

error

);




notify(

"Failed updating announcement.",

"error"

);



}



};









// ========================================
// ANNOUNCEMENT STYLE
// ========================================


const announcementStyle =

document.createElement(

"style"

);




announcementStyle.innerHTML = `



.announcement-card{


background:white;

padding:20px;

border-radius:15px;

margin-bottom:15px;

box-shadow:

0 5px 15px rgba(0,0,0,.08);

}



.announcement-card h3{


margin-bottom:10px;


}



.announcement-card small{


opacity:.7;


}



`;



document.head.appendChild(

announcementStyle

);





// ========================================
// FIRESTORE PERMISSION CHECK
// ========================================


async function checkAnnouncementPermission(){



try{



await getDocs(

collection(

db,

"announcements"

)

);




console.log(

"Announcement collection accessible."

);



}



catch(error){



console.error(

"Announcement Permission Error:",

error

);



if(error.code==="permission-denied"){


console.warn(

`

Firestore Rules blocked announcements.

Allow read/write access for authenticated admins.

`

);


}



}



}
// ========================================
// ANNOUNCEMENT MANAGEMENT
// ADD + EDIT + DELETE SYSTEM
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


author:

currentUser?.email || "Admin",


createdAt:

serverTimestamp(),


type:"Announcement"


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

"Announcement Save Error:",

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






container.innerHTML="";








if(snapshot.empty){



container.innerHTML=`

<div class="empty-state">


<p>

📢 No announcements yet.

</p>


</div>

`;



return;


}







snapshot.forEach(docSnap=>{


const data = docSnap.data();





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





<div class="announcement-actions">





<button

class="edit-btn"

onclick="editAnnouncement('${docSnap.id}')"

>


✏️ Edit

</button>






<button

class="delete-btn"

onclick="deleteAnnouncement('${docSnap.id}')"

>


🗑 Delete

</button>




</div>






</div>



`;



});






}



catch(error){


console.error(

"Announcement Loading Error:",

error

);



container.innerHTML=`

<p>

❌ Failed loading announcements.

</p>

`;



}



}











// ========================================
// DELETE ANNOUNCEMENT
// ========================================


window.deleteAnnouncement = async function(id){



const confirmDelete =

confirm(

"Delete this announcement?"

);






if(!confirmDelete)

return;








try{



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






await loadAnnouncements();



}



catch(error){



console.error(

"Delete Announcement Error:",

error

);



notify(

"Unable to delete announcement.",

"error"

);



}



};









// ========================================
// EDIT ANNOUNCEMENT
// ========================================


window.editAnnouncement = async function(id){



try{



const announcementRef =

doc(

db,

"announcements",

id

);







const snapshot =

await getDoc(

announcementRef

);






if(!snapshot.exists()){


notify(

"Announcement not found.",

"error"

);


return;


}








const data = snapshot.data();







const newTitle =

prompt(

"Update announcement title:",

data.title

);






if(newTitle===null)

return;








const newMessage =

prompt(

"Update announcement message:",

data.message

);






if(newMessage===null)

return;









await updateDoc(

announcementRef,

{


title:newTitle,


message:newMessage,


updatedAt:

serverTimestamp()


}

);






notify(

"Announcement updated successfully."

);






await loadAnnouncements();



}



catch(error){



console.error(

"Edit Announcement Error:",

error

);



notify(

"Failed updating announcement.",

"error"

);



}



};









// ========================================
// ANNOUNCEMENT BUTTON STYLE
// ========================================


const announcementStyle =

document.createElement("style");



announcementStyle.innerHTML = `



.announcement-card{


background:rgba(255,255,255,.08);

padding:20px;

border-radius:15px;

margin-bottom:15px;

}



.announcement-actions{


margin-top:15px;

display:flex;

gap:10px;

}



`;



document.head.appendChild(

announcementStyle

);
// ========================================
// ANNOUNCEMENT MANAGEMENT SYSTEM
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


author:

currentUser?.email || "Administrator",


createdAt:

serverTimestamp()



}


);







notify(

"Announcement published successfully."

);






announcementForm.reset();







await loadAnnouncements();



}



catch(error){



console.error(

"Announcement Publish Error:",

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
// DELETE ANNOUNCEMENT
// ========================================


window.deleteAnnouncement = async function(id){



const confirmDelete = confirm(

"Delete this announcement?"

);




if(!confirmDelete)

return;





try{



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






await loadAnnouncements();



}

catch(error){


console.error(

error

);


notify(

"Failed deleting announcement.",

"error"

);


}



};









// ========================================
// UPDATED LOAD ANNOUNCEMENTS
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






container.innerHTML="";






if(snapshot.empty){


container.innerHTML=

`

<div class="empty-state">

📢 No announcements yet.

</div>

`;


return;


}









snapshot.forEach(docSnap=>{



const data = docSnap.data();





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





<button

class="delete-btn"

onclick="deleteAnnouncement('${docSnap.id}')"

>

🗑 Delete

</button>




</div>



`;




});





}

catch(error){


console.error(

"Announcement Loading Error:",

error

);



notify(

"Unable to load announcements.",

"error"

);


}



}









// ========================================
// EXPORT REPORT PLACEHOLDER
// ========================================


const exportButton =

document.getElementById(

"exportReport"

);





if(exportButton){


exportButton.onclick=()=>{


alert(

"📄 Treasury report export will be generated soon."

);


};


}









console.log(`


=================================

DALUBWIKAAN ANNOUNCEMENT SYSTEM

✓ Create Announcement

✓ View Announcement

✓ Delete Announcement

✓ Firebase Connected


SYSTEM READY 🚀

=================================


`);
