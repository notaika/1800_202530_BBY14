// profile.js
// Responsibilities:
//  - Populate the user's profile page and feed
//  - Fetch user's recipes and communities from Firestore
//  - Wire small UI interactions (switching between grid & communities)
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
import { updateRecipeCards } from "./preview.js";

// Watch authentication state. When a user signs in we fetch the user's
// document and populate the profile; if there's no signed-in user we
// redirect to the login page.
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // Read the user's Firestore document at `users/{uid}`. This provides
      // static profile fields (username, name, bio, profilePicUrl) used by
      // populateProfilePage below.
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Populate the top-of-page profile fields (title, fullname, bio,
        // avatar) from the user document.
        populateProfilePage(userData);
      } else {
        console.error("No user document found for logged-in user!");
      }

      // By default show the user's recipe grid. The function below queries
      // the `recipe` collection where `submittedByUserID == user.uid`.
      displayUserRecipes(user.uid);

      // Wire the UI buttons for switching views: Communities and Grid.
      // These are client-side interactions that call the functions below.
      const communityBtn = document.getElementById("community-btn");
      if (communityBtn) {
        communityBtn.addEventListener("click", (e) => {
          e.preventDefault();
          displayUserCommunities(user.uid);
        });
      }

      const profileGridBtn = document.getElementById("profile-grid-btn");
      if (profileGridBtn) {
        profileGridBtn.addEventListener("click", (e) => {
          e.preventDefault();
          displayUserRecipes(user.uid);
        });
      }
    } catch (error) {
      // Surface errors to the console for debugging (network / Firestore
      // permission issues are the most common causes here).
      console.error("Error fetching user data:", error);
    }
  } else {
    // No authenticated user, redirect to login so the user can sign in.
    console.log("No user signed in.");
    window.location.href = "/login";
  }
});

// Render static profile fields from the `users/{uid}` document (read-only)
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
    profileUserCommunity.textContent = "";
  }
}

// Populate the profile grid with recipes for this user (reads `recipe` where submittedByUserID == userId)
async function displayUserRecipes(userId) {
  const gridContainer = document.getElementById("post-content-grid");
  if (!gridContainer) return;

  // Clear container and reset class to row
  gridContainer.innerHTML = "";
  gridContainer.className = "row g-1";

  const recipesRef = collection(db, "recipe");
  const q = query(recipesRef, where("submittedByUserID", "==", userId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    gridContainer.innerHTML =
      "<div class='col-12'><p class='p-3 text-center'>You haven't posted any recipes yet.</p></div>";
    return;
  }

  // Build simple 3-column grid of recipe thumbnails
  let allPostsHtml = "";
  querySnapshot.forEach((doc) => {
    const recipe = doc.data();
    const recipeId = doc.id;

    allPostsHtml += `
      <div class="post col-4 recipe-button" recipeId="${recipeId}">
          <img
            src="${
              recipe.imageUrl || "/assets/images/profile-pic-placeholder.jpg"
            }"
            class="post-img square-media rounded" 
            alt="${recipe.name}" />
      </div>
    `;
  });

  // Inject markup and rebind preview/card interactions
  gridContainer.innerHTML = allPostsHtml;
  updateRecipeCards();
}

// Display communities this user belongs to (reads `communities` where membersUID array-contains userId)
async function displayUserCommunities(userId) {
  const gridContainer = document.getElementById("post-content-grid");
  if (!gridContainer) return;

  // Clear and show a small spinner while loading
  gridContainer.innerHTML =
    "<div class='col-12 text-center'><div class='spinner-border text-success' role='status'><span class='visually-hidden'>Loading...</span></div></div>";

  // style container
  gridContainer.className = "g-4";

  try {
    const communitiesRef = collection(db, "communities");
    // query for communities where  membersUID array contains the userId
    const q = query(
      communitiesRef,
      where("membersUID", "array-contains", userId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      gridContainer.innerHTML =
        "<div class='col-12'><p class='p-3 text-center'>You haven't joined any communities yet.</p></div>";
      return;
    }

    // Build cards using Promise.all over docs (kept async map for consistency)
    const communityPromises = querySnapshot.docs.map(async (commDoc) => {
      const community = commDoc.data();
      const communityId = commDoc.id;
      const communityMembersCount = community.membersUID.length;
      const communityMembers =
        communityMembersCount <= 1 ? "member" : "members";

      // build the community card
      return `
        <div class="community-item col mt-3">
          <div class="card h-100 shadow-sm community-card">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${community.communityName}</h5>
              <p class="card-text small text-truncate">${community.description}</p>
              <a href="/communities/${communityId}" class="btn btn-warning mt-auto fw-bold btn-sm">View Community</a>
            </div>
            <div class="card-footer">
              <small class="text-body-secondary">
                <strong>${communityMembersCount}</strong> ${communityMembers} 
              </small>
            </div>
          </div>
        </div>
      `;
    });

    const allCards = await Promise.all(communityPromises);
    gridContainer.innerHTML =
      `<h2 class="profile-title text-dark fw-bold">Your Communities</h2>` +
      allCards.join("");
  } catch (error) {
    console.error("Error fetching user communities:", error);
    gridContainer.innerHTML =
      "<div class='col-12'><p class='p-3 text-center text-danger'>Error loading communities.</p></div>";
  }
}
