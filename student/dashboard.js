// ==========================================
// STUDENT DASHBOARD
// ==========================================

const API_URL = "../backend/api.php";

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
    setupSearch();
});


// ==========================================
// API HELPER
// ==========================================

async function apiRequest(action) {
    const response = await fetch(
        `${API_URL}?action=${encodeURIComponent(action)}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.ok) {
        throw new Error(result.message || "Request failed");
    }

    return result.data;
}


// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {
    try {
        const data = await apiRequest("student_dashboard");

        console.log("Student Dashboard:", data);

        // ------------------------------
        // Student name
        // ------------------------------

        const nameElement =
            document.querySelector("[data-student-name]");

        if (nameElement && data.user) {
            nameElement.textContent =
                data.user.name || "Student";
        }


        // ------------------------------
        // Statistics
        // ------------------------------

        const stats = data.stats || {};

        setText(
            "totalApplications",
            Number(stats.applications_count || 0)
        );

        setText(
            "savedOpportunities",
            Number(stats.saved_count || 0)
        );


        // ------------------------------
        // Profile progress
        // ------------------------------

        updateProfileProgress(data.profile);


        // ------------------------------
        // Load other dashboard sections
        // ------------------------------

        await Promise.all([
            loadRecentApplications(),
            loadUpcomingDeadlines(),
            loadRecommendations(),
            loadRecentActivities()
        ]);

    } catch (error) {

        console.error("Dashboard error:", error);

        if (
            error.message.includes("401") ||
            error.message.includes("403")
        ) {
            window.location.href = "../login.html";
        }
    }
}


// ==========================================
// RECENT APPLICATIONS
// ==========================================

async function loadRecentApplications() {

    try {

        const applications =
            await apiRequest("applications") || [];

        let pending = 0;
        let accepted = 0;

        applications.forEach(application => {

            const status =
                String(application.status || "")
                    .toLowerCase()
                    .trim();

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


        setText("pendingApplications", pending);
        setText("acceptedApplications", accepted);


        const container =
            document.getElementById("recentApplications");

        if (!container) return;


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


        applications
            .slice(0, 4)
            .forEach(application => {

                const title =
                    application.opportunity_title ||
                    application.scholarship_title ||
                    "Unknown Opportunity";

                const type =
                    application.opportunity_title
                        ? "Career Opportunity"
                        : "Scholarship";

                const status =
                    application.status || "pending";

                container.innerHTML += `
                    <div class="dashboard-table-row">

                        <span>
                            ${escapeHTML(title)}
                        </span>

                        <span>
                            ${escapeHTML(type)}
                        </span>

                        <span class="status ${getStatusClass(status)}">
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


// ==========================================
// UPCOMING DEADLINES
// ==========================================

async function loadUpcomingDeadlines() {

    const container =
        document.getElementById("upcomingDeadlines");

    if (!container) return;

    try {

        const [opportunities, scholarships] =
            await Promise.all([
                apiRequest("opportunities"),
                apiRequest("scholarships")
            ]);


        const items = [];


        // Opportunities
        (opportunities || []).forEach(item => {

            if (item.deadline) {

                items.push({
                    title: item.title,
                    type: "Career Opportunity",
                    deadline: item.deadline
                });

            }

        });


        // Scholarships
        (scholarships || []).forEach(item => {

            if (item.deadline) {

                items.push({
                    title: item.title,
                    type: "Scholarship",
                    deadline: item.deadline
                });

            }

        });


        // Sort by deadline
        items.sort(
            (a, b) =>
                new Date(a.deadline) -
                new Date(b.deadline)
        );


        const upcoming =
            items.slice(0, 3);


        container.innerHTML = "";


        if (upcoming.length === 0) {

            container.innerHTML = `
                <div class="deadline-item">
                    <div>
                        <h4>No upcoming deadlines</h4>
                        <p>Check again later.</p>
                    </div>
                </div>
            `;

            return;
        }


        upcoming.forEach(item => {

            container.innerHTML += `
                <div class="deadline-item">

                    <div class="deadline-icon">
                        <i class="fa-solid fa-calendar"></i>
                    </div>

                    <div>
                        <h4>
                            ${escapeHTML(item.title)}
                        </h4>

                        <p>
                            ${escapeHTML(item.type)}
                        </p>
                    </div>

                    <strong>
                        ${formatDate(item.deadline)}
                    </strong>

                </div>
            `;

        });

    } catch (error) {

        console.error(
            "Deadline loading error:",
            error
        );
    }
}


// ==========================================
// RECOMMENDATIONS
// ==========================================

async function loadRecommendations() {

    const container =
        document.getElementById("recommendationGrid");

    if (!container) return;

    try {

        const opportunities =
            await apiRequest("opportunities") || [];


        container.innerHTML = "";


        const recommendations =
            opportunities.slice(0, 3);


        if (recommendations.length === 0) {

            container.innerHTML = `
                <div class="recommendation-card">
                    <div>
                        <h3>No opportunities available</h3>
                        <p>Check again later.</p>
                    </div>
                </div>
            `;

            return;
        }


        recommendations.forEach(item => {

            const organization =
                item.organization ||
                item.company_name ||
                "Organization";

            container.innerHTML += `
                <div class="recommendation-card">

                    <div class="recommendation-icon">
                        <i class="fa-solid fa-briefcase"></i>
                    </div>

                    <div>
                        <h3>
                            ${escapeHTML(item.title)}
                        </h3>

                        <p>
                            ${escapeHTML(organization)}
                        </p>

                        <small>
                            ${escapeHTML(
                                item.location || "Bangladesh"
                            )}
                        </small>
                    </div>

                    <a href="student_opportunities.html">
                        View
                    </a>

                </div>
            `;
        });

    } catch (error) {

        console.error(
            "Recommendation loading error:",
            error
        );
    }
}


// ==========================================
// RECENT ACTIVITIES
// ==========================================

async function loadRecentActivities() {

    const container =
        document.getElementById("activityList");

    if (!container) return;

    try {

        const applications =
            await apiRequest("applications") || [];

        const saved =
            await apiRequest("saved") || [];


        const activities = [];


        // Applications
        applications.slice(0, 3).forEach(item => {

            const title =
                item.opportunity_title ||
                item.scholarship_title ||
                "an opportunity";

            activities.push({
                icon: "fa-paper-plane",
                text: `Applied for ${title}`,
                date: item.applied_at
            });

        });


        // Saved items
        saved.slice(0, 2).forEach(item => {

            const title =
                item.opportunity_title ||
                item.scholarship_title ||
                "an opportunity";

            activities.push({
                icon: "fa-bookmark",
                text: `Saved ${title}`,
                date: item.saved_at
            });

        });


        activities.sort(
            (a, b) =>
                new Date(b.date || 0) -
                new Date(a.date || 0)
        );


        container.innerHTML = "";


        if (activities.length === 0) {

            container.innerHTML = `
                <div class="activity-item">
                    <i class="fa-solid fa-circle-info"></i>

                    <div>
                        <strong>
                            No recent activities
                        </strong>

                        <p>
                            Start exploring opportunities.
                        </p>
                    </div>
                </div>
            `;

            return;
        }


        activities
            .slice(0, 4)
            .forEach(activity => {

                container.innerHTML += `
                    <div class="activity-item">

                        <i class="fa-solid ${activity.icon}"></i>

                        <div>
                            <strong>
                                ${escapeHTML(activity.text)}
                            </strong>

                            <p>
                                ${formatRelativeDate(activity.date)}
                            </p>
                        </div>

                    </div>
                `;
            });

    } catch (error) {

        console.error(
            "Activity loading error:",
            error
        );
    }
}


// ==========================================
// PROFILE PROGRESS
// ==========================================

function updateProfileProgress(profile) {

    if (!profile) return;


    const fields = [
        "university",
        "department",
        "cgpa",
        "graduation_year",
        "bio",
        "skills",
        "profile_image"
    ];


    let completed = 0;


    fields.forEach(field => {

        if (
            profile[field] !== null &&
            profile[field] !== undefined &&
            String(profile[field]).trim() !== ""
        ) {
            completed++;
        }

    });


    const percentage =
        Math.round(
            (completed / fields.length) * 100
        );


    const progressText =
        document.querySelector(
            ".profile-progress-dashboard strong"
        );

    const progressBar =
        document.querySelector(
            ".profile-progress-dashboard .progress-bar"
        );


    if (progressText) {
        progressText.textContent =
            `${percentage}%`;
    }


    if (progressBar) {
        progressBar.style.width =
            `${percentage}%`;
    }
}


// ==========================================
// SEARCH
// ==========================================

function setupSearch() {

    const searchInput =
        document.querySelector(".search-box input");

    if (!searchInput) return;


    searchInput.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Enter") return;

            const keyword =
                searchInput.value.trim();

            if (!keyword) return;


            window.location.href =
                `student_opportunities.html?search=${encodeURIComponent(keyword)}`;
        }
    );
}


// ==========================================
// HELPERS
// ==========================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function getStatusClass(status) {

    const value =
        String(status)
            .toLowerCase()
            .trim();


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


    if (value === "redirected") {
        return "review";
    }


    return "pending";
}


function formatStatus(status) {

    const value =
        String(status || "pending")
            .replace(/_/g, " ");

    return value.replace(
        /\b\w/g,
        char => char.toUpperCase()
    );
}


function formatDate(date) {

    if (!date) return "-";


    const parsed =
        new Date(date);


    if (Number.isNaN(parsed.getTime())) {
        return "-";
    }


    return parsed.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short"
        }
    );
}


function formatRelativeDate(date) {

    if (!date) return "Recently";


    const parsed =
        new Date(date);


    if (Number.isNaN(parsed.getTime())) {
        return "Recently";
    }


    const diff =
        Date.now() - parsed.getTime();

    const minutes =
        Math.floor(diff / 60000);

    const hours =
        Math.floor(diff / 3600000);

    const days =
        Math.floor(diff / 86400000);


    if (minutes < 1) {
        return "Just now";
    }

    if (minutes < 60) {
        return `${minutes} min ago`;
    }

    if (hours < 24) {
        return `${hours} hr ago`;
    }

    if (days === 1) {
        return "Yesterday";
    }

    if (days < 7) {
        return `${days} days ago`;
    }


    return parsed.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}