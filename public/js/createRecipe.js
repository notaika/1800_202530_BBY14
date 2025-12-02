import { onAuthReady, logoutUser } from "./authentication.js";
import { db, auth } from "./firebaseConfig.js";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const communityPrefab = document.getElementById("create-community-template");
const communityDropdown = document.getElementById("create-community-list");

// Add community options to the dropdown
onAuthReady(async (user) => {
  const usersDocRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(usersDocRef);

  if (docSnap.exists()) {
    const userData = docSnap.data();
    const userCommunities = userData.communityIDs;

    userCommunities.forEach((element) => {
      getCommunity(element);
    });
  }
});

async function getCommunity(element) {
  const communityDocRef = doc(db, "communities", element);
  const communitySnap = await getDoc(communityDocRef);

  if (communitySnap.exists()) {
    const communityData = communitySnap.data();

    let newOption = communityPrefab.content.cloneNode(true);

    newOption.querySelector(".create-community-label").innerHTML +=
      communityData.communityName;
    newOption.querySelector(".create-community-option").value = element;

    communityDropdown.appendChild(newOption);
  }
}

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
    const description = document
      .getElementById("create-description")
      .value.replace(/\n/g, "<br>");
    const ingredients = document
      .getElementById("create-ingredients")
      .value.replace(/\n/g, "<br>");
    const instructions = document
      .getElementById("create-instructions")
      .value.replace(/\n/g, "<br>");

    const difficulty = document.querySelector(
      "input[name=create-dificulty]:checked"
    ).value;

    const prepTime = formatTime(
      document.querySelector("input[name=create-prep-time]:checked").value
    );
    const cookTime = formatTime(
      document.querySelector("input[name=create-cook-time]:checked").value
    );

    const implementDropdown = document.getElementById("create-item-list");
    const cookingImplement =
      implementDropdown.options[implementDropdown.selectedIndex].value;

    // community integration - aika
    var userCommunityId = [];

    var checkedCommunities = document.querySelectorAll(
      "input[name=create-community-check]:checked"
    );

    if (checkedCommunities.length > 0) {
      checkedCommunities.forEach((element) => {
        userCommunityId.push(element.value);
      });
    }

    try {
      const userDoc = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDoc);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        if (userData.communityId) {
          userCommunityId = userData.communityId;
        }
      }

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
        communityId: userCommunityId, // need to add logic for this later
        tags: cookingImplement,
      };

      // adds document to recipe collection
      const docRef = await addDoc(collection(db, "recipe"), newRecipeDoc);
      console.log("Recipe created with ID: ", docRef.id);

      alert("Recipe created successfully!");
      window.location.href = `/recipeDetails?id=${docRef.id}`; // auto navigates to recipe page
      // console.error("You have not uncommented those lines on createRecipe.js Do that ")

      console.log(newRecipeDoc);
    } catch (error) {
      console.error("Error adding recipe: ", error);
      alert("Error creating recipe. See console for details.");
    }
  });
}

//Save inputed image as base 64 string.
const addImageButton = document.getElementById("create-add-button");
if (addImageButton) {
  addImageButton.addEventListener("change", handleFileSelect);
}
function handleFileSelect(event) {
  var file = event.target.files[0];

  if (file) {
    var reader = new FileReader();

    reader.onload = function (e) {
      var base64String = e.target.result.split(",")[1];
      const imageReference = "data:image/jpeg;base64," + base64String;

      var finalWidth = 100;
      var finalHeight = 100;

      //Determine the aspect ratio of the image.
      var imgFull = new Image();

      imgFull.onload = function () {
        //A firebase document can store a maximum of 1 mB, a max area of 200000 creates a file around 500 kB in size.
        const maxImageArea = 200000;

        const originalWidth = this.width;
        const originalHeight = this.height;

        const originalArea = originalWidth * originalHeight;

        if (originalArea > maxImageArea) {
          const aspectRatio = originalWidth / originalHeight;

          finalWidth = Math.floor(Math.sqrt(aspectRatio * maxImageArea));
          finalHeight = Math.floor(Math.sqrt(maxImageArea / aspectRatio));
        } else {
          finalWidth = originalWidth;
          finalHeight = originalHeight;
        }

        resizeBase64Image(imageReference, finalWidth, finalHeight).then(
          (resized) => {
            updateImage(resized);

            imageFile = resized;
          }
        );
      };

      imgFull.src = e.target.result;
    };

    reader.readAsDataURL(file);
  } else {
    imageFile = "";
  }
}

//Image size likely needs to be reduced due to Firebase's file size constraints.
function resizeBase64Image(originalImage, newWidth, newHeight) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = newWidth;
    canvas.height = newHeight;

    let context = canvas.getContext("2d");
    let img = document.createElement("img");

    img.src = originalImage;

    img.onload = function () {
      context.scale(newWidth / img.width, newHeight / img.height);
      context.drawImage(img, 0, 0);
      resolve(canvas.toDataURL());
    };
  });
}

//Whenever you change a images source, set it to: "data:image/png;base64," + imageURL
function updateImage(imageSrc) {
  const createImage = document.getElementById("create-image");

  createImage.src = imageSrc;
}

function formatTime(timeInMin) {
  let minuteAmount = 0;
  let hourAmount = 0;

  if (timeInMin >= 60) {
    hourAmount = Math.floor(timeInMin / 60);
    minuteAmount = timeInMin % 60;

    if (hourAmount > 1) {
      return hourAmount + " hours " + minuteAmount + " minutes";
    } else {
      return hourAmount + " hour " + minuteAmount + " minutes";
    }
  } else if (timeInMin > 0) {
    return timeInMin + " minutes";
  } else {
    return "";
  }
}
