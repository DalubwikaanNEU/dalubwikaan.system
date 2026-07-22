// =================================
// DALUBWIKAAN TREASURY DASHBOARD
// FIREBASE LIVE VERSION
// =================================



import {db} from "./firebase.js";



import {


collection,
getDocs


}

from

"https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";







async function loadDashboard(){



let totalFunds = 0;

let totalExpenses = 0;



let yearTotals = {


"First Year":0,

"Second Year":0,

"Third Year":0,

"Fourth Year":0


};






// GET COLLECTIONS


let collectionSnapshot =
await getDocs(
collection(db,"collections")
);





collectionSnapshot.forEach((doc)=>{


let data = doc.data();



totalFunds += data.amount;



if(yearTotals[data.year] !== undefined){


yearTotals[data.year] += data.amount;


}


});









// GET PROJECT EXPENSES


let projectSnapshot =
await getDocs(
collection(db,"projects")
);



projectSnapshot.forEach((doc)=>{


let data = doc.data();



totalExpenses += data.budget;



});







// UPDATE CARDS



document
.getElementById("totalFunds")
.innerHTML =
"₱"+totalFunds.toLocaleString();





document
.getElementById("totalExpenses")
.innerHTML =
"₱"+totalExpenses.toLocaleString();





document
.getElementById("remainingBalance")
.innerHTML =

"₱"+
(totalFunds-totalExpenses)
.toLocaleString();






// TEMP MEMBER COUNT

document
.getElementById("totalMembers")
.innerHTML =
"150";






// UPDATE YEAR LEVEL



let years =
document.querySelectorAll(".year p");



years[0].innerHTML =
"₱"+yearTotals["First Year"].toLocaleString();



years[1].innerHTML =
"₱"+yearTotals["Second Year"].toLocaleString();



years[2].innerHTML =
"₱"+yearTotals["Third Year"].toLocaleString();



years[3].innerHTML =
"₱"+yearTotals["Fourth Year"].toLocaleString();





}





loadDashboard();
