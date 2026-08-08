// ==========================================
// Recruiter Dashboard
// Vanilla JavaScript
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ======================================
    // Sidebar Active Menu
    // ======================================

    // const menuItems = document.querySelectorAll(".sidebar-menu a");

    // menuItems.forEach(item => {

    //     item.addEventListener("click", function (e) {

    //         e.preventDefault();

    //         menuItems.forEach(link => link.classList.remove("active"));

    //         this.classList.add("active");

    //     });

    // });

    const menuItems = document.querySelectorAll(".sidebar-menu a");

    menuItems.forEach(item => {

        item.addEventListener("click", function () {

            menuItems.forEach(link => {
                link.classList.remove("active");
            });

            this.classList.add("active");

        });

    });

    // ======================================
    // Dashboard Search (Top Search)
    // ======================================

    const topSearch = document.querySelector(".search-box input");

    if (topSearch) {

        topSearch.addEventListener("keyup", function () {

            console.log("Searching:", this.value);

        });

    }

    // ======================================
    // Opportunity Search
    // ======================================

    const searchInput = document.querySelector(".filter-search input");

    const tableRows = document.querySelectorAll("tbody tr");

    if (searchInput) {

        searchInput.addEventListener("keyup", function () {

            const keyword = this.value.toLowerCase();

            tableRows.forEach(row => {

                const text = row.innerText.toLowerCase();

                row.style.display = text.includes(keyword)
                    ? ""
                    : "none";

            });

        });

    }

    // ======================================
    // Category Filter
    // ======================================

    const categoryFilter = document.querySelectorAll(".filters select")[0];

    if (categoryFilter) {

        categoryFilter.addEventListener("change", function () {

            const value = this.value.toLowerCase();

            tableRows.forEach(row => {

                const category = row.children[2].innerText.toLowerCase();

                if (
                    value === "all categories" ||
                    category === value
                ) {

                    row.style.display = "";

                } else {

                    row.style.display = "none";

                }

            });

        });

    }

    // ======================================
    // Status Filter
    // ======================================

    const statusFilter = document.querySelectorAll(".filters select")[1];

    if (statusFilter) {

        statusFilter.addEventListener("change", function () {

            const value = this.value.toLowerCase();

            tableRows.forEach(row => {

                const status = row.querySelector(".badge")
                    .innerText
                    .toLowerCase();

                if (

                    value === "all statuses" ||

                    status === value

                ) {

                    row.style.display = "";

                } else {

                    row.style.display = "none";

                }

            });

        });

    }

    // ======================================
    // Sort Table
    // ======================================

    const sortSelect = document.querySelectorAll(".filters select")[2];

    if (sortSelect) {

        sortSelect.addEventListener("change", function () {

            alert("Sorting feature can be connected with backend data.");

        });

    }

    // ======================================
    // Delete Opportunity
    // ======================================

    const deleteButtons = document.querySelectorAll(".delete");

    deleteButtons.forEach(btn => {

        btn.addEventListener("click", function () {

            const confirmDelete = confirm(
                "Are you sure you want to delete this opportunity?"
            );

            if (confirmDelete) {

                this.closest("tr").remove();

            }

        });

    });

    // ======================================
    // View Button
    // ======================================

    const viewButtons = document.querySelectorAll(".actions button:nth-child(1)");

    viewButtons.forEach(btn => {

        btn.addEventListener("click", function () {

            alert("View Opportunity");

        });

    });

    // ======================================
    // Edit Button
    // ======================================

    const editButtons = document.querySelectorAll(".actions button:nth-child(2)");

    editButtons.forEach(btn => {

        btn.addEventListener("click", function () {

            alert("Edit Opportunity");

        });

    });

    // ======================================
    // Applicant Button
    // ======================================

    const applicantButtons = document.querySelectorAll(".actions button:nth-child(3)");

    applicantButtons.forEach(btn => {

        btn.addEventListener("click", function () {

            alert("Open Applicant List");

        });

    });

    // ======================================
    // Notification Button
    // ======================================

    const bellBtn = document.querySelector(".fa-bell");

    if (bellBtn) {

        bellBtn.parentElement.addEventListener("click", () => {

            alert("No new notifications.");

        });

    }

    // ======================================
    // Settings Button
    // ======================================

    const settingsBtn = document.querySelector(".fa-gear");

    if (settingsBtn) {

        settingsBtn.parentElement.addEventListener("click", () => {

            alert("Settings panel coming soon.");

        });

    }

    // ======================================
    // New Opportunity Button
    // ======================================

    // const newButtons = document.querySelectorAll(".primary-btn, .new-btn");

    // newButtons.forEach(btn => {

    //     btn.addEventListener("click", () => {

    //         alert("Redirect to Post Opportunity page.");

    //     });

    // });

    // ======================================
    // Stat Card Hover Counter Animation
    // ======================================

    const cards = document.querySelectorAll(".stat-card h2");

    cards.forEach(card => {

        const finalValue = parseInt(card.innerText);

        if (isNaN(finalValue)) return;

        let count = 0;

        const speed = Math.max(10, Math.floor(800 / finalValue));

        const counter = setInterval(() => {

            count++;

            card.innerText = count;

            if (count >= finalValue) {

                clearInterval(counter);

            }

        }, speed);

    });

    // ======================================
    // Row Hover Effect
    // ======================================

    tableRows.forEach(row => {

        row.addEventListener("mouseenter", () => {

            row.style.cursor = "pointer";

        });

    });

    // ======================================
    // Logout Icon
    // ======================================

    const logout = document.querySelector(".fa-arrow-right-from-bracket");

    if (logout) {

        logout.addEventListener("click", () => {

            const ok = confirm("Do you want to logout?");

            if (ok) {

                alert("Logged out successfully.");

            }

        });

    }

    // ======================================
    // Console Message
    // ======================================

    console.log("Recruiter Dashboard Loaded Successfully.");

});





// ==========================================
// POST OPPORTUNITY TOGGLE
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    // Sidebar links
    const dashboardBtn = document.getElementById("dashboard-btn");
    const postBtn = document.getElementById("post_opportunity_btn");
    const profileBtn = document.getElementById("profile-btn");

    // Sections
    const dashboard1 = document.getElementById("dashboard_1");
    const dashboard2 = document.getElementById("dashboard_2");
    const dashboard3 = document.getElementById("dashboard_3");

    // Sidebar menu active state
    const menuItems = document.querySelectorAll(".sidebar-menu a");

    function setActive(button) {
        menuItems.forEach(link => link.classList.remove("active"));
        button.classList.add("active");
    }

    function showDashboard1() {
        dashboard1.style.display = "block";
        dashboard2.style.display = "none";
        dashboard3.style.display = "none";
        setActive(dashboardBtn);
    }

    function showDashboard2() {
        dashboard1.style.display = "none";
        dashboard2.style.display = "block";
        dashboard3.style.display = "none";
        setActive(postBtn);
    }

    function showDashboard3() {
        dashboard1.style.display = "none";
        dashboard2.style.display = "none";
        dashboard3.style.display = "block";
        setActive(profileBtn);
    }

    // Default page
    showDashboard1();

    // Dashboard
    dashboardBtn.addEventListener("click", function (e) {
        e.preventDefault();
        showDashboard1();
    });

    // Post Opportunity
    postBtn.addEventListener("click", function (e) {
        e.preventDefault();
        showDashboard2();
    });

    // My Profile
    profileBtn.addEventListener("click", function (e) {
        e.preventDefault();
        showDashboard3();
    });

});