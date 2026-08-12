// ==========================================
// RECRUITER PROFILE - DYNAMIC VERSION
// ==========================================

const PROFILE_API = "../backend/api.php";

let originalData = {};

document.addEventListener("DOMContentLoaded", () => {
    loadRecruiterProfile();

    setupEditButton();
    setupCancelButton();
    setupProfileForm();
    setupImagePreview();
});


// ==========================================
// LOAD PROFILE
// ==========================================

async function loadRecruiterProfile() {

    try {

        const response = await fetch(
            `${PROFILE_API}?action=profile`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const result = await response.json();

        console.log("Recruiter Profile API:", result);

        if (!result.ok || !result.data) {

            console.error("Unable to load recruiter profile.");

            return;
        }

        const recruiter = result.data;

        originalData = recruiter;

        console.log("Logged-in Recruiter:", recruiter);


        // ==========================================
        // NAME
        // ==========================================

        document
            .querySelectorAll("[data-recruiter-name]")
            .forEach(element => {

                element.textContent =
                    recruiter.full_name || "Recruiter";

            });


        // ==========================================
        // EMAIL
        // ==========================================

        document
            .querySelectorAll("[data-recruiter-email]")
            .forEach(element => {

                element.textContent =
                    recruiter.email || "Not provided";

            });


        // ==========================================
        // PHONE
        // ==========================================

        setValue(
            "[data-recruiter-phone]",
            recruiter.phone
        );


        // ==========================================
        // DESIGNATION
        // ==========================================

        setValue(
            "[data-recruiter-designation]",
            recruiter.designation
        );


        // ==========================================
        // ORGANIZATION
        // ==========================================

        setValue(
            "[data-recruiter-organization]",
            recruiter.company_name
        );


        // ==========================================
        // ORGANIZATION EMAIL
        // ==========================================

        setValue(
            "[data-recruiter-company-email]",
            recruiter.company_email
        );


        // ==========================================
        // ORGANIZATION PHONE
        // ==========================================

        setValue(
            "[data-recruiter-company-phone]",
            recruiter.company_phone
        );


        // ==========================================
        // WEBSITE
        // ==========================================

        setValue(
            "[data-recruiter-company-website]",
            recruiter.company_website
        );


        // ==========================================
        // DESCRIPTION
        // ==========================================

        setValue(
            "[data-recruiter-company-description]",
            recruiter.company_description
        );


        // ==========================================
        // TOPBAR
        // ==========================================

        const topName =
            document.querySelector("[data-recruiter-top-name]");

        if (topName) {

            topName.textContent =
                recruiter.full_name || "Recruiter";

        }


        console.log(
            "Recruiter profile loaded successfully."
        );

    }

    catch (error) {

        console.error(
            "Recruiter profile loading error:",
            error
        );

    }

}


// ==========================================
// SET VALUE
// ==========================================

function setValue(selector, value) {

    const element =
        document.querySelector(selector);

    if (!element) return;

    element.value =
        value !== null &&
        value !== undefined
            ? value
            : "";

}


// ==========================================
// EDIT BUTTON
// ==========================================

function setupEditButton() {

    const editButton =
        document.getElementById("editProfile");

    const fields =
        document.querySelectorAll(
            "#profileForm input, " +
            "#profileForm select, " +
            "#profileForm textarea"
        );

    if (!editButton) return;

    editButton.addEventListener(
        "click",
        () => {

            fields.forEach(field => {

                field.disabled = false;

            });

            editButton.innerHTML =
                '<i class="fas fa-check"></i> Editing';

            editButton.classList.add("editing");

        }
    );

}


// ==========================================
// CANCEL
// ==========================================

function setupCancelButton() {

    const cancelButton =
        document.getElementById("cancelChanges");

    const fields =
        document.querySelectorAll(
            "#profileForm input, " +
            "#profileForm select, " +
            "#profileForm textarea"
        );

    if (!cancelButton) return;

    cancelButton.addEventListener(
        "click",
        () => {

            loadRecruiterProfile();

            fields.forEach(field => {

                field.disabled = true;

            });

            resetEditButton();

        }
    );

}


// ==========================================
// SAVE PROFILE
// ==========================================

function setupProfileForm() {

    const form =
        document.getElementById("profileForm");

    if (!form) return;

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const data = {

                full_name:
                    getValue(
                        "[data-recruiter-name-input]"
                    ),

                phone:
                    getValue(
                        "[data-recruiter-phone]"
                    ),

                designation:
                    getValue(
                        "[data-recruiter-designation]"
                    ),

                organization:
                    getValue(
                        "[data-recruiter-organization]"
                    ),

                company_email:
                    getValue(
                        "[data-recruiter-company-email]"
                    ),

                company_phone:
                    getValue(
                        "[data-recruiter-company-phone]"
                    ),

                company_website:
                    getValue(
                        "[data-recruiter-company-website]"
                    ),

                company_description:
                    getValue(
                        "[data-recruiter-company-description]"
                    )

            };


            try {

                const response =
                    await fetch(
                        `${PROFILE_API}?action=profile`,
                        {
                            method: "POST",

                            credentials: "include",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(data)
                        }
                    );


                const result =
                    await response.json();


                console.log(
                    "Save Profile API:",
                    result
                );


                if (!result.ok) {

                    alert(
                        result.message ||
                        "Profile update failed."
                    );

                    return;

                }


                alert(
                    "Profile updated successfully!"
                );


                // Reload fresh database data
                await loadRecruiterProfile();


                // Disable fields
                document
                    .querySelectorAll(
                        "#profileForm input, " +
                        "#profileForm select, " +
                        "#profileForm textarea"
                    )
                    .forEach(field => {

                        field.disabled = true;

                    });


                resetEditButton();


            }

            catch (error) {

                console.error(
                    "Profile update error:",
                    error
                );

                alert(
                    "Server error. Please try again."
                );

            }

        }
    );

}


// ==========================================
// GET INPUT VALUE
// ==========================================

function getValue(selector) {

    const element =
        document.querySelector(selector);

    return element
        ? element.value.trim()
        : "";

}


// ==========================================
// RESET EDIT BUTTON
// ==========================================

function resetEditButton() {

    const editButton =
        document.getElementById("editProfile");

    if (!editButton) return;

    editButton.innerHTML =
        '<i class="fas fa-pen"></i> Edit Profile';

    editButton.classList.remove("editing");

}


// ==========================================
// PROFILE IMAGE PREVIEW
// ==========================================

function setupImagePreview() {

    const upload =
        document.getElementById("imageUpload");

    const image =
        document.getElementById("profileImage");

    if (!upload || !image) return;

    upload.addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];

            if (!file) return;

            const reader =
                new FileReader();

            reader.onload =
                e => {

                    image.src =
                        e.target.result;

                };

            reader.readAsDataURL(file);

        }
    );

}