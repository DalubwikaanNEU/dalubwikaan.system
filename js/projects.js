// =================================
// DALUBWIKAAN PROJECT TRANSPARENCY
// PROJECT DASHBOARD
// VERSION 4.0 FINAL FIXED
// AUTOMATIC EXPENSE COMPUTATION
// =================================


// =================================
// FIREBASE IMPORT
// =================================

import { db } from "./firebase.js";


import {

    collection,
    getDocs,
    query,
    orderBy,
    onSnapshot

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
// FORMAT PESO
// =================================

function peso(value){

    return "₱" +

    Number(value || 0)

    .toLocaleString(
        "en-PH",
        {

            minimumFractionDigits:2,

            maximumFractionDigits:2

        }

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





// =================================
// CALCULATE UTILIZATION
// =================================

function calculateProgress(
    budget,
    spent
){


    if(!budget || budget <= 0){

        return 0;

    }


    let percent =

    (spent / budget) * 100;



    return Math.round(percent);


}





// =================================
// FINANCIAL STATUS
// =================================

function financialStatus(
    budget,
    spent
){


    const remaining =

    budget - spent;



    if(remaining < 0){


        return `

        <div class="danger-status">

        🔴 Over Budget:

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
// LOAD EXPENSE MAP
// =================================

async function getExpenseMap(){


    const expenseSnapshot =

    await getDocs(

        collection(
            db,
            "expenses"
        )

    );



    const expenseMap = {};




    expenseSnapshot.forEach(
        
        docSnap=>{


            const expense =

            docSnap.data();



            const projectName =

            expense.project;



            if(!projectName){

                return;

            }



            if(!expenseMap[projectName]){


                expenseMap[projectName] = 0;


            }



            expenseMap[projectName]

            +=

            Number(
                expense.amount || 0
            );


        }

    );



    return expenseMap;


}
// =================================
// LOAD PROJECTS
// REAL-TIME PROJECT MONITORING
// =================================


function loadProjects(){


    if(!container){

        console.warn(
            "Project container not found."
        );

        return;

    }





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

        async(snapshot)=>{


            try{


                container.innerHTML = "";



                if(snapshot.empty){


                    container.innerHTML = `

                    <div class="empty-state">

                    📂 No projects available.

                    </div>

                    `;


                    return;


                }





                // GET ALL EXPENSES

                const expenseMap =

                await getExpenseMap();






                snapshot.forEach(

                    docSnap=>{



                        const project =

                        docSnap.data();





                        const projectName =

                        project.name ||

                        "Unnamed Project";






                        const budget =

                        Number(
                            project.budget || 0
                        );







                        // MATCH EXPENSE USING PROJECT NAME

                        const actualExpense =

                        expenseMap[projectName]

                        ||

                        0;






                        const remaining =

                        budget - actualExpense;







                        const progress =

                        calculateProgress(

                            budget,

                            actualExpense

                        );








                        const card =

                        document.createElement(
                            "div"
                        );





                        card.className =

                        "project-card";









                        card.innerHTML = `



                        <div class="project-header">


                            <h2>

                            🏗 ${projectName}

                            </h2>



                            ${

                            statusBadge(
                                project.status
                                ||
                                "Planning"
                            )

                            }


                        </div>






                        <div class="budget-info">



                            <div class="budget-item">


                                <h4>

                                Allocated Budget

                                </h4>


                                <p>

                                ${peso(budget)}

                                </p>


                            </div>







                            <div class="budget-item">


                                <h4>

                                Actual Expenses

                                </h4>


                                <p>

                                ${peso(actualExpense)}

                                </p>


                            </div>






                            <div class="budget-item">


                                <h4>

                                Balance

                                </h4>


                                <p>

                                ${peso(remaining)}

                                </p>


                            </div>



                        </div>






                        ${

                        financialStatus(

                            budget,

                            actualExpense

                        )

                        }








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


                            ${
                            
                            progress >= 100

                            ?

                            "Budget fully utilized"

                            :

                            "Monitoring expenses..."

                            }


                            </small>



                        </div>








                        <div class="description">


                        <p>

                        ${
                        
                        project.description

                        ||

                        "No project description."

                        }


                        </p>


                        </div>






                        `;








                        container.appendChild(card);



                    }

                );



            }

            catch(error){


                console.error(

                    "PROJECT DISPLAY ERROR:",

                    error

                );



                container.innerHTML = `


                <div class="empty-state">

                ⚠ Failed to load projects.

                </div>


                `;


            }



        }


    );



}
// =================================
// START PROJECT SYSTEM
// =================================


loadProjects();




// =================================
// OPTIONAL MANUAL REFRESH
// =================================

window.refreshProjects = function(){


    loadProjects();


    console.log(

        "Projects refreshed."

    );


};




// =================================
// SYSTEM READY LOG
// =================================


console.log(`


=================================

DALUBWIKAAN PROJECT TRANSPARENCY

VERSION 4.0 FINAL FIXED


✅ Projects Loading

✅ Expense Tracking Connected

✅ Actual Expense Computation

✅ Budget Monitoring

✅ Utilization Calculation


SYSTEM ONLINE

=================================


`);
