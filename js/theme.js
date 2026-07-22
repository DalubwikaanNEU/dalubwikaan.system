// =================================
// DALUBWIKAAN THEME SWITCHER
// =================================


const themeButton = document.getElementById("themeToggle");


// Load saved theme

let savedTheme = localStorage.getItem("theme");


if(savedTheme === "dark"){

document.body.classList.add("dark-mode");

themeButton.innerHTML = "☀️";

}




// Toggle theme

themeButton.addEventListener("click",()=>{


document.body.classList.toggle("dark-mode");



let isDark =
document.body.classList.contains("dark-mode");



if(isDark){

themeButton.innerHTML="☀️";

localStorage.setItem(
"theme",
"dark"
);


}

else{


themeButton.innerHTML="🌙";


localStorage.setItem(
"theme",
"light"
);


}


});
