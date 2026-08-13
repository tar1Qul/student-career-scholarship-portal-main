// ==========================================
// STUDENT PROFILE - FULL DYNAMIC VERSION
// ==========================================

const PROFILE_API = "../backend/api.php";

document.addEventListener("DOMContentLoaded", loadStudentProfile);

async function loadStudentProfile() {
  try {
    const response = await fetch(`${PROFILE_API}?action=profile`, {
      method: "GET",
      credentials: "include",
    });

    const result = await response.json();

    console.log("Profile API Response:", result);

    if (!result.ok || !result.data) {
      console.error("Unable to load student profile.");
      return;
    }

    const student = result.data;

    console.log("Logged-in Student:", student);

    // ==========================================
    // NAME
    // ==========================================

    document.querySelectorAll("[data-student-name]").forEach((element) => {
      element.textContent = student.full_name || "Student Name";
    });
    const nameInput = document.querySelector("[data-student-name-input]");

    if (nameInput) {
      nameInput.value = student.full_name || "";
    }

    const emailInput = document.querySelector("[data-student-email-input]");

    if (emailInput) {
      emailInput.value = student.email || "";
    }

    // ==========================================
    // EMAIL
    // ==========================================

    document.querySelectorAll("[data-student-email]").forEach((element) => {
      element.textContent = student.email || "Not provided";
    });

    // ==========================================
    // PHONE
    // ==========================================

    setInputValue("[data-student-phone]", student.phone);

    // ==========================================
    // UNIVERSITY
    // ==========================================

    setInputValue("[data-student-university]", student.university);

    // ==========================================
    // DEPARTMENT
    // ==========================================

    setInputValue("[data-student-department]", student.department);

    // ==========================================
    // CGPA
    // ==========================================

    setInputValue("[data-student-cgpa]", student.cgpa);

    // ==========================================
    // GRADUATION YEAR
    // ==========================================

    setInputValue("[data-student-graduation]", student.graduation_year);

    // ==========================================
    // BIO / CAREER INTEREST
    // ==========================================

    const bioField = document.querySelector("[data-student-bio]");

    if (bioField) {
      bioField.value = student.bio || "";
    }

    // ==========================================
    // SKILLS
    // ==========================================

    loadSkills(student.skills);

    // ==========================================
    // PROFILE IMAGE
    // ==========================================

    loadProfileImages(student.profile_image);

    // ==========================================
    // HEADER INFORMATION
    // ==========================================

    const departmentText = document.querySelector(
      "[data-student-department-text]",
    );

    if (departmentText) {
      departmentText.textContent = student.department
        ? `${student.department} Student`
        : "Student";
    }

    console.log("Student profile loaded successfully.");
  } catch (error) {
    console.error("Student profile loading error:", error);
  }
}

// ==========================================
// SET INPUT VALUE
// ==========================================

function setInputValue(selector, value) {
  const element = document.querySelector(selector);

  if (!element) return;

  element.value =
    value !== null && value !== undefined && value !== "" ? value : "";
}

// ==========================================
// LOAD SKILLS
// ==========================================

function loadSkills(skills) {
  const container = document.querySelector("[data-student-skills]");

  if (!container) return;

  container.innerHTML = "";

  if (!skills) {
    container.innerHTML = `
            <span class="skill-tag">
                No skills added
            </span>
        `;

    return;
  }

  let skillList = [];

  // If database stores JSON
  try {
    const parsed = JSON.parse(skills);

    if (Array.isArray(parsed)) {
      skillList = parsed;
    }
  } catch (error) {
    // If database stores comma-separated text
    skillList = String(skills)
      .split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill !== "");
  }

  if (skillList.length === 0) {
    container.innerHTML = `
            <span class="skill-tag">
                No skills added
            </span>
        `;

    return;
  }

  skillList.forEach((skill) => {
    const span = document.createElement("span");

    span.className = "skill-tag";

    span.textContent = skill;

    container.appendChild(span);
  });
}

// ==========================================
// LOAD PROFILE IMAGE
// ==========================================

function loadProfileImages(profileImage) {
  const images = document.querySelectorAll("[data-student-profile-image]");

  if (!images.length) return;

  // No image stored in database
  if (!profileImage) {
    images.forEach((image) => {
      image.style.display = "none";
    });

    return;
  }

  let imagePath = String(profileImage).trim();

  // Absolute URL
  if (
    !imagePath.startsWith("http://") &&
    !imagePath.startsWith("https://") &&
    !imagePath.startsWith("data:")
  ) {
    if (imagePath.startsWith("../")) {
      // Already relative
    } else {
      imagePath = "../" + imagePath;
    }
  }

  images.forEach((image) => {
    image.src = imagePath;

    image.style.display = "block";
  });
}
