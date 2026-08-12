// ================================
// STUDENT DASHBOARD
// ================================

const API_URL = "../backend/api.php";

document.addEventListener("DOMContentLoaded", loadDashboard);

async function loadDashboard() {
    try {
        const response = await fetch(
            `${API_URL}?action=student_dashboard`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const result = await response.json();

        console.log("Dashboard API:", result);

        if (!result.ok) {
            alert(result.message || "Unable to load dashboard.");
            window.location.href = "../login.html";
            return;
        }

        const data = result.data;

        // ================================
        // STUDENT NAME
        // ================================

        if (data.user) {
            const nameElement =
                document.querySelector("[data-student-name]");

            if (nameElement) {
                nameElement.textContent = data.user.name;
            }
        }

        // ================================
        // STATISTICS
        // ================================

        const stats = data.stats || {};

        document.getElementById("totalApplications").textContent =
            stats.applications_count || 0;

        document.getElementById("savedOpportunities").textContent =
            stats.saved_count || 0;

        // ================================
        // LOAD APPLICATION DETAILS
        // ================================

        await loadRecentApplications();

    } catch (error) {
        console.error("Dashboard error:", error);
    }
}


// ========================================
// LOAD STUDENT APPLICATIONS
// ========================================

async function loadRecentApplications() {

    try {

        const response = await fetch(
            `${API_URL}?action=applications`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const result = await response.json();

        console.log("Applications API:", result);

        if (!result.ok) {
            return;
        }

        const applications = result.data || [];

        // Calculate statistics from actual applications
        let pending = 0;
        let accepted = 0;

        applications.forEach(application => {

            const status =
                String(application.status || "").toLowerCase();

            if (
                status === "pending" ||
                status === "under_review" ||
                status === "review"
            ) {
                pending++;
            }

            if (
                status === "accepted" ||
                status === "approved"
            ) {
                accepted++;
            }
        });

        document.getElementById("pendingApplications").textContent =
            pending;

        document.getElementById("acceptedApplications").textContent =
            accepted;


        // ========================================
        // DISPLAY RECENT APPLICATIONS
        // ========================================

        const container =
            document.getElementById("recentApplications");

        if (!container) return;

        // Keep table header
        container.innerHTML = `
            <div class="dashboard-table-header">
                <span>Opportunity</span>
                <span>Type</span>
                <span>Status</span>
            </div>
        `;

        if (applications.length === 0) {

            container.innerHTML += `
                <div class="dashboard-table-row">
                    <span>No applications yet</span>
                    <span>-</span>
                    <span>-</span>
                </div>
            `;

            return;
        }


        // Show latest 4 applications
        applications
            .slice(0, 4)
            .forEach(application => {

                let title = "Unknown";

                let type = "Opportunity";

                if (application.opportunity_title) {
                    title = application.opportunity_title;
                    type = "Job / Opportunity";
                }
                else if (application.scholarship_title) {
                    title = application.scholarship_title;
                    type = "Scholarship";
                }

                const status =
                    application.status || "Pending";

                const statusClass =
                    getStatusClass(status);

                container.innerHTML += `
                    <div class="dashboard-table-row">

                        <span>
                            ${escapeHTML(title)}
                        </span>

                        <span>
                            ${escapeHTML(type)}
                        </span>

                        <span class="status ${statusClass}">
                            ${escapeHTML(formatStatus(status))}
                        </span>

                    </div>
                `;
            });

    } catch (error) {

        console.error(
            "Application loading error:",
            error
        );
    }
}


// ========================================
// STATUS CLASS
// ========================================

function getStatusClass(status) {

    const value =
        String(status).toLowerCase();

    if (
        value === "accepted" ||
        value === "approved"
    ) {
        return "accepted";
    }

    if (
        value === "rejected" ||
        value === "declined"
    ) {
        return "rejected";
    }

    if (
        value === "under_review" ||
        value === "review"
    ) {
        return "review";
    }

    return "pending";
}


// ========================================
// FORMAT STATUS
// ========================================

function formatStatus(status) {

    return String(status)
        .replace(/_/g, " ")
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );
}


// ========================================
// SECURITY
// ========================================

function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}