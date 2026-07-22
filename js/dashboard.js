// =============================
// DALUBWIKAAN TREASURY DASHBOARD
// DASHBOARD SCRIPT
// =============================



// NUMBER COUNTER ANIMATION

function animateNumber(element, target){

    let current = 0;

    let speed = target / 80;


    let counter = setInterval(()=>{


        current += speed;


        if(current >= target){

            current = target;
            clearInterval(counter);

        }


        element.innerHTML =
        "₱" + Math.floor(current).toLocaleString();


    },20);


}




// APPLY ANIMATION TO FUND CARDS


document.addEventListener("DOMContentLoaded",()=>{


const moneyCards =
document.querySelectorAll(".card h2");



const values=[

25000,
150,
8000,
17000

];



moneyCards.forEach((card,index)=>{


if(index === 1){

let current=0;

let target=values[index];


let counter=setInterval(()=>{

current+=3;


if(current>=target){

current=target;
clearInterval(counter);

}


card.innerHTML =
Math.floor(current);


},20);



}

else{


animateNumber(
card,
values[index]
);


}



});



});







// =============================
// DARK MODE PREPARATION
// =============================


const themeButton =
document.querySelector("header button");



themeButton.addEventListener("click",()=>{


document.body.classList.toggle("dark");



if(document.body.classList.contains("dark")){


themeButton.innerHTML="☀️";


}

else{


themeButton.innerHTML="🌙";


}



});
