document.addEventListener("DOMContentLoaded", () => {

    const API = "../backend/api.php";

    let allUsers = [];


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
    // ADMIN ACCESS CHECK
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

            console.error(
                "Admin access error:",
                error
            );

            window.location.href =
                "../login.html";

            return false;
        }
    }



    // ==========================================
    // LOAD USERS
    // ==========================================

    async function loadUsers() {

        const tbody =
            document.getElementById(
                "usersTableBody"
            );


        try {

            if (tbody) {

                tbody.innerHTML = `
                    <tr>
                        <td colspan="6"
                            style="text-align:center;">
                            Loading users...
                        </td>
                    </tr>
                `;
            }


            const data =
                await api("admin_users");


            allUsers =
                Array.isArray(data)
                    ? data
                    : [];


            updateStatistics();

            renderUsers(allUsers);


            console.log(
                "Users loaded:",
                allUsers
            );

        } catch (error) {

            console.error(
                "Load users error:",
                error
            );


            if (tbody) {

                tbody.innerHTML = `
                    <tr>
                        <td colspan="6"
                            style="text-align:center;">
                            Failed to load users.
                        </td>
                    </tr>
                `;
            }
        }
    }



    // ==========================================
    // UPDATE STATISTICS
    // ==========================================

    function updateStatistics() {

        const total =
            allUsers.length;


        const students =
            allUsers.filter(
                user => user.role === "student"
            ).length;


        const admins =
            allUsers.filter(
                user => user.role === "admin"
            ).length;


        const active =
            allUsers.filter(
                user => user.status === "active"
            ).length;


        setText(
            "totalUsers",
            total
        );


        setText(
            "totalStudents",
            students
        );


        setText(
            "totalAdmins",
            admins
        );


        setText(
            "activeUsers",
            active
        );
    }



    // ==========================================
    // SET TEXT
    // ==========================================

    function setText(id, value) {

        const element =
            document.getElementById(id);


        if (element) {

            element.textContent =
                value;
        }
    }



    // ==========================================
    // RENDER USERS
    // ==========================================

    function renderUsers(users) {

        const tbody =
            document.getElementById(
                "usersTableBody"
            );


        if (!tbody) return;


        if (users.length === 0) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6"
                        style="text-align:center;">
                        No users found.
                    </td>
                </tr>
            `;

            return;
        }


        tbody.innerHTML = "";


        users.forEach(user => {

            const row =
                document.createElement("tr");


            const statusClass =
                getStatusClass(
                    user.status
                );


            const isAdmin =
                user.role === "admin";


            const formattedRole =
                capitalize(
                    user.role
                );


            const formattedStatus =
                capitalize(
                    user.status
                );


            row.innerHTML = `

                <td>#${user.id}</td>

                <td>
                    ${escapeHtml(
                        user.full_name || ""
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        user.email || ""
                    )}
                </td>

                <td>
                    ${formattedRole}
                </td>

                <td>

                    <span class="status ${statusClass}">
                        ${formattedStatus}
                    </span>

                </td>

                <td>

                    <button
                        class="view-btn"
                        title="View User"
                        data-action="view"
                        data-id="${user.id}"
                    >
                        <i class="fa-solid fa-eye"></i>
                    </button>


                    ${isAdmin
                        ? ""
                        : `
                        <button
                            class="edit-btn"
                            title="${
                                user.status === "active"
                                    ? "Deactivate User"
                                    : "Activate User"
                            }"
                            data-action="status"
                            data-id="${user.id}"
                            data-status="${user.status}"
                        >
                            <i class="fa-solid ${
                                user.status === "active"
                                    ? "fa-user-slash"
                                    : "fa-user-check"
                            }"></i>
                        </button>

                        <button
                            class="delete-btn"
                            title="Delete User"
                            data-action="delete"
                            data-id="${user.id}"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>
                        `
                    }

                </td>
            `;


            tbody.appendChild(row);
        });


        addActionListeners();
    }



    // ==========================================
    // STATUS CLASS
    // ==========================================

    function getStatusClass(status) {

        switch (status) {

            case "active":
                return "approved";

            case "inactive":
                return "pending";

            case "suspended":
                return "rejected";

            default:
                return "pending";
        }
    }



    // ==========================================
    // CAPITALIZE
    // ==========================================

    function capitalize(value) {

        if (!value) return "";


        return (
            value.charAt(0).toUpperCase() +
            value.slice(1)
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
    // USER ACTION BUTTONS
    // ==========================================

    function addActionListeners() {

        document
            .querySelectorAll(
                "[data-action='view']"
            )
            .forEach(button => {

                button.onclick = () => {

                    const id =
                        Number(
                            button.dataset.id
                        );


                    const user =
                        allUsers.find(
                            item =>
                                Number(item.id) === id
                        );


                    if (!user) return;


                    alert(
                        "User Details\n\n" +
                        "Name: " +
                        (user.full_name || "") +
                        "\nEmail: " +
                        (user.email || "") +
                        "\nPhone: " +
                        (user.phone || "Not provided") +
                        "\nRole: " +
                        capitalize(user.role) +
                        "\nStatus: " +
                        capitalize(user.status)
                    );
                };
            });



        document
            .querySelectorAll(
                "[data-action='status']"
            )
            .forEach(button => {

                button.onclick =
                    async () => {

                        const id =
                            Number(
                                button.dataset.id
                            );


                        const currentStatus =
                            button.dataset.status;


                        const newStatus =
                            currentStatus === "active"
                                ? "inactive"
                                : "active";


                        const message =
                            newStatus === "active"
                                ? "Activate this user?"
                                : "Deactivate this user?";


                        if (!confirm(message)) {

                            return;
                        }


                        try {

                            await api(
                                "admin_user_status",
                                "POST",
                                {
                                    id: id,
                                    status: newStatus
                                }
                            );


                            alert(
                                "User status updated successfully."
                            );


                            await loadUsers();

                        } catch (error) {

                            alert(
                                error.message
                            );
                        }
                    };
            });



        document
            .querySelectorAll(
                "[data-action='delete']"
            )
            .forEach(button => {

                button.onclick =
                    async () => {

                        const id =
                            Number(
                                button.dataset.id
                            );


                        const user =
                            allUsers.find(
                                item =>
                                    Number(item.id) === id
                            );


                        const name =
                            user?.full_name ||
                            "this user";


                        if (
                            !confirm(
                                `Are you sure you want to delete ${name}?`
                            )
                        ) {

                            return;
                        }


                        try {

                            await api(
                                "admin_delete",
                                "POST",
                                {
                                    type: "user",
                                    id: id
                                }
                            );


                            alert(
                                "User deleted successfully."
                            );


                            await loadUsers();

                        } catch (error) {

                            alert(
                                error.message
                            );
                        }
                    };
            });
    }



    // ==========================================
    // SEARCH + FILTER
    // ==========================================

    function applyFilters() {

        const search =
            (
                document
                    .getElementById("userSearch")
                    ?.value || ""
            )
            .toLowerCase()
            .trim();


        const role =
            document
                .getElementById("roleFilter")
                ?.value || "all";


        const status =
            document
                .getElementById("statusFilter")
                ?.value || "all";


        const filteredUsers =
            allUsers.filter(user => {

                const userId =
                    String(user.id);


                const name =
                    (
                        user.full_name || ""
                    ).toLowerCase();


                const email =
                    (
                        user.email || ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    userId.includes(search) ||
                    name.includes(search) ||
                    email.includes(search);


                const matchesRole =
                    role === "all" ||
                    user.role === role;


                const matchesStatus =
                    status === "all" ||
                    user.status === status;


                return (
                    matchesSearch &&
                    matchesRole &&
                    matchesStatus
                );
            });


        renderUsers(
            filteredUsers
        );
    }



    // ==========================================
    // SEARCH EVENT
    // ==========================================

    const userSearch =
        document.getElementById(
            "userSearch"
        );


    if (userSearch) {

        userSearch.addEventListener(
            "input",
            applyFilters
        );
    }



    // ==========================================
    // ROLE FILTER EVENT
    // ==========================================

    const roleFilter =
        document.getElementById(
            "roleFilter"
        );


    if (roleFilter) {

        roleFilter.addEventListener(
            "change",
            applyFilters
        );
    }



    // ==========================================
    // STATUS FILTER EVENT
    // ==========================================

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
    // INITIAL LOAD
    // ==========================================

    async function init() {

        const isAdmin =
            await checkAdmin();


        if (!isAdmin) return;


        await loadUsers();
    }


    init();

});