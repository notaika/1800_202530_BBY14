// loginSignup.js
// Responsibilities:
//  - Wire up login & signup form submission
//  - Provide UI feedback (errors, button disabled state)
//  - Delegate actual auth operations to `authentication.js` (loginUser, signupUser)

// -----------------------------
// Imports (libraries / project modules)
// -----------------------------
import { loginUser, signupUser, authErrorMessage } from "./authentication.js";


// -----------------------------
// DOM References
// -----------------------------
// Centralized DOM lookups for easy reading and maintainability
const errorDiv = document.getElementById("auth-error");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");


// -----------------------------
// Helpers / UI utilities
// -----------------------------
// showError
// Display an authentication related error message in the UI.
// The message to display (supports empty to clear)
function showError(msg) {
  if (!errorDiv) return;
  errorDiv.textContent = msg || "";
  errorDiv.classList.remove("d-none");
}


// hideError
// Hide and clear the auth error UI element.
function hideError() {
  if (!errorDiv) return;
  errorDiv.classList.add("d-none");
  errorDiv.textContent = "";
}


// setSubmitDisabled
// Toggle submit button disabled state and show simple processing text.
// This provides consistent feedback for both login and signup forms.
function setSubmitDisabled(form, disabled) {
  const submitBtn = form?.querySelector('[type="submit"]');
  if (!submitBtn) return;

  submitBtn.disabled = disabled;

  // Keep button label contextual and deterministic
  if (disabled) {
    submitBtn.textContent = "Processing...";
  } else {
    submitBtn.textContent = form.id === "login-form" ? "Login" : "Create Account";
  }
}


// -----------------------------
// Form validation helpers
// -----------------------------
// validateLoginInputs
// Basic client-side validation for login fields.
function validateLoginInputs(email, password) {
  if (!email || !password) {
    return { ok: false, message: "Please enter your email and password." };
  }
  return { ok: true };
}


// validateSignupInputs
// Basic client-side validation for signup fields.
function validateSignupInputs(displayName, email, password) {
  if (!displayName || !email || !password) {
    return { ok: false, message: "Please fill in display name, email, and password." };
  }
  return { ok: true };
}


// -----------------------------
// Event handlers: Login
// -----------------------------
// Attach handler only when the form exists on the page
if (loginForm) {
  // onLoginSubmit
  // Handle login form submission: validate, call auth, show errors.
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;

    const valid = validateLoginInputs(email, password);
    if (!valid.ok) {
      showError(valid.message);
      return;
    }

    setSubmitDisabled(loginForm, true);

    try {
      // Delegates actual auth work to authentication.js (loginUser)
      await loginUser(email, password);
    } catch (err) {
      // authErrorMessage maps firebase errors -> user-friendly strings
      showError(authErrorMessage(err));
      console.error("Login failed:", err);
    } finally {
      setSubmitDisabled(loginForm, false);
    }
  });
}


// -----------------------------
// Event handlers: Signup
// -----------------------------
if (signupForm) {
  // onSignupSubmit
  // Handle signup form submission: validate, call auth, show errors.
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const displayName = signupForm.displayName.value.trim();
    const email = signupForm.email.value.trim();
    const password = signupForm.password.value;

    const valid = validateSignupInputs(displayName, email, password);
    if (!valid.ok) {
      showError(valid.message);
      return;
    }

    setSubmitDisabled(signupForm, true);

    try {
      // Delegates actual auth work to authentication.js (signupUser)
      await signupUser(displayName, email, password);
    } catch (err) {
      // authErrorMessage maps firebase errors -> user-friendly strings
      showError(authErrorMessage(err));
      console.error("Signup failed:", err);
    } finally {
      setSubmitDisabled(signupForm, false);
    }
  });
}
