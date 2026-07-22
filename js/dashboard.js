// =================================
// DALUBWIKAAN TREASURY DASHBOARD
// FIREBASE REAL-TIME + ANALYTICS + PDF
// =================================


import { db } from "./firebase.js";


import {

collection,
onSnapshot

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
// COLLECTIONS
// ===============================


function loadCollections(){



onSnapshot(

collection(db,"collections"),



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
document.getElementById("transactionTable");



if(table){

table.innerHTML="";

}







let records=[];



snapshot.forEach((doc)=>{


let data = doc.data();



records.push(data);



});




// latest first

records.sort((a,b)=>{


return new Date(b.date)-new Date(a.date);


});






records.forEach((data)=>{



let amount =
Number(data.amount)||0;




totalFunds += amount;





if(yearTotals[data.year] !== undefined){

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

₱${amount.toLocaleString()}

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






// UPDATE DASHBOARD


setText(

"totalFunds",

"₱"+totalFunds.toLocaleString()

);




setText(

"firstYear",

"₱"+yearTotals["First Year"].toLocaleString()

);



setText(

"secondYear",

"₱"+yearTotals["Second Year"].toLocaleString()

);



setText(

"thirdYear",

"₱"+yearTotals["Third Year"].toLocaleString()

);



setText(

"fourthYear",

"₱"+yearTotals["Fourth Year"].toLocaleString()

);





updateProgress(yearTotals);


createCollectionChart(yearTotals);



updateBalance();



hideLoader();



}



catch(error){

console.log(error);

}



}


);


}









// ===============================
// PROJECTS + EXPENSES
// ===============================


function loadProjects(){



onSnapshot(

collection(db,"projects"),



(snapshot)=>{


let expenses=0;



let table =
document.getElementById("projectTable");



if(table){

table.innerHTML="";

}




reportData.projects=[];





snapshot.forEach((doc)=>{


let data=doc.data();



let budget =
Number(data.budget)||0;



expenses += budget;



reportData.projects.push(data);






if(table){


table.innerHTML += `


<tr>


<td>

${data.name || "Unnamed Project"}

</td>



<td>

₱${budget.toLocaleString()}

</td>



<td>

${data.description || ""}

</td>



</tr>



`;

}



});






if(snapshot.empty && table){


table.innerHTML=`

<tr>

<td colspan="3">

No projects recorded.

</td>

</tr>

`;

}




window.currentExpenses =
expenses;



reportData.expenses =
expenses;




setText(

"totalExpenses",

"₱"+expenses.toLocaleString()

);



updateBalance();


updateBudgetChart();


}


);


}









// ===============================
// EXPENSE RECEIPTS
// ===============================


function loadExpenses(){


onSnapshot(

collection(db,"expenses"),



(snapshot)=>{


let container =
document.getElementById("expenseTable");



if(!container)return;




container.innerHTML="";




snapshot.forEach((doc)=>{


let data=doc.data();



container.innerHTML += `


<tr>


<td>

${data.project}

</td>



<td>

₱${Number(data.amount).toLocaleString()}

</td>



<td>

<a href="${data.receipt}" target="_blank">

View Receipt

</a>

</td>



</tr>



`;



});



}


);



}









// ===============================
// BALANCE
// ===============================


function updateBalance(){



let balance =

window.totalFunds -

window.currentExpenses;



reportData.remaining =
balance;



setText(

"remainingBalance",

"₱"+balance.toLocaleString()

);



}









// ===============================
// SAFE TEXT UPDATE
// ===============================


function setText(id,value){


let el =
document.getElementById(id);



if(el){

el.innerHTML=value;

}


}









// ===============================
// PROGRESS
// ===============================


function updateProgress(data){



let max=Math.max(

data["First Year"],

data["Second Year"],

data["Third Year"],

data["Fourth Year"]

);



if(max===0)return;




document.getElementById("firstProgress").style.width=

(data["First Year"]/max*100)+"%";



document.getElementById("secondProgress").style.width=

(data["Second Year"]/max*100)+"%";



document.getElementById("thirdProgress").style.width=

(data["Third Year"]/max*100)+"%";



document.getElementById("fourthProgress").style.width=

(data["Fourth Year"]/max*100)+"%";


}









// ===============================
// COLLECTION CHART
// ===============================


function createCollectionChart(data){


let canvas =
document.getElementById("collectionChart");



if(!canvas)return;



if(collectionChart){

collectionChart.destroy();

}





collectionChart=new Chart(canvas,{


type:"bar",


data:{


labels:Object.keys(data),



datasets:[{


label:"Collected Funds",


data:Object.values(data)


}]


},



options:{


responsive:true

}



});


}









// ===============================
// PIE CHART
// ===============================


function updateBudgetChart(){



let canvas =
document.getElementById("budgetChart");



if(!canvas)return;



if(budgetChart){

budgetChart.destroy();

}





budgetChart=new Chart(canvas,{


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

window.totalFunds-window.currentExpenses,

0

)

]


}]


},



options:{


responsive:true


}



});



}









// ===============================
// PDF REPORT
// ===============================


let button =
document.getElementById("generateReport");



if(button){


button.onclick=()=>{



const {

jsPDF

}=window.jspdf;




let doc=new jsPDF();



let y=20;



doc.setFontSize(18);


doc.text(

"DALUBWIKAAN TREASURY REPORT",

20,

y

);



y+=15;



doc.setFontSize(12);



doc.text(

"Academic Year 2026-2027",

20,

y

);



y+=15;



doc.text(

"Generated: "+
new Date().toLocaleDateString(),

20,

y

);




y+=20;



doc.text(

"Total Funds: ₱"+
reportData.funds.toLocaleString(),

20,

y

);



y+=10;



doc.text(

"Expenses: ₱"+
reportData.expenses.toLocaleString(),

20,

y

);



y+=10;



doc.text(

"Balance: ₱"+
reportData.remaining.toLocaleString(),

20,

y

);




y+=20;



doc.text(

"Projects:",

20,

y

);



y+=10;




reportData.projects.forEach(project=>{


doc.text(

project.name+
" - ₱"+
Number(project.budget).toLocaleString(),

20,

y

);


y+=10;



});





doc.save(

"Dalubwikaan_Treasury_Report.pdf"

);



};


}









// ===============================
// LOADING
// ===============================


function hideLoader(){


let loader =
document.getElementById("loader");


if(loader){

loader.style.display="none";

}


}









// ===============================
// START
// ===============================


loadCollections();


loadProjects();


loadExpenses();
