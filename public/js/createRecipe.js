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
    //textareas need to have all instances of \n replaced with "<br>"
    const title = document.getElementById("create-name").value;
    const description = document.getElementById("create-description").value.replace(/\n/g, "<br>");
    const ingredients = document.getElementById("create-ingredients").value.replace(/\n/g, "<br>");
    const instructions = document.getElementById("create-instructions").value.replace(/\n/g, "<br>");

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
        imageUrl: imageFile, 
        communityId: "", // need to add logic for this later
      };

      // adds document to recipe collection
      // const docRef = await addDoc(collection(db, "recipe"), newRecipeDoc);
      // console.log("Recipe created with ID: ", docRef.id);

      // alert("Recipe created successfully!");
      // window.location.href = `/recipe?id=${docRef.id}`; // auto navigates to recipe page

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
      const imageReference = "data:image/jpeg;base64," + base64String

      var finalWidth = 100;
      var finalHeight = 100;

      //Determine the aspect ratio of the image.
      var imgFull = new Image();

      imgFull.onload = function(){

        //A firebase document can store a maximum of 1 mB, a max area of 200000 creates a file around 500 kB in size.
        const maxImageArea = 200000;

        const originalWidth = this.width;
        const originalHeight = this.height;

        const originalArea = originalWidth * originalHeight;

        if(originalArea > maxImageArea){

          const aspectRatio = originalWidth / originalHeight;

          finalWidth = Math.floor(Math.sqrt(aspectRatio * maxImageArea));
          finalHeight = Math.floor(Math.sqrt(maxImageArea / aspectRatio));


        } else {

          finalWidth = originalWidth;
          finalHeight = originalHeight;

        }

        resizeBase64Image(imageReference, finalWidth, finalHeight).then(resized=>{

          updateImage(resized);

          imageFile = resized;

        });
      }

      imgFull.src = e.target.result;

    }

    reader.readAsDataURL(file);
    
  } else {
    
    imageFile = ""
  }
}

//Image size likely needs to be reduced due to Firebase's file size constraints.
function resizeBase64Image(originalImage, newWidth, newHeight){
    return new Promise((resolve, reject)=>{

        const canvas = document.createElement("canvas");
        canvas.width = newWidth;
        canvas.height = newHeight;

        let context = canvas.getContext("2d");
        let img = document.createElement("img");

        img.src = originalImage;

        img.onload = function () {
            context.scale(newWidth/img.width,  newHeight/img.height);
            context.drawImage(img, 0, 0); 
            resolve(canvas.toDataURL());               
        }
    });
}

//Whenever you change a images source, set it to: "data:image/png;base64," + imageURL
function updateImage(imageSrc){

  const createImage = document.getElementById("create-image");

  createImage.src =  imageSrc;

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




