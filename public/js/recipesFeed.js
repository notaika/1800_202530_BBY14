// /public/js/recipesFeed.js
import { db } from "./firebaseConfig.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Fetch all recipes from Firestore
 */
async function loadRecipes() {
  try {
    const snapshot = await getDocs(collection(db, "recipe"));
    const recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Detect which page we're on
    const isHome = !!document.querySelector(".feed .row.g-3");
    const isBrowse = !!document.querySelector(".browse-feed .row.g-3");

    if (isHome) renderHomeFeed(recipes);
    if (isBrowse) renderBrowseFeed(recipes);
  } catch (err) {
    console.error("Error loading recipes:", err);
  }
}

/**
 * Render single-column Home feed (1 card per row, includes description)
 */
function renderHomeFeed(recipes) {
  const container = document.querySelector(".feed .row.g-3");
  if (!container) return;

  container.innerHTML = recipes.map(r => `
    <div class="col-12">
      <div class="recipe-card">
        <img src="${r.imageUrl}" class="square-media" alt="${r.name || r.title}">
        <div class="card-body">
          <h5 class="card-title">${r.name || r.title}</h5>
          <span class="author-chip">@${r.author || "Unknown"}</span>
          <p class="mt-2 mb-0 small text-dark">${r.description || ""}</p>
        </div>
      </div>
    </div>
  `).join("");
}

/**
 * Render two-column Browse feed (alternating top/bottom layout)
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
          <span class="author-chip">@${r.author || "Unknown"}</span>
        </div>
        ${left ? `<img src="${r.imageUrl}" class="card-img-bottom square-media" alt="${r.name || r.title}">` : ""}
      </div>
    `;
    container.appendChild(col);
  });
}

document.addEventListener("DOMContentLoaded", loadRecipes);
