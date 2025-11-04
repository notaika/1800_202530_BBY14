import { loginUser, signupUser, authErrorMessage } from "./authentication.js";

// helpers
const errorDiv = document.getElementById("auth-error");

function showError(msg) {
  if (!errorDiv) return;
  errorDiv.textContent = msg || "";
  errorDiv.classList.remove("d-none");
}

function hideError() {
  if (!errorDiv) return;
  errorDiv.classList.add("d-none");
  errorDiv.textContent = "";
}

function setSubmitDisabled(form, disabled) {
  const submitBtn = form?.querySelector('[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = disabled;
    submitBtn.textContent = disabled
      ? "Processing..."
      : form.id === "login-form"
      ? "Login"
      : "Create Account";
  }
}

// event listeners

// find's login form (login.ejs)
const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;

    if (!email || !password) {
      showError("Please enter your email and password.");
      return;
    }

    setSubmitDisabled(loginForm, true);

    try {
      await loginUser(email, password);
    } catch (err) {
      showError(authErrorMessage(err));
      console.error(err);
    } finally {
      setSubmitDisabled(loginForm, false);
    }
  });
}

// find's signup form (signup.ejs)
const signupForm = document.getElementById("signup-form");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const displayName = signupForm.displayName.value.trim();
    const email = signupForm.email.value.trim();
    const password = signupForm.password.value;

    if (!displayName || !email || !password) {
      showError("Please fill in display name, email, and password.");
      return;
    }

    setSubmitDisabled(signupForm, true);

    try {
      await signupUser(displayName, email, password);
    } catch (err) {
      showError(authErrorMessage(err)); // from error map in authentication
      console.error(err);
    } finally {
      setSubmitDisabled(signupForm, false);
    }
  });
}
