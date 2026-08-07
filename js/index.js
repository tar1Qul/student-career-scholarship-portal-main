/* =====================================
   STUDENT CAREER PORTAL JAVASCRIPT
===================================== */



// ===============================
// SEARCH FUNCTION
// ===============================


const searchInput = document.querySelector(".search-box input");
const searchButton = document.querySelector(".search-box button");


searchButton.addEventListener("click", function () {

    let value = searchInput.value.trim();


    if (value === "") {

        alert("Please enter what you want to search.");

    }

    else {

        alert(
            "Searching opportunities for: " + value
        );

        // Later PHP API connection will be added here

    }


});






// ===============================
// FAQ ACCORDION
// ===============================


const questions = document.querySelectorAll(".question");


questions.forEach(function (item) {


    item.addEventListener("click", function () {


        this.classList.toggle("active");



        if (this.classList.contains("active")) {


            this.style.background = "#eef5ff";

            this.innerHTML +=
                `
            <p style="
            margin-top:15px;
            color:#64748b;
            ">
            This answer will be loaded from database.
            </p>
            `;


        }

        else {

            this.style.background = "white";

        }



    });


});







// ===============================
// APPLY BUTTON
// ===============================


const applyButtons = document.querySelectorAll(".card button");


applyButtons.forEach(function (button) {


    button.addEventListener("click", function () {


        alert(
            "Application page will open soon."
        );


        // Future PHP:
        // window.location.href="php/apply.php";


    });


});







// ===============================
// SIGN UP BUTTON
// ===============================


const signup = document.querySelector(".signup");


signup.addEventListener("click", function () {


    window.location.href = "#register";


});







// ===============================
// SMOOTH SCROLL
// ===============================


document.querySelectorAll("nav a").forEach(function (link) {


    link.addEventListener("click", function (e) {


        let target = this.getAttribute("href");


        if (target.startsWith("#")) {


            e.preventDefault();


            document
                .querySelector(target)
                ?.scrollIntoView({

                    behavior: "smooth"

                });


        }


    });


});








// ===============================
// OPPORTUNITY CARD HOVER EFFECT
// ===============================


const cards = document.querySelectorAll(".card");


cards.forEach(function (card) {


    card.addEventListener("mouseenter", function () {


        this.style.transform = "translateY(-8px)";
        this.style.transition = "0.3s";


    });



    card.addEventListener("mouseleave", function () {


        this.style.transform = "translateY(0)";


    });



});








// ===============================
// LOGIN BUTTON DEMO
// ===============================


const loginButton = document.querySelector(".login");










// ===============================
// PAGE LOAD MESSAGE
// ===============================


window.addEventListener("load", function () {


    console.log(
        "Student Career Portal Loaded Successfully"
    );


});