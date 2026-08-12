// ==========================================
// STUDENT PROFILE - DYNAMIC DATA
// ==========================================

const PROFILE_API = "../backend/api.php";

document.addEventListener("DOMContentLoaded", loadStudentProfile);

async function loadStudentProfile() {
    try {
        const response = await fetch(
            `${PROFILE_API}?action=profile`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const result = await response.json();

        console.log("Profile API Response:", result);

        if (!result.ok || !result.data) {
            console.error("Unable to load student profile.");
            return;
        }

        const student = result.data;

        // ==========================================
        // NAME
        // ==========================================

        document
            .querySelectorAll("[data-student-name]")
            .forEach(element => {
                element.textContent = student.full_name || "Student Name";
            });


        // ==========================================
        // EMAIL
        // ==========================================

        document
            .querySelectorAll("[data-student-email]")
            .forEach(element => {
                element.textContent =
                    student.email || "student@example.com";
            });


        // ==========================================
        // PHONE
        // ==========================================

        document
            .querySelectorAll("[data-student-phone]")
            .forEach(element => {
                element.textContent =
                    student.phone || "Not provided";
            });


        console.log("Logged-in student:", student);

    } catch (error) {

        console.error(
            "Student profile loading error:",
            error
        );
    }
}