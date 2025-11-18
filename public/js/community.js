import { db, auth } from "./firebaseConfig.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const createCommunityForm = document.getElementById("create-community-form");

if (createCommunityForm) {
  createCommunityForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // check user authentication state
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to create a community.");
      window.location.href = "/login";
      return;
    }

    // get values from form
    const name = document.getElementById("community-name").value.trim();
    const description = document
      .getElementById("community-description")
      .value.trim();

    // if community name and description empty, cancel operation
    if (!name || !description) {
      alert("Please fill in all fields.");
      return;
    }

    // create new community object
    const newCommunityDoc = {
      communityName: name,
      description: description,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      // initialize the user with creator id
      membersUID: [user.uid],
    };

    try {
      // add onto firebase db
      const docRef = await addDoc(
        collection(db, "communities"),
        newCommunityDoc
      );

      console.log("Community created with ID: ", docRef.id);
      alert("Community created successfully!");

      // redirect to this page once created
      window.location.href = "/communities";
    } catch (error) {
      console.error("Error adding community: ", error);
      alert("Error creating community. See console for details.");
    }
  });
}
