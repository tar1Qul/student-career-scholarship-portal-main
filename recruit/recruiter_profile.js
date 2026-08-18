document.addEventListener("DOMContentLoaded", () => {

    const API = "../backend/api.php";
    const form = document.getElementById("profileForm");

    if (!form) {
        console.error("profileForm not found.");
        return;
    }


    // =================================================
    // API FUNCTION
    // =================================================
    async function api(action, method = "GET", data = null) {

        const options = {
            method: method,
            credentials: "same-origin",
            headers: {}
        };

        if (method !== "GET") {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(data || {});
        }

        const response = await fetch(
            `${API}?action=${encodeURIComponent(action)}`,
            options
        );

        let result;

        try {
            result = await response.json();
        } catch (error) {
            throw new Error("Invalid response from server.");
        }

        if (!response.ok || !result.ok) {
            throw new Error(
                result.message || "Something went wrong."
            );
        }

        return result.data || {};
    }


    // =================================================
    // FORM INPUTS
    // =================================================
    const inputs = form.querySelectorAll(
        "input, textarea, select"
    );


    // =================================================
    // SET FORM VALUE
    // =================================================
    function setValue(id, value) {

        const element = document.getElementById(id);

        if (element) {
            element.value = value ?? "";
        }
    }


    // =================================================
    // ENABLE / DISABLE EDITING
    // =================================================
    function setEditing(enabled) {

        inputs.forEach(input => {

            if (input.id === "imageUpload") {
                return;
            }

            input.disabled = !enabled;
        });
    }


    // =================================================
    // UPDATE PROFILE HEADER
    // =================================================
    function updateProfileHeader(data) {

        const fullName =
            data.full_name || "Recruiter";

        const designation =
            data.designation || "Recruiter";

        const organization =
            data.company_name ||
            "Student Career & Scholarship Portal";


        // =============================================
        // REGISTERED RECRUITER NAME
        // HTML already has: id="displayName"
        // =============================================
        const displayName =
            document.getElementById("displayName");

        if (displayName) {
            displayName.textContent = fullName;
        }


        // =============================================
        // DESIGNATION
        // HTML already has:
        // data-recruiter-designation-text
        // =============================================
        const designationText =
            document.querySelector(
                "[data-recruiter-designation-text]"
            );

        if (designationText) {
            designationText.textContent = designation;
        }


        // =============================================
        // ORGANIZATION
        // Try to find existing organization text
        // =============================================
        const organizationText =
            document.querySelector(
                "[data-recruiter-organization]"
            );

        if (organizationText) {
            organizationText.textContent = organization;
        }


        console.log("Header updated:", {
            fullName,
            designation,
            organization
        });
    }


    // =================================================
    // LOAD PROFILE FROM DATABASE
    // =================================================
    async function loadProfile() {

        try {

            const data = await api("profile");

            if (!data) {
                return;
            }


            console.log(
                "Recruiter profile loaded:",
                data
            );


            // =============================================
            // LOAD FORM DATA
            // =============================================
            setValue(
                "fullName",
                data.full_name
            );

            setValue(
                "email",
                data.email
            );

            setValue(
                "phone",
                data.phone
            );

            setValue(
                "designation",
                data.designation
            );

            setValue(
                "organization",
                data.company_name
            );

            setValue(
                "companyWebsite",
                data.company_website
            );

            setValue(
                "companyEmail",
                data.company_email
            );

            setValue(
                "companyPhone",
                data.company_phone
            );

            setValue(
                "aboutOrganization",
                data.company_description
            );


            // =============================================
            // LOAD PROFILE HEADER
            // =============================================
            updateProfileHeader(data);


            // =============================================
            // LOAD PROFILE IMAGE IF API RETURNS ONE
            // =============================================
            const profileImage =
                document.getElementById("profileImage");

if (profileImage) {

    profileImage.src =
        data.profile_image
            ? data.profile_image
            : "../images/default-recruiter.png";
}


        } catch (error) {

            console.error(
                "Profile loading error:",
                error
            );


            const message =
                (error.message || "")
                .toLowerCase();


            if (
                message.includes("log in") ||
                message.includes("login") ||
                message.includes("unauthorized")
            ) {
                window.location.href =
                    "../login.html";

                return;
            }

            alert(
                "Could not load profile: " +
                error.message
            );
        }
    }


    // =================================================
    // EDIT BUTTON
    // =================================================
    const editButton =
        document.getElementById("editBtn");

    if (editButton) {

        editButton.addEventListener(
            "click",
            () => {

                const fullNameInput =
                    document.getElementById("fullName");

                if (!fullNameInput) {
                    return;
                }


                const currentlyDisabled =
                    fullNameInput.disabled;


                // Enable editing
                if (currentlyDisabled) {

                    setEditing(true);

                    editButton.textContent =
                        "Cancel Edit";

                } else {

                    // Cancel editing
                    setEditing(false);

                    editButton.textContent =
                        "Edit Profile";

                    // Restore database values
                    loadProfile();
                }
            }
        );
    }


    // =================================================
    // SAVE PROFILE
    // =================================================
    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const submitButton =
                form.querySelector(
                    'button[type="submit"]'
                );


            const payload = {

                full_name:
                    document
                        .getElementById("fullName")
                        ?.value
                        .trim() || "",

                email:
                    document
                        .getElementById("email")
                        ?.value
                        .trim() || "",

                phone:
                    document
                        .getElementById("phone")
                        ?.value
                        .trim() || "",

                designation:
                    document
                        .getElementById("designation")
                        ?.value
                        .trim() || "",

                company_name:
                    document
                        .getElementById("organization")
                        ?.value
                        .trim() || "",

                company_website:
                    document
                        .getElementById("companyWebsite")
                        ?.value
                        .trim() || "",

                company_email:
                    document
                        .getElementById("companyEmail")
                        ?.value
                        .trim() || "",

                company_phone:
                    document
                        .getElementById("companyPhone")
                        ?.value
                        .trim() || "",

                company_description:
                    document
                        .getElementById(
                            "aboutOrganization"
                        )
                        ?.value
                        .trim() || ""
            };


            try {

                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = "Saving...";
                }


                const updatedData =
                    await api(
                        "profile",
                        "POST",
                        payload
                    );


                // Immediately update header
                updateProfileHeader({
                    ...payload,
                    ...(updatedData || {})
                });


                alert(
                    "Profile updated successfully."
                );


                setEditing(false);


                if (editButton) {
                    editButton.textContent =
                        "Edit Profile";
                }


                // Reload latest data from database
                await loadProfile();


            } catch (error) {

                console.error(
                    "Profile save error:",
                    error
                );

                alert(
                    error.message ||
                    "Could not update profile."
                );

            } finally {

                if (submitButton) {

                    submitButton.disabled = false;

                    submitButton.textContent =
                        "Save Changes";
                }
            }
        }
    );


    // =================================================
    // PROFILE IMAGE PREVIEW
    // =================================================
    const imageUpload =
        document.getElementById("imageUpload");

    const profileImage =
        document.getElementById("profileImage");

    if (imageUpload && profileImage) {

        imageUpload.addEventListener(
            "change",
            function () {

                const file =
                    this.files?.[0];

                if (!file) {
                    return;
                }


                if (
                    !file.type.startsWith("image/")
                ) {
                    alert(
                        "Please select a valid image file."
                    );

                    return;
                }


                const reader =
                    new FileReader();

                reader.onload =
                    event => {

                        profileImage.src =
                            event.target.result;
                    };

                reader.readAsDataURL(file);
            }
        );
    }


    // =================================================
    // INITIAL STATE
    // =================================================
    setEditing(false);


    // =================================================
    // LOAD INITIAL PROFILE
    // =================================================
    loadProfile();

});