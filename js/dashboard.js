// =================================
// DALUBWIKAAN TREASURY DASHBOARD
// FIREBASE REAL-TIME + ANALYTICS + PDF
// POLISHED VERSION 3.0
// =================================


import { db } from "./firebase.js";


import {

collection,
onSnapshot,
query,
orderBy

}

from

"https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";





// ===============================
// VARIABLES
// ===============================


let collectionChart;

let budgetChart;



window.totalFunds = 0;

window.currentExpenses = 0;




let reportData = {


funds:0,

expenses:0,

remaining:0,

years:{},

projects:[]

};








// ===============================
// HELPER FUNCTION
// ===============================


function setText(id,value){


const el =
document.getElementById(id);



if(el){

el.textContent=value;

}


}






function peso(value){


return "₱" +

Number(value || 0)

.toLocaleString();


}









// ===============================
// COLLECTIONS
// ===============================


function loadCollections(){



const q = query(

collection(db,"collections"),

orderBy(
"createdAt",
"desc"
)

);




onSnapshot(

q,

(snapshot)=>{


try{


let totalFunds = 0;



let yearTotals = {


"First Year":0,

"Second Year":0,

"Third Year":0,

"Fourth Year":0


};





let table =
document.getElementById(
"transactionTable"
);



if(table){

table.innerHTML="";

}





let records=[];



snapshot.forEach((doc)=>{


records.push(
doc.data()
);


});







records.forEach((data)=>{



let amount =
Number(data.amount)||0;




totalFunds += amount;





if(
yearTotals[data.year]
!== undefined
){

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



<td class="paid">

Completed

</td>



</tr>


`;



}



});







if(records.length===0 && table){


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





updateProgress(yearTotals);


createCollectionChart(yearTotals);



updateBalance();



hideLoader();



}


catch(error){


console.error(
"Collection Error:",
error
);


}



}


);



}

// ===============================
// PROJECTS
// ===============================


function loadProjects(){


const q = query(

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

q,

(snapshot)=>{


let table =

document.getElementById(
"projectTable"
);



if(table){

table.innerHTML="";

}




reportData.projects=[];




snapshot.forEach(
(docSnap)=>{


const data =
docSnap.data();



const budget =

Number(
data.budget || 0
);




reportData.projects.push(data);






if(table){



table.innerHTML += `


<tr>


<td>

${data.name || "Unnamed Project"}

</td>



<td>

${peso(budget)}

</td>



<td>

${data.description || "No description"}

</td>



</tr>



`;



}



});







if(snapshot.empty && table){



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









// ===============================
// EXPENSE TRANSPARENCY
// RECEIPTS
// ===============================



function loadExpenses(){



const q = query(

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

q,

(snapshot)=>{



const container =

document.getElementById(
"expensePreview"
);





if(!container)

return;






container.innerHTML="";





let totalExpenses = 0;







snapshot.forEach(
(docSnap)=>{



const data =
docSnap.data();



const amount =

Number(
data.amount || 0
);



totalExpenses += amount;







let receiptHTML = "";





if(
data.receipt
){



receiptHTML = `


<div class="receipt-box">


<img

src="${data.receipt}"

alt="Receipt"

class="receipt-image"

>



<br>


<a

href="${data.receipt}"

target="_blank"

class="view-btn"

>

🧾 Open Receipt

</a>


</div>



`;



}

else{


receiptHTML = `


<p>

📄 No receipt uploaded.

</p>


`;



}







container.innerHTML += `


<div class="expense-card">


<h3>

💸 ${data.project || "Unnamed Expense"}

</h3>




<p>

<strong>
Amount:
</strong>

${peso(amount)}

</p>




<p>

${data.description || "No description"}

</p>





${receiptHTML}



</div>



`;




});






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




if(snapshot.empty){



container.innerHTML = `


<p>

No expense records available.

</p>


`;



}




}

);


}


// ===============================
// ANNOUNCEMENT BOARD
// ===============================



function loadAnnouncements(){



const container =

document.getElementById(
"announcementContainer"
);





if(!container)

return;







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








container.innerHTML = "";





snapshot.forEach(
(docSnap)=>{



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

${data.user || "Administrator"}

</small>



</div>



`;





});



}



);



}









// ===============================
// BALANCE
// ===============================



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



}









// ===============================
// PROGRESS BAR
// ===============================



function updateProgress(data){



const max = Math.max(


data["First Year"],


data["Second Year"],


data["Third Year"],


data["Fourth Year"]



);





if(max === 0)

return;






const progress = {


firstProgress:

data["First Year"],



secondProgress:

data["Second Year"],



thirdProgress:

data["Third Year"],



fourthProgress:

data["Fourth Year"]


};






Object.keys(progress)

.forEach(id=>{



const element =

document.getElementById(id);




if(element){



element.style.width =


(
progress[id]

/

max

*

100

)

+

"%";



}



});




}









// ===============================
// COLLECTION CHART
// ===============================



function createCollectionChart(data){



const canvas =

document.getElementById(
"collectionChart"
);





if(!canvas)

return;







if(collectionChart){


collectionChart.destroy();


}







collectionChart = new Chart(

canvas,

{


type:"bar",




data:{


labels:Object.keys(data),



datasets:[{


label:

"Collected Funds",



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









// ===============================
// BUDGET CHART
// ===============================



function updateBudgetChart(){



const canvas =

document.getElementById(
"budgetChart"
);





if(!canvas)

return;







if(budgetChart){


budgetChart.destroy();


}







budgetChart = new Chart(

canvas,

{


type:"doughnut",




data:{


labels:[

"Expenses",

"Remaining"

],




datasets:[{


data:[


window.currentExpenses,


Math.max(

window.totalFunds -

window.currentExpenses,

0

)


]


}]



},




options:{


responsive:true



}



}

);





}


// ===============================
// PDF TREASURY REPORT
// ===============================



const reportButton =

document.getElementById(
"generateReport"
);





if(reportButton){



reportButton.onclick = ()=>{



const {

jsPDF

}=window.jspdf;





const pdf =

new jsPDF();




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





y += 15;





pdf.text(

"Generated: "

+

new Date()

.toLocaleDateString(),

20,

y

);







y += 20;





pdf.text(

"Total Funds: "

+

peso(reportData.funds),

20,

y

);





y += 10;





pdf.text(

"Total Expenses: "

+

peso(reportData.expenses),

20,

y

);





y += 10;





pdf.text(

"Remaining Balance: "

+

peso(reportData.remaining),

20,

y

);







y += 20;





pdf.text(

"Projects:",

20,

y

);





y += 10;







reportData.projects.forEach(

(project)=>{



pdf.text(

`${project.name} - ${peso(project.budget)}`,

20,

y

);





y += 10;



});







pdf.save(

"Dalubwikaan_Treasury_Report.pdf"

);



};



}









// ===============================
// LOADER
// ===============================



function hideLoader(){



const loader =

document.getElementById(
"loader"
);





if(loader){



loader.style.display="none";


}



}









// ===============================
// THEME SYSTEM
// ===============================



const themeButton =

document.getElementById(
"themeToggle"
);





if(themeButton){



const saved =

localStorage.getItem(
"theme"
);





if(saved === "dark"){



document.body.classList.add(
"dark"
);



themeButton.textContent =
"☀";



}






themeButton.onclick = ()=>{



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









// ===============================
// SYSTEM START
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



}

);









// ===============================
// GLOBAL ERROR HANDLER
// ===============================



window.addEventListener(

"error",

(event)=>{



console.error(

"Dashboard Error:",

event.error

);



}

);





window.addEventListener(

"unhandledrejection",

(event)=>{



console.error(

"Promise Error:",

event.reason

);



}

);






console.log(`

=================================

DALUBWIKAAN TREASURY DASHBOARD

VERSION 3.0


✓ Firebase Realtime

✓ Announcement Board

✓ Expense Receipt Preview

✓ Analytics

✓ PDF Report

✓ Dark Mode


SYSTEM READY

=================================

`);
