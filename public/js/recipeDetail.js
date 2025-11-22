import { db, auth } from "./firebaseConfig.js";
import { onAuthReady} from "./authentication.js";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion, 
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

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
      const recipeContent = document.getElementById("recipe-page-content");

      // seed elements on recipe.ejs
      document.getElementById("recipe-name").textContent = recipe.name || recipe.title;
      document.getElementById("recipe-image").src = recipe.imageUrl;

      //Formats date as (Month dd, yyyy)
      if (recipe.submittedTimestamp){

        //Date() takes miliseconds as a input.
        const currentTimeStamp = new Date(recipe.submittedTimestamp.seconds * 1000);

        //Format of date, we may want to standardize this somehow.
        const options = {
          month: "long",
          year: "numeric",
          day: "numeric"
        }
        const recipeTimestamp = currentTimeStamp.toLocaleDateString("en-US", options);
        
        document.getElementById("recipe-timestamp").innerHTML = recipeTimestamp;
      }

      //Cooking Item
      if (recipe.tags){
        recipeContent.innerHTML = recipeContent.innerHTML + `
        <h3>Cooking Item</h3>
        <p id="recipe-preview-cook-item">Place holder</p>`
        document.getElementById("recipe-preview-cook-item").innerHTML = recipe.tags;
      }

      //Set description
      if (recipe.description){
        recipeContent.innerHTML = recipeContent.innerHTML + `
        <h3>Description</h3>
        <p id="recipe-description">Place holder</p>`
        document.getElementById("recipe-description").innerHTML = recipe.description;
      }

      //Set difficulty
      if (recipe.difficulty){
        recipeContent.innerHTML = recipeContent.innerHTML + `
        <h3>Difficulty</h3>
        <p id="recipe-difficulty">Place holder</p>`
        document.getElementById("recipe-difficulty").innerHTML = recipe.difficulty;
      }
      
      //Set prep time
      if(recipe.prepTime){
        recipeContent.innerHTML = recipeContent.innerHTML + `
        <h3>Prep Time</h3>
        <p id="recipe-prep-time">Place holder</p>`
        //We will need to format the time unit either on write or read.
        document.getElementById("recipe-prep-time").innerHTML = recipe.prepTime;
      }

      //Set cook time
      if(recipe.cookTime){
        recipeContent.innerHTML = recipeContent.innerHTML + `
        <h3>Cook Time</h3>
        <p id="recipe-cook-time">Place holder</p>`
        //We will need to format the time unit either on write or read.
        document.getElementById("recipe-cook-time").innerHTML = recipe.cookTime;
      }

      //Set ingredients
      if (recipe.ingredients){
        recipeContent.innerHTML = recipeContent.innerHTML + `
        <h3>Ingredients</h3>
        <p id="recipe-ingredients">Place holder</p>`
        document.getElementById("recipe-ingredients").innerHTML = recipe.ingredients;
      }
      
      //Set instructions
      if(recipe.instructions){
        recipeContent.innerHTML = recipeContent.innerHTML + `
        <h3>Instructions</h3>
        <p id="recipe-instructions">Place holder</p>`
        document.getElementById("recipe-instructions").innerHTML = recipe.instructions;
      }

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

    onAuthStateChanged(auth, async (user) => {

        //Only show save button if user is logged in
        if(user){

          document.getElementById("recipe-save-container").innerHTML = `

            <button id="recipe-save" class="recipe-preview-save">
            <i id="recipe-save-icon" class="bi bi-heart"></i>
            </button>

            `;

            const id = recipeId
          
          try {
            // reference to the user document
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              
              const userSavedRecipes = userSnap.data().favouriteRecipeIDs;
              const entryNew = recipeCanSave(id, userSavedRecipes);

              //Link save button to savePreviewedRecipe().
              document.getElementById("recipe-save").addEventListener('click', (event) => {

                savePreviewedRecipe(id, entryNew);
              
              })  
            }
          
          } catch(error) {
            console.error("Error retreiving user information: ",error)
          }
            

        }

      })

  } catch (error) {
    console.error("Error loading recipe:", error);
    document.getElementById("recipe-name").textContent =
      "Error loading recipe.";
  }
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
            window.location.reload();
          } else{

            console.error("Recipe not found saved");
            window.location.reload();
          }
        } else{
          //Should be adding a new entry.
          if(addEntry){
            
            await updateDoc(userRef, {favouriteRecipeIDs : arrayUnion(id)});
            window.location.reload();
          } else{

            console.error("Recipe found allready saved");
            window.location.reload();
          }
        }
      }
    
    }catch (error){
      console.error("Error finding user: ", error);
    }
  })
}


function recipeCanSave(id, savedArray){
  //Returns true if id is not present in savedArray.
  const savedIcon = document.getElementById("recipe-save-icon");
  if(savedArray.includes(id)){
    
    savedIcon.classList.remove("bi-heart");
    savedIcon.classList.add("bi-heart-fill");

    return false;

  } else{

    return true;

  }
}



displayRecipeInfo();


