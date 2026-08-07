document.addEventListener("DOMContentLoaded", () => {


    const imageUpload =
        document.getElementById("imageUpload");


    const profileImage =
        document.getElementById("profileImage");



    imageUpload.addEventListener("change", function () {


        const file = this.files[0];


        if (file) {


            const reader = new FileReader();


            reader.onload = function (e) {

                profileImage.src = e.target.result;

            }


            reader.readAsDataURL(file);


        }


    });





    // Edit Profile


    const editBtn =
        document.getElementById("editBtn");


    const inputs =
        document.querySelectorAll(
            "#profileForm input, #profileForm textarea"
        );



    let editing = false;



    editBtn.addEventListener("click", () => {


        editing = !editing;



        inputs.forEach(input => {


            input.disabled = !editing;


        });



        if (editing) {

            editBtn.innerText = "Cancel Edit";

        }

        else {

            editBtn.innerText = "Edit Profile";

        }



    });







    // Save


    document
        .getElementById("profileForm")
        .addEventListener("submit", function (e) {


            e.preventDefault();


            alert("Profile updated successfully!");



            inputs.forEach(input => {

                input.disabled = true;

            });



            editing = false;

            editBtn.innerText = "Edit Profile";



        });



});

// post_opportunity toggole

document.addEventListener("DOMContentLoaded", function () {

    const profileBtn = document.getElementById("profile-btn");
    const postBtn = document.getElementById("post_opportunity_btn");

    const dashboard1 = document.getElementById("dashboard_1");
    const dashboard2 = document.getElementById("dashboard_2");


    // ==============================
    // DEFAULT STATE
    // ==============================

    dashboard1.style.display = "block";
    dashboard2.style.display = "none";


    // ==============================
    // PROFILE BUTTON
    // ==============================

    profileBtn.addEventListener("click", function (e) {

        e.preventDefault();

        dashboard1.style.display = "block";
        dashboard2.style.display = "none";

        // Active state
        profileBtn.classList.add("active");
        postBtn.classList.remove("active");

    });


    // ==============================
    // POST OPPORTUNITY BUTTON
    // ==============================

    postBtn.addEventListener("click", function (e) {

        e.preventDefault();

        dashboard1.style.display = "none";
        dashboard2.style.display = "block";

        // Active state
        postBtn.classList.add("active");
        profileBtn.classList.remove("active");

    });

});