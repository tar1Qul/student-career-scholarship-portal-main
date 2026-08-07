// ===============================
// Recruiter Portal JavaScript
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    // ===============================
    // Elements
    // ===============================

    const titleInput = document.querySelector('input[placeholder*="Junior"]');
    const organizationInput = document.querySelector('input[placeholder*="Stripe"]');
    const locationInput = document.querySelector('input[placeholder*="Berlin"]');

    const categorySelect = document.querySelector("select");
    const deadlineInput = document.querySelector('input[type="date"]');

    const textareas = document.querySelectorAll("textarea");

    const submitBtn = document.querySelector(".submit-btn");
    const draftBtn = document.querySelector(".draft-btn");

    const badge = document.querySelector(".floating-badge");
    const badgeClose = document.querySelector(".close-badge");

    // ===============================
    // Minimum Date = Today
    // ===============================

    if (deadlineInput) {

        const today = new Date();

        const yyyy = today.getFullYear();

        const mm = String(today.getMonth() + 1).padStart(2, "0");

        const dd = String(today.getDate()).padStart(2, "0");

        deadlineInput.min = `${yyyy}-${mm}-${dd}`;

    }

    // ===============================
    // Floating Badge Close
    // ===============================

    if (badgeClose) {

        badgeClose.addEventListener("click", () => {

            badge.style.opacity = "0";
            badge.style.transform = "translateY(20px)";

            setTimeout(() => {

                badge.style.display = "none";

            }, 250);

        });

    }

    // ===============================
    // Focus Animation
    // ===============================

    const fields = document.querySelectorAll("input, textarea, select");

    fields.forEach(field => {

        field.addEventListener("focus", () => {

            field.parentElement.style.transition = ".25s";
            field.parentElement.style.transform = "translateY(-2px)";

        });

        field.addEventListener("blur", () => {

            field.parentElement.style.transform = "translateY(0px)";

        });

    });

    // ===============================
    // Validation
    // ===============================

    function validateForm() {

        let valid = true;

        fields.forEach(field => {

            field.style.borderColor = "#e5e7eb";

        });

        if (titleInput.value.trim() === "") {

            titleInput.style.borderColor = "#ef4444";

            valid = false;

        }

        if (organizationInput.value.trim() === "") {

            organizationInput.style.borderColor = "#ef4444";

            valid = false;

        }

        if (locationInput.value.trim() === "") {

            locationInput.style.borderColor = "#ef4444";

            valid = false;

        }

        if (deadlineInput.value === "") {

            deadlineInput.style.borderColor = "#ef4444";

            valid = false;

        }

        textareas.forEach(area => {

            if (area.value.trim() === "") {

                area.style.borderColor = "#ef4444";

                valid = false;

            }

        });

        return valid;

    }

    // ===============================
    // Submit
    // ===============================

    if (submitBtn) {

        submitBtn.addEventListener("click", () => {

            if (!validateForm()) {

                alert("Please complete all required fields.");

                return;

            }

            submitBtn.disabled = true;

            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

            setTimeout(() => {

                submitBtn.innerHTML =
                    '<i class="fa-solid fa-circle-check"></i> Submitted';

                submitBtn.style.background = "#16a34a";

                alert("Opportunity submitted successfully!");

            }, 1800);

        });

    }

    // ===============================
    // Save Draft
    // ===============================

    if (draftBtn) {

        draftBtn.addEventListener("click", () => {

            const draft = {

                title: titleInput.value,

                category: categorySelect.value,

                organization: organizationInput.value,

                location: locationInput.value,

                deadline: deadlineInput.value,

                description: textareas[0].value,

                eligibility: textareas[1].value

            };

            localStorage.setItem(
                "opportunityDraft",
                JSON.stringify(draft)
            );

            alert("Draft saved successfully.");

        });

    }

    // ===============================
    // Load Draft Automatically
    // ===============================

    const savedDraft = localStorage.getItem("opportunityDraft");

    if (savedDraft) {

        const draft = JSON.parse(savedDraft);

        titleInput.value = draft.title || "";

        categorySelect.value = draft.category || "Internship";

        organizationInput.value = draft.organization || "";

        locationInput.value = draft.location || "";

        deadlineInput.value = draft.deadline || "";

        textareas[0].value = draft.description || "";

        textareas[1].value = draft.eligibility || "";

    }

    // ===============================
    // Ctrl + S = Save Draft
    // ===============================

    document.addEventListener("keydown", e => {

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {

            e.preventDefault();

            draftBtn.click();

        }

    });

    // ===============================
    // Responsive Sidebar (Future Ready)
    // ===============================

    function checkWidth() {

        if (window.innerWidth < 768) {

            document.body.classList.add("mobile");

        } else {

            document.body.classList.remove("mobile");

        }

    }

    checkWidth();

    window.addEventListener("resize", checkWidth);

});