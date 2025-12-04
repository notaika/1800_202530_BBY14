# PotLuck

PotLuck is a community-oriented recipe platform built to make cooking simple, accessible, and collaborative. The app focuses on **one‑dish cooking**, where every recipe is intentionally designed to be prepared using a single pot, bowl, pan, or similar cooking container. This approach supports busy students, beginners, and anyone who prefers uncomplicated cooking without sacrificing creativity.

At its core, PotLuck creates a shared space where users can browse, create, and contribute recipes within **communities**. These communities act as collaborative cookbooks; groups of students, cultural food circles, shared-living groups, or social clusters, each collecting and curating their own recipe sets.  

## Project Overview

This project demonstrates the full development cycle of a modern, community-driven web application. Built as a full-stack implementation, it incorporates:

- A Node.js + Express backend  
- EJS for server-side rendering  
- Firebase Authentication and Firestore for user and recipe data  
- Modular JavaScript for front-end logic  
- Cloud deployment with environment variable management and custom domain configuration  

Throughout the development process, emphasis was placed on clean UI/UX, organized code architecture, scalable design patterns, and clear separation of concerns between pages, scripts, and Firebase logic.

## Core Concepts

### Community-Driven Cookbooks  
Users can create and join communities, each containing a shared recipe collection contributed by members.

### One-Dish Recipe Model  
To keep cooking approachable, every recipe uses only one primary dish. This consistency simplifies filtering, searching, and user decision-making.

### Dynamic, User-Focused Features  
Real-time interactions, live searching, filtering, saved recipes, editable content, and user cookbooks support an interactive browsing experience.



## Features

### Community Features  
- Create new communities  
- Join existing groups  
- View community cookbooks  
- Publish recipes to selected communities  

### User Features  
- Create and manage accounts using Firebase Authentication  
- Browse a real-time recipe feed  
- Filter recipes based on one-dish types  
- Search in real time across all recipes  
- Open preview modals and full recipe pages  
- Save or unsave recipes  
- Edit personal recipes  
- View submitted recipes and joined communities  

### Technical Features  
- Express routing and middleware  
- EJS server-side rendered pages  
- Modular front-end JavaScript files  
- Firestore integration for recipes, profiles, and communities  
- Cloud deployment compatibility  



## Technology Stack

**Backend:** Node.js, Express  
**Frontend:** HTML, CSS, JavaScript, EJS  
**Authentication & Database:** Firebase Authentication, Firestore  
**Deployment:** DigitalOcean App Platform  



## Repository Structure

```
Project Root
│
├── app.js                     # Express app entry point
├── package.json
├── package-lock.json
│
├── /public                    # Static assets
│     ├── css/                 
│     ├── images/              
│     └── js/                  
│          ├── authentication.js
│          ├── firebaseConfig.js
│          ├── recipesFeed.js
│          ├── preview.js
│          ├── createRecipe.js
│          ├── profile.js
│          ├── community.js
│          └── savedRecipes.js
│
└── /views                     # EJS templates
      ├── index.ejs           
      ├── login.ejs
      ├── signup.ejs
      ├── home.ejs             
      ├── recipe.ejs           
      ├── preview.ejs          
      ├── createRecipe.ejs
      ├── profile.ejs
      ├── community.ejs
      └── partials/            
```



## Detailed Page Structure

### Landing Page (`index.ejs`)
A welcoming introduction to PotLuck’s purpose. The page highlights the key concepts of one‑dish cooking and collaborative communities. The primary call‑to‑action, **Get Started**, takes new users to the Sign-Up page.

### Sign-Up (`signup.ejs`)
Users provide a username, email, and password. Firebase Authentication creates the account, while Firestore stores the profile document. After successful registration, users are redirected to login.

### Login (`login.ejs`)
Handles email + password verification using Firebase Authentication. Upon successful login, the user is redirected to the Home page, and authentication state is maintained across the session.

### Home Page (`home.ejs`)
The main content hub of the app.  
Includes:
- A responsive search bar that updates results in real time  
- Dish-type filters for narrowing by cooking container (pan, pot, bowl, etc.)  
- A two-column recipe feed loaded live from Firestore  
- Clickable recipe cards opening the preview modal  

### Recipe Preview (`preview.ejs`)
A modal overlay displaying a short version of the recipe.  
Features:
- Expand to full recipe  
- Save/unsave toggle  
- Edit button (only if user is the creator)  
- Dismissal returning to the feed  

### Recipe Page (`recipe.ejs`)
Shows full ingredients, steps, cooking dish type, community, and creator.

### Community Page (`community.ejs`)
Users can:
- Create new communities (name + description)  
- Search for communities  
- Join or view community cookbooks  
Each community includes its own recipe collection.

### Create Recipe Page (`createRecipe.ejs`)
Users can upload an image, choose a dish type, select a community, enter ingredients and instructions, and publish a new recipe to Firestore. This page is replicated for the edit functionality, pre-filling fields with existing data to be edited and updated in the Firestore database.

### Profile Page (`profile.ejs`)
Displays:
- User information  
- A personal cookbook showing recipes they authored  
- Joined communities  
Interactive toggle buttons switch between sections  


## Detailed Script Overview

### authentication.js
Handles:
- Registration and login requests  
- Logging out  
- Firebase auth-state listener  
- Page access control and redirects  

### recipesFeed.js
Controls:
- Fetching recipe list from Firestore  
- Monitoring search bar input  
- Applying dish-type filters  
- Rendering cards to the feed grid  
- Adding click listeners for preview modals  

### preview.js
Handles:
- Opening/closing the preview popup  
- Save/unsave button logic  
- Redirect to full recipe  
- Showing the Edit button for the creator  

### createRecipe.js
Responsible for:
- Processing the recipe creation form  
- Image upload and validation  
- Creating recipe documents in Firestore  
- Handling dish type and community selection  

### community.js
Manages:
- Creating new communities  
- Joining communities  
- Viewing community information and cookbook  
- Storing metadata in Firestore  

### profile.js
Displays:
- Submitted recipes  
- Joined communities  
- User metadata  
Toggles views without reloading the page.

### savedRecipes.js
Loads:
- Saved recipe IDs from Firestore  
- Full recipe documents using batched `in` queries  
Renders saved recipes using `recipe.ejs` layout.

## Firestore Database Structure

PotLuck uses Firebase Authentication and Firestore to store users, recipes, and communities.  
Below is the database structure required to recreate the database from scratch.

### `users` Collection
Each document ID is automatically generated. The `favouriteRecipeIDs` field contains an array of recipe IDs that represent the recipes saved by the user, establishing a many-to-many relationship. Similarly, the `communityIDs` field holds an array of community IDs that indicate the communities the user has joined, also reflecting a many-to-many relationship.

**Fields:**
- `username` (string)
- firstName` (string)
- `lastName` (string)
- `bio` (string)
- `email` (string)
- `profilePicURL` (string)
- `favouriteRecipeIDs` (array of recipe IDs)
- `communityIDs` (array of community IDs)

### `recipe` Collection
Each document ID is automatically generated. The `tags` field is an array of strings used to categorize the recipe by dish type for the filtering functionality submitted when creating or editing a recipe.

**Fields:**
- `name` (string)
- `description` (string)
- `ingredients` (string)
- `instructions` (string)
- `difficulty` (string)
- `prepTime` (string)  
- `communityId` (string)
- `cookTime` (string)
- `imageUrl` (string)
- `submittedByUserID` (string - user uid)
- `submittedTimestamp` (timestamp)
- `tags` (array of strings)

### `communities` Collection
Each document ID is automatically generated. The `membersUID` field is an array of user IDs representing users who have joined the community, establishing a many-to-many relationship.

**Fields:**
- `communityName` (string)
- `description` (string)
- `createdBy` (string)
- `createdAt` (timestamp)
- `membersUID` (array of user IDs)


## Local Development Setup

To run the application locally:

1. **Clone** the repository with:
      ```bash
      git clone https://github.com/notaika/1800_202530_BBY14.git
      cd 1800_202530_BBY14
      ```
2. **Install dependencies** using:
   ```bash
   npm install
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```
4. **Create a `.env` file** in the project root with the following structure:

   ```bash
   PORT="YOUR_PORT_NUMBER"
   SESSION_SECRET="YOUR_SESSION_SECRET"

   VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
   VITE_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
   VITE_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
   VITE_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
   ```

5. Open the app at:
   ```
   http://localhost:8000
   ```


## Hosted Demo

You can access the deployed version of PotLuck at the link below:

### Live Demo:  [https://potluck-app.online/](https://potluck-app.online/)

The hosted version runs the same functionality as the local version, including account creation, recipe publishing, communities, and favorites but is deployed on DigitalOcean App Platform with a custom domain.



| Variable                          | Description                                   |
|-----------------------------------|-----------------------------------------------|
| SESSION_SECRET                    | Used for Express session encryption           |
| PORT                              | Assigned by hosting platform or defaults 8000 |
| VITE_FIREBASE_API_KEY             | API key for Firebase services                 |
| VITE_FIREBASE_AUTH_DOMAIN         | Firebase authentication domain                 |
| VITE_FIREBASE_PROJECT_ID          | Firebase project identifier                    |
| VITE_FIREBASE_APP_ID              | Firebase application identifier                 |


## Deployment Notes

- Use `process.env.PORT`  
- Ensure `"start": "node app.js"` exists  
- Configure domain & SSL on DigitalOcean  
- Add custom domain to Firebase Authorized Domains  

---

## Known Issues and Limitations

- No rate limiting  
- Limited error-handling states  
- Firestore rules require strict configuration  
- Images may load slowly without CDN  

---

## Next Steps

### Feature Enhancements
- Comments and likes  
- Followable communities  
- Notifications  
- Advanced community search  
- Profile pictures  

### Technical Upgrades
- Pagination  
- Server-side rendering options  
- Input sanitization  
- CDN & caching improvements  
