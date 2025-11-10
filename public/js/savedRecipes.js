import { onAuthReady, logoutUser } from "./authentication.js";
import { db } from "./firebaseConfig.js";
import {
  doc,
  getDoc,
  getDocs,
  collection,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


