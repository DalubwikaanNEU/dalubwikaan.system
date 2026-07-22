// =================================
// DALUBWIKAAN TREASURY DASHBOARD
// FIREBASE REAL-TIME + ANALYTICS + PDF REPORT
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

years:{}


};









// ===============================
// LOAD COLLECTIONS
// ===============================


function loadCollections(){


onSnapshot(

collection(db,"collections"),

(snapshot)=>{



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





snapshot.forEach((doc)=>{


let data = doc.data();



let amount =
Number(data.amount);



totalFunds += amount;





if(yearTotals[data.year]){

yearTotals[data.year]+=amount;

}






if(table){


table.innerHTML += `

<tr>

<td>
${data.date}
</td>


<td>
${data.year}
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







window.totalFunds = totalFunds;



reportData.funds = totalFunds;



reportData.years = yearTotals;






// UPDATE CARDS


document
.getElementById("totalFunds")
.innerHTML =

"₱"+totalFunds.toLocaleString();






// UPDATE YEAR CARDS


document
.getElementById("firstYear")
.innerHTML =

"₱"+yearTotals["First Year"].toLocaleString();




document
.getElementById("secondYear")
.innerHTML =

"₱"+yearTotals["Second Year"].toLocaleString();




document
.getElementById("thirdYear")
.innerHTML =

"₱"+yearTotals["Third Year"].toLocaleString();




document
.getElementById("fourthYear")
.innerHTML =

"₱"+yearTotals["Fourth Year"].toLocaleString();







updateProgress(yearTotals);




createCollectionChart(yearTotals);



updateBalance();



updateBudgetChart();



}


);


}









// ===============================
// LOAD PROJECT EXPENSES
// ===============================


function loadProjects(){


onSnapshot(

collection(db,"projects"),

(snapshot)=>{



let expenses = 0;



let table =
document.getElementById("projectTable");



if(table){

table.innerHTML="";

}





snapshot.forEach((doc)=>{


let data = doc.data();



let budget =
Number(data.budget);



expenses += budget;






if(table){


table.innerHTML += `

<tr>

<td>
${data.name}
</td>


<td>
₱${budget.toLocaleString()}
</td>


<td>
${data.description}
</td>


</tr>

`;

}


});





window.currentExpenses = expenses;



reportData.expenses = expenses;




document
.getElementById("totalExpenses")
.innerHTML =

"₱"+expenses.toLocaleString();





updateBalance();


updateBudgetChart();



}


);


}









// ===============================
// BALANCE CALCULATOR
// ===============================


function updateBalance(){


let balance =

window.totalFunds -
window.currentExpenses;



reportData.remaining = balance;




let element =
document.getElementById("remainingBalance");



if(element){


element.innerHTML =

"₱"+balance.toLocaleString();


}



}









// ===============================
// PROGRESS BAR
// ===============================


function updateProgress(data){



let max = Math.max(

data["First Year"],

data["Second Year"],

data["Third Year"],

data["Fourth Year"]

);



if(max===0) return;



document
.getElementById("firstProgress")
.style.width =

(data["First Year"]/max*100)+"%";




document
.getElementById("secondProgress")
.style.width =

(data["Second Year"]/max*100)+"%";




document
.getElementById("thirdProgress")
.style.width =

(data["Third Year"]/max*100)+"%";




document
.getElementById("fourthProgress")
.style.width =

(data["Fourth Year"]/max*100)+"%";


}









// ===============================
// COLLECTION BAR CHART
// ===============================


function createCollectionChart(data){



let canvas =
document.getElementById("collectionChart");



if(!canvas) return;



if(collectionChart){

collectionChart.destroy();

}





collectionChart = new Chart(canvas,{


type:"bar",



data:{


labels:[

"First Year",

"Second Year",

"Third Year",

"Fourth Year"

],



datasets:[{


label:"Collected Funds",


data:[

data["First Year"],

data["Second Year"],

data["Third Year"],

data["Fourth Year"]

]


}]


},



options:{


responsive:true


}



});



}









// ===============================
// BUDGET PIE CHART
// ===============================


function updateBudgetChart(){



let canvas =
document.getElementById("budgetChart");



if(!canvas) return;



if(budgetChart){

budgetChart.destroy();

}




budgetChart = new Chart(canvas,{


type:"pie",



data:{


labels:[

"Expenses",

"Remaining Balance"

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
// PDF REPORT GENERATOR
// ===============================


let button =
document.getElementById("generateReport");



if(button){


button.addEventListener("click",()=>{



const {

jsPDF

}

=
window.jspdf;



let doc =
new jsPDF();





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

"Remaining: ₱"+
reportData.remaining.toLocaleString(),

20,

y

);



y+=20;



doc.text(

"Collection Breakdown:",

20,

y

);



y+=10;



Object.keys(reportData.years)
.forEach(year=>{


doc.text(

year+
": ₱"+
reportData.years[year].toLocaleString(),

20,

y

);



y+=10;


});




doc.save(

"Dalubwikaan_Treasury_Report.pdf"

);



});


}









// ===============================
// START SYSTEM
// ===============================


loadCollections();

loadProjects();
