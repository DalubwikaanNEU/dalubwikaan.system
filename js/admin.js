// =================================
// DALUBWIKAAN ADMIN PANEL
// =================================



let records = [];




// COLLECTION FORM


document
.getElementById("collectionForm")
.addEventListener("submit",function(e){


e.preventDefault();



let year =
document.getElementById("yearLevel").value;



let amount =
document.getElementById("amount").value;



let date =
document.getElementById("date").value;



records.push({

type:"Collection",

details:
year + " Collection ("+date+")",

amount:"₱"+Number(amount).toLocaleString()

});



displayRecords();



this.reset();



});







// PROJECT FORM


document
.getElementById("projectForm")
.addEventListener("submit",function(e){


e.preventDefault();



let project =
document.getElementById("projectName").value;


let budget =
document.getElementById("projectBudget").value;


let description =
document.getElementById("description").value;



records.push({

type:"Project",

details:
project+" - "+description,

amount:
"₱"+Number(budget).toLocaleString()


});



displayRecords();



this.reset();


});








// DISPLAY DATA


function displayRecords(){


let table =
document.getElementById("records");


table.innerHTML="";



records.forEach(item=>{


table.innerHTML += `

<tr>

<td>
${item.type}
</td>


<td>
${item.details}
</td>


<td>
${item.amount}
</td>


</tr>

`;


});


}
