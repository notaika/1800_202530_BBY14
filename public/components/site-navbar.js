class SiteNavbar extends HTMLElement {

    connectedCallback(){
        this.innerHTML = `
            <nav class="craft-stick-nav">
      
                <!-- Sliding indicator dot (animated in JS) -->
                <div class="nav-indicator"></div>

                <!-- Home tab -->
                <!-- active property is passed from server (server.js) -->
                <a class="nav-item <%= active==='home' ? 'active' : '' %>" data-index="0" href="/">
                    <i class="bi bi-house-fill"></i>
                    <span>Home</span>
                </a>

                <!-- Browse recipes tab -->
                <a class="nav-item <%= active==='browse' ? 'active' : '' %>" data-index="1" href="/browse">
                    <i class="bi bi-compass"></i>
                    <span>Browse</span>
                </a>

                <!-- Create a recipe tab (future feature) -->
                <a class="nav-item <%= active==='create' ? 'active' : '' %>" data-index="2" href="/create">
                    <i class="bi bi-plus-circle"></i>
                    <span>Create</span>
                </a>

                <!-- View single recipe page -->
                <a class="nav-item <%= active==='recipe' ? 'active' : '' %>" data-index="3" href="/recipe">
                    <i class="bi bi-book"></i>
                    <span>Recipe</span>
                </a>

                <!-- Profile tab (future feature) -->
                <a class="nav-item <%= active==='profile' ? 'active' : '' %>" data-index="4" href="/profile">
                    <i class="bi bi-person"></i>
                    <span>Profile</span>
                </a>

            </nav>
        `;
        console.log("Navbar loaded");
    }
}
customElements.define('site-navbar', SiteNavbar);