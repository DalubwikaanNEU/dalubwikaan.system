// =================================
// DALUBWIKAAN TREASURY DASHBOARD
// VERSION 5.0 POLISHED
// FIREBASE REAL-TIME
// PROJECT TRANSPARENCY
// BUDGET MONITORING
// ANNOUNCEMENT BOARD
// PDF REPORT
// =================================


import { db } from "./firebase.js";


import {

    collection,
    onSnapshot,
    query,
    orderBy,
    getDocs

}

from

"https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";




// =================================
// VARIABLES
// =================================


let collectionChart = null;

let budgetChart = null;



window.totalFunds = 0;

window.currentExpenses = 0;




let projectExpenses = {};





let reportData = {


    funds:0,


    expenses:0,


    remaining:0,


    years:{},


    projects:[]


};









// =================================
// HELPERS
// =================================



function setText(id,value){


    const element =

    document.getElementById(id);



    if(element){

        element.textContent = value;

    }


}







function peso(value){


    return "₱" +

    Number(value || 0)

    .toLocaleString(
        "en-PH",
        {
            minimumFractionDigits:2
        }
    );


}









// =================================
// PROJECT STATUS BADGE
// =================================


function statusBadge(status){


    const currentStatus =

    String(status || "Planning")
    .trim();



    if(currentStatus === "Completed"){


        return `

        <span class="status completed">

        🟢 Completed

        </span>

        `;


    }



    if(currentStatus === "Ongoing"){


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

function financialStatus(statusText) {
    return statusText || "0% done";
}









// =================================
// LOAD COLLECTIONS
// =================================


function loadCollections(){



    const q = query(

        collection(
            db,
            "collections"
        ),

        orderBy(
            "createdAt",
            "desc"
        )

    );






    onSnapshot(

        q,

        (snapshot)=>{



            let totalFunds = 0;



            let yearTotals = {


                "First Year":0,


                "Second Year":0,


                "Third Year":0,


                "Fourth Year":0


            };







            const table =

            document.getElementById(
                "transactionTable"
            );






            if(table){

                table.innerHTML="";

            }









            snapshot.forEach((doc)=>{



                const data =

                doc.data();






                const amount =

                Number(
                    data.amount || 0
                );






                totalFunds += amount;







                if (data.yearLevel && yearTotals[data.yearLevel] !==undefined) {yearTotals[data.yearLevel] += amount; }



                    table.innerHTML += `


                    <tr>


                    <td>


                    ${data.date || "N/A"}
                    

                    </td>

                    <td>

                    ${data.yearLevel || "N/A"}
                    

                    </td>


                    




                    <td>

                    ${peso(amount)}

                    </td>
                    <td>
                      <span class="${data.status ? data.status.toLowercase() : 'pending'}">
                      ${data.status || "Recorded"}
                      </span>
                    </td>



                    </tr>


                    `;



                })








            if(snapshot.empty && table){



                table.innerHTML = `


                <tr>


                <td colspan="4">


                No collection records yet.


                </td>


                </tr>


                `;



            }








            window.totalFunds =

            totalFunds;







            reportData.funds =

            totalFunds;







            reportData.years =

            yearTotals;









            setText(

                "totalFunds",

                peso(totalFunds)

            );








            setText(

                "firstYear",

                peso(
                    yearTotals["First Year"]
                )

            );






            setText(

                "secondYear",

                peso(
                    yearTotals["Second Year"]
                )

            );






            setText(

                "thirdYear",

                peso(
                    yearTotals["Third Year"]
                )

            );






            setText(

                "fourthYear",

                peso(
                    yearTotals["Fourth Year"]
                )

            );







            updateProgress(
                yearTotals
            );







            createCollectionChart(
                yearTotals
            );







            updateBalance();






            hideLoader();



        }



    );



}

// =================================
// LOAD PROJECTS + BUDGET MONITORING
// PROJECT TRANSPARENCY SYSTEM
// =================================


function loadProjects(){


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



            const table =

            document.getElementById(
                "projectTable"
            );





            if(table){

                table.innerHTML="";

            }






            // =========================
            // LOAD EXPENSES
            // =========================


            const expenseSnapshot =

            await getDocs(

                collection(
                    db,
                    "expenses"
                )

            );





            projectExpenses = {};








            expenseSnapshot.forEach(
                (expenseDoc)=>{


                    const expense =

                    expenseDoc.data();




                    const projectName =

                    expense.project;






                    if(
                        !projectExpenses[projectName]
                    ){


                        projectExpenses[projectName]=0;


                    }







                    projectExpenses[projectName]

                    +=

                    Number(
                        expense.amount || 0
                    );




                }

            );









            reportData.projects=[];







            projectSnapshot.forEach(
                (projectDoc)=>{


                    const data =

                    projectDoc.data();








                    const name =

                    data.name ||

                    "Unnamed Project";








                    const budget =

                    Number(
                        data.budget || 0
                    );








                    const spent =
                        Number(data.actualExpenses) || 0;








                    const remaining =

                    budget - spent;








                    // =====================
                    // IMPORTANT STATUS FIX
                    // =====================


                    let status =

                    data.status;



                    if(!status){

                        status = "Planning";

                    }







                    const projectData = {


                        name,


                        budget,


                        spent,


                        remaining,


                        status,


                        description:

                        data.description || ""


                    };








                    reportData.projects.push(
                        projectData
                    );









                    if(table){



                        table.innerHTML += `



                        <tr>



                        <td>



                        <strong>

                        ${name}

                        </strong>



                        <br><br>



                        ${statusBadge(status)}



                        </td>








                        <td>



                        <strong>

                        Allocated Budget

                        </strong>


                        <br>


                        ${peso(budget)}





                        <br><br>





                        <strong>

                        Actual Expenses

                        </strong>


                        <br>


                        ${peso(spent)}







                        <br><br>





                        ${financialStatus(

                            data.utilizationStatus,

                        

                        )}





                        </td>









                        <td>



                        ${
                            data.description ||

                            "No project description."
                        }



                        </td>







                        </tr>



                        `;



                    }







                }

            );









            if(
                projectSnapshot.empty
                &&
                table
            ){



                table.innerHTML = `



                <tr>


                <td colspan="3">


                No projects available.


                </td>


                </tr>



                `;



            }







            updateBudgetChart();




        }



    );



}









// =================================
// LOAD EXPENSE TRANSPARENCY
// RECEIPT MONITORING
// =================================



function loadExpenses(){



    const expenseQuery = query(

        collection(
            db,
            "expenses"
        ),


        orderBy(
            "createdAt",
            "desc"
        )


    );








    onSnapshot(

        expenseQuery,

        (snapshot)=>{





            const container =

            document.getElementById(
                "expensePreview"
            );







            if(!container)

            return;








            container.innerHTML="";






            let totalExpenses = 0;









            snapshot.forEach(
                (expenseDoc)=>{



                    const data =

                    expenseDoc.data();







                    const amount =

                    Number(
                        data.amount || 0
                    );








                    totalExpenses += amount;









                    let receiptHTML = "";








                    if(data.receipt){



                        receiptHTML = `



                        <div class="receipt-box">



                        <img

                        src="${data.receipt}"

                        class="receipt-image"

                        alt="Official Receipt"


                        >





                        <br>



                        <a

                        href="${data.receipt}"

                        target="_blank"

                        class="view-btn"

                        >

                        🧾 View Receipt

                        </a>



                        </div>



                        `;



                    }

                    else{



                        receiptHTML = `


                        <p>


                        📄 No receipt uploaded.


                        </p>


                        `;



                    }









                    container.innerHTML += `



                    <div class="expense-card">



                    <h3>


                    💸 ${data.project || "Unknown Project"}


                    </h3>





                    <p>


                    <strong>

                    Amount:

                    </strong>


                    ${peso(amount)}



                    </p>








                    <p>


                    ${

                    data.description ||

                    "No description provided."

                    }


                    </p>







                    ${receiptHTML}





                    </div>



                    `;




                }

            );









            if(snapshot.empty){



                container.innerHTML = `


                <p>


                No expense records available.


                </p>


                `;



            }








            window.currentExpenses =

            totalExpenses;







            reportData.expenses =

            totalExpenses;








            setText(

                "totalExpenses",

                peso(totalExpenses)

            );







            updateBalance();







            updateBudgetChart();






        }



    );



}

// =================================
// ANNOUNCEMENT BOARD
// =================================


function loadAnnouncements(){


    const container =

    document.getElementById(
        "announcementContainer"
    );




    if(!container)

    return;







    const q = query(

        collection(
            db,
            "announcements"
        ),


        orderBy(
            "createdAt",
            "desc"
        )


    );









    onSnapshot(

        q,

        (snapshot)=>{



            if(snapshot.empty){



                container.innerHTML = `


                <div class="empty-state">


                <p>

                📢 No announcements yet.

                </p>


                </div>


                `;



                return;


            }







            container.innerHTML="";







            snapshot.forEach(
                (docSnap)=>{


                    const data =

                    docSnap.data();








                    container.innerHTML += `


                    <div class="announcement-card">



                    <h3>


                    📢 ${

                    data.title ||

                    "Announcement"

                    }


                    </h3>








                    <p>


                    ${

                    data.message ||

                    ""

                    }


                    </p>








                    <small>


                    Posted by:

                    ${

                    data.createdBy ||

                    data.user ||

                    "Administrator"

                    }



                    </small>



                    </div>



                    `;



                }

            );



        }



    );



}









// =================================
// BALANCE COMPUTATION
// WITH ABONADO DETECTION
// =================================


function updateBalance(){



    const balance =

    Number(
        window.totalFunds || 0
    )

    -

    Number(
        window.currentExpenses || 0
    );







    reportData.remaining =

    balance;







    const balanceElement =

    document.getElementById(
        "remainingBalance"
    );








    if(balanceElement){



        if(balance < 0){



            balanceElement.innerHTML = `



            🔴 Abonado

            <br>

            ${peso(
                Math.abs(balance)
            )}



            `;



            balanceElement.classList.add(
                "danger-status"
            );



        }

        else{



            balanceElement.innerHTML = `



            🟢 Remaining

            <br>

            ${peso(balance)}



            `;



            balanceElement.classList.remove(
                "danger-status"
            );



        }



    }







    setText(

        "currentBalance",

        peso(balance)

    );



}









// =================================
// YEAR COLLECTION PROGRESS
// =================================


function updateProgress(data){



    const max = Math.max(


        data["First Year"],


        data["Second Year"],


        data["Third Year"],


        data["Fourth Year"]



    );







    if(max === 0)

    return;








    const progressData = {



        firstProgress:

        data["First Year"],




        secondProgress:

        data["Second Year"],




        thirdProgress:

        data["Third Year"],




        fourthProgress:

        data["Fourth Year"]



    };









    Object.entries(progressData)

    .forEach(

        ([id,value])=>{





            const bar =

            document.getElementById(id);






            if(bar){



                bar.style.width =


                (

                    value /

                    max *

                    100

                )

                +

                "%";



            }



        }



    );



}









// =================================
// COLLECTION CHART
// =================================


function createCollectionChart(data){



    const canvas =

    document.getElementById(
        "collectionChart"
    );







    if(!canvas)

    return;







    if(collectionChart){



        collectionChart.destroy();



    }








    collectionChart =

    new Chart(

        canvas,

        {



        type:"bar",




        data:{


            labels:

            Object.keys(data),




            datasets:[{


                label:

                "Collected Funds",



                data:

                Object.values(data)



            }]



        },







        options:{


            responsive:true



        }



        }



    );



}









// =================================
// BUDGET MONITORING CHART
// SHOW REAL EXPENSES
// =================================


function updateBudgetChart(){



    const canvas =

    document.getElementById(
        "budgetChart"
    );







    if(!canvas)

    return;








    if(budgetChart){


        budgetChart.destroy();


    }









    const remaining =

    window.totalFunds -

    window.currentExpenses;







    budgetChart =

    new Chart(

        canvas,

        {



        type:"doughnut",





        data:{



            labels:[


            "Expenses",


            remaining < 0

            ?

            "Abonado"

            :

            "Remaining"



            ],






            datasets:[{


                data:[


                window.currentExpenses,


                Math.abs(
                    remaining
                )


                ]



            }]



        },








        options:{


            responsive:true



        }





        }



    );



}

// =================================
// PDF TREASURY REPORT
// PROJECT TRANSPARENCY VERSION
// =================================


function generatePDF(){


    const button =

    document.getElementById(
        "generateReport"
    );





    if(!button)

    return;








    button.onclick = ()=>{



        const {

            jsPDF

        } = window.jspdf;






        const pdf =

        new jsPDF();







        let y = 20;







        pdf.setFontSize(18);



        pdf.text(

            "DALUBWIKAAN TREASURY REPORT",

            20,

            y

        );







        y += 15;







        pdf.setFontSize(12);







        pdf.text(

            "Academic Year 2026-2027",

            20,

            y

        );







        y += 10;







        pdf.text(

            "Generated: "

            +

            new Date()

            .toLocaleDateString(),

            20,

            y

        );







        y += 20;







        pdf.text(

            "FINANCIAL SUMMARY",

            20,

            y

        );







        y += 10;








        pdf.text(

            "Total Funds: "

            +

            peso(
                reportData.funds
            ),

            20,

            y

        );







        y += 10;







        pdf.text(

            "Total Expenses: "

            +

            peso(
                reportData.expenses
            ),

            20,

            y

        );








        y += 10;







        pdf.text(

            "Balance: "

            +

            peso(
                reportData.remaining
            ),

            20,

            y

        );







        y += 20;







        pdf.text(

            "PROJECT TRANSPARENCY",

            20,

            y

        );







        y += 10;








        reportData.projects

        .forEach(

            (project)=>{





                pdf.text(

`
${project.name}

Status:
${project.status}

Budget:
${peso(project.budget)}

Spent:
${peso(project.spent)}

Balance:
${peso(project.remaining)}
`,

                    20,

                    y

                );







                y += 35;








                if(y > 270){


                    pdf.addPage();


                    y = 20;


                }






            }

        );








        pdf.save(

            "Dalubwikaan_Treasury_Report.pdf"

        );




    };


}









// =================================
// SEARCH SYSTEM
// =================================


function enableSearch(){



    const search =

    document.getElementById(
        "searchRecord"
    );






    if(!search)

    return;








    search.addEventListener(

        "input",

        ()=>{





            const keyword =

            search.value

            .toLowerCase();








            document

            .querySelectorAll(

                "#projectTable tr, #transactionTable tr"

            )

            .forEach(

                (row)=>{





                    row.style.display =


                    row.innerText

                    .toLowerCase()

                    .includes(keyword)


                    ?


                    ""


                    :


                    "none";






                }

            );







        }


    );



}









// =================================
// LOADER
// =================================


function hideLoader(){



    const loader =

    document.getElementById(
        "loader"
    );







    if(loader){



        loader.style.opacity="0";







        setTimeout(()=>{



            loader.style.display="none";



        },500);




    }



}









// =================================
// DARK / LIGHT MODE
// =================================


function initializeTheme(){



    const button =

    document.getElementById(
        "themeToggle"
    );







    const savedTheme =

    localStorage.getItem(
        "theme"
    );








    if(savedTheme==="dark"){



        document.body.classList.add(
            "dark"
        );



        if(button)

        button.textContent="☀";



    }









    if(button){



        button.onclick = ()=>{





            document.body.classList.toggle(
                "dark"
            );







            const dark =

            document.body.classList.contains(
                "dark"
            );








            localStorage.setItem(

                "theme",

                dark

                ?

                "dark"

                :

                "light"

            );







            button.textContent =

            dark

            ?

            "☀"

            :

            "🌙";







        };




    }



}









// =================================
// INITIALIZATION
// =================================


window.addEventListener(

"load",

()=>{



    loadCollections();



    loadProjects();



    loadExpenses();



    loadAnnouncements();




    generatePDF();



    enableSearch();



    initializeTheme();






    setTimeout(()=>{



        hideLoader();



    },800);





});









// =================================
// AUTO SYNC CHECK
// =================================


setInterval(()=>{



    console.log(

        "Dalubwikaan Treasury Dashboard Sync..."

    );



},30000);









// =================================
// GLOBAL ERROR HANDLING
// =================================


window.addEventListener(

"error",

(event)=>{


    console.error(

        "Dashboard Error:",

        event.error

    );


}

);









window.addEventListener(

"unhandledrejection",

(event)=>{


    console.error(

        "Promise Error:",

        event.reason

    );


}

);









console.log(`

========================================

DALUBWIKAAN TREASURY DASHBOARD v5.0

✓ Firebase Real-Time Sync

✓ Project Status Monitoring

✓ Ongoing / Completed / Planning

✓ Budget Transparency

✓ Expense Tracking

✓ Abonado Detection

✓ Receipt Monitoring

✓ Announcement Board

✓ PDF Transparency Report

✓ Dark Mode

SYSTEM READY

========================================

`);
