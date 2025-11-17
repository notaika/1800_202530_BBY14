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
const drawer   = document.getElementById("favouritesPanel");
const backdrop = document.querySelector(".fav-backdrop");
const listElement   = document.getElementById("fav-list");

// ----- State -----
let currentUser = null;
// when logged-in we store only IDs in Firestore (array field)
// when logged-out we store in localStorage
let favs = {};

// ----- Drawer open/close -----
function openDrawer() {
  if (!drawer || !backdrop) return;
  // Show drawer and backdrop - drawer.hidden comes from Bootstrap offcanvas styles - https://getbootstrap.com/docs/5.3/components/offcanvas/
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

  // Firestore allows up to 10 items in an 'in' query, so we batch if needed
  const recipesRef = collection(db, "recipe");
  // For simplicity we do only the first 10 here
  const idBatch = ids.slice(0, 10);
  // Build query for IDs
  const q = query(recipesRef, where("__name__", "in", idBatch));
  // Fetch docs - this is where we get the recipe data for the IDs
  const snap = await getDocs(q);

  // Render list
  listElement.innerHTML = snap.docs.map(d => {
    const r = d.data();
    console.log("Recipe data:", r);
    return `
      <div class="fav-item" data-id="${d.id}">
        <img src="${r.imageUrl || ""}" alt="${r.name || r.title || "Recipe"}">
        <div>
          <h6 class="mb-1">${r.name || r.title || "Untitled"}</h6>
          <small>@${r.author || r.username || "unknown"}</small>
        </div>
        <button class="btn btn-sm btn-outline-forest remove-fav" data-id="${d.id}">
          Remove
        </button>
      </div>`;
  }).join("");
}

// ----- LocalStorage (guest) -----
const LS_KEY = "potluck.favs";
function loadFromLocal() {
  try {
    // Load favourites from localStorage for guest users
    const raw = localStorage.getItem(LS_KEY);
    favs = raw ? JSON.parse(raw) : {};
  } catch {
    favs = {};
  }
}
function saveToLocal() {
    // Save favourites to localStorage for guest users
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(favs));
  } catch {}
}

// ----- Firestore (logged-in) -----
async function loadFromFirestore(uid) {
    // Load favourites from Firestore for logged-in users
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  favs = {};
  if (snap.exists() && Array.isArray(snap.data().favouriteRecipeIDs)) {
    snap.data().favouriteRecipeIDs.forEach(id => { favs[id] = true; });
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
        // Remove from Firestore array
        await updateDoc(userRef, { favouriteRecipeIDs: arrayRemove(id) });
        delete favs[id];
      } else {
        // Add to Firestore array
        await updateDoc(userRef, { favouriteRecipeIDs: arrayUnion(id) });
        favs[id] = true;
      }
    } else {
      // Guest mode: minimal local store
      if (isFav) {
        delete favs[id];
      } else {
        // Store locally 
        favs[id] = true;
      }
      saveToLocal();
    }

    // Update UI
    renderFavourites();
    paintHearts();
  } catch (err) {
    console.error("Error updating favourites:", err);
  }
}

// ----- Paint hearts on current page -----
function paintHearts() {
  document.querySelectorAll(".fav-toggle").forEach(btn => {
    const id = btn.dataset.id;

    // Toggle 'is-fav' class based on current favs state - becomes red based on CSS
    btn.classList.toggle("is-fav", !!favs[id]);
  });
}

// ----- Public init -----  
export function initFavouritesUI() {
  // Open/close
  document.querySelectorAll(".fav-open").forEach(b => b.addEventListener("click", openDrawer));
  backdrop?.addEventListener("click", closeDrawer);
  drawer?.querySelector(".btn-close")?.addEventListener("click", closeDrawer);

  // Remove from drawer
  listElement?.addEventListener("click", (e) => {
    const btn = e.target.closest(".remove-fav");
    if (!btn) return;
    const id = btn.dataset.id;
    toggleFavourite(id);
  });

  // Delegate heart clicks within cards
  document.addEventListener("click", (e) => {
    const heart = e.target.closest(".fav-toggle");
    if (!heart) return;
    const card = heart.closest(".recipe-card");
    const id   = heart.dataset.id;

    // Build minimal payload from card (not required for array version but harmless)
    const payload = {
      title:  card?.querySelector(".card-title")?.textContent?.trim() || "Untitled",
      author: card?.querySelector(".author-chip")?.textContent?.replace(/^@/, "").trim() || "unknown",
      imageUrl: card?.querySelector("img")?.getAttribute("src") || ""
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
