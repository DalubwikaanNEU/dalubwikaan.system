// =================================
// DALUBWIKAAN PROJECT TRANSPARENCY
// =================================


import {db} from "./firebase.js";



import {


collection,
onSnapshot


}

from

"https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";








const container =
document.getElementById("projectContainer");





function loadProjects(){


onSnapshot(

collection(db,"projects"),

(projectSnapshot)=>{



container.innerHTML="";




projectSnapshot.forEach((doc)=>{


let project =
doc.data();



let card = document.createElement("div");



card.className="project-card";




card.innerHTML = `

<h2>

${project.name}

</h2>


<h3>

Budget:

₱${project.budget.toLocaleString()}

</h3>


<p>

${project.description}

</p>


<div class="status">

Completed

</div>


`;



container.appendChild(card);



});



}


);



}






loadProjects();
