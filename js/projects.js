// =================================
// DALUBWIKAAN PROJECT TRANSPARENCY
// VERSION 3.0
// PROJECT STATUS + BUDGET MONITORING
// FINANCIAL UTILIZATION TRACKER
// =================================


import { db } from "./firebase.js";


import {

collection,
onSnapshot,
getDocs,
query,
orderBy

}

from

"https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";




// =================================
// ELEMENT
// =================================


const container =

document.getElementById(
"projectContainer"
);




// =================================
// HELPERS
// =================================


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



const balance =

budget - spent;






if(balance < 0){


return `

<div class="danger-status">

🔴 Abonado:

${peso(
Math.abs(balance)
)}

</div>

`;



}






return `

<div class="success-status">

🟢 Remaining:

${peso(balance)}

</div>

`;



}









function calculateProgress(
budget,
spent
){


if(
budget <= 0
)

return 0;





let progress =

(spent / budget) * 100;






if(progress > 100)

progress = 100;






return Math.round(progress);



}









// =================================
// LOAD PROJECTS
// =================================


async function loadProjects(){



if(!container)

return;







try{



// ===============================
// LOAD EXPENSES
// ===============================


const expenseSnapshot =

await getDocs(

collection(
db,
"expenses"
)

);





let expenseMap = {};








expenseSnapshot.forEach(doc=>{



const expense =

doc.data();






const projectName =

expense.project;




if(!expenseMap[projectName]){


expenseMap[projectName]=0;


}






expenseMap[projectName]

+=

Number(
expense.amount || 0
);



});









// ===============================
// REAL TIME PROJECTS
// ===============================


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

(snapshot)=>{



container.innerHTML="";






if(snapshot.empty){



container.innerHTML=`

<div class="empty-state">

📂 No projects available.

</div>

`;



return;



}








snapshot.forEach(doc=>{



const project =

doc.data();







const name =

project.name ||

"Unnamed Project";







const budget =

Number(
project.budget || 0
);







const spent =

expenseMap[name]

||

0;







const remaining =

budget - spent;







const progress =

calculateProgress(
budget,
spent
);






const status =

project.status ||

"Planning";








const card =

document.createElement(
"div"
);





card.className=

"project-card";









card.innerHTML = `



<div class="project-header">


<h2>

${name}

</h2>



${statusBadge(status)}


</div>






<div class="budget-info">



<div>

<strong>
Allocated Budget
</strong>


<p>

${peso(budget)}

</p>

</div>





<div>

<strong>
Actual Expenses
</strong>


<p>

${peso(spent)}

</p>


</div>





${financialStatus(
budget,
spent
)}


</div>








<p class="description">

${project.description ||

"No project description available."

}

</p>







<div class="progress-section">



<p>

Financial Utilization:

<strong>

${progress}%

</strong>


</p>






<div class="progress-bar">


<div

class="progress-fill"

style="width:${progress}%">

</div>


</div>





<small>

${progress >= 100

?

"Budget fully utilized"

:

"Monitoring expenses..."

}

</small>



</div>






`;







container.appendChild(card);



});





}



);



}



catch(error){



console.error(

"Project Transparency Error:",

error

);





container.innerHTML = `


<div class="empty-state">

⚠ Unable to load projects.

</div>


`;



}



}









// =================================
// START SYSTEM
// =================================


loadProjects();






console.log(`

================================

DALUBWIKAAN PROJECT TRANSPARENCY v3.0


✓ Project Status

✓ Budget Monitoring

✓ Expense Tracking

✓ Progress Visualization

✓ Abonado Detection


SYSTEM READY

================================

`);
