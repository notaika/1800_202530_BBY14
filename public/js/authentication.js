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

// logs in user and redirects to main
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("Success. User logged in.", userCredential.user);
    window.location.href = "/main";
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in: ", error.message);
    throw error;
  }
}

// creates new auth user and updates user collection in db
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
    const newUserDoc = {
      username: displayName,
      firstName: "",
      lastName: "",
      bio: "New PotLuck user!", // default bio
      email: user.email,
      profilePicUrl: "/assets/images/profile-pic-placeholder.jpg", // default-pic
      favouriteRecipeIDs: [],
      communityId: "",
    };

    // set the document in the 'users' collection with the user's UID = doc ID
    await setDoc(doc(db, "users", user.uid), newUserDoc);

    console.log("Firestore user document created successfully!");
  } catch (error) {
    console.error("Error creating user document in Firestore:", error);
  }

  window.location.href = "/main";
  return user;
}

// sign out user
export async function logoutUser() {
  try {
    await signOut(auth);
    console.log("User logged out");
    window.location.href = "/login";
  } catch (error) {
    console.error("Error logging out:", error);
  }
}

// runs the given callback when auth state resolves
export function onAuthReady(callback) {
  return onAuthStateChanged(auth, callback);
}

// from 1800 demo, maps auth error messages
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
