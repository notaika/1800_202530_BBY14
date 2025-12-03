import { db, auth } from "./firebaseConfig.js";
import { onAuthReady } from "./authentication.js";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

// get document ID from URL
function getRecipeIdFromUrl() {
  const params = new URL(window.location.href).searchParams;
  return params.get("id");
}

async function displayRecipeInfo() {
  const recipeId = getRecipeIdFromUrl();
  if (!recipeId) {
    const nameElement = document.getElementById("recipe-name");
    if (nameElement) nameElement.textContent = "Recipe not found.";
    return;
  }

  try {
    const recipeRef = doc(db, "recipe", recipeId);
    const recipeSnap = await getDoc(recipeRef);

    if (recipeSnap.exists()) {
      const recipe = recipeSnap.data();
      const recipeContent = document.getElementById("recipe-page-content");

      // Image + name
      document.getElementById("recipe-name").textContent =
        recipe.name || recipe.title;
      document.getElementById("recipe-image").src = recipe.imageUrl;

      // Timestamp formatting
      if (recipe.submittedTimestamp) {
        const currentTimeStamp = new Date(
          recipe.submittedTimestamp.seconds * 1000
        );
        const options = {
          month: "long",
          year: "numeric",
          day: "numeric",
        };
        const recipeTimestamp = currentTimeStamp.toLocaleDateString(
          "en-US",
          options
        );
        document.getElementById("recipe-timestamp").innerHTML = recipeTimestamp;
      }

      // Cooking item
      if (recipe.tags) {
        recipeContent.innerHTML += `
          <h3>Cooking Item</h3>
          <p id="recipe-preview-cook-item"></p>`;
        document.getElementById("recipe-preview-cook-item").innerHTML =
          recipe.tags;
      }

      // Description
      if (recipe.description) {
        recipeContent.innerHTML += `
          <h3>Description</h3>
          <p id="recipe-description"></p>`;
        document.getElementById("recipe-description").innerHTML =
          recipe.description;
      }

      // Difficulty
      if (recipe.difficulty) {
        recipeContent.innerHTML += `
          <h3>Difficulty</h3>
          <p id="recipe-difficulty"></p>`;
        document.getElementById("recipe-difficulty").innerHTML =
          recipe.difficulty;
      }

      // Prep time
      if (recipe.prepTime) {
        recipeContent.innerHTML += `
          <h3>Prep Time</h3>
          <p id="recipe-prep-time"></p>`;
        document.getElementById("recipe-prep-time").innerHTML =
          recipe.prepTime;
      }

      // Cook time
      if (recipe.cookTime) {
        recipeContent.innerHTML += `
          <h3>Cook Time</h3>
          <p id="recipe-cook-time"></p>`;
        document.getElementById("recipe-cook-time").innerHTML =
          recipe.cookTime;
      }

      // Ingredients
      if (recipe.ingredients) {
        recipeContent.innerHTML += `
          <h3>Ingredients</h3>
          <p id="recipe-ingredients"></p>`;
        document.getElementById("recipe-ingredients").innerHTML =
          recipe.ingredients;
      }

      // Instructions
      if (recipe.instructions) {
        recipeContent.innerHTML += `
          <h3>Instructions</h3>
          <p id="recipe-instructions"></p>`;
        document.getElementById("recipe-instructions").innerHTML =
          recipe.instructions;
      }

      // Author logic
      if (recipeSnap.exists()) {
        const recipe = recipeSnap.data();
        const authorId = recipe.submittedByUserID;

        let authorName = "Unknown User";
        let authorLinkHTML = "";

        if (authorId) {
          try {
            const userDocRef = doc(db, "users", authorId);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              authorName = `@${userData.username}`;
            }
          } catch (err) {
            console.error("Error fetching author name:", err);
          }
          authorLinkHTML = `<a href="/profile/${authorId}" class="author-link text-decoration-none fw-bold">${authorName}</a>`;
        } else {
          authorLinkHTML = `<span>by ${authorName}</span>`;
        }

        document.getElementById(
          "recipe-author"
        ).innerHTML = `by ${authorLinkHTML}`;

        // Auth-dependent UI
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            document.getElementById("recipe-save-container").innerHTML = `
              <button id="recipe-save" class="recipe-preview-save">
                <i id="recipe-save-icon" class="bi bi-heart"></i>
              </button>
              <button id="recipe-preview-edit" class="recipe-preview-edit" style="display: none;">
                <i class="bi bi-pencil"></i>
              </button>
            `;

            const id = recipeId;

            // Show edit + delete for owner
            if (recipe.submittedByUserID == user.uid) {
              linkEditButton(id);
              showDeleteButton(id);
            }

            try {
              const userRef = doc(db, "users", user.uid);
              const userSnap = await getDoc(userRef);

              if (userSnap.exists()) {
                const userSavedRecipes = userSnap.data().favouriteRecipeIDs;
                const entryNew = recipeCanSave(id, userSavedRecipes);

                document
                  .getElementById("recipe-save")
                  .addEventListener("click", () => {
                    savePreviewedRecipe(id, entryNew);
                  });
              }
            } catch (error) {
              console.error("Error retrieving user information: ", error);
            }
          }
        });
      }
    } else {
      document.getElementById("recipe-name").textContent = "Recipe not found.";
    }
  } catch (error) {
    console.error("Error loading recipe:", error);
    document.getElementById("recipe-name").textContent =
      "Error loading recipe.";
  }
}

async function savePreviewedRecipe(id, addEntry) {
  onAuthStateChanged(auth, async (user) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const savedArray = userSnap.data().favouriteRecipeIDs;

        if (savedArray.includes(id)) {
          if (!addEntry) {
            await updateDoc(userRef, { favouriteRecipeIDs: arrayRemove(id) });
            window.location.reload();
          } else {
            window.location.reload();
          }
        } else {
          if (addEntry) {
            await updateDoc(userRef, { favouriteRecipeIDs: arrayUnion(id) });
            window.location.reload();
          } else {
            window.location.reload();
          }
        }
      }
    } catch (error) {
      console.error("Error finding user: ", error);
    }
  });
}

function recipeCanSave(id, savedArray) {
  const savedIcon = document.getElementById("recipe-save-icon");
  if (savedArray.includes(id)) {
    savedIcon.classList.remove("bi-heart");
    savedIcon.classList.add("bi-heart-fill");
    return false;
  } else {
    return true;
  }
}

displayRecipeInfo();

// Connects the button to edit the recipe, only if the current user created the recipe.
function linkEditButton(id) {
  document.getElementById("recipe-preview-edit").style.display = "inline";
  document
    .getElementById("recipe-preview-edit")
    .addEventListener("click", () => {
      const url = "/editRecipe?id=" + id;
      window.location.href = url;
    });
}

// Delete recipe feature (owner only)
function showDeleteButton(id) {
  const deleteBtn = document.getElementById("recipe-delete");
  const overlay = document.getElementById("delete-confirm-overlay");
  const cancelBtn = document.getElementById("delete-cancel-btn");
  const confirmBtn = document.getElementById("delete-confirm-btn");

  if (!deleteBtn || !overlay || !cancelBtn || !confirmBtn) return;

  deleteBtn.classList.remove("d-none");

  deleteBtn.addEventListener("click", () => {
    overlay.hidden = false;
  });

  cancelBtn.addEventListener("click", () => {
    overlay.hidden = true;
  });

  confirmBtn.addEventListener("click", async () => {
    confirmBtn.disabled = true;

    try {
      await deleteDoc(doc(db, "recipe", id));

      // Always redirect to Home so the deleted recipe doesn't reappear in history
      window.location.href = "/profile";
    } catch (error) {
      console.error("Error deleting recipe: ", error);
      alert("Something went wrong while deleting this recipe. Please try again.");
      confirmBtn.disabled = false;
      overlay.hidden = true;
    }
  });
}
