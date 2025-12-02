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
        previewImg.src =
          data.profilePicUrl || "/assets/images/profile-pic-placeholder.jpg";
      } else {
        console.log("No user doc found to edit.");
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

  if (!currentUser) {
    return;
  }

  // if user uploaded new file, use it else, use default
  const finalPicUrl = uploadedImageBase64 || previewImg.src;

  // get update values from the form
  const newProfileData = {
    username: usernameInput.value,
    firstName: firstNameInput.value,
    lastName: lastNameInput.value,
    bio: bioInput.value,
    profilePicUrl: finalPicUrl,
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

const fileInput = document.getElementById("profileFile");
const previewImg = document.getElementById("profile-preview-img");
let uploadedImageBase64 = "";

if (fileInput) {
  fileInput.addEventListener("change", handleFileSelect);
}

function handleFileSelect(event) {
  const file = event.target.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const imageReference = e.target.result;

      const imgFull = new Image();
      imgFull.onload = function () {
        const maxImageArea = 200000;
        const originalWidth = this.width;
        const originalHeight = this.height;
        const originalArea = originalWidth * originalHeight;

        let finalWidth = originalWidth;
        let finalHeight = originalHeight;

        if (originalArea > maxImageArea) {
          const aspectRatio = originalWidth / originalHeight;
          finalWidth = Math.floor(Math.sqrt(aspectRatio * maxImageArea));
          finalHeight = Math.floor(Math.sqrt(maxImageArea / aspectRatio));
        }

        // resizes and compresses image
        resizeBase64Image(imageReference, finalWidth, finalHeight).then(
          (resized) => {
            updateImage(resized);
            uploadedImageBase64 = resized;
          }
        );
      };

      imgFull.src = e.target.result;
    };

    reader.readAsDataURL(file);
  } else {
    uploadedImageBase64 = "";
  }
}

// taken code from Quinn on create recipe (thanks quinn)
function resizeBase64Image(originalImage, newWidth, newHeight) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = newWidth;
    canvas.height = newHeight;

    const context = canvas.getContext("2d");
    const img = new Image();
    img.src = originalImage;

    img.onload = function () {
      context.scale(newWidth / img.width, newHeight / img.height);
      context.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
  });
}

function updateImage(imageSrc) {
  previewImg.src = imageSrc;
}
