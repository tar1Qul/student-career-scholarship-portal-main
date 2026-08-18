document.addEventListener("DOMContentLoaded", () => {

    const API = "../backend/api.php";
    let allOpportunities = [];


    async function api(action, method = "GET", data = null) {

        const options = {
            method,
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

        const result = await response.json();

        if (!response.ok || !result.ok) {
            throw new Error(
                result.message || "Something went wrong."
            );
        }

        return result.data;
    }


    async function loadOpportunities() {

        const tbody =
            document.getElementById(
                "opportunitiesTableBody"
            );

        try {

            const data =
                await api("admin_opportunities");

            allOpportunities =
                Array.isArray(data) ? data : [];

            updateStatistics();
            applyFilters();

        } catch (error) {

            console.error(error);

            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center;">
                        Failed to load opportunities.
                    </td>
                </tr>
            `;
        }
    }


    function updateStatistics() {

        setText(
            "totalOpportunities",
            allOpportunities.length
        );

        setText(
            "publishedOpportunities",
            allOpportunities.filter(
                item => item.status === "approved"
            ).length
        );

        setText(
            "pendingOpportunities",
            allOpportunities.filter(
                item => item.status === "pending"
            ).length
        );

        setText(
            "closedOpportunities",
            allOpportunities.filter(
                item => item.status === "closed"
            ).length
        );
    }


    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    }


    function applyFilters() {

        const search =
            (
                document
                    .getElementById("opportunitySearch")
                    ?.value || ""
            ).toLowerCase().trim();

        const category =
            document
                .getElementById(
                    "opportunityCategoryFilter"
                )
                ?.value || "all";

        const status =
            document
                .getElementById(
                    "opportunityStatusFilter"
                )
                ?.value || "all";


        const filtered =
            allOpportunities.filter(item => {

                const matchesSearch =
                    !search ||
                    String(item.id).includes(search) ||
                    (item.title || "")
                        .toLowerCase()
                        .includes(search) ||
                    (item.company || "")
                        .toLowerCase()
                        .includes(search);

                const matchesCategory =
                    category === "all" ||
                    item.category === category;

                const matchesStatus =
                    status === "all" ||
                    item.status === status;

                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesStatus
                );
            });

        renderOpportunities(filtered);
    }


    function renderOpportunities(data) {

        const tbody =
            document.getElementById(
                "opportunitiesTableBody"
            );

        if (!data.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center;">
                        No opportunities found.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML = "";


        data.forEach(item => {

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>CR${item.id}</td>

                <td>${escapeHtml(item.title || "")}</td>

                <td>
                    ${escapeHtml(
                        item.company ||
                        item.company_name ||
                        "-"
                    )}
                </td>

                <td>${escapeHtml(item.category || "-")}</td>

                <td>${escapeHtml(item.location || "-")}</td>

                <td>${formatDate(item.deadline)}</td>

                <td>
                    <select
                        class="opportunityStatus"
                        data-id="${item.id}"
                    >
                        ${statusOptions(item.status)}
                    </select>
                </td>

                <td>
                    <button
                        class="view-btn"
                        data-action="view"
                        data-id="${item.id}"
                    >
                        <i class="fa-solid fa-eye"></i>
                    </button>

                    <button
                        class="delete-btn"
                        data-action="delete"
                        data-id="${item.id}"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });

        addActionListeners();
    }


    function statusOptions(current) {

        const statuses = [
            ["pending", "Pending"],
            ["approved", "Published"],
            ["rejected", "Rejected"],
            ["closed", "Closed"]
        ];

        return statuses.map(([value, label]) => `
            <option
                value="${value}"
                ${current === value ? "selected" : ""}
            >
                ${label}
            </option>
        `).join("");
    }


    function addActionListeners() {

        document
            .querySelectorAll(".opportunityStatus")
            .forEach(select => {

                select.onchange = async () => {

                    try {

                        await api(
                            "admin_opportunity_status",
                            "POST",
                            {
                                id: Number(select.dataset.id),
                                status: select.value
                            }
                        );

                        await loadOpportunities();

                    } catch (error) {

                        alert(error.message);
                        await loadOpportunities();
                    }
                };
            });


        document
            .querySelectorAll("[data-action='view']")
            .forEach(button => {

                button.onclick = () => {

                    const item =
                        allOpportunities.find(
                            x =>
                                Number(x.id) ===
                                Number(button.dataset.id)
                        );

                    if (!item) return;

                    alert(
                        "Opportunity Details\n\n" +
                        "Title: " + (item.title || "-") +
                        "\nCompany: " +
                        (
                            item.company ||
                            item.company_name ||
                            "-"
                        ) +
                        "\nCategory: " +
                        (item.category || "-") +
                        "\nLocation: " +
                        (item.location || "-") +
                        "\nDeadline: " +
                        formatDate(item.deadline) +
                        "\nStatus: " +
                        (item.status || "-")
                    );
                };
            });


        document
            .querySelectorAll("[data-action='delete']")
            .forEach(button => {

                button.onclick = async () => {

                    if (
                        !confirm(
                            "Delete this opportunity?"
                        )
                    ) {
                        return;
                    }

                    try {

                        await api(
                            "admin_delete",
                            "POST",
                            {
                                type: "opportunity",
                                id: Number(
                                    button.dataset.id
                                )
                            }
                        );

                        alert(
                            "Opportunity deleted successfully."
                        );

                        await loadOpportunities();

                    } catch (error) {

                        alert(error.message);
                    }
                };
            });
    }


    function formatDate(date) {

        if (!date) return "-";

        const value =
            new Date(date + "T00:00:00");

        if (isNaN(value.getTime())) {
            return date;
        }

        return value.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


    function escapeHtml(value) {

        const div =
            document.createElement("div");

        div.textContent = value;

        return div.innerHTML;
    }


    document
        .getElementById("opportunitySearch")
        ?.addEventListener(
            "input",
            applyFilters
        );


    document
        .getElementById(
            "opportunityCategoryFilter"
        )
        ?.addEventListener(
            "change",
            applyFilters
        );


    document
        .getElementById(
            "opportunityStatusFilter"
        )
        ?.addEventListener(
            "change",
            applyFilters
        );


    loadOpportunities();

});