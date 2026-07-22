// =================================
// DALUBWIKAAN TREASURY DASHBOARD
// FIREBASE REAL-TIME + ANALYTICS
// =================================


import { db } from "./firebase.js";


import {

collection,
onSnapshot

}

from

"https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";




// CHART VARIABLES

let collectionChart;

let budgetChart;



window.totalFunds = 0;

window.currentExpenses = 0;







// =================================
// LOAD COLLECTIONS REAL TIME
// =================================


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



table.innerHTML="";






snapshot.forEach((doc)=>{


let data = doc.data();



let amount =
Number(data.amount || 0);



totalFunds += amount;





if(yearTotals[data.year] !== undefined){


yearTotals[data.year] += amount;


}







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



});






window.totalFunds = totalFunds;






// UPDATE TOTAL FUNDS


document
.getElementById("totalFunds")
.innerHTML =

"₱"+totalFunds.toLocaleString();







// UPDATE YEAR LEVEL


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






// PROGRESS BAR


let max = Math.max(

yearTotals["First Year"],

yearTotals["Second Year"],

yearTotals["Third Year"],

yearTotals["Fourth Year"]

);




if(max > 0){



document
.getElementById("firstProgress")
.style.width =
(yearTotals["First Year"]/max*100)+"%";



document
.getElementById("secondProgress")
.style.width =
(yearTotals["Second Year"]/max*100)+"%";



document
.getElementById("thirdProgress")
.style.width =
(yearTotals["Third Year"]/max*100)+"%";



document
.getElementById("fourthProgress")
.style.width =
(yearTotals["Fourth Year"]/max*100)+"%";



}






updateCollectionChart(yearTotals);



calculateBalance();



updateBudgetChart();



}


);


}









// =================================
// LOAD PROJECTS REAL TIME
// =================================



function loadProjects(){



onSnapshot(

collection(db,"projects"),

(snapshot)=>{



let expenses = 0;



let table =
document.getElementById("projectTable");



table.innerHTML="";






snapshot.forEach((doc)=>{


let data = doc.data();



let budget =
Number(data.budget || 0);



expenses += budget;






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



});






window.currentExpenses = expenses;




document
.getElementById("totalExpenses")
.innerHTML =

"₱"+expenses.toLocaleString();






calculateBalance();



updateBudgetChart();



}



);


}









// =================================
// COMPUTE BALANCE
// =================================


function calculateBalance(){



let remaining =

window.totalFunds -

window.currentExpenses;





document
.getElementById("remainingBalance")
.innerHTML =

"₱"+remaining.toLocaleString();



}









// =================================
// BAR CHART
// =================================



function updateCollectionChart(data){



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


responsive:true,


plugins:{


legend:{


display:true


}


}



}



});



}









// =================================
// PIE CHART
// =================================



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

"Used Budget",

"Remaining Funds"

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


});



}









// =================================
// MEMBERS
// =================================


// Temporary value

document
.getElementById("totalMembers")
.innerHTML = "150";









// START DASHBOARD


loadCollections();


loadProjects();
