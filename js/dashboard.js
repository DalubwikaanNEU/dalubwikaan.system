// =================================
// DALUBWIKAAN TREASURY DASHBOARD
// FIREBASE REAL-TIME VERSION
// =================================


import { db } from "./firebase.js";



import {

collection,
onSnapshot

}

from

"https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";







// ===============================
// LOAD COLLECTIONS REAL TIME
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



table.innerHTML="";






snapshot.forEach((doc)=>{


let data = doc.data();




totalFunds += Number(data.amount);





if(yearTotals[data.year] !== undefined){

yearTotals[data.year] += Number(data.amount);

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
₱${Number(data.amount).toLocaleString()}
</td>


<td class="paid">
Completed
</td>


</tr>

`;



});






// UPDATE TOTAL FUNDS


document
.getElementById("totalFunds")
.innerHTML =

"₱"+totalFunds.toLocaleString();







// UPDATE YEAR LEVELS


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






// UPDATE PROGRESS BAR


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




calculateBalance(totalFunds);



}


);


}









// ===============================
// LOAD PROJECTS REAL TIME
// ===============================



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




expenses += Number(data.budget);





table.innerHTML += `

<tr>


<td>

${data.name}

</td>



<td>

₱${Number(data.budget).toLocaleString()}

</td>



<td>

${data.description}

</td>


</tr>

`;



});





document
.getElementById("totalExpenses")
.innerHTML =

"₱"+expenses.toLocaleString();






// SAVE EXPENSE VALUE

window.currentExpenses = expenses;



calculateBalance();





}


);


}









// ===============================
// COMPUTE BALANCE
// ===============================



function calculateBalance(totalFunds){



let funds =
totalFunds || 0;



let expenses =
window.currentExpenses || 0;



let remaining =
funds - expenses;





document
.getElementById("remainingBalance")
.innerHTML =

"₱"+remaining.toLocaleString();



}









// ===============================
// MEMBER COUNT
// ===============================

// Temporary muna
// papalitan natin kapag may members collection na


document
.getElementById("totalMembers")
.innerHTML = "150";









// START SYSTEM


loadCollections();

loadProjects();
