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

// Wait until the HTML is fully loaded before running this code
document.addEventListener("DOMContentLoaded", () => {

  // --------------------------------------
  // Link recipe cards to recipe preview
  // --------------------------------------
  updateRecipeCards();

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

        //Set title
        document.getElementById("recipe-preview-title").innerHTML = currentRecipe.title || currentRecipe.name;

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

        //All values aside from: title and submittedByUserID are optional.

        //Set image
        if (currentRecipe.imageUrl){
          document.getElementById("recipe-preview-image").src = currentRecipe.imageUrl
        }

        //Formats date as (Month dd, yyyy)
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

        //Set description
        if (currentRecipe.description){
          recipePreviewContent.innerHTML = recipePreviewContent.innerHTML + `
          <h3>Description</h3>
          <p id="recipe-preview-description">Place holder</p>`
          document.getElementById("recipe-preview-description").innerHTML = currentRecipe.description;
        }

        //Set difficulty
        if (currentRecipe.difficulty){
          recipePreviewContent.innerHTML = recipePreviewContent.innerHTML + `
          <h3>Difficulty</h3>
          <p id="recipe-preview-difficulty">Place holder</p>`
          document.getElementById("recipe-preview-difficulty").innerHTML = currentRecipe.difficulty;
        }
        
        //Set prep time
        if(currentRecipe.prepTime){
          recipePreviewContent.innerHTML = recipePreviewContent.innerHTML + `
          <h3>Prep Time</h3>
          <p id="recipe-preview-prep-time">Place holder</p>`
          //We will need to format the time unit either on write or read.
          document.getElementById("recipe-preview-prep-time").innerHTML = currentRecipe.prepTime;
        }

        //Set cook time
        if(currentRecipe.cookTime){
          recipePreviewContent.innerHTML = recipePreviewContent.innerHTML + `
          <h3>Cook Time</h3>
          <p id="recipe-preview-cook-time">Place holder</p>`
          //We will need to format the time unit either on write or read.
          document.getElementById("recipe-preview-cook-time").innerHTML = currentRecipe.cookTime;
        }

        //Set ingredients
        if (currentRecipe.ingredients){
          recipePreviewContent.innerHTML = recipePreviewContent.innerHTML + `
          <h3>Ingredients</h3>
          <p id="recipe-preview-ingredients">Place holder</p>`
          document.getElementById("recipe-preview-ingredients").innerHTML = currentRecipe.ingredients;
        }
        
        //Set instructions
        if(currentRecipe.instructions){
          recipePreviewContent.innerHTML = recipePreviewContent.innerHTML + `
          <h3>Instructions</h3>
          <p id="recipe-preview-instructions">Place holder</p>`
          document.getElementById("recipe-preview-instructions").innerHTML = currentRecipe.instructions;
        }

        //Determine if the user has all ready saved this recipe.
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              // reference to the user document
              const userRef = doc(db, "users", user.uid);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                const userSavedRecipes = userSnap.data().favouriteRecipeIDs;
                const entryNew = recipeCanSave(id, userSavedRecipes);
                //Link save button to savePreviewedRecipe().
                document.getElementById("recipe-preview-save").addEventListener('click', (event) => {
                  
                  savePreviewedRecipe(id, entryNew);
                
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

        //Ensure that saved recipe list has not been updated on another window.
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



export function updateRecipeCards(){

  // --------------------------------------
  // Link recipe cards to recipe preview
  // --------------------------------------

    //Should be called after recipe card is loaded.

    

  document.querySelectorAll(".recipe-button").forEach(function(b){

    b.addEventListener('click', (event) => {

      //All items that are on top of the card should have the css property pointer-events: none.
      const recipeID = event.target.getAttribute("recipeid");
      openRecipePreview(recipeID);

    })
  })

}

