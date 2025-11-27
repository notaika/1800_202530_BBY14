import { db, auth } from "./firebaseConfig.js";
import {
  collection, // reference collection
  addDoc, // create new doc
  serverTimestamp, // created at timestamp
  doc, //reference a specific document
  getDoc, // fetch a single document
  updateDoc, // update fields in a document
  arrayUnion, // add to an array (field)
  arrayRemove, // remove from an array (field)
  query, // create a query (for recipes)
  where, // filter a query
  getDocs, // fetch multiple documents (for recipes q)
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ~~~~ CREATE NEW COMMUNITY ~~~~
const createCommunityForm = document.getElementById("create-community-form");

// if the community form is present
if (createCommunityForm) {
  createCommunityForm.addEventListener("submit", async (e) => {
    // stop page from refresh
    e.preventDefault();

    // check user authentication state
    const user = auth.currentUser;

    // if no user logged in, send an error and navigate back to login page
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
      // add new community onto firebase db
      const docRef = await addDoc(
        collection(db, "communities"),
        newCommunityDoc
      );

      // if user created, add community onto user community list on database
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        communityIDs: arrayUnion(docRef.id),
      });

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

// ~~~~ DISPLAY COMMUNITIES ~~~~
const communityContainer = document.getElementById("community-card-container");
// display communities from database onto community page
async function displayCommunities() {
  // make sure this only runs on community page
  if (!communityContainer) {
    return;
  }

  const commRef = collection(db, "communities");

  try {
    // fetch all docs from communities collection
    const commSnap = await getDocs(commRef);
    let communityCard = "";

    // loop through all data and put into html cards
    commSnap.forEach((commDoc) => {
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

// ~~~~ SINGLE COMMUNITY PAGE ~~~~
const singleCommContainer = document.getElementById(
  "single-community-container"
);

if (singleCommContainer) {
  // checks user credentials
  onAuthStateChanged(auth, async (user) => {
    // if valid... run loadCommunity
    await loadCommunity(user);
  });
}

async function loadCommunity(user) {
  // 1. grab the community ID from the URL
  // 2. grab the path name, split url where '/'. the last part should be the id - so just pop it out
  const pathParts = window.location.pathname.split("/");
  const communityId = pathParts.pop();

  // no id? cancel out this function
  if (!communityId) return;

  const titleEl = document.getElementById("community-title");
  const descEl = document.getElementById("community-desc");
  const actionContainer = document.getElementById("community-action-container");
  const recipesGrid = document.getElementById("community-recipes-grid");
  const communityCreator = document.getElementById("community-creator");

  try {
    // get community info
    const commRef = doc(db, "communities", communityId);
    const commSnap = await getDoc(commRef);

    if (!commSnap.exists()) {
      titleEl.textContent = "Community Not Found";
      return;
    }

    const commData = commSnap.data();
    const commCreatorID = commData.createdBy;

    // populate community page information
    titleEl.textContent = commData.communityName;
    descEl.textContent = commData.description;

    if (commCreatorID) {
      try {
        const creatorDocRef = doc(db, "users", commCreatorID);
        const creatorSnap = await getDoc(creatorDocRef);

        if (creatorSnap.exists()) {
          const creatorData = creatorSnap.data();

          communityCreator.textContent = `@${creatorData.username}`;
        } else {
          communityCreator.textContent = "@unknown";
        }
      } catch (error) {
        console.error("Error fetching creator:", error);
        communityCreator.textContent = "@unknown";
      }
    }

    // button handling for join and leave
    if (user) {
      const isMember = commData.membersUID.includes(user.uid);

      // if user is a member, show leave community button
      // if user is NOT a member, show join community butten
      const btn = document.createElement("button");
      btn.className = isMember
        ? "btn text-light berry-red fw-bold"
        : "btn btn-warning fw-bold";
      btn.textContent = isMember ? "Leave Community" : "Join Community";

      btn.onclick = async () => {
        btn.disabled = true;
        const userDocRef = doc(db, "users", user.uid);

        try {
          // if user is a member (leave...)
          if (isMember) {
            // remove user UID from community members array
            await updateDoc(commRef, {
              membersUID: arrayRemove(user.uid),
            });

            // also remove community ID from user property
            await updateDoc(userDocRef, {
              communityIDs: arrayRemove(communityId),
            });
            alert("You have left the community.");
          } else {
            // if user is not a member (join...)
            await updateDoc(commRef, {
              // arrayUnion (add user ID to community member list)
              membersUID: arrayUnion(user.uid),
            });
            // set community ID to user property
            await updateDoc(userDocRef, {
              communityIDs: arrayUnion(communityId),
            });
            alert("You have joined the community!");
          }

          // reloading page to update UI
          window.location.reload();
        } catch (error) {
          console.error(error);
          alert("Action failed.");
          btn.disabled = false;
        }
      };

      actionContainer.innerHTML = "";
      actionContainer.appendChild(btn);
    } else {
      actionContainer.innerHTML = `<a href="/login" class="btn btn-warning fw-bold">Login to Join</a>`;
    }

    // get the recipes from this community
    // select all recipes where user communityId is this.communityId
    const recipesRef = collection(db, "recipe");
    const q = query(recipesRef, where("communityId", "==", communityId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      recipesGrid.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-basket3 fs-1 text-muted"></i>
          <p class="mt-3 text-muted">No recipes shared yet.</p>
        </div>`;
      return;
    }

    let recipesHtml = "";
    querySnapshot.forEach((doc) => {
      const r = doc.data();
      recipesHtml += `
        <div class="col-md-4 col-sm-6">
          <div class="card h-100 shadow-sm recipe-card">
            <a href="/recipeDetails?id=${
              doc.id
            }" class="text-decoration-none text-dark">
              <img 
                src="${r.imageUrl || "/assets/images/placeholder.png"}" 
                class="card-img-top square-media" 
                alt="${r.name}"
              >
              <div class="card-body">
                <h5 class="card-title">${r.name}</h5>
                <p class="card-text small text-muted text-truncate">${
                  r.description
                }</p>
              </div>
            </a>
          </div>
        </div>
      `;
    });
    recipesGrid.innerHTML = recipesHtml;
  } catch (error) {
    console.error("Error loading community page:", error);
  }
}
