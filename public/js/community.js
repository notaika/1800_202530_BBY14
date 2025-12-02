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

      // console.log("Community created with ID: ", docRef.id);
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
const searchInput = document.getElementById("community-search");

// store all fetched communities onto global variable once page loads
// this is used for dynamic filtering
let allCommunities = [];

// helper function to render cards
function renderCommunities(communitiesList) {
  if (!communityContainer) return;

  if (communitiesList.length === 0) {
    communityContainer.innerHTML = `<div class="col-12 text-center py-5">No communities found matching your search.</div>`;
    return;
  }

  let allCardsHtml = "";

  communitiesList.forEach((community) => {
    const communityId = community.id;
    const communityMembersCount = community.membersUID
      ? community.membersUID.length
      : 0;
    const communityMembersLabel =
      communityMembersCount === 1 ? "Member" : "Members";

    const buttonText = "View Community";

    allCardsHtml += `
        <div class="community-item col mb-4">
            <div class="card h-100 shadow-sm community-card">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${community.communityName}</h5>
                <p class="card-text">${community.description}</p>
                <a href="/communities/${communityId}" class="btn btn-warning mt-auto fw-bold">${buttonText}</a>
            </div>
            <div class="card-footer">
                <small class="text-body-secondary">
                <strong>${communityMembersCount}</strong> ${communityMembersLabel} 
                </small>
            </div>
            </div>
        </div>
        `;
  });

  communityContainer.innerHTML = allCardsHtml;
}

// ~~~~ FETCH AND INITIAL DISPLAY LOGIC ~~~~

async function fetchAndStoreCommunities() {
  if (!communityContainer) {
    return;
  }

  const commRef = collection(db, "communities");
  try {
    const commSnap = await getDocs(commRef);

    // after fetching data, store it onto global array allCommunities
    allCommunities = commSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // display all initially
    renderCommunities(allCommunities);
  } catch (error) {
    console.error("Error fetching communities:", error);
    communityContainer.innerHTML = `<div class="col-12 text-center text-danger">Error loading communities.</div>`;
  }
}

// event listener for filtering
if (communityContainer) {
  // display our data fetched first
  fetchAndStoreCommunities();

  // attach an event listener to the search input field
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();

      // use the global array to filter based on the search term
      const filteredCommunities = allCommunities.filter((community) => {
        const name = community.communityName
          ? community.communityName.toLowerCase()
          : "";
        const desc = community.description
          ? community.description.toLowerCase()
          : "";

        return name.includes(searchTerm) || desc.includes(searchTerm);
      });

      // render the filtered list onto the page
      renderCommunities(filteredCommunities);
    });
  }
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
    const q = query(
      recipesRef,
      where("communityId", "array-contains", communityId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      recipesGrid.innerHTML = `
        <div class="col-12 text-center py-5">
            <span>No recipes shared yet.</span>
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
