import { db, auth } from "./firebaseConfig.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const createForm = document.querySelector(".create-form");
const submitButton = document.getElementById("create-submit");

if (submitButton) {
  submitButton.addEventListener("click", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      console.log("No user logged in!");
      alert("You must be logged in to create a recipe.");
      return;
    }

    // get form values
    const title = document.getElementById("create-name").value;
    const description = document.getElementById("create-description").value;
    const ingredients = document.getElementById("create-ingredients").value;
    const instructions = document.getElementById("create-instructions").value;

    try {
      // build new recipe object onto firebase
      const newRecipeDoc = {
        name: title,
        description: description,
        ingredients: ingredients,
        instructions: instructions,
        prepTime: "",
        cookTime: "",
        difficulty: "Medium",
        submittedByUserID: user.uid,
        submittedTimestamp: serverTimestamp(), // from demo
        imageUrl:
          "https://images.unsplash.com/photo-1650092194571-d3c1534562be?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170", // Placeholder
        communityId: "", // need to add logic for this later
      };

      // adds document to recipe collection
      const docRef = await addDoc(collection(db, "recipe"), newRecipeDoc);
      console.log("Recipe created with ID: ", docRef.id);

      alert("Recipe created successfully!");
      window.location.href = `/recipe?id=${docRef.id}`; // auto navigates to recipe page
    } catch (error) {
      console.error("Error adding recipe: ", error);
      alert("Error creating recipe. See console for details.");
    }
  });
}
