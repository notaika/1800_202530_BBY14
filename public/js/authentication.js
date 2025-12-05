// authentication.js
// Responsibilities:
//  - Handle login, signup (with user doc creation), logout
//  - Provide small helpers for auth-state readiness and user-friendly errors
// Notes:
//  - Uses Firebase Auth for identities and Firestore `users/{uid}` for profile
//    metadata; reads/writes are documented inline below.
// import the initialized Firebase instances
import { auth, db } from "/js/firebaseConfig.js";

// and also import Firestore fxns
import {
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// import fxns from the Firebase Auth SDK
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Login: authenticate via Firebase Auth and redirect to `/home`
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("Success. User logged in.", userCredential.user);
    window.location.href = "/home";
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in: ", error.message);
    throw error;
  }
}

// Signup: create Firebase Auth user, update displayName, and write a default
// profile document to Firestore `users/{uid}`. Then redirect to `/home`.
export async function signupUser(displayName, email, password) {
  // 1. Create the user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  // updates user profile
  await updateProfile(user, { displayName: displayName });

  // creates a new doc in the 'users' collection in db
  try {
    // Default profile fields stored in Firestore for app use
    const newUserDoc = {
      username: displayName,
      firstName: "",
      lastName: "",
      bio: "New PotLuck user!", // default bio
      email: user.email,
      profilePicUrl: "/assets/images/profile-pic-placeholder.jpg", // default-pic
      favouriteRecipeIDs: [],
      communityIDs: [],
    };

    // set the document in the 'users' collection with the user's UID = doc ID
    await setDoc(doc(db, "users", user.uid), newUserDoc);

    console.log("Firestore user document created successfully!");
  } catch (error) {
    console.error("Error creating user document in Firestore:", error);
  }

  window.location.href = "/home";
  return user;
}

// Logout: end session and send user to `/login`
export async function logoutUser() {
  try {
    await signOut(auth);
    console.log("User logged out");
    window.location.href = "/login";
  } catch (error) {
    console.error("Error logging out:", error);
  }
}

// Helper: run the given callback when auth state resolves
export function onAuthReady(callback) {
  return onAuthStateChanged(auth, callback);
}

// Map Firebase auth error codes to user-friendly messages
export function authErrorMessage(error) {
  const code = (error?.code || "").toLowerCase();

  const map = {
    "auth/invalid-credential": "Wrong email or password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/email-already-in-use": "Email is already in use.",
    "auth/weak-password": "Password too weak (min 6 characters).",
    "auth/missing-password": "Password cannot be empty.",
    "auth/network-request-failed": "Network error. Try again.",
  };

  return map[code] || "Something went wrong. Please try again.";
}
