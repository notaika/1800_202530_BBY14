import { auth, db } from "/js/firebaseConfig.js";
import {
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const profileForm = document.getElementById("edit-profile-form");
const usernameInput = document.getElementById("profile-username");
const firstNameInput = document.getElementById("profile-first-name");
const lastNameInput = document.getElementById("profile-last-name");
const bioInput = document.getElementById("profile-bio");
const picUrlInput = document.getElementById("profile-pic-url");
const messageEl = document.getElementById("form-message");

let currentUser;
let userDocRef;

// listening  for auth state changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    userDocRef = doc(db, "users", user.uid);

    // load existing data onto form
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        usernameInput.value = data.username || "";
        firstNameInput.value = data.firstName || "";
        lastNameInput.value = data.lastName || "";
        bioInput.value = data.bio || "";
        picUrlInput.value = data.profilePicUrl || "";
      } else {
        console.log("No user document found to edit!");
      }
    } catch (e) {
      console.error("Error loading user data:", e);
      messageEl.textContent = "Error loading your data.";
    }
  } else {
    // no user? redirect to login page
    console.log("No user signed in.");
    window.location.href = "/login";
  }
});

// save data and update to db on submit
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUser) return;

  // get update values from the form
  const newProfileData = {
    username: usernameInput.value,
    firstName: firstNameInput.value,
    lastName: lastNameInput.value,
    bio: bioInput.value,
    profilePicUrl: picUrlInput.value,
  };

  try {
    // update document in Firestore
    await updateDoc(userDocRef, newProfileData);

    messageEl.textContent = "Profile saved successfully!";
    messageEl.className = "alert alert-success";

    // automatically go back to /profile
    setTimeout(() => {
      window.location.href = "/profile";
    }, 2000);
  } catch (e) {
    console.error("Error updating profile: ", e);
    messageEl.textContent = "Error saving profile. Please try again.";
    messageEl.className = "alert alert-danger";
  }
});
