import { db } from "./firebaseConfig.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
let browseAllRecipes = [];
let activeTag = null;
import {updateRecipeCards} from "./preview.js";


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

  const isBrowseStyle = !!document.querySelector(".browse-feed .row.g-3");

  if (isBrowseStyle) {
    browseAllRecipes = recipes;
    renderBrowseFeed(browseAllRecipes);
    setupBrowseControls();
  }
  } catch (err) {
    console.error("Error loading recipes:", err);
  }
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
    <div class="card h-100 overflow-hidden recipe-card recipe-button ${left ? "card-left" : "card-right"}" recipeid="${r.id}">
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

  updateRecipeCards();

}

/**
 * Apply search + tag filters to browse recipes
 */
function applyBrowseFilters() {
  let filtered = [...browseAllRecipes];

  // Search query
  const searchInput = document.querySelector(
    ".floating-search .search-form input[type='search']"
  );
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

  if (query) {
    const words = query.split(/\s+/).filter(Boolean);
    filtered = filtered.filter((r) => {
      const haystack = [
        r.name,
        r.title,
        r.description,
        r.author,
        ...(Array.isArray(r.tags) ? r.tags : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return words.some((w) => haystack.includes(w));
    });
  }

  // Tag filter
  if (activeTag) {
    filtered = filtered.filter(
      (r) => Array.isArray(r.tags) && r.tags.includes(activeTag)
    );
  }

  renderBrowseFeed(filtered);
}

/**
 * Set up search bar and tags on Browse page
 */
function setupBrowseControls() {
  const form = document.querySelector(".floating-search .search-form");
  const input = form?.querySelector('input[type="search"]');

  // Search wiring
  if (form && input) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      applyBrowseFilters();
    });

    input.addEventListener("input", () => {
      applyBrowseFilters();
    });
  }

  // Tag filters
  const tagHost = document.querySelector(".tag-filter");
  if (!tagHost) return;

  const tagSet = new Set();
  browseAllRecipes.forEach((r) => {
    if (Array.isArray(r.tags)) {
      r.tags.forEach((t) => {
        const trimmed = String(t).trim();
        if (trimmed) tagSet.add(trimmed);
      });
    }
  });

  const tags = Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  if (tags.length === 0) {
    tagHost.style.display = "none";
    return;
  }

  tagHost.innerHTML = "";

  // If there's only a few tags, show tag chips. Otherwise a dropdown
  const useChips = tags.length <= 16;

  if (useChips) {
    const label = document.createElement("span");
    label.className = "tag-filter-label";
    label.textContent = "Tags:";
    tagHost.appendChild(label);

    const row = document.createElement("div");
    row.className = "tag-chip-row";

    tags.forEach((tag) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tag-chip";
      btn.textContent = tag;
      btn.dataset.tag = tag;

      btn.addEventListener("click", () => {
        if (activeTag === tag) {
          activeTag = null;
          btn.classList.remove("active");
        } else {
          activeTag = tag;
          tagHost
            .querySelectorAll(".tag-chip.active")
            .forEach((el) => el.classList.remove("active"));
          btn.classList.add("active");
        }
        applyBrowseFilters();
      });

      row.appendChild(btn);
    });

    tagHost.appendChild(row);
  } else {
    const wrapper = document.createElement("div");
    wrapper.className = "d-flex align-items-center gap-2";

    const label = document.createElement("span");
    label.className = "tag-filter-label";
    label.textContent = "Tag:";
    wrapper.appendChild(label);

    const select = document.createElement("select");
    select.className = "form-select form-select-sm tag-dropdown";

    const optAll = document.createElement("option");
    optAll.value = "";
    optAll.textContent = "All tags";
    select.appendChild(optAll);

    tags.forEach((tag) => {
      const opt = document.createElement("option");
      opt.value = tag;
      opt.textContent = tag;
      select.appendChild(opt);
    });

    select.addEventListener("change", () => {
      activeTag = select.value || null;
      applyBrowseFilters();
    });

    wrapper.appendChild(select);
    tagHost.appendChild(wrapper);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadRecipes();       
});
