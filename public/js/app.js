import { onAuthReady, logoutUser } from "./authentication.js";
import { db, auth } from "./firebaseConfig.js";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  updateDoc ,
  arrayUnion, 
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

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

  // --------------------------------------
  // Link recipe cards to recipe preview
  // --------------------------------------
  document.querySelectorAll(".recipe-button").forEach(function(b){

    b.addEventListener('click', (event) => {

      //All items that are on top of the card should have the css property pointer-events: none.
      const recipeID = event.target.getAttribute("recipeid");
      openRecipePreview(recipeID);

    })
  })

  //Save original state of preview.ejs
  const recipeOriginal = document.getElementById("recipe-preview").innerHTML;

  async function openRecipePreview(id){
    
    try{
      
      const recipesDocRef = doc(db, "recipe", id);
      const docSnap = await getDoc(recipesDocRef);
      

      if(docSnap.exists()){

        const currentRecipe = docSnap.data();
        const recipePreview = document.getElementById("recipe-preview");
        
        if(recipeOriginal){
          //Avoids duplicate information
          recipePreview.innerHTML = recipeOriginal;

        }
        
        const recipePreviewContent = document.getElementById("recipe-preview-content");
        recipePreview.style.display = "block";

        document.getElementById("recipe-preview-title").innerHTML = currentRecipe.title;

        //Author name needs to be retrived from users collection.
        var authorName = "deleted";
        const authorDocRef = doc(db, "users", currentRecipe.submittedByUserID);
        const authorSnap = await getDoc(authorDocRef);

        if(authorSnap.exists()){

          authorName = authorSnap.data().username;

          //Author ID is saved incase we need to link to their profile.
          document.getElementById("recipe-preview-author").setAttribute("userId", currentRecipe.submittedByUserID);

        }
        document.getElementById("recipe-preview-author").innerHTML = "@" + authorName;


        //All values aside from: name and submittedByUserID are optional.
        if (currentRecipe.imageUrl){

          document.getElementById("recipe-preview-image").src = currentRecipe.imageUrl

        }

        if (currentRecipe.submittedTimestamp){

          //Date() takes miliseconds as a input.
          const currentTimeStamp = new Date(currentRecipe.submittedTimestamp.seconds * 1000);

          //Format of date, we may want to standardize this somehow.
          const options = {
            month: "long",
            year: "numeric",
            day: "numeric"
          }
          const recipeTimestamp = currentTimeStamp.toLocaleDateString("en-US", options);
          
          document.getElementById("recipe-preview-timestamp").innerHTML = recipeTimestamp;

        }

        if (currentRecipe.description){

          recipePreviewContent.innerHTML = recipePreviewContent.innerHTML + `
          <h3>Description</h3>
          <p id="recipe-preview-description">Place holder</p>`

          document.getElementById("recipe-preview-description").innerHTML = currentRecipe.description;
        }

        if (currentRecipe.difficulty){

          recipePreviewContent.innerHTML = recipePreviewContent.innerHTML + `
          <h3>Difficulty</h3>
          <p id="recipe-preview-difficulty">Place holder</p>`

          document.getElementById("recipe-preview-difficulty").innerHTML = currentRecipe.difficulty;
        }

        if(currentRecipe.prepTime){

          recipePreviewContent.innerHTML = recipePreviewContent.innerHTML + `
          <h3>Prep Time</h3>
          <p id="recipe-preview-prep-time">Place holder</p>`

          //We will need to format the time unit either on write or read.
          document.getElementById("recipe-preview-prep-time").innerHTML = currentRecipe.prepTime;
          
        }

        if (currentRecipe.ingredients){

          recipePreviewContent.innerHTML = recipePreviewContent.innerHTML + `
          <h3>Ingredients</h3>
          <p id="recipe-preview-ingredients">Place holder</p>`

          document.getElementById("recipe-preview-ingredients").innerHTML = currentRecipe.ingredients;
        }
        
        if(currentRecipe.instructions){

          recipePreviewContent.innerHTML = recipePreviewContent.innerHTML + `
          <h3>Instructions</h3>
          <p id="recipe-preview-instructions">Place holder</p>`

          document.getElementById("recipe-preview-instructions").innerHTML = currentRecipe.instructions;
        }

        //Determine if the user has allready saved this recipe.
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              // reference to the user document
              const userRef = doc(db, "users", user.uid);
              const userSnap = await getDoc(userRef);

              if (userSnap.exists()) {
                const userData = userSnap.data();

                const userSavedRecipes = userSnap.data().favouriteRecipeIDs;
                console.log(userSavedRecipes);

                //Link save button to savePreviewedRecipe().
                //console.log(recipeCanSave(id, userSavedRecipes))

                const newEntry = recipeCanSave(id, userSavedRecipes);

                document.getElementById("recipe-preview-save").addEventListener('click', (event) => {
                  
                  savePreviewedRecipe(id, newEntry);
                
                })  
              }
            
            } catch(error) {
              console.error("Error retreiving user information: ",error)
            }
          }
        })

      } else {
        console.warn("Recipe not found: ", id)
      }

      //Link the back button of recipe preview, must be done after recipe-preview.innerHTML is set to recipeOriginal
      document.getElementById("recipe-preview-back").addEventListener('click', (event) => {
        
        closeRecipePreview();
      
      })   

       

      function recipeCanSave(id, savedArray){
        //Returns true if id is not present in savedArray.
        const previewSavedIcon = document.getElementById("recipe-preview-save-icon");

        if(savedArray.includes(id)){
          
          previewSavedIcon.classList.remove("bi-bookmark");
          previewSavedIcon.classList.add("bi-bookmark-check");

          return false;

        } else{

          return true;

        }

      }
      

    } catch (error){
    console.error("Error previewing recipe ", error);
  }

  }

  function closeRecipePreview(){
    const recipePreview = document.getElementById("recipe-preview");
    recipePreview.style.display = "none";

  }

  async function savePreviewedRecipe(id, addEntry){

    onAuthStateChanged(auth, async (user) => {

      try {
        // reference to the user document
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {

          const savedArray = userSnap.data().favouriteRecipeIDs;

          if(savedArray.includes(id)){

            //Should be removing a existing entry.
            if(!addEntry){

              const newSavedList = savedArray.filter(function(currentRecipe) {
                return currentRecipe !== id;
              })
              

              await updateDoc(userRef, {favouriteRecipeIDs : arrayRemove(id)});

              openRecipePreview(id);

            } else{

              console.error("Recipe not found saved");
              openRecipePreview(id);

            }

          } else{

            //Should be adding a new entry.
            if(addEntry){
              console.log("New saved pushed")
              await updateDoc(userRef, {favouriteRecipeIDs : arrayUnion(id)});

              openRecipePreview(id);

            } else{

              console.error("Recipe found allready saved");
              openRecipePreview(id);

            }

          }

        }
      
      }catch (error){

        console.error("Error finding user: ", error);

      }

    })

  }

});

