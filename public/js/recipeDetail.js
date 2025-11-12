import { db } from "./firebaseConfig.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// get document ID from URLS
function getRecipeIdFromUrl() {
  const params = new URL(window.location.href).searchParams;
  return params.get("id");
}

async function displayRecipeInfo() {
  const recipeId = getRecipeIdFromUrl();
  if (!recipeId) {
    // fixed error with printing message for missing content when no id provided
    const nameElement = document.getElementById("recipe-name");
    if (nameElement) nameElement.textContent = "Recipe not found.";
    return;
  }

  try {
    // get doc recipe from firestore
    const recipeRef = doc(db, "recipe", recipeId);
    const recipeSnap = await getDoc(recipeRef);

    if (recipeSnap.exists()) {
      const recipe = recipeSnap.data();

      // seed elements on recipe.ejs
      document.getElementById("recipe-name").textContent = recipe.name;
      document.getElementById("recipe-image").src = recipe.imageUrl;
      document.getElementById("recipe-description").textContent =
        recipe.description;
      document.getElementById("recipe-ingredients").textContent =
        recipe.ingredients;
      document.getElementById("recipe-instructions").textContent =
        recipe.instructions;

      // == *** need to remember to do logic for author!!

      let authorName = "unknown";
      if (recipe.submittedByUserID) {
        try {
          const userDocRef = doc(db, "users", recipe.submittedByUserID);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            authorName = `@${userDocSnap.data().username}`;
          }
        } catch (userError) {
          console.error("Error fetching author:", userError);
        }
      }

      document.getElementById("recipe-author").textContent = `by ${authorName}`;
    } else {
      document.getElementById("recipe-name").textContent = "Recipe not found.";
    }
  } catch (error) {
    console.error("Error loading recipe:", error);
    document.getElementById("recipe-name").textContent =
      "Error loading recipe.";
  }
}

displayRecipeInfo();
