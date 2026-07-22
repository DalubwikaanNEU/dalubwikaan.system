// =================================
// DALUBWIKAAN PROJECT TRANSPARENCY
// VERSION 2.0
// PROJECT STATUS + BUDGET MONITORING
// =================================


import {db} from "./firebase.js";


import {

collection,
onSnapshot,
getDocs,
query,
orderBy

}

from

"https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";





const container =

document.getElementById(
"projectContainer"
);







function peso(value){

return "₱" +

Number(value || 0)

.toLocaleString(
"en-PH"
);

}









// =================================
// STATUS BADGE
// =================================


function statusBadge(status){



if(status === "Completed"){


return `

<span class="status completed">

🟢 Completed

</span>

`;



}



else if(status === "Ongoing"){


return `

<span class="status ongoing">

🔵 Ongoing

</span>

`;



}




return `

<span class="status planning">

🟡 Planning

</span>

`;



}









// =================================
// FINANCIAL STATUS
// =================================


function budgetStatus(
budget,
spent
){



const remaining =

budget - spent;







if(remaining < 0){


return `


<div class="danger-status">


🔴 Abonado:

${peso(
Math.abs(remaining)
)}



</div>


`;



}






return `


<div class="success-status">


🟢 Remaining:

${peso(remaining)}



</div>


`;



}









// =================================
// LOAD PROJECTS
// =================================


function loadProjects(){



if(!container)return;






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



container.innerHTML="";







// GET EXPENSES

const expenseSnapshot =

await getDocs(

collection(
db,
"expenses"
)

);







let expenses = {};






expenseSnapshot.forEach(
(doc)=>{


const data =
doc.data();





if(!expenses[data.project]){


expenses[data.project]=0;


}






expenses[data.project]

+=

Number(
data.amount || 0
);



});









if(projectSnapshot.empty){



container.innerHTML = `


<div class="empty-state">


<p>

📂 No projects available.

</p>


</div>


`;



return;


}








projectSnapshot.forEach(
(doc)=>{



const project =
doc.data();







const budget =

Number(
project.budget || 0
);







const spent =

expenses[
project.name
]

||

0;







const status =

project.status ||

"Planning";






const card =

document.createElement(
"div"
);






card.className =
"project-card";







card.innerHTML = `



<div class="project-header">


<h2>

🏗 ${project.name || "Unnamed Project"}

</h2>



${statusBadge(status)}


</div>







<div class="project-info">



<p>

<strong>
Allocated Budget:
</strong>


<br>

${peso(budget)}

</p>






<p>

<strong>
Actual Expenses:
</strong>


<br>

${peso(spent)}

</p>





${budgetStatus(
budget,
spent
)}



</div>







<div class="project-description">


<p>

${project.description ||

"No project description provided."
}


</p>


</div>




`;








container.appendChild(card);



});






}



);



}









loadProjects();





console.log(`

================================

DALUBWIKAAN PROJECT REPORT v2.0

✓ Firebase Sync

✓ Project Status Tracking

✓ Budget Monitoring

✓ Expense Calculation

✓ Abonado Detection

✓ Transparency Ready

================================

`);
