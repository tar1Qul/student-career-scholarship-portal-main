// =====================================================
// RECRUITER DASHBOARD - FINAL DATABASE CONNECTED VERSION
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    const API = "../backend/api.php";

    let opportunities = [];
    let editingOpportunityId = null;


    // =====================================================
    // API HELPER
    // =====================================================

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

        const url = `${API}?action=${encodeURIComponent(action)}`;

        const response = await fetch(url, options);

        const result = await response.json();

        if (!response.ok || !result.ok) {
            throw new Error(result.message || "Something went wrong.");
        }

        return result.data;
    }


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHtml(value) {

        if (value === null || value === undefined) {
            return "";
        }

        const div = document.createElement("div");
        div.textContent = String(value);

        return div.innerHTML;
    }


    // =====================================================
    // DATE FORMAT
    // =====================================================

    function formatDate(date) {

        if (!date) return "-";

        const d = new Date(date + "T00:00:00");

        if (isNaN(d.getTime())) return date;

        return d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }


    // =====================================================
    // RELATIVE DATE
    // =====================================================

    function relativeDate(dateValue) {

        if (!dateValue) return "-";

        const date = new Date(dateValue.replace(" ", "T"));
        const now = new Date();

        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return "Just now";

        const minutes = Math.floor(seconds / 60);

        if (minutes < 60) {
            return `${minutes} min ago`;
        }

        const hours = Math.floor(minutes / 60);

        if (hours < 24) {
            return `${hours} hour${hours > 1 ? "s" : ""} ago`;
        }

        const days = Math.floor(hours / 24);

        if (days < 30) {
            return `${days} day${days > 1 ? "s" : ""} ago`;
        }

        return formatDate(dateValue);
    }


    // =====================================================
    // STATUS
    // =====================================================

    function statusLabel(status) {

        const labels = {
            approved: "Approved",
            pending: "Pending Verification",
            rejected: "Rejected",
            closed: "Closed",
            draft: "Draft"
        };

        return labels[status] || status;
    }


    function statusClass(status) {

        const classes = {
            approved: "verified",
            pending: "pending",
            rejected: "rejected",
            closed: "expired",
            draft: "pending"
        };

        return classes[status] || "pending";
    }


    // =====================================================
    // STAT CARDS
    // =====================================================

    function updateStats(stats) {

        const cards = document.querySelectorAll(".stat-card h2");

        if (cards.length < 4) return;

        cards[0].textContent = stats.total || 0;
        cards[1].textContent = stats.approved || 0;
        cards[2].textContent = stats.pending || 0;
        cards[3].textContent = stats.applications || 0;
    }


    // =====================================================
    // RENDER OPPORTUNITIES
    // =====================================================

    function renderOpportunities(data) {

        const tbody = document.querySelector(".opportunity-section tbody");

        if (!tbody) return;

        if (!data.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center; padding:30px;">
                        No opportunities found.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML = data.map(opportunity => `

            <tr data-id="${opportunity.id}">

                <td>
                    <strong>${escapeHtml(opportunity.title)}</strong>
                </td>

                <td>
                    ${escapeHtml(opportunity.organization)}
                </td>

                <td>
                    ${escapeHtml(
                        opportunity.category ||
                        opportunity.opportunity_type ||
                        "-"
                    )}
                </td>

                <td>
                    ${formatDate(opportunity.deadline)}
                </td>

                <td>
                    <span class="badge ${statusClass(opportunity.status)}">
                        ${statusLabel(opportunity.status)}
                    </span>
                </td>

                <td>
                    <i class="fa-solid fa-users"></i>
                    ${opportunity.applicant_count || 0}
                </td>

                <td>
                    ${relativeDate(opportunity.updated_at)}
                </td>

                <td class="actions">

                    <button
                        type="button"
                        title="View"
                        data-action="view"
                        data-id="${opportunity.id}">
                        <i class="fa-regular fa-eye"></i>
                    </button>

                    <button
                        type="button"
                        title="Edit"
                        data-action="edit"
                        data-id="${opportunity.id}">
                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <button
                        type="button"
                        title="Applicants"
                        data-action="applicants"
                        data-id="${opportunity.id}">
                        <i class="fa-solid fa-user-group"></i>
                    </button>

                    <button
                        type="button"
                        class="delete"
                        title="Delete"
                        data-action="delete"
                        data-id="${opportunity.id}">
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </td>

            </tr>

        `).join("");
    }


    // =====================================================
    // LOAD DASHBOARD
    // =====================================================

    async function loadDashboard() {

        const tbody = document.querySelector(".opportunity-section tbody");

        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center; padding:25px;">
                        Loading opportunities...
                    </td>
                </tr>
            `;
        }

        try {

            const data = await api("recruiter_dashboard");

            updateStats(data.stats || {});

            opportunities = data.opportunities || [];

            renderOpportunities(opportunities);

        } catch (error) {

            console.error(error);

            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align:center; padding:25px;">
                            ${escapeHtml(error.message)}
                        </td>
                    </tr>
                `;
            }

            if (
                error.message.includes("log in") ||
                error.message.includes("401")
            ) {
                window.location.href = "../login.html";
            }
        }
    }


    // =====================================================
    // FILTER + SEARCH
    // =====================================================

    function getFilteredOpportunities() {

        let result = [...opportunities];

        const filterSearch =
            document.querySelector(".filter-search input");

        const selects =
            document.querySelectorAll(".filters select");

        const keyword =
            filterSearch ? filterSearch.value.trim().toLowerCase() : "";

        const category =
            selects[0] ? selects[0].value.trim().toLowerCase() : "";

        const status =
            selects[1] ? selects[1].value.trim().toLowerCase() : "";

        const sort =
            selects[2] ? selects[2].value.trim().toLowerCase() : "";


        // SEARCH

        if (keyword) {

            result = result.filter(item => {

                const text = [
                    item.title,
                    item.organization,
                    item.category,
                    item.opportunity_type,
                    item.location
                ]
                    .join(" ")
                    .toLowerCase();

                return text.includes(keyword);
            });
        }


        // CATEGORY

        if (
            category &&
            category !== "all categories"
        ) {

            result = result.filter(item => {

                const itemCategory =
                    String(item.category || "").toLowerCase();

                const itemType =
                    String(item.opportunity_type || "").toLowerCase();

                return (
                    itemCategory === category ||
                    itemType === category
                );
            });
        }


        // STATUS

        if (
            status &&
            status !== "all statuses"
        ) {

            result = result.filter(item => {

                const dbStatus =
                    String(item.status || "").toLowerCase();

                const uiStatus =
                    statusLabel(item.status).toLowerCase();

                return (
                    dbStatus === status ||
                    uiStatus === status
                );
            });
        }


        // SORT

        if (sort.includes("oldest")) {

            result.sort((a, b) =>
                new Date(a.created_at) -
                new Date(b.created_at)
            );

        } else if (sort.includes("deadline")) {

            result.sort((a, b) => {

                if (!a.deadline) return 1;
                if (!b.deadline) return -1;

                return new Date(a.deadline) -
                    new Date(b.deadline);
            });

        } else {

            result.sort((a, b) =>
                new Date(b.created_at) -
                new Date(a.created_at)
            );
        }


        return result;
    }


    function applyFilters() {
        renderOpportunities(getFilteredOpportunities());
    }


    const filterSearch =
        document.querySelector(".filter-search input");

    if (filterSearch) {
        filterSearch.addEventListener("input", applyFilters);
    }


    document
        .querySelectorAll(".filters select")
        .forEach(select => {
            select.addEventListener("change", applyFilters);
        });


    // =====================================================
    // TOP SEARCH
    // =====================================================

    const topSearch =
        document.querySelector(".search-box input");

    if (topSearch) {

        topSearch.addEventListener("input", () => {

            const searchBox =
                document.querySelector(".filter-search input");

            if (searchBox) {

                searchBox.value = topSearch.value;

                applyFilters();
            }
        });
    }


    // =====================================================
    // MODAL HELPER
    // =====================================================

    function closeModal() {

        const modal =
            document.getElementById("recruiterDynamicModal");

        if (modal) {
            modal.remove();
        }
    }


    function showModal(title, content) {

        closeModal();

        const modal = document.createElement("div");

        modal.id = "recruiterDynamicModal";

        modal.style.cssText = `
            position:fixed;
            inset:0;
            background:rgba(0,0,0,.55);
            z-index:99999;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
        `;

        modal.innerHTML = `
            <div style="
                background:#fff;
                width:min(950px,100%);
                max-height:90vh;
                overflow:auto;
                border-radius:14px;
                padding:25px;
                position:relative;
            ">

                <button
                    id="dynamicModalClose"
                    style="
                        position:absolute;
                        right:15px;
                        top:12px;
                        border:none;
                        background:none;
                        font-size:28px;
                        cursor:pointer;
                    ">
                    &times;
                </button>

                <h2 style="margin-bottom:20px;">
                    ${escapeHtml(title)}
                </h2>

                ${content}

            </div>
        `;

        document.body.appendChild(modal);

        document
            .getElementById("dynamicModalClose")
            .addEventListener("click", closeModal);

        modal.addEventListener("click", event => {

            if (event.target === modal) {
                closeModal();
            }
        });
    }


    // =====================================================
    // VIEW OPPORTUNITY
    // =====================================================

    async function viewOpportunity(id) {

        try {

            const item = await api(
                `opportunity_get&id=${encodeURIComponent(id)}`
            );

            const canToggle =
                item.status === "approved" ||
                item.status === "closed";

            showModal(
                "Opportunity Details",
                `

                <div style="line-height:1.8;">

                    <p>
                        <strong>Title:</strong>
                        ${escapeHtml(item.title)}
                    </p>

                    <p>
                        <strong>Organization:</strong>
                        ${escapeHtml(item.organization)}
                    </p>

                    <p>
                        <strong>Category:</strong>
                        ${escapeHtml(item.category || "-")}
                    </p>

                    <p>
                        <strong>Type:</strong>
                        ${escapeHtml(item.opportunity_type)}
                    </p>

                    <p>
                        <strong>Location:</strong>
                        ${escapeHtml(item.location || "-")}
                    </p>

                    <p>
                        <strong>Deadline:</strong>
                        ${formatDate(item.deadline)}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${statusLabel(item.status)}
                    </p>

                    <p>
                        <strong>Application URL:</strong><br>
                        ${
                            item.application_url
                                ? `<a href="${escapeHtml(item.application_url)}"
                                    target="_blank"
                                    rel="noopener">
                                    ${escapeHtml(item.application_url)}
                                   </a>`
                                : "-"
                        }
                    </p>

                    <hr>

                    <h3>Description</h3>

                    <p>
                        ${escapeHtml(item.description || "-")}
                    </p>

                    <h3>Requirements</h3>

                    <p>
                        ${escapeHtml(item.requirements || "-")}
                    </p>

                    ${
                        canToggle
                            ? `
                                <button
                                    id="toggleOpportunityStatus"
                                    data-id="${item.id}"
                                    data-status="${
                                        item.status === "approved"
                                            ? "closed"
                                            : "approved"
                                    }"
                                    style="
                                        margin-top:15px;
                                        padding:10px 16px;
                                        cursor:pointer;
                                    ">
                                    ${
                                        item.status === "approved"
                                            ? "Close Opportunity"
                                            : "Reopen Opportunity"
                                    }
                                </button>
                              `
                            : ""
                    }

                </div>
                `
            );

            const toggleBtn =
                document.getElementById("toggleOpportunityStatus");

            if (toggleBtn) {

                toggleBtn.addEventListener("click", async () => {

                    try {

                        await api(
                            "opportunity_status",
                            "POST",
                            {
                                id: Number(toggleBtn.dataset.id),
                                status: toggleBtn.dataset.status
                            }
                        );

                        closeModal();

                        await loadDashboard();

                        alert("Opportunity status updated successfully.");

                    } catch (error) {
                        alert(error.message);
                    }
                });
            }

        } catch (error) {

            alert(error.message);
        }
    }


    // =====================================================
    // EDIT OPPORTUNITY
    // =====================================================

    async function editOpportunity(id) {

        try {

            const item = await api(
                `opportunity_get&id=${encodeURIComponent(id)}`
            );

            const dashboard1 =
                document.getElementById("dashboard_1");

            const dashboard2 =
                document.getElementById("dashboard_2");

            const form =
                document.getElementById("opportunityForm");

            if (!dashboard2 || !form) {
                alert("Opportunity edit form was not found.");
                return;
            }

            editingOpportunityId = item.id;

            if (dashboard1) {
                dashboard1.style.display = "none";
            }

            dashboard2.style.display = "block";

            const title = document.getElementById("title");
            const category = document.getElementById("category");
            const organization = document.getElementById("organization");
            const location = document.getElementById("location");
            const deadline = document.getElementById("deadline");
            const applicationUrl =
                document.getElementById("applicationUrl");
            const description =
                document.getElementById("description");
            const eligibility =
                document.getElementById("eligibility");

            if (title) title.value = item.title || "";
            if (category) category.value =
                item.category || item.opportunity_type || "";
            if (organization) organization.value =
                item.organization || "";
            if (location) location.value =
                item.location || "";
            if (deadline) deadline.value =
                item.deadline || "";
            if (applicationUrl) applicationUrl.value =
                item.application_url || "";
            if (description) description.value =
                item.description || "";
            if (eligibility) eligibility.value =
                item.requirements || "";

            const heading =
                dashboard2.querySelector("h1");

            if (heading) {
                heading.textContent = "Edit Opportunity";
            }

            const submitBtn =
                form.querySelector('button[type="submit"]');

            if (submitBtn) {
                submitBtn.textContent =
                    "Update & Submit for Verification";
            }

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        } catch (error) {

            alert(error.message);
        }
    }


    // =====================================================
    // APPLICANTS
    // =====================================================

    async function viewApplicants(opportunityId) {

        try {

            const applicants = await api(
                "opportunity_applicants",
                "POST",
                {
                    opportunity_id: opportunityId
                }
            );

            if (!applicants.length) {

                showModal(
                    "Applicants",
                    `
                    <p style="padding:20px 0;">
                        No applicants found for this opportunity yet.
                    </p>
                    `
                );

                return;
            }

            const rows = applicants.map(applicant => `

                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(applicant.full_name)}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(applicant.email)}
                    </td>

                    <td>
                        ${escapeHtml(applicant.university || "-")}
                    </td>

                    <td>
                        ${escapeHtml(applicant.department || "-")}
                    </td>

                    <td>
                        ${escapeHtml(applicant.cgpa || "-")}
                    </td>

                    <td>
                        <select
                            class="applicant-status-select"
                            data-application-id="${applicant.id}">

                            ${[
                                "pending",
                                "under_review",
                                "shortlisted",
                                "accepted",
                                "rejected"
                            ].map(status => `
                                <option
                                    value="${status}"
                                    ${
                                        applicant.status === status
                                            ? "selected"
                                            : ""
                                    }>
                                    ${status.replace("_", " ")}
                                </option>
                            `).join("")}

                        </select>
                    </td>

                    <td>
                        <button
                            type="button"
                            class="updateApplicantStatus"
                            data-application-id="${applicant.id}">
                            Update
                        </button>
                    </td>

                </tr>

            `).join("");


            showModal(
                "Applicants",
                `

                <div style="overflow:auto;">

                    <table
                        style="
                            width:100%;
                            border-collapse:collapse;
                        ">

                        <thead>

                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>University</th>
                                <th>Department</th>
                                <th>CGPA</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>

                        </thead>

                        <tbody>

                            ${rows}

                        </tbody>

                    </table>

                </div>

                `
            );


            document
                .querySelectorAll(".updateApplicantStatus")
                .forEach(button => {

                    button.addEventListener("click", async () => {

                        const applicationId =
                            Number(button.dataset.applicationId);

                        const select =
                            document.querySelector(
                                `.applicant-status-select[data-application-id="${applicationId}"]`
                            );

                        if (!select) return;

                        try {

                            button.disabled = true;
                            button.textContent = "Updating...";

                            await api(
                                "application_status",
                                "POST",
                                {
                                    application_id: applicationId,
                                    status: select.value
                                }
                            );

                            button.textContent = "Updated";

                            await loadDashboard();

                        } catch (error) {

                            button.disabled = false;
                            button.textContent = "Update";

                            alert(error.message);
                        }
                    });
                });

        } catch (error) {

            alert(error.message);
        }
    }


    // =====================================================
    // DELETE
    // =====================================================

    async function deleteOpportunity(id) {

        const confirmed = confirm(
            "Are you sure you want to permanently delete this opportunity?"
        );

        if (!confirmed) return;

        try {

            await api(
                "opportunity_delete",
                "POST",
                { id: id }
            );

            opportunities =
                opportunities.filter(item => item.id !== id);

            applyFilters();

            await loadDashboard();

            alert("Opportunity deleted successfully.");

        } catch (error) {

            alert(error.message);
        }
    }


    // =====================================================
    // TABLE ACTION EVENT DELEGATION
    // =====================================================

    const opportunityTable =
        document.querySelector(".opportunity-section table");

    if (opportunityTable) {

        opportunityTable.addEventListener("click", event => {

            const button =
                event.target.closest("button[data-action]");

            if (!button) return;

            const action =
                button.dataset.action;

            const id =
                Number(button.dataset.id);

            if (!id) return;

            if (action === "view") {
                viewOpportunity(id);
            }

            if (action === "edit") {
                editOpportunity(id);
            }

            if (action === "applicants") {
                viewApplicants(id);
            }

            if (action === "delete") {
                deleteOpportunity(id);
            }
        });
    }


    // =====================================================
    // CREATE / UPDATE OPPORTUNITY FORM
    // =====================================================

    const opportunityForm =
        document.getElementById("opportunityForm");


    if (opportunityForm) {

        opportunityForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const submitButton =
                    opportunityForm.querySelector(
                        'button[type="submit"]'
                    );

                const title =
                    document.getElementById("title")?.value.trim() || "";

                const category =
                    document.getElementById("category")?.value.trim() || "";

                const organization =
                    document.getElementById("organization")?.value.trim() || "";

                const location =
                    document.getElementById("location")?.value.trim() || "";

                const deadline =
                    document.getElementById("deadline")?.value || "";

                const applicationUrl =
                    document.getElementById("applicationUrl")?.value.trim() || "";

                const description =
                    document.getElementById("description")?.value.trim() || "";

                const eligibility =
                    document.getElementById("eligibility")?.value.trim() || "";


                const payload = {
                    title: title,
                    category: category,
                    opportunity_type:
                        String(category).toLowerCase() === "internship"
                            ? "internship"
                            : "job",
                    organization: organization,
                    location: location,
                    deadline: deadline,
                    application_url: applicationUrl,
                    description: description,
                    requirements: eligibility
                };


                try {

                    if (submitButton) {

                        submitButton.disabled = true;

                        submitButton.textContent =
                            editingOpportunityId
                                ? "Updating..."
                                : "Submitting...";
                    }


                    if (editingOpportunityId) {

                        payload.id =
                            editingOpportunityId;

                        await api(
                            "opportunity_update",
                            "POST",
                            payload
                        );

                        alert(
                            "Opportunity updated and submitted for verification."
                        );

                    } else {

                        await api(
                            "opportunity_create",
                            "POST",
                            payload
                        );

                        alert(
                            "Opportunity submitted for admin verification."
                        );
                    }


                    editingOpportunityId = null;

                    opportunityForm.reset();

                    const dashboard1 =
                        document.getElementById("dashboard_1");

                    const dashboard2 =
                        document.getElementById("dashboard_2");

                    if (dashboard1) {
                        dashboard1.style.display = "block";
                    }

                    if (dashboard2) {
                        dashboard2.style.display = "none";
                    }

                    await loadDashboard();

                } catch (error) {

                    alert(error.message);

                } finally {

                    if (submitButton) {

                        submitButton.disabled = false;

                        submitButton.textContent =
                            "Submit for verification";
                    }
                }
            }
        );
    }


    // =====================================================
    // SAVE AS DRAFT
    // =====================================================

    const draftBtn =
        document.getElementById("draftBtn");

    if (draftBtn && opportunityForm) {

        draftBtn.addEventListener("click", async () => {

            if (editingOpportunityId) {

                alert(
                    "Please use Update & Submit for Verification when editing an existing opportunity."
                );

                return;
            }

            try {

                draftBtn.disabled = true;

                const payload = {
                    title:
                        document.getElementById("title")?.value.trim() || "",

                    category:
                        document.getElementById("category")?.value.trim() || "",

                    organization:
                        document.getElementById("organization")?.value.trim() || "",

                    location:
                        document.getElementById("location")?.value.trim() || "",

                    deadline:
                        document.getElementById("deadline")?.value || "",

                    application_url:
                        document.getElementById("applicationUrl")?.value.trim() || "",

                    description:
                        document.getElementById("description")?.value.trim() || "",

                    requirements:
                        document.getElementById("eligibility")?.value.trim() || "",

                    opportunity_type: "job",

                    status: "draft"
                };

                await api(
                    "opportunity_create",
                    "POST",
                    payload
                );

                alert("Opportunity saved as draft.");

                opportunityForm.reset();

                await loadDashboard();

            } catch (error) {

                alert(error.message);

            } finally {

                draftBtn.disabled = false;
            }
        });
    }


    // =====================================================
    // NOTIFICATIONS
    // =====================================================

    const bellButton =
        document.querySelector(".top-icons button:first-child");

    if (bellButton) {

        bellButton.addEventListener("click", async () => {

            try {

                const notifications =
                    await api("notifications");

                if (!notifications.length) {

                    alert("No notifications.");

                    return;
                }

                const content =
                    notifications
                        .slice(0, 20)
                        .map(item => `

                            <div
                                style="
                                    padding:12px 0;
                                    border-bottom:1px solid #eee;
                                ">

                                <strong>
                                    ${escapeHtml(item.title)}
                                </strong>

                                <p style="margin:5px 0;">
                                    ${escapeHtml(item.message)}
                                </p>

                                <small>
                                    ${relativeDate(item.created_at)}
                                </small>

                            </div>

                        `)
                        .join("");

                showModal(
                    "Notifications",
                    content
                );

            } catch (error) {

                alert(error.message);
            }
        });
    }


    // =====================================================
    // LOGOUT
    // =====================================================

    const logoutLink =
        document.querySelector(".logout");

    if (logoutLink) {

        logoutLink.addEventListener("click", event => {

            event.preventDefault();

            const ok =
                confirm("Do you want to logout?");

            if (ok) {

                window.location.href =
                    "../backend/logout.php";
            }
        });
    }


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    loadDashboard();

});