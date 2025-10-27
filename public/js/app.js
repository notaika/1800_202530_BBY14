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

});
