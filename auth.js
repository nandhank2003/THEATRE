// =============================
// 🎬 MALABAR CINEHUB AUTH UTILITY
// =============================

const USER_STORAGE_KEY = "MALABAR_CINEHUB_USER";

/**
 * Retrieves the current user from localStorage.
 * @returns {object | null} The user object if logged in, otherwise null.
 */
function getCurrentUser() {
  try {
    const userJSON = localStorage.getItem(USER_STORAGE_KEY);
    if (!userJSON) return null;

    const user = JSON.parse(userJSON);
    // Basic validation: check for token and loggedIn status
    if (user && user.loggedIn && user.token) {
      return user;
    }
    return null;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    // Clear corrupted data
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

/**
 * Checks if a user is logged in and redirects to the login page if not.
 * @param {Event} e - The event object from the click handler.
 * @returns {boolean} - True if the user is logged in, false otherwise.
 */
function requireLogin(e) {
  if (!getCurrentUser()) {
    e.preventDefault(); // Stop navigation
    alert("Please log in to book tickets.");
    window.location.href = "/login-form/login.html";
    return false;
  }
  return true;
}