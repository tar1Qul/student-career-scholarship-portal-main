// ===============================
// Admin Dashboard JavaScript
// ===============================

// Sidebar Active Menu
const menuItems = document.querySelectorAll(".sidebar nav a");

menuItems.forEach(item => {

    item.addEventListener("click", function(e){

        menuItems.forEach(link => link.classList.remove("active"));

        this.classList.add("active");

    });

});

// Search Function
const searchInputs = document.querySelectorAll("input[type='text']");

searchInputs.forEach(input=>{

    input.addEventListener("keyup",function(){

        console.log("Searching :",this.value);

    });

});

// Buttons
document.querySelectorAll(".approve-btn").forEach(button=>{

    button.addEventListener("click",()=>{

        alert("Opportunity Approved Successfully.");

    });

});

document.querySelectorAll(".reject-btn").forEach(button=>{

    button.addEventListener("click",()=>{

        alert("Opportunity Rejected.");

    });

});

document.querySelectorAll(".edit-btn").forEach(button=>{

    button.addEventListener("click",()=>{

        alert("Edit User");

    });

});

document.querySelectorAll(".view-btn").forEach(button=>{

    button.addEventListener("click",()=>{

        alert("View User Details");

    });

});


// Card Hover Animation

const cards=document.querySelectorAll(".card,.small-card");

cards.forEach(card=>{

    card.addEventListener("mouseenter",()=>{

        card.style.transform="translateY(-5px)";

    });

    card.addEventListener("mouseleave",()=>{

        card.style.transform="translateY(0px)";

    });

});

console.log("Admin Dashboard Loaded Successfully");