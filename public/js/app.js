import { onAuthReady, logoutUser } from "./authentication.js";
import { db, auth } from "./firebaseConfig.js";
import {
  doc,
  getDoc,
  getDocs,
  collection,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

onAuthReady(async (user) => {
  // all auth elements
  const navProfileLink = document.getElementById("nav-profile-link");
  // V-- Get the new header elements --V
  const headerLoginLink = document.getElementById("header-login-link");
  const headerLogoutButton = document.getElementById("header-logout-button");

  if (user) {
    // User is signed in.
    if (headerLoginLink) headerLoginLink.classList.add("d-none"); // Hide Login
    if (headerLogoutButton) {
      headerLogoutButton.classList.remove("d-none"); // Show Logout
      // Add click listener to the *header* logout button
      headerLogoutButton.addEventListener("click", () => {
        logoutUser();
      });
    }

    if (navProfileLink) {
      navProfileLink.href = "/profile";
    }

    try {
      // get  user document from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // 2. populate the elements with the user's data
        populateUserData(userData, user);
      } else {
        console.error("No user document found for logged-in user!");
      }

      displayRecipes(); // displays recipes from db
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  } else {
    // user is signed out...

    // show login and hide logout
    if (headerLoginLink) headerLoginLink.classList.remove("d-none");
    if (headerLogoutButton) headerLogoutButton.classList.add("d-none");
    console.log("No user signed in, redirecting to login.");

    displayRecipes(); // displays recipes from db

    // protect these pages and redirect to login if no user detected
    const currentPage = window.location.pathname;
    if (
      currentPage.includes("/profile") ||
      currentPage.includes("/create") ||
      currentPage.includes("/main")
    ) {
      console.log("No user signed in, redirecting to login.");
      window.location.href = "/login";
    }
  }
});

// find all elements with ids and fill elements w/ user data
function populateUserData(userData, authUser) {
  // get user's username
  // Use 'username' from your schema
  const name = userData.username || authUser.displayName;

  // seed main.ejs elems
  const userGreeting = document.getElementById("user-greeting");
  if (userGreeting) {
    userGreeting.textContent = `Hi, ${name}`;
  }

  const mainProfilePic = document.getElementById("profile-pic-main");
  if (mainProfilePic && userData.profilePicUrl) {
    mainProfilePic.src = userData.profilePicUrl;
  }

  // seed profile.ejs elems
  const profileTitle = document.getElementById("profile-title");
  if (profileTitle) {
    profileTitle.textContent = `${name}'s Cookbook`;
  }

  const profileBio = document.getElementById("profile-bio");
  if (profileBio) {
    profileBio.textContent = userData.bio || "No bio set.";
  }

  const profileProfilePic = document.getElementById("profile-pic-profile");
  if (profileProfilePic && userData.profilePicUrl) {
    profileProfilePic.src = userData.profilePicUrl;
  }
}

// dynamically displays recipes
async function displayRecipes() {
  //gets container in recipe.ejs
  const container = document.getElementById("recipe-card-container");
  if (!container) return; // don't run if container is not on page

  // get all documents from the "recipe" collection
  const querySnapshot = await getDocs(collection(db, "recipe"));

  const recipePromises = querySnapshot.docs.map(async (recipeDoc) => {
    const recipe = recipeDoc.data();
    const recipeId = recipeDoc.id;
    let authorName = "unknown";

    // fetch author for this specific recipe
    if (recipe.submittedByUserID) {
      try {
        const userDocRef = doc(db, "users", recipe.submittedByUserID);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          authorName = `@${userDocSnap.data().username}`;
        }
      } catch (err) {
        console.error("Error fetching author for card:", err);
      }
    }

    // container
    return `
      <div class="col">
        <div class="card h-100 overflow-hidden recipe-card">
          <a href="/recipe?id=${recipeId}" class="text-decoration-none">
            <img
              src="${recipe.imageUrl || "/assets/images/placeholder.png"}"
              class="card-img-top square-media"
              alt="${recipe.name}"
            />
            <div class="card-body py-2">
              <h6 class="card-title mb-1 text-dark">${recipe.name}</h6>
              <span class="author-chip">${authorName}</span>
            </div>
          </a>
        </div>
      </div>
    `;
  });

  // wait for all fetches and promises to finish
  const allCardsHtml = await Promise.all(recipePromises);

  // add all recipes to page
  container.innerHTML = allCardsHtml.join("");
}

// MAYVEE STUFF

// Wait until the HTML is fully loaded before running this code
document.addEventListener("DOMContentLoaded", () => {
  // Get important elements from the page
  const main = document.querySelector("main"); // the main screen content
  const nav = document.querySelector(".craft-stick-nav"); // bottom navbar
  const indicatorDot = nav?.querySelector(".nav-indicator"); // sliding dot

  // -------------------------
  // Animate page when it loads
  // -------------------------
  // Start invisible, then fade + slide in smoothly
  if (main) {
    main.classList.add("page-fade"); // initial hidden state
    requestAnimationFrame(() => {
      main.classList.add("page-active"); // fade in animation
    });
  }

  // -------------------------------------------------
  // Move the sliding dot under the correct active icon
  // -------------------------------------------------
  function moveIndicatorToActive(animate = true) {
    if (!nav || !indicatorDot) return;

    // Find the currently active navigation icon
    const activeItem = nav.querySelector(".nav-item.active");
    if (!activeItem) return;

    // Measure position of nav + active icon
    const navRect = nav.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    // Find the center of the active icon (left to right)
    const centerX = itemRect.left - navRect.left + itemRect.width / 2;

    // Move dot to that center position
    if (!animate) indicatorDot.style.transition = "none"; // no animation during first load
    indicatorDot.style.transform = `translateX(${centerX - 3}px) translateZ(0)`;

    // Re-enable smooth animation after initial load
    if (!animate)
      requestAnimationFrame(() => {
        indicatorDot.style.transition = "";
      });
  }

  // Position the sliding dot right away when the page loads
  requestAnimationFrame(() => moveIndicatorToActive(false));

  // Recalculate dot position if screen size changes (rotate phone, etc.)
  window.addEventListener("resize", () => moveIndicatorToActive(false));

  // --------------------------------------
  // Nav click: animate dot + fade out page
  // --------------------------------------
  document.querySelectorAll("a.nav-item").forEach((link) => {
    link.addEventListener("click", (e) => {
      // Do nothing if clicking the tab we're already on
      if (link.classList.contains("active")) return;

      // Stop instant jump to new page
      e.preventDefault();

      // Figure out where we are going
      const url = link.getAttribute("href");

      // Switch active tab styling visually
      nav
        .querySelectorAll("a.nav-item")
        .forEach((i) => i.classList.remove("active"));
      link.classList.add("active");

      // Move the sliding dot under new tab
      moveIndicatorToActive(true);

      // Fade out the page before leaving
      if (main) {
        main.classList.remove("page-active");
        main.classList.add("fade-out");
      }

      // After animation completes, load the new page
      setTimeout(() => {
        window.location.href = url;
      }, 250); // matches fade-out speed
    });
  });

});

