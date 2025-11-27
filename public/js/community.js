import { db, auth } from "./firebaseConfig.js";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Create New Community
const createCommunityForm = document.getElementById("create-community-form");

if (createCommunityForm) {
  createCommunityForm.addEventListener("submit", async (e) => {
    // stop page from refresh
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

      // if user created, update the user's profile with the new community id
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        communityId: docRef.id,
      });

      console.log("Community created with ID: ", docRef.id);
      alert("Community created successfully!");

      // redirect to this page once created
      window.location.href = "/community";
    } catch (error) {
      console.error("Error adding community: ", error);
      alert("Error creating community. See console for details.");
    }
  });
}

const communityContainer = document.getElementById("community-card-container");
// display communities from database onto community page
async function displayCommunities() {
  // make sure this only runs on community page
  if (!communityContainer) {
    return;
  }

  const communitiesRef = collection(db, "communities");

  try {
    // fetch all docs from communities collection
    const communitiesData = await getDocs(communitiesRef);
    let communityCard = "";

    // loop through all data and put into html cards
    communitiesData.forEach((commDoc) => {
      const community = commDoc.data();
      const communityId = commDoc.id;
      const communityMembersCount = community.membersUID.length;
      const communityMembers =
        communityMembersCount <= 1 ? "member" : "members";

      // crete community card structure with dynamic data!
      communityCard += `
        <div class="community-item col mb-4">
          <div class="card h-100 shadow-sm community-card">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${community.communityName}</h5>
              <p class="card-text">
                ${community.description}
              </p>
              <a href="/communities/${communityId}" class="btn btn-warning mt-auto fw-bold">View Community</a>
            </div>
            <div class="card-footer">
              <small class="text-body-secondary">
                <strong>${communityMembersCount}</strong> 
                ${communityMembers} 
                | <strong>0</strong> Recipes
              </small>
            </div>
          </div>
        </div>
      `;

      communityContainer.innerHTML = communityCard;
    });
  } catch (error) {
    console.error("Error fetching communities:", error);
  }
}

if (communityContainer) {
  displayCommunities();
  console.log("Success");
}
