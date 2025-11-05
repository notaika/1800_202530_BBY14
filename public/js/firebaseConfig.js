// Import Firebase SDK modules from the CDN bc we're using EJS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = window.firebaseConfig;
const app = initializeApp(firebaseConfig);

// export and initialize Firestore authentication
export const auth = getAuth(app);

// export and initialize Firestore database
export const db = getFirestore(app);
