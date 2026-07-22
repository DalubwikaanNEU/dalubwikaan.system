// =================================
// DALUBWIKAAN TREASURY DASHBOARD
// VERSION 4.0
// FIREBASE REAL-TIME
// PROJECT TRANSPARENCY
// BUDGET MONITORING
// ANNOUNCEMENT BOARD
// PDF REPORT
// =================================


import { db } from "./firebase.js";


import {

collection,
onSnapshot,
query,
orderBy,
getDocs

}

from

"https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";




// =================================
// VARIABLES
// =================================


let collectionChart;

let budgetChart;



window.totalFunds = 0;

window.currentExpenses = 0;



let projectExpenses = {};





let reportData = {


funds:0,


expenses:0,


remaining:0,


years:{},


projects:[]


};









// =================================
// HELPERS
// =================================


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
"en-PH"
);



}







function statusBadge(status){



switch(status){



case "Completed":

return `

<span class="status completed">

🟢 Completed

</span>

`;




case "Ongoing":

return `

<span class="status ongoing">

🔵 Ongoing

</span>

`;





default:

return `

<span class="status planning">

🟡 Planning

</span>

`;



}



}







function financialStatus(
budget,
spent
){



const difference =

budget - spent;





if(difference < 0){



return `

<span class="danger-status">

🔴 Abonado 

${peso(
Math.abs(difference)
)}

</span>

`;



}



return `

<span class="success-status">

🟢 Remaining

${peso(difference)}

</span>

`;



}









// =================================
// LOAD COLLECTIONS
// =================================


function loadCollections(){



const q = query(

collection(
db,
"collections"
),

orderBy(
"createdAt",
"desc"
)

);






onSnapshot(

q,

(snapshot)=>{



let totalFunds=0;



let yearTotals={



"First Year":0,


"Second Year":0,


"Third Year":0,


"Fourth Year":0



};







const table =

document.getElementById(
"transactionTable"
);







if(table){

table.innerHTML="";

}








snapshot.forEach((doc)=>{



const data =
doc.data();




const amount =

Number(
data.amount || 0
);





totalFunds += amount;






if(yearTotals[data.year]
!==undefined){



yearTotals[data.year]+=amount;



}







if(table){



table.innerHTML += `

<tr>

<td>

${data.date || "N/A"}

</td>


<td>

${data.year || "N/A"}

</td>


<td>

${peso(amount)}

</td>


<td>

<span class="verified">

✔ Recorded

</span>

</td>


</tr>

`;



}



});









if(snapshot.empty && table){



table.innerHTML=`

<tr>

<td colspan="4">

No collection records yet.

</td>

</tr>

`;



}








window.totalFunds =
totalFunds;



reportData.funds =
totalFunds;



reportData.years =
yearTotals;






setText(
"totalFunds",
peso(totalFunds)
);






setText(
"firstYear",
peso(yearTotals["First Year"])
);






setText(
"secondYear",
peso(yearTotals["Second Year"])
);






setText(
"thirdYear",
peso(yearTotals["Third Year"])
);






setText(
"fourthYear",
peso(yearTotals["Fourth Year"])
);







updateProgress(
yearTotals
);



createCollectionChart(
yearTotals
);



updateBalance();



hideLoader();




}



);



}
// =================================
// LOAD PROJECTS + EXPENSE MONITORING
// =================================


function loadProjects(){



const projectQuery = query(

collection(
db,
"projects"
),

orderBy(
"createdAt",
"desc"
)

);






onSnapshot(

projectQuery,

async(projectSnapshot)=>{



const table =

document.getElementById(
"projectTable"
);





if(table){

table.innerHTML="";

}






// ================================
// GET ALL EXPENSES
// ================================


const expenseSnapshot =

await getDocs(

collection(
db,
"expenses"
)

);





projectExpenses = {};






expenseSnapshot.forEach(
(expenseDoc)=>{



const expense =

expenseDoc.data();





const projectName =

expense.project;






if(!projectExpenses[projectName]){



projectExpenses[projectName]=0;



}







projectExpenses[projectName]

+=

Number(
expense.amount || 0
);



});








reportData.projects=[];







// ================================
// DISPLAY PROJECTS
// ================================


projectSnapshot.forEach(
(projectDoc)=>{



const data =

projectDoc.data();







const name =

data.name ||

"Unnamed Project";






const budget =

Number(
data.budget || 0
);







const spent =

projectExpenses[name]

||

0;






const remaining =

budget - spent;








// IMPORTANT
// READ REAL STATUS FROM FIRESTORE


const status =

data.status ||

"Planning";









reportData.projects.push({


name,


budget,


spent,


status,


description:

data.description || "",


remaining


});










if(table){



table.innerHTML += `


<tr>



<td>


<strong>

${name}

</strong>



<br><br>


${statusBadge(status)}



</td>







<td>



<strong>
Allocated Budget:
</strong>


<br>


${peso(budget)}



<br><br>



<strong>
Actual Expenses:
</strong>


<br>


${peso(spent)}



<br><br>



${financialStatus(
budget,
spent
)}



</td>







<td>


${data.description || 

"No project description."

}



</td>




</tr>


`;



}







});









if(projectSnapshot.empty && table){



table.innerHTML = `


<tr>

<td colspan="3">

No projects available.

</td>

</tr>


`;



}







updateBudgetChart();



}



);



}









// =================================
// LOAD EXPENSE TRANSPARENCY
// =================================


function loadExpenses(){



const expenseQuery = query(

collection(
db,
"expenses"
),

orderBy(
"createdAt",
"desc"
)

);







onSnapshot(

expenseQuery,

(snapshot)=>{





const container =

document.getElementById(
"expensePreview"
);






if(!container)return;







container.innerHTML="";







let totalExpenses = 0;








snapshot.forEach(
(expenseDoc)=>{



const data =

expenseDoc.data();





const amount =

Number(
data.amount || 0
);





totalExpenses += amount;









let receipt="";






if(data.receipt){



receipt = `


<div class="receipt-box">


<img

src="${data.receipt}"

class="receipt-image"

alt="Receipt"



>




<br>


<a

href="${data.receipt}"

target="_blank"

class="view-btn"

>

🧾 View Official Receipt

</a>


</div>



`;



}

else{



receipt = `


<p>

📄 No receipt attached.

</p>



`;



}









container.innerHTML += `


<div class="expense-card">


<h3>

💸 ${data.project || "Unknown Project"}

</h3>



<p>

<strong>
Amount:
</strong>


${peso(amount)}

</p>





<p>

${data.description || 
"No description provided."
}

</p>




${receipt}



</div>



`;




});









if(snapshot.empty){



container.innerHTML = `


<p>

No expense records available.

</p>


`;



}








window.currentExpenses =

totalExpenses;






reportData.expenses =

totalExpenses;








setText(

"totalExpenses",

peso(totalExpenses)

);







updateBalance();



updateBudgetChart();





}



);



}
// =================================
// ANNOUNCEMENT BOARD
// =================================


function loadAnnouncements(){



const container =

document.getElementById(
"announcementContainer"
);





if(!container)return;








const q = query(

collection(
db,
"announcements"
),

orderBy(
"createdAt",
"desc"
)

);








onSnapshot(

q,

(snapshot)=>{



if(snapshot.empty){



container.innerHTML = `


<div class="empty-state">


<p>

📢 No announcements yet.

</p>


</div>


`;



return;



}







container.innerHTML="";







snapshot.forEach(
(docSnap)=>{



const data =

docSnap.data();








container.innerHTML += `


<div class="announcement-card">


<h3>

📢 ${data.title || 
"Announcement"
}

</h3>





<p>

${data.message || ""}

</p>





<small>

Posted by:

${data.createdBy ||

data.user ||

"Administrator"
}


</small>





</div>



`;



});




}



);



}









// =================================
// BALANCE COMPUTATION
// =================================


function updateBalance(){



const balance =

window.totalFunds -

window.currentExpenses;







reportData.remaining =

balance;








setText(

"remainingBalance",

peso(balance)

);








// OPTIONAL ADMIN COMPATIBILITY


setText(

"currentBalance",

peso(balance)

);



}









// =================================
// YEAR PROGRESS BAR
// =================================


function updateProgress(data){



const max = Math.max(

data["First Year"],

data["Second Year"],

data["Third Year"],

data["Fourth Year"]

);







if(max===0)return;







const progressData = {



firstProgress:

data["First Year"],



secondProgress:

data["Second Year"],



thirdProgress:

data["Third Year"],



fourthProgress:

data["Fourth Year"]



};









Object.entries(progressData)

.forEach(

([id,value])=>{





const element =

document.getElementById(id);







if(element){



element.style.width =

(

value /

max *

100

)

+

"%";



}





}

);



}









// =================================
// COLLECTION ANALYTICS CHART
// =================================


function createCollectionChart(data){



const canvas =

document.getElementById(
"collectionChart"
);





if(!canvas)return;







if(collectionChart){



collectionChart.destroy();



}








collectionChart =

new Chart(

canvas,

{


type:"bar",




data:{


labels:Object.keys(data),




datasets:[{


label:

"Total Collections",



data:

Object.values(data)



}]



},




options:{



responsive:true



}



}

);



}









// =================================
// BUDGET STATUS CHART
// =================================


function updateBudgetChart(){



const canvas =

document.getElementById(
"budgetChart"
);







if(!canvas)return;








if(budgetChart){



budgetChart.destroy();



}








const remaining =

Math.max(

window.totalFunds -

window.currentExpenses,

0

);








budgetChart =

new Chart(

canvas,

{


type:"doughnut",





data:{



labels:[


"Expenses",


"Available Funds"


],





datasets:[{


data:[



window.currentExpenses,



remaining



]



}]



},




options:{



responsive:true



}



}

);



}









// =================================
// SEARCH PROJECT / EXPENSE DATA
// =================================


function enableSearch(){



const search =

document.getElementById(
"searchRecord"
);







if(!search)return;







search.addEventListener(
"input",
()=>{



const keyword =

search.value

.toLowerCase();








document

.querySelectorAll(
"#projectTable tr, #transactionTable tr"
)

.forEach(
(row)=>{





row.style.display =

row.innerText

.toLowerCase()

.includes(keyword)

?

""

:

"none";





}

);






});



}









// =================================
// PDF TREASURY REPORT
// =================================


function generatePDF(){



const button =

document.getElementById(
"generateReport"
);






if(!button)return;








button.onclick = ()=>{



const {

jsPDF

}=window.jspdf;







const pdf =

new jsPDF();







let y=20;








pdf.setFontSize(18);



pdf.text(

"DALUBWIKAAN TREASURY REPORT",

20,

y

);






y+=15;







pdf.setFontSize(12);






pdf.text(

"Academic Year 2026-2027",

20,

y

);







y+=15;








pdf.text(

"Generated: "

+

new Date()

.toLocaleDateString(),

20,

y

);






y+=20;







pdf.text(

"Financial Summary",

20,

y

);







y+=10;








pdf.text(

"Total Funds: "

+

peso(reportData.funds),

20,

y

);






y+=10;








pdf.text(

"Total Expenses: "

+

peso(reportData.expenses),

20,

y

);






y+=10;








pdf.text(

"Remaining Balance: "

+

peso(reportData.remaining),

20,

y

);







y+=20;







pdf.text(

"Project Transparency",

20,

y

);







y+=10;








reportData.projects.forEach(
(project)=>{





pdf.text(

`${project.name}

Status: ${project.status}

Budget: ${peso(project.budget)}

Spent: ${peso(project.spent)}`,

20,

y

);





y+=20;





});








pdf.save(

"Dalubwikaan_Transparency_Report.pdf"

);



};



}
// ===============================
// PDF TREASURY REPORT
// ===============================

const reportButton = document.getElementById("generateReport");


if(reportButton){

    reportButton.onclick = ()=>{


        const {
            jsPDF
        } = window.jspdf;



        const pdf = new jsPDF();


        let y = 20;



        pdf.setFontSize(18);


        pdf.text(
            "DALUBWIKAAN TREASURY REPORT",
            20,
            y
        );



        y += 15;



        pdf.setFontSize(12);


        pdf.text(
            "Academic Year 2026-2027",
            20,
            y
        );



        y += 10;



        pdf.text(
            "Generated: " + new Date().toLocaleDateString(),
            20,
            y
        );



        y += 20;



        pdf.text(
            "Financial Summary",
            20,
            y
        );



        y += 10;



        pdf.text(
            "Total Funds: " + peso(reportData.funds),
            20,
            y
        );



        y += 10;



        pdf.text(
            "Total Expenses: " + peso(reportData.expenses),
            20,
            y
        );



        y += 10;



        pdf.text(
            "Remaining Balance: " + peso(reportData.remaining),
            20,
            y
        );



        y += 20;



        pdf.text(
            "Project Transparency Report",
            20,
            y
        );



        y += 10;



        reportData.projects.forEach(project=>{


            pdf.text(

                `${project.name || "Unnamed"} - ${peso(project.budget)} - Status: ${project.status || "Planning"}`,

                20,

                y

            );


            y += 10;



            if(y > 270){

                pdf.addPage();

                y = 20;

            }


        });



        pdf.save(
            "Dalubwikaan_Treasury_Report.pdf"
        );


    };


}






// ===============================
// LOADER SYSTEM
// ===============================


function hideLoader(){


    const loader =
    document.getElementById("loader");



    if(loader){


        loader.style.opacity="0";


        setTimeout(()=>{


            loader.style.display="none";


        },500);


    }


}







// ===============================
// DARK / LIGHT MODE
// ===============================


const themeButton =
document.getElementById("themeToggle");



if(themeButton){


    const savedTheme =
    localStorage.getItem("theme") || "light";



    if(savedTheme==="dark"){

        document.body.classList.add("dark");

        themeButton.textContent="☀";


    }





    themeButton.onclick=()=>{


        document.body.classList.toggle("dark");



        const dark =
        document.body.classList.contains("dark");



        localStorage.setItem(

            "theme",

            dark ? "dark" : "light"

        );



        themeButton.textContent =
        dark ? "☀" : "🌙";



    };


}






// ===============================
// INITIALIZATION
// ===============================


window.addEventListener(
"load",
()=>{


    loadCollections();


    loadProjects();


    loadExpenses();


    loadAnnouncements();



    setTimeout(()=>{


        hideLoader();


    },800);



});








// ===============================
// AUTO REFRESH
// ===============================


setInterval(()=>{


    console.log(
        "Dalubwikaan Dashboard Sync..."
    );


},30000);








// ===============================
// ERROR HANDLING
// ===============================


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

        "Unhandled Promise:",
        event.reason

    );


});







console.log(`

========================================

DALUBWIKAAN TREASURY DASHBOARD v4.0

✓ Firebase Realtime Sync
✓ Announcement Board
✓ Project Transparency
✓ Expense Monitoring
✓ Receipt Preview
✓ Financial Analytics
✓ PDF Treasury Report
✓ Dark Mode

SYSTEM READY

========================================

`);
