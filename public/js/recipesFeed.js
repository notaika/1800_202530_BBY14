import { db } from "./firebaseConfig.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Fetch all recipes and their author usernames
 */
async function loadRecipes() {
  try {
    const snapshot = await getDocs(collection(db, "recipe"));
    const recipes = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const recipe = { id: docSnap.id, ...docSnap.data() };

        // Look up the user by submittedByUserID
        if (recipe.submittedByUserID) {
          try {
            const userRef = doc(db, "users", recipe.submittedByUserID);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              // ✅ use 'username' from the user doc
              recipe.author = userSnap.data().username || "Unknown";
            } else {
              recipe.author = "Unknown";
            }
          } catch (err) {
            console.error("Error fetching user:", err);
            recipe.author = "Unknown";
          }
        } else {
          recipe.author = "Unknown";
        }

        return recipe;
      })
    );

    // detect page
    const isHome = !!document.querySelector(".feed .row.g-3");
    const isBrowse = !!document.querySelector(".browse-feed .row.g-3");

    if (isHome) renderHomeFeed(recipes);
    if (isBrowse) renderBrowseFeed(recipes);
  } catch (err) {
    console.error("Error loading recipes:", err);
  }
}

/**
 * Single-column home feed
 */
function renderHomeFeed(recipes) {
  const container = document.querySelector(".feed .row.g-3");
  if (!container) return;

  container.innerHTML = recipes
    .map(
      (r) => `
    <div class="col-12">
      <div class="recipe-card">
        <img src="${r.imageUrl}" class="square-media" alt="${r.name || r.title}">
        <div class="card-body">
          <h5 class="card-title">${r.name || r.title}</h5>
          <span class="author-chip">@${r.author}</span>
          <p class="mt-2 mb-0 small text-dark">${r.description || ""}</p>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

/**
 * Two-column browse feed
 */
function renderBrowseFeed(recipes) {
  const container = document.querySelector(".browse-feed .row.g-3");
  if (!container) return;

  container.innerHTML = "";
  recipes.forEach((r, idx) => {
    const left = idx % 2 === 0;
    const col = document.createElement("div");
    col.className = "col";
    col.innerHTML = `
      <div class="card h-100 overflow-hidden recipe-card ${left ? "card-left" : "card-right"}">
        ${!left ? `<img src="${r.imageUrl}" class="card-img-top square-media" alt="${r.name || r.title}">` : ""}
        <div class="card-body py-2">
          <h6 class="card-title mb-1">${r.name || r.title}</h6>
          <span class="author-chip">@${r.author}</span>
        </div>
        ${left ? `<img src="${r.imageUrl}" class="card-img-bottom square-media" alt="${r.name || r.title}">` : ""}
      </div>
    `;
    container.appendChild(col);
  });
}

document.addEventListener("DOMContentLoaded", loadRecipes);
