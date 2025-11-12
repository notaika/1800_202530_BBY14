import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        populateProfilePage(userData);
      } else {
        console.error("No user document found for logged-in user!");
      }

      displayUserRecipes(user.uid);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  } else {
    console.log("No user signed in.");
    window.location.href = "/login";
  }
});

function populateProfilePage(userData) {
  const profileTitle = document.getElementById("profile-title");
  if (profileTitle) {
    profileTitle.textContent = `${userData.username}'s Cookbook`;
  }

  const profileFirstName = document.getElementById("profile-full-name");
  if (profileFirstName) {
    profileFirstName.textContent = `${userData.firstName} ${userData.lastName}`;
  }

  const profileBio = document.getElementById("profile-bio");
  if (profileBio) {
    profileBio.textContent = userData.bio || "No bio set.";
  }

  const profileProfilePic = document.getElementById("profile-pic-profile");
  if (profileProfilePic && userData.profilePicUrl) {
    profileProfilePic.src = userData.profilePicUrl;
  }

  const profileUserCommunity = document.getElementById("user-community");
  if (profileUserCommunity) {
    if (profileUserCommunity.textContent.trim() === "") {
      profileUserCommunity.classList.add("small", "fst-italic");
      profileUserCommunity.textContent = "has yet to join a community...";
    }
  }
}

// populate the profile grid
async function displayUserRecipes(userId) {
  const gridContainer = document.getElementById("post-content-grid");
  if (!gridContainer) return;

  const recipesRef = collection(db, "recipe");
  const q = query(recipesRef, where("submittedByUserID", "==", userId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    gridContainer.innerHTML =
      "<div class='col-12'><p class='p-3 text-center'>You haven't posted any recipes yet.</p></div>";
    return;
  }

  let allPostsHtml = "";
  querySnapshot.forEach((doc) => {
    const recipe = doc.data();
    const recipeId = doc.id;

    allPostsHtml += `
      <div class="post col-4">
        <a href="/recipe?id=${recipeId}">
          <img
            src="${
              recipe.imageUrl || "/assets/images/profile-pic-placeholder.jpg"
            }"
            class="post-img square-media rounded" 
            alt="${recipe.name}" />
        </a>
      </div>
    `;
  });

  gridContainer.innerHTML = allPostsHtml;
}
