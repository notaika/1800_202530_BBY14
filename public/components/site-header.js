class SiteHeader extends HTMLElement {
    connectedCallback(){

        this.innerHTML = `
            <header class="topbar shadow-sm">
                <div class="container text-center">
                    <strong class="app-title">PotLuck</strong>
                </div>
            </header>
        `

    }

    

}

customElements.define('site-header', SiteHeader);