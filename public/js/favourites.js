// Favourites drawer and heart toggles
// Each recipe card should include:
//   <button class="fav-toggle" data-id="..."><i class="bi bi-heart-fill"></i></button>

import { auth, db } from "./firebaseConfig.js";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  collection,
  getDocs,
  arrayRemove,
  arrayUnion,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ----- DOM refs -----
const drawer = document.getElementById("favouritesPanel");
const backdrop = document.querySelector(".fav-backdrop");
const listElement = document.getElementById("fav-list");

// ----- State -----
let currentUser = null;
// when logged-in we store only IDs in Firestore (array field)
// when logged-out we store in localStorage
let favs = {};
let favouritesUIInitialized = false;
// Keep basic recipe data for mini-preview bubble
let favDetails = {};

// ----- Mini preview bubble helpers -----
function hideFavPreviewBubble() {
  const bubble = document.getElementById("fav-preview-bubble");
  if (bubble) {
    bubble.hidden = true;
    bubble.innerHTML = "";
  }
}

function showFavPreviewBubble(id, anchorEl) {
  const data = favDetails[id];
  if (!data) {
    console.warn("No details for fav id", id);
    return;
  }

  const bubble = document.getElementById("fav-preview-bubble");
  if (!bubble) return;

    const title  = data.name || data.title || "Untitled";
  const author = data.author || data.username || "unknown";
  const desc   = (data.description || "").trim();
  const difficulty = data.difficulty || "";
  const prepTime   = data.prepTime   || "";
  const cookTime   = data.cookTime   || "";
  const ingredients = (data.ingredients || "").trim();
  const instructions = (data.instructions || "").trim();
  const img    = data.imageUrl || "";

  bubble.innerHTML = `
    <div class="fav-preview-card position-relative">
      <button
        type="button"
        class="fav-preview-close"
        aria-label="Close preview">&times;</button>

      <div class="d-flex gap-2 mb-2">
        ${img ? `<img src="${img}" alt="${title}" class="fav-preview-thumb">` : ""}
        <div class="flex-grow-1">
          <div class="small fw-semibold mb-1">${title}</div>
          <div class="small text-muted mb-1">@${author}</div>
          ${(prepTime || cookTime || difficulty) ? `
            <div class="small text-muted">
              ${prepTime ? `Prep: ${prepTime}` : ""}
              ${cookTime ? ` &bull; Cook: ${cookTime}` : ""}
              ${difficulty ? ` &bull; Difficulty: ${difficulty}` : ""}
            </div>` : ""}
        </div>
      </div>

      ${desc ? `
        <div class="mb-2">
          <div class="small fw-semibold mb-1">Description</div>
          <p class="small mb-0">${desc}</p>
        </div>` : ""}

      ${ingredients ? `
        <div class="mb-2">
          <div class="small fw-semibold mb-1">Ingredients</div>
          <p class="small mb-0">${ingredients}</p>
        </div>` : ""}

      ${instructions ? `
        <div>
          <div class="small fw-semibold mb-1">Instructions</div>
          <p class="small mb-0">${instructions}</p>
        </div>` : ""}
    </div>
  `;


  bubble.hidden = false;

  // Position the bubble near the clicked row, inside the drawer
  try {
    const drawerRect = drawer.getBoundingClientRect();
    const anchorRect = anchorEl.getBoundingClientRect();

    const top = anchorRect.top - drawerRect.top + anchorRect.height + 8;
    const left = 12;

    bubble.style.top = `${top}px`;
    bubble.style.left = `${left}px`;
  } catch {
    // Fallback: pin to bottom-right if something goes wrong
    bubble.style.top = "auto";
    bubble.style.bottom = "56px";
    bubble.style.left = "12px";
  }

  // Close button inside the bubble
  const closeBtn = bubble.querySelector(".fav-preview-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      hideFavPreviewBubble();
    });
  }
}

// ----- Drawer open/close -----
function openDrawer() {
  if (!drawer || !backdrop) return;
  drawer.hidden = false;
  backdrop.hidden = false;
  requestAnimationFrame(() => {
    drawer.setAttribute("data-open", "true");
    backdrop.setAttribute("data-open", "true");
  });
}

function closeDrawer() {
  if (!drawer || !backdrop) return;
  drawer.removeAttribute("data-open");
  backdrop.removeAttribute("data-open");
  setTimeout(() => {
    drawer.hidden = true;
    backdrop.hidden = true;
    hideFavPreviewBubble(); // make sure mini bubble is cleared
  }, 220);
}

// ----- Render favourites list in drawer -----
async function renderFavourites() {
  if (!listElement) return;

  const ids = Object.keys(favs);
  if (ids.length === 0) {
    listElement.innerHTML = `
      <div class="text-center text-muted py-4 small">
        <p>No favourites yet. Tap a heart in the top right corner of any recipe to add it to your favourites.</p>
      </div>`;
    return;
  }

  const recipesRef = collection(db, "recipe");
  const idBatch = ids.slice(0, 10);
  const q = query(recipesRef, where("__name__", "in", idBatch));
  const snap = await getDocs(q);

  // Save details for mini preview
  favDetails = {};
  snap.docs.forEach((d) => {
    favDetails[d.id] = d.data();
  });

  // Render rows
  listElement.innerHTML = snap.docs
    .map((d) => {
      const r = d.data();
      console.log("Recipe data:", r);

      const title = r.name || r.title || "Untitled";
      const author = r.author || r.username || "unknown";
      const img = r.imageUrl || "";

      return `
        <div class="fav-item d-flex align-items-center justify-content-between gap-2" data-id="${d.id}">
          <button
            type="button"
            class="fav-main flex-grow-1 text-start"
            data-id="${d.id}">
            <div class="fav-main-inner d-flex align-items-center gap-2">
              ${img ? `<img src="${img}" alt="${title}" class="fav-thumb">` : ""}
              <div class="d-flex flex-column">
                <span class="small fw-semibold">${title}</span>
                <span class="small text-muted">@${author}</span>
              </div>
            </div>
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-forest remove-fav"
            data-id="${d.id}">
            Remove
          </button>
        </div>`;
    })
    .join("");
}

// ----- LocalStorage (guest) -----
const LS_KEY = "potluck.favs";
function loadFromLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    favs = raw ? JSON.parse(raw) : {};
  } catch {
    favs = {};
  }
}
function saveToLocal() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(favs));
  } catch {}
}

// ----- Firestore (logged-in) -----
async function loadFromFirestore(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  favs = {};
  if (snap.exists() && Array.isArray(snap.data().favouriteRecipeIDs)) {
    snap.data().favouriteRecipeIDs.forEach((id) => {
      favs[id] = true;
    });
  } else {
    await setDoc(userRef, { favouriteRecipeIDs: [] }, { merge: true });
  }
}

/**
 * Logged-in: update users/{uid}.favouriteRecipeIDs with arrayUnion/arrayRemove.
 * Guest: store favs in localStorage.
 */
async function toggleFavourite(id, payload) {
  if (!id) return;
  const isFav = !!favs[id];

  try {
    if (currentUser) {
      const userRef = doc(db, "users", currentUser.uid);
      if (isFav) {
        await updateDoc(userRef, { favouriteRecipeIDs: arrayRemove(id) });
        delete favs[id];
      } else {
        await updateDoc(userRef, { favouriteRecipeIDs: arrayUnion(id) });
        favs[id] = true;
      }
    } else {
      if (isFav) {
        delete favs[id];
      } else {
        favs[id] = true;
      }
      saveToLocal();
    }

    renderFavourites();
    paintHearts();
  } catch (err) {
    console.error("Error updating favourites:", err);
  }
}

// ----- Paint hearts on current page -----
function paintHearts() {
  document.querySelectorAll(".fav-toggle").forEach((btn) => {
    const id = btn.dataset.id;
    btn.classList.toggle("is-fav", !!favs[id]);
  });
}

// ----- Public init -----
export function initFavouritesUI() {
  if (favouritesUIInitialized) return;
  favouritesUIInitialized = true;

  // Open/close
  document.querySelectorAll(".fav-open").forEach((b) =>
    b.addEventListener("click", openDrawer)
  );
  backdrop?.addEventListener("click", closeDrawer);
  drawer?.querySelector(".btn-close")?.addEventListener("click", closeDrawer);

  // Clicks inside the drawer list
  listElement?.addEventListener("click", (e) => {
    // 1) Remove button
    const removeBtn = e.target.closest(".remove-fav");
    if (removeBtn) {
      const id = removeBtn.dataset.id;
      toggleFavourite(id);
      return;
    }

    // 2) Main favourite row → show mini bubble
    const main = e.target.closest(".fav-main");
    if (main) {
      const id = main.dataset.id;
      showFavPreviewBubble(id, main);
    }
  });

  // Delegate heart clicks within cards
  document.addEventListener("click", (e) => {
    const heart = e.target.closest(".fav-toggle");
    if (!heart) return;
    const card = heart.closest(".recipe-card");
    const id = heart.dataset.id;

    const payload = {
      title:
        card?.querySelector(".card-title")?.textContent?.trim() || "Untitled",
      author:
        card
          ?.querySelector(".author-chip")
          ?.textContent?.replace(/^@/, "")
          .trim() || "unknown",
      imageUrl: card?.querySelector("img")?.getAttribute("src") || "",
    };

    toggleFavourite(id, payload);
  });

  // Auth watcher - on login/logout we reload favs and repaint hearts
  onAuthStateChanged(auth, async (user) => {
    currentUser = user || null;
    try {
      if (currentUser) await loadFromFirestore(currentUser.uid);
      else loadFromLocal();
    } catch (err) {
      console.error("Load favourites failed:", err);
      loadFromLocal();
    }
    renderFavourites();
    paintHearts();
  });
}
