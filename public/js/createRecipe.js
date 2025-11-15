import { db, auth } from "./firebaseConfig.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const createForm = document.querySelector(".create-form");
const submitButton = document.getElementById("create-submit");

var imageFile = "";

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

    const difficulty = document.querySelector("input[name=create-dificulty]:checked").value;

    const prepTime = formatTime(document.getElementById("create-prep-time").value);
    const cookTime = formatTime(document.getElementById("create-cook-time").value);

    try {
      // build new recipe object onto firebase
      const newRecipeDoc = {
        name: title,
        description: description,
        ingredients: ingredients,
        instructions: instructions,
        prepTime: prepTime,
        cookTime: cookTime,
        difficulty: difficulty,
        submittedByUserID: user.uid,
        submittedTimestamp: serverTimestamp(), // from demo
        imageUrl: imageFile, // Placeholder
        communityId: "", // need to add logic for this later
      };

      // adds document to recipe collection
      const docRef = await addDoc(collection(db, "recipe"), newRecipeDoc);
      console.log("Recipe created with ID: ", docRef.id);

      alert("Recipe created successfully!");
      window.location.href = `/recipe?id=${docRef.id}`; // auto navigates to recipe page

      console.log(newRecipeDoc)
    } catch (error) {
      console.error("Error adding recipe: ", error);
      alert("Error creating recipe. See console for details.");
    }
  });
}

//Save inputed image as base 64 string.
document.getElementById("create-add-button").addEventListener("change", handleFileSelect);
function handleFileSelect(event){

  var file = event.target.files[0];

  if (file) {

    var reader = new FileReader();
    
    reader.onload = function (e) {

      var base64String = e.target.result.split(',')[1];

      imageFile = base64String;

      updateImage(imageFile)

    }

    reader.readAsDataURL(file);
    
  } else {
    
    imageFile = ""
  }
}

//Whenever you change a images source, set it to: "data:image/png;base64," + imageURL
function updateImage(imageSrc){

  const createImage = document.getElementById("create-image");

  createImage.src =  "data:image/png;base64," + imageSrc;

}

function formatTime(timeInMin){

  let minuteAmount = 0;
  let hourAmount = 0;

  if (timeInMin >= 60){

    hourAmount = Math.floor(timeInMin / 60);
    minuteAmount = timeInMin % 60;

    if (hourAmount > 1){

      return hourAmount + " hours " + minuteAmount + " minutes";

    } else{

      return hourAmount + " hour " + minuteAmount + " minutes"; 

    }

  } else if (timeInMin > 0){

    return timeInMin + " minutes";

  } else{
    return "";
  }

}




