// savedRecipes.js
// Responsibilities:
//  - Render the current user's saved (favourite) recipes
//  - Fetch recipe documents referenced by the user's saved IDs
//  - Reuse preview helpers to render recipe cards
import { db, auth } from "./firebaseConfig.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {updateRecipeCards} from "./preview.js";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // Read the current user's document to get saved recipe IDs
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const userSavedRecipes = userSnap.data().favouriteRecipeIDs;

        const savedRecipeCardHolder = document.getElementById("saved-recipe-list");
        const savedCardTemplate = document.getElementById("saved-card-template");

        if(userSavedRecipes.length > 0){

          userSavedRecipes.forEach(element => {

            // For each saved recipe ID, render a small card from a template
            addRecipeCard(element, savedRecipeCardHolder, savedCardTemplate);

            updateRecipeCards()
            
          });

          

        } else{

          document.getElementById("saved-recipe-list").innerHTML = `
          <h1>No saved recipes found!</h1>
          <p>Press the saved button to add a recipe to this list.</h>
          `

        }

      }
    } catch (error){

      console.error("User document not found: ", error);

    }
  }

  async function addRecipeCard(id, parentobject, cardTemplate){

    try{
      // Read recipe/{id} to populate the saved recipe card
      const recipesDocRef = doc(db, "recipe", id);
      const docSnap = await getDoc(recipesDocRef);
      

      if(docSnap.exists()){

        const currentRecipe = docSnap.data();

        let newcard = cardTemplate.content.cloneNode(true);

        newcard.querySelector(".card-title").innerHTML = currentRecipe.title || currentRecipe.name;
        newcard.querySelector(".saved-thumbnail").src = currentRecipe.imageUrl;

        newcard.querySelector(".recipe-button").setAttribute("recipeId", id);

        // Fetch author name from users/{submittedByUserID}
        var authorName = "deleted";
        const authorDocRef = doc(db, "users", currentRecipe.submittedByUserID);
        const authorSnap = await getDoc(authorDocRef);

        if(authorSnap.exists()){

          authorName = authorSnap.data().username;

          // Store author ID on the chip if we need to link to profile later
          newcard.querySelector(".author-chip").setAttribute("userId", currentRecipe.submittedByUserID);

        }
        newcard.querySelector(".author-chip").innerHTML = "@" + authorName;

        parentobject.appendChild(newcard);
        
        updateRecipeCards()

      }
    
    } catch (error){

      console.error("Recipe doc not found: ", error)

    }

  }

})