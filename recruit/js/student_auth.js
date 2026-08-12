// js/student_auth.js

const API_URL = "../backend/api.php";

async function getLoggedInStudent() {
    try {
        const response = await fetch(`${API_URL}?action=me`, {
            method: "GET",
            credentials: "include"
        });

        const result = await response.json();

        if (!result.ok || !result.data) {
            window.location.href = "../login.html";
            return null;
        }

        if (result.data.role !== "student") {
            window.location.href = "../login.html";
            return null;
        }

        return result.data;

    } catch (error) {
        console.error("Authentication error:", error);
        return null;
    }
}

async function loadStudentIdentity() {
    const student = await getLoggedInStudent();

    if (!student) return;

    // All elements having data-student-name
    document.querySelectorAll("[data-student-name]").forEach(element => {
        element.textContent = student.name;
    });

    // All elements having data-student-email
    document.querySelectorAll("[data-student-email]").forEach(element => {
        element.textContent = student.email;
    });

    // Store current student information
    window.currentStudent = student;
}