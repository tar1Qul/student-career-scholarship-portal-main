document.addEventListener("DOMContentLoaded", () => {

    const API = "../backend/api.php";

    let allScholarships = [];


    // ==========================================
    // API
    // ==========================================

    async function api(action, method = "GET", data = null) {

        const options = {
            method,
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
                result.message ||
                "Something went wrong."
            );
        }


        return result.data;
    }



    // ==========================================
    // CHECK ADMIN
    // ==========================================

    async function checkAdmin() {

        try {

            const user = await api("me");


            if (!user || user.role !== "admin") {

                window.location.href =
                    "../login.html";

                return false;
            }


            return true;

        } catch (error) {

            window.location.href =
                "../login.html";

            return false;
        }
    }



    // ==========================================
    // LOAD SCHOLARSHIPS
    // ==========================================

    async function loadScholarships() {

        const tbody =
            document.getElementById(
                "scholarshipsTableBody"
            );


        try {

            if (tbody) {

                tbody.innerHTML = `
                    <tr>
                        <td colspan="7"
                            style="text-align:center;">
                            Loading scholarships...
                        </td>
                    </tr>
                `;
            }


            const data =
                await api("admin_scholarships");


            allScholarships =
                Array.isArray(data)
                    ? data
                    : [];


            updateStatistics();

            applyFilters();


        } catch (error) {

            console.error(error);


            if (tbody) {

                tbody.innerHTML = `
                    <tr>
                        <td colspan="7"
                            style="text-align:center;">
                            Failed to load scholarships.
                        </td>
                    </tr>
                `;
            }
        }
    }



    // ==========================================
    // STATISTICS
    // ==========================================

    function updateStatistics() {

        setText(
            "totalScholarships",
            allScholarships.length
        );


        setText(
            "publishedScholarships",
            allScholarships.filter(
                item =>
                    item.status === "approved"
            ).length
        );


        setText(
            "pendingScholarships",
            allScholarships.filter(
                item =>
                    item.status === "pending"
            ).length
        );


        setText(
            "closedScholarships",
            allScholarships.filter(
                item =>
                    item.status === "closed"
            ).length
        );
    }



    function setText(id, value) {

        const element =
            document.getElementById(id);


        if (element) {

            element.textContent =
                value;
        }
    }



    // ==========================================
    // FILTERS
    // ==========================================

    function applyFilters() {

        const search =
            (
                document
                    .getElementById(
                        "scholarshipSearch"
                    )
                    ?.value || ""
            )
            .toLowerCase()
            .trim();


        const category =
            document
                .getElementById(
                    "categoryFilter"
                )
                ?.value || "all";


        const status =
            document
                .getElementById(
                    "statusFilter"
                )
                ?.value || "all";


        const filtered =
            allScholarships.filter(item => {

                const title =
                    (
                        item.title || ""
                    ).toLowerCase();


                const provider =
                    (
                        item.provider || ""
                    ).toLowerCase();


                const id =
                    String(item.id);


                const searchMatch =
                    !search ||
                    title.includes(search) ||
                    provider.includes(search) ||
                    id.includes(search);


                const categoryMatch =
                    category === "all" ||
                    item.category === category;


                const statusMatch =
                    status === "all" ||
                    item.status === status;


                return (
                    searchMatch &&
                    categoryMatch &&
                    statusMatch
                );
            });


        renderScholarships(
            filtered
        );
    }



    // ==========================================
    // RENDER TABLE
    // ==========================================

    function renderScholarships(data) {

        const tbody =
            document.getElementById(
                "scholarshipsTableBody"
            );


        if (!tbody) return;


        if (!data.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="7"
                        style="text-align:center;">
                        No scholarships found.
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

                <td>SC${item.id}</td>

                <td>
                    ${escapeHtml(
                        item.title || ""
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        item.provider || ""
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        item.category || "-"
                    )}
                </td>

                <td>
                    ${formatDate(
                        item.deadline
                    )}
                </td>

                <td>

                    <select
                        class="scholarship-status-select"
                        data-id="${item.id}"
                    >
                        ${statusOptions(
                            item.status
                        )}
                    </select>

                </td>

                <td>

                    <button
                        class="view-btn"
                        title="View"
                        data-action="view"
                        data-id="${item.id}"
                    >
                        <i class="fa-solid fa-eye"></i>
                    </button>


                    <button
                        class="delete-btn"
                        title="Delete"
                        data-action="delete"
                        data-id="${item.id}"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </td>
            `;


            tbody.appendChild(row);
        });


        addEventListeners();
    }



    // ==========================================
    // STATUS OPTIONS
    // ==========================================

    function statusOptions(current) {

        const statuses = [
            ["draft", "Draft"],
            ["pending", "Pending"],
            ["approved", "Published"],
            ["rejected", "Rejected"],
            ["closed", "Closed"]
        ];


        return statuses
            .map(([value, label]) => `

                <option
                    value="${value}"
                    ${
                        current === value
                            ? "selected"
                            : ""
                    }
                >
                    ${label}
                </option>

            `)
            .join("");
    }



    // ==========================================
    // ACTIONS
    // ==========================================

    function addEventListeners() {


        // Status change

        document
            .querySelectorAll(
                ".scholarship-status-select"
            )
            .forEach(select => {

                select.onchange =
                    async () => {

                        try {

                            select.disabled = true;


                            await api(
                                "admin_scholarship_status",
                                "POST",
                                {
                                    id:
                                        Number(
                                            select.dataset.id
                                        ),

                                    status:
                                        select.value
                                }
                            );


                            await loadScholarships();


                        } catch (error) {

                            alert(
                                error.message
                            );

                            await loadScholarships();

                        } finally {

                            select.disabled = false;
                        }
                    };
            });



        // View

        document
            .querySelectorAll(
                "[data-action='view']"
            )
            .forEach(button => {

                button.onclick = () => {

                    const item =
                        allScholarships.find(
                            scholarship =>
                                Number(
                                    scholarship.id
                                ) === Number(
                                    button.dataset.id
                                )
                        );


                    if (!item) return;


                    alert(
                        "Scholarship Details\n\n" +

                        "Title: " +
                        (item.title || "") +

                        "\nProvider: " +
                        (item.provider || "") +

                        "\nCategory: " +
                        (item.category || "-") +

                        "\nAmount: " +
                        (item.amount || "-") +

                        "\nDeadline: " +
                        formatDate(
                            item.deadline
                        ) +

                        "\nStatus: " +
                        (item.status || "-") +

                        "\n\nDescription:\n" +
                        (item.description || "-") +

                        "\n\nEligibility:\n" +
                        (item.eligibility || "-")
                    );
                };
            });



        // Delete

        document
            .querySelectorAll(
                "[data-action='delete']"
            )
            .forEach(button => {

                button.onclick =
                    async () => {

                        const item =
                            allScholarships.find(
                                scholarship =>
                                    Number(
                                        scholarship.id
                                    ) === Number(
                                        button.dataset.id
                                    )
                            );


                        const title =
                            item?.title ||
                            "this scholarship";


                        if (
                            !confirm(
                                `Delete "${title}"?`
                            )
                        ) {

                            return;
                        }


                        try {

                            await api(
                                "admin_delete",
                                "POST",
                                {
                                    type: "scholarship",

                                    id:
                                        Number(
                                            button.dataset.id
                                        )
                                }
                            );


                            alert(
                                "Scholarship deleted successfully."
                            );


                            await loadScholarships();


                        } catch (error) {

                            alert(
                                error.message
                            );
                        }
                    };
            });
    }



    // ==========================================
    // DATE FORMAT
    // ==========================================

    function formatDate(date) {

        if (!date) return "-";


        const value =
            new Date(
                date + "T00:00:00"
            );


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



    // ==========================================
    // ESCAPE HTML
    // ==========================================

    function escapeHtml(value) {

        const div =
            document.createElement("div");


        div.textContent =
            value;


        return div.innerHTML;
    }



    // ==========================================
    // MODAL
    // ==========================================

    const modal =
        document.getElementById(
            "scholarshipModal"
        );


    const addButton =
        document.getElementById(
            "addScholarshipBtn"
        );


    const closeButton =
        document.getElementById(
            "closeScholarshipModal"
        );


    const cancelButton =
        document.getElementById(
            "cancelScholarshipBtn"
        );


    function openModal() {

        if (!modal) return;

        modal.style.display =
            "flex";
    }


    function closeModal() {

        if (!modal) return;

        modal.style.display =
            "none";
    }


    if (addButton) {

        addButton.addEventListener(
            "click",
            openModal
        );
    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeModal
        );
    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeModal
        );
    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeModal();
                }
            }
        );
    }



    // ==========================================
    // CREATE SCHOLARSHIP
    // ==========================================

    const form =
        document.getElementById(
            "scholarshipForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const saveButton =
                    document.getElementById(
                        "saveScholarshipBtn"
                    );


                const payload = {

                    title:
                        document
                            .getElementById(
                                "scholarshipTitle"
                            )
                            ?.value.trim() || "",


                    provider:
                        document
                            .getElementById(
                                "scholarshipProvider"
                            )
                            ?.value.trim() || "",


                    category:
                        document
                            .getElementById(
                                "scholarshipCategory"
                            )
                            ?.value || "",


                    amount:
                        document
                            .getElementById(
                                "scholarshipAmount"
                            )
                            ?.value.trim() || "",


                    deadline:
                        document
                            .getElementById(
                                "scholarshipDeadline"
                            )
                            ?.value || "",


                    application_url:
                        document
                            .getElementById(
                                "scholarshipUrl"
                            )
                            ?.value.trim() || "",


                    description:
                        document
                            .getElementById(
                                "scholarshipDescription"
                            )
                            ?.value.trim() || "",


                    eligibility:
                        document
                            .getElementById(
                                "scholarshipEligibility"
                            )
                            ?.value.trim() || ""
                };


                try {

                    if (saveButton) {

                        saveButton.disabled =
                            true;

                        saveButton.textContent =
                            "Saving...";
                    }


                    await api(
                        "admin_scholarship_create",
                        "POST",
                        payload
                    );


                    alert(
                        "Scholarship created successfully."
                    );


                    form.reset();

                    closeModal();

                    await loadScholarships();


                } catch (error) {

                    alert(
                        error.message
                    );

                } finally {

                    if (saveButton) {

                        saveButton.disabled =
                            false;

                        saveButton.textContent =
                            "Save Scholarship";
                    }
                }
            }
        );
    }



    // ==========================================
    // FILTER EVENTS
    // ==========================================

    const search =
        document.getElementById(
            "scholarshipSearch"
        );


    if (search) {

        search.addEventListener(
            "input",
            applyFilters
        );
    }


    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            applyFilters
        );
    }


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyFilters
        );
    }



    // ==========================================
    // INITIALIZE
    // ==========================================

    async function init() {

        const isAdmin =
            await checkAdmin();


        if (!isAdmin) return;


        await loadScholarships();
    }


    init();

});