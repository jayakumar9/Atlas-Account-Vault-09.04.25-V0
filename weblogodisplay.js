class WebLogoDisplay extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.logoFetcher = new WebLogoFetch();
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: Arial, sans-serif;
                }

                .logo-fetcher {
                    background: white;
                    padding: 2rem;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    width: 100%;
                    max-width: 400px;
                    margin: 0 auto;
                }

                .logo-form {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 1.5rem;
                }

                .logo-input {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 16px;
                }

                .logo-button {
                    padding: 10px 20px;
                    background-color: #1a73e8;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }

                .logo-button:hover {
                    background-color: #1557b0;
                }

                .logo-display {
                    text-align: center;
                    margin-top: 20px;
                    min-height: 150px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .logo-display img {
                    max-width: 128px;
                    height: auto;
                    display: block;
                    margin: 0 auto 10px;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .error {
                    color: #d32f2f;
                    font-size: 14px;
                }

                .success {
                    color: #2e7d32;
                    font-size: 14px;
                    margin-top: 10px;
                }

                h2 {
                    color: #1a73e8;
                    margin-bottom: 1.5rem;
                    text-align: center;
                }

                .confirmation-dialog {
                    margin-top: 20px;
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background-color: #f8f9fa;
                }

                .button-group {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    margin-top: 15px;
                }

                .button-group button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }

                .confirm-button {
                    background-color: #1a73e8;
                    color: white;
                }

                .upload-button {
                    background-color: #34a853;
                    color: white;
                }

                .cancel-button {
                    background-color: #dadce0;
                    color: #3c4043;
                }

                .loading {
                    width: 24px;
                    height: 24px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #1a73e8;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 20px auto;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .file-input {
                    display: none;
                }
            </style>
            <div class="logo-fetcher">
                <h2>Website Logo Fetcher</h2>
                <form class="logo-form">
                    <input type="text" class="logo-input" placeholder="Enter website (e.g., gmail.com)">
                    <button type="submit" class="logo-button">Fetch Logo</button>
                </form>
                <div class="logo-display"></div>
                <input type="file" class="file-input" accept="image/*">
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const form = this.shadowRoot.querySelector('.logo-form');
        const fileInput = this.shadowRoot.querySelector('.file-input');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFetch();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleManualUpload(file);
            }
        });
    }

    showLoading() {
        const display = this.shadowRoot.querySelector('.logo-display');
        display.innerHTML = '<div class="loading"></div>';
    }

    async handleFetch() {
        const input = this.shadowRoot.querySelector('.logo-input');
        const display = this.shadowRoot.querySelector('.logo-display');
        const domain = input.value.trim();

        if (!domain) {
            display.innerHTML = '<p class="error">Please enter a website URL</p>';
            return;
        }

        this.showLoading();

        const result = await this.logoFetcher.fetchLogo(domain);

        if (result) {
            this.displayLogo(result.url, domain);
        } else {
            const defaultLogoUrl = this.logoFetcher.createDefaultLogo(domain);
            this.showConfirmationDialog(domain, defaultLogoUrl);
        }
    }

    displayLogo(url, domain) {
        const display = this.shadowRoot.querySelector('.logo-display');
        const img = document.createElement('img');
        img.src = url;
        
        display.innerHTML = '';
        display.appendChild(img);
        
        const info = document.createElement('p');
        info.textContent = `Logo fetched for: ${domain}`;
        info.className = 'success';
        display.appendChild(info);

        this.dispatchEvent(new CustomEvent('logofetched', {
            detail: { domain, logoUrl: url }
        }));
    }

    showConfirmationDialog(domain, defaultLogoUrl) {
        const display = this.shadowRoot.querySelector('.logo-display');
        const dialog = document.createElement('div');
        dialog.className = 'confirmation-dialog';
        dialog.innerHTML = `
            <p>Unable to fetch logo from web. Would you like to:</p>
            <div class="button-group">
                <button class="confirm-button">Use Default Logo</button>
                <button class="upload-button">Upload Manual</button>
                <button class="cancel-button">Cancel</button>
            </div>
        `;

        // Show the default logo
        const defaultImg = document.createElement('img');
        defaultImg.src = defaultLogoUrl;
        display.innerHTML = '';
        display.appendChild(defaultImg);
        display.appendChild(dialog);

        // Setup button handlers
        const confirmBtn = dialog.querySelector('.confirm-button');
        const uploadBtn = dialog.querySelector('.upload-button');
        const cancelBtn = dialog.querySelector('.cancel-button');

        confirmBtn.addEventListener('click', () => {
            this.displayLogo(defaultLogoUrl, domain);
            dialog.remove();
        });

        uploadBtn.addEventListener('click', () => {
            this.shadowRoot.querySelector('.file-input').click();
            dialog.remove();
        });

        cancelBtn.addEventListener('click', () => {
            display.innerHTML = '';
            dialog.remove();
        });
    }

    async handleManualUpload(file) {
        const display = this.shadowRoot.querySelector('.logo-display');
        const domain = this.shadowRoot.querySelector('.logo-input').value.trim();

        try {
            const url = URL.createObjectURL(file);
            this.displayLogo(url, domain);
        } catch (error) {
            display.innerHTML = '<p class="error">Failed to load uploaded image</p>';
        }
    }
}

// Register the web component
customElements.define('web-logo-display', WebLogoDisplay); 