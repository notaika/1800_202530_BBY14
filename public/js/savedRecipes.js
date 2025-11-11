import { onAuthReady, logoutUser } from "./authentication.js";
import { db, auth } from "./firebaseConfig.js";
import {
  doc,
  getDoc,
  getDocs,
  collection,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {updateRecipeCards} from "./preview.js";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // reference to the user document
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const userSavedRecipes = userSnap.data().favouriteRecipeIDs;

        const savedRecipeCardHolder = document.getElementById("saved-recipe-list");
        const savedCardTemplate = document.getElementById("saved-card-template");

        if(userSavedRecipes.length > 0){

          userSavedRecipes.forEach(element => {

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
      
      const recipesDocRef = doc(db, "recipe", id);
      const docSnap = await getDoc(recipesDocRef);
      

      if(docSnap.exists()){

        const currentRecipe = docSnap.data();

        let newcard = cardTemplate.content.cloneNode(true);

        newcard.querySelector(".card-title").innerHTML = currentRecipe.title;
        newcard.querySelector(".saved-thumbnail").src = currentRecipe.imageUrl;

        newcard.querySelector(".recipe-button").setAttribute("recipeId", id);

        //Author name needs to be retrived from users collection.
        var authorName = "deleted";
        const authorDocRef = doc(db, "users", currentRecipe.submittedByUserID);
        const authorSnap = await getDoc(authorDocRef);

        if(authorSnap.exists()){

          authorName = authorSnap.data().username;

          //Author ID is saved incase we need to link to their profile.
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