// Wait until the HTML is fully loaded before running this code
document.addEventListener("DOMContentLoaded", () => {

  // Get important elements from the page
  const main = document.querySelector("main"); // the main screen content
  const nav  = document.querySelector(".craft-stick-nav"); // bottom navbar
  const indicatorDot = nav?.querySelector(".nav-indicator"); // sliding dot


  // -------------------------
  // Animate page when it loads
  // -------------------------
  // Start invisible, then fade + slide in smoothly
  if (main) {
    main.classList.add("page-fade"); // initial hidden state
    requestAnimationFrame(() => {
      main.classList.add("page-active"); // fade in animation
    });
  }

  // -------------------------------------------------
  // Move the sliding dot under the correct active icon
  // -------------------------------------------------
  function moveIndicatorToActive(animate = true) {
    if (!nav || !indicatorDot) return;

    // Find the currently active navigation icon
    const activeItem = nav.querySelector(".nav-item.active");
    if (!activeItem) return;

    // Measure position of nav + active icon
    const navRect = nav.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    // Find the center of the active icon (left to right)
    const centerX = (itemRect.left - navRect.left) + (itemRect.width / 2);

    // Move dot to that center position
    if (!animate) indicatorDot.style.transition = "none"; // no animation during first load
    indicatorDot.style.transform = `translateX(${centerX - 3}px) translateZ(0)`;
    
    // Re-enable smooth animation after initial load
    if (!animate) requestAnimationFrame(() => {
      indicatorDot.style.transition = "";
    });
  }

  // Position the sliding dot right away when the page loads
  requestAnimationFrame(() => moveIndicatorToActive(false));

  // Recalculate dot position if screen size changes (rotate phone, etc.)
  window.addEventListener("resize", () => moveIndicatorToActive(false));

  // --------------------------------------
  // Nav click: animate dot + fade out page
  // --------------------------------------
  document.querySelectorAll("a.nav-item").forEach(link => {

    link.addEventListener("click", (e) => {
      // Do nothing if clicking the tab we're already on
      if (link.classList.contains("active")) return;

      // Stop instant jump to new page
      e.preventDefault();

      // Figure out where we are going
      const url = link.getAttribute("href");

      // Switch active tab styling visually
      nav.querySelectorAll("a.nav-item").forEach(i => i.classList.remove("active"));
      link.classList.add("active");

      // Move the sliding dot under new tab
      moveIndicatorToActive(true);

      // Fade out the page before leaving
      if (main) {
        main.classList.remove("page-active");
        main.classList.add("fade-out");
      }

      // After animation completes, load the new page
      setTimeout(() => {
        window.location.href = url;
      }, 250); // matches fade-out speed
    });
  });

  // --------------------------------------
  // Link recipe cards to recipe preview
  // --------------------------------------
  document.querySelectorAll(".recipe-button").forEach(function(b){
    b.addEventListener('click', (event) => {
      const recipeID = event.target.getAttribute("recipeid");
      console.log(recipeID)
      openRecipePreview(recipeID);
    })
  })

  //Save orijinal state of preview.ejs
  const recipeOriginal = document.getElementById("recipe-preview").innerHTML;

  function openRecipePreview(id){
    
    //Will be updated to reference actual entries in the firebase
    const currentRecipe = {
    "id": 1,
    "title": "Avocado Toast",
    "author": "MaisOuiMayvee",
    "imageUrl": "https://images.unsplash.com/photo-1650092194571-d3c1534562be?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170",
    "thumbUrl": "https://images.unsplash.com/photo-1650092194571-d3c1534562be?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170",
    "description": "Crispy toast with smashed avocado, lemon, and chili flakes.",
    "ingredients": "Test"
    }
    // This code should work when Firebase is added
    // const recipesDocRef = collection(db, "recipes", id);
    try{
      // const docSnap = await getDoc(recipesDocRef);
      // const currentRecipe = docSnap.data;

      const recipePreview = document.getElementById("recipe-preview");
      
      if(recipeOriginal){

        recipePreview.innerHTML = recipeOriginal;

      }
      
      const recipePreviewContent = document.getElementById("recipe-preview-content");
      recipePreview.style.display = "block";

      document.getElementById("recipe-preview-title").innerHTML = currentRecipe.title;
      document.getElementById("recipe-preview-author").innerHTML = currentRecipe.author;

      if (currentRecipe.imageUrl){

        document.getElementById("recipe-preview-image").src = currentRecipe.imageUrl

      }

      if (currentRecipe.description){

        recipePreviewContent.innerHTML = recipePreviewContent.innerHTML + `
        <h3>Description</h3>
        <p id="recipe-preview-description">Place holder</p>`

        document.getElementById("recipe-preview-description").innerHTML = currentRecipe.description;
      }
      
      if (currentRecipe.ingredients){

        recipePreviewContent.innerHTML = recipePreviewContent.innerHTML + `
        <h3>Ingredients</h3>
        <p id="recipe-preview-ingredients">Place holder</p>`

        document.getElementById("recipe-preview-ingredients").innerHTML = currentRecipe.ingredients;
      }
      
      if(currentRecipe.instructions){

        recipePreviewContent.innerHTML = recipePreviewContent.innerHTML + `
        <h3>Instructions</h3>
        <p id="recipe-preview-instructions">Place holder</p>`

        document.getElementById("recipe-preview-instructions").innerHTML = currentRecipe.instructions;
      }

      if (currentRecipe.tags){

        recipePreviewContent.innerHTML = recipePreviewContent.innerHTML + `
        <h3>Tags</h3>
        <p id="recipe-preview-tags">Place holder</p>`

        document.getElementById("recipe-preview-tags").innerHTML = currentRecipe.tags;
      }

      //Link the back button of recipe preview, must be done after recipe-preview.innerHTML is set to recipeOriginal
      document.getElementById("recipe-preview-back").addEventListener('click', (event) => {
        closeRecipePreview();
      })

  } catch (error){
    console.error("Error previewing recipe ", error);
  }

  }

  function closeRecipePreview(){
    const recipePreview = document.getElementById("recipe-preview");
    recipePreview.style.display = "none";

  }

});

