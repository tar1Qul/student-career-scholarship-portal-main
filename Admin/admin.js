// ===============================
// Admin Dashboard JavaScript
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    const API = "../backend/api.php";


    // ===============================
    // LOAD ADMIN DASHBOARD DATA
    // ===============================

    async function loadDashboard() {

        try {

            const response = await fetch(
                `${API}?action=admin_dashboard`,
                {
                    method: "GET",
                    credentials: "same-origin"
                }
            );

            const result = await response.json();

            if (!response.ok || !result.ok) {
                throw new Error(
                    result.message ||
                    "Failed to load dashboard data."
                );
            }

            const data = result.data || {};

            // ===============================
            // UPDATE STATISTICS
            // ===============================

            document.getElementById("totalUsers").textContent =
                data.total_users ?? 0;

            document.getElementById("totalScholarships").textContent =
                data.total_scholarships ?? 0;

            document.getElementById("totalOpportunities").textContent =
                data.total_opportunities ?? 0;

            document.getElementById("pendingVerification").textContent =
                data.pending_verification ?? 0;

            console.log(
                "Admin dashboard loaded:",
                data
            );

        } catch (error) {

            console.error(
                "Dashboard loading error:",
                error
            );
        }
    }


    // ===============================
    // SIDEBAR ACTIVE MENU
    // ===============================

    const menuItems =
        document.querySelectorAll(".sidebar nav a, .sidebar-menu a");

    menuItems.forEach(item => {

        item.addEventListener("click", function () {

            menuItems.forEach(link =>
                link.classList.remove("active")
            );

            this.classList.add("active");
        });
    });


    // ===============================
    // SEARCH
    // ===============================

    const searchInputs =
        document.querySelectorAll("input[type='text']");

    searchInputs.forEach(input => {

        input.addEventListener("keyup", function () {
            console.log("Searching:", this.value);
        });
    });


    // ===============================
    // CARD HOVER
    // ===============================

    const cards =
        document.querySelectorAll(".card, .small-card");

    cards.forEach(card => {

        card.addEventListener("mouseenter", () => {
            card.style.transform = "translateY(-5px)";
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "translateY(0px)";
        });
    });


    // ===============================
    // INITIAL LOAD
    // ===============================

    loadDashboard();

    console.log(
        "Admin Dashboard Loaded Successfully"
    );

});