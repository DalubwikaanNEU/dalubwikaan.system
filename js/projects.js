// =================================
// DALUBWIKAAN PROJECT TRANSPARENCY
// VERSION 2.0
// PROJECT STATUS + BUDGET PROGRESS
// =================================


import { db } from "./firebase.js";


import {

collection,
onSnapshot,
getDocs

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








function statusBadge(status){


if(status === "Completed"){


return `

<span class="status completed">

🟢 Completed

</span>

`;



}



if(status === "Ongoing"){


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









async function loadProjects(){



if(!container)return;






const expenseSnapshot =

await getDocs(

collection(
db,
"expenses"
)

);





let expenses = {};





expenseSnapshot.forEach(doc=>{


const data = doc.data();



if(!expenses[data.project]){


expenses[data.project]=0;


}





expenses[data.project]

+=

Number(
data.amount || 0
);



});









onSnapshot(

collection(
db,
"projects"
),

(snapshot)=>{



container.innerHTML="";







snapshot.forEach((doc)=>{



const project = doc.data();






const budget =

Number(
project.budget || 0
);






const spent =

expenses[project.name]

||

0;







let percentage =

(budget === 0)

?

0

:

(spent / budget) * 100;







if(percentage > 100){

percentage = 100;

}






const remaining =

budget - spent;






const status =

project.status ||

"Planning";









let financial;



if(remaining < 0){



financial = `

<p class="danger-status">

🔴 Abonado:

${peso(
Math.abs(remaining)
)}

</p>

`;



}

else{



financial = `

<p class="success-status">

🟢 Remaining:

${peso(remaining)}

</p>

`;



}









const card =

document.createElement(
"div"
);



card.className=

"project-card";







card.innerHTML = `


<h2>

${project.name}

</h2>





${statusBadge(status)}







<div class="budget-info">


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





${financial}


</div>







<p>

${project.description ||

"No project description available."

}

</p>








<div class="progress-container">


<div class="progress-bar">


<div 

class="progress-fill"

style="width:${percentage}%">

</div>


</div>




<small>

Budget Utilization:

${percentage.toFixed(0)}%

</small>


</div>






`;







container.appendChild(card);





});





if(snapshot.empty){



container.innerHTML = `

<div class="empty-state">

No projects available.

</div>

`;



}



}



);



}








loadProjects();
