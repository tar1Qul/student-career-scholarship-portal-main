document.addEventListener("DOMContentLoaded", async () => {

    const API = "../backend/api.php";


    // ==========================================
    // API FUNCTION
    // ==========================================

    async function api(action, method = "GET", data = null) {

        const options = {
            method: method,
            credentials: "same-origin",
            headers: {}
        };


        if (method !== "GET") {

            options.headers["Content-Type"] =
                "application/json";

            options.body =
                JSON.stringify(data || {});
        }


        const response = await fetch(
            `${API}?action=${encodeURIComponent(action)}`,
            options
        );


        let result;


        try {

            result = await response.json();

        } catch (error) {

            throw new Error(
                "Invalid response from server."
            );
        }


        if (!response.ok || !result.ok) {

            throw new Error(
                result.message || "Something went wrong."
            );
        }


        return result.data;
    }



    // ==========================================
    // SET TEXT SAFELY
    // ==========================================

    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (element) {

            element.textContent =
                value ?? 0;
        }
    }

    // ==========================================
    // LOAD ADMIN INFORMATION
    // ==========================================

    async function loadAdminInfo() {

        try {

            const user =
                await api("me");


            // if doesnot login
            if (!user) {

                window.location.href =
                    "../login.html";

                return;
            }

            if (user.role !== "admin") {

                window.location.href =
                    "../login.html";

                return;
            }


            // Topbar admin name
            const adminName =
                document.getElementById("adminName");

            if (adminName) {

                adminName.textContent =
                    user.name || "Admin";
            }


            // Welcome title
            const welcomeAdminName =
                document.getElementById(
                    "welcomeAdminName"
                );

            if (welcomeAdminName) {

                welcomeAdminName.textContent =
                    user.name || "Admin";
            }


            console.log(
                "Admin loaded:",
                user
            );

        } catch (error) {

            console.error(
                "Admin info error:",
                error
            );

            window.location.href =
                "../login.html";
        }
    }



    // ==========================================
    // LOAD DASHBOARD STATISTICS
    // ==========================================

    async function loadDashboardStats() {

        try {

            const data =
                await api("admin_dashboard");


            // Total users
            setText(
                "totalUsers",
                data.users_count || 0
            );


            // Scholarships
            setText(
                "totalScholarships",
                data.pending_scholarships || 0
            );


            // Career posts
            setText(
                "totalCareerPosts",
                data.pending_opportunities || 0
            );


            // Pending verification
            const pendingVerification =
                Number(
                    data.pending_opportunities || 0
                ) +
                Number(
                    data.pending_scholarships || 0
                );


            setText(
                "pendingVerification",
                pendingVerification
            );


            console.log(
                "Dashboard statistics loaded:",
                data
            );

        } catch (error) {

            console.error(
                "Dashboard stats error:",
                error
            );

            alert(
                "Could not load dashboard data: " +
                error.message
            );
        }
    }



    // ==========================================
    // LOAD EVERYTHING
    // ==========================================

    await loadAdminInfo();

    await loadDashboardStats();


    console.log(
        "Admin Dashboard Loaded Successfully"
    );

});