class WebLogoFetch extends HTMLElement {
    constructor() {
        super();
        this.debounceTimer = null;
        this.lastInputValue = '';
        this.isTyping = false;
        this.logoCache = new Map();
        this.failedAttempts = new Map();
        this.maxRetries = 2;
        this.retryDelay = 1000;
        this.innerHTML = `
            <div class="web-logo-fetch-container">
                <img id="selectedLogo" 
                     src="data:image/svg+xml,${encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <rect width="24" height="24" fill="#666" rx="4"/>
                            <path d="M12 6l-1.5 1.5h3L12 6zm0 12l1.5-1.5h-3L12 18zm4.5-7.5L18 12l-1.5 1.5V9zm-9 0L6 12l1.5 1.5V9z" fill="white"/>
                        </svg>
                    `)}"
                     style="width: 100%; height: 100%; object-fit: contain;"
                     alt="Website Logo"
                />
            </div>
        `;
        
        this.addEventListener('click', () => {
            const websiteInput = document.getElementById('website');
            if (websiteInput && websiteInput.value && this.isValidUrl(websiteInput.value)) {
                this.handleFetch(websiteInput.value);
            }
        });

        // Listen for website input changes
        const websiteInput = document.getElementById('website');
        if (websiteInput) {
            websiteInput.addEventListener('input', (e) => {
                // Clear any existing timer
                if (this.debounceTimer) {
                    clearTimeout(this.debounceTimer);
                }

                if (!e.target.value) {
                    this.resetLogo();
                    this.lastInputValue = '';
                    this.isTyping = false;
                    return;
                }

                this.isTyping = true;
                this.lastInputValue = e.target.value;

                // Set a timer to check if typing has stopped
                this.debounceTimer = setTimeout(() => {
                    this.isTyping = false;
                    // Only proceed if the input is valid and hasn't changed
                    if (this.isValidUrl(this.lastInputValue) && this.lastInputValue === e.target.value) {
                        console.log('Typing completed, waiting 3 seconds before fetching logo...');
                        // Wait additional 3 seconds before fetching
                        setTimeout(() => {
                            // Double check if the input hasn't changed during the wait
                            if (this.lastInputValue === e.target.value) {
                                console.log('Starting logo fetch for:', this.lastInputValue);
                                this.handleFetch(this.lastInputValue);
                            }
                        }, 3000);
                    }
                }, 500); // Check for typing completion after 500ms of no input
            });

            // Update blur event to use the same delay
            websiteInput.addEventListener('blur', (e) => {
                if (e.target.value && this.isValidUrl(e.target.value)) {
                    // Only fetch if we're not already in the process of fetching
                    if (!this.isTyping && this.lastInputValue === e.target.value) {
                        setTimeout(() => {
                            // Check if the input is still the same after the delay
                            if (this.lastInputValue === e.target.value) {
                                this.handleFetch(e.target.value);
                            }
                        }, 3000);
                    }
                }
            });
        }
    }

    isValidUrl(input) {
        // Check if input is at least 4 characters and contains a dot
        if (input.length < 4 || !input.includes('.')) {
            return false;
        }

        // Remove protocol and www if present
        let domain = input.replace(/^(https?:\/\/)?(www\.)?/, '');
        
        // Get the domain part (before any path, query parameters, or hash)
        domain = domain.split('/')[0].split('?')[0].split('#')[0];

        // Check if domain has at least one dot and valid characters
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
        return domainRegex.test(domain);
    }

    resetLogo() {
        const img = this.querySelector('#selectedLogo');
        if (img) {
            img.src = `data:image/svg+xml,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <rect width="24" height="24" fill="#666" rx="4"/>
                    <path d="M12 6l-1.5 1.5h3L12 6zm0 12l1.5-1.5h-3L12 18zm4.5-7.5L18 12l-1.5 1.5V9zm-9 0L6 12l1.5 1.5V9z" fill="white"/>
                </svg>
            `)}`;
        }
    }

    async handleFetch(websiteUrl) {
        if (!websiteUrl) return;

        const domain = this.cleanDomain(websiteUrl);
        if (!domain || !this.isValidDomain(domain)) {
            console.log('Invalid domain:', websiteUrl);
            return;
        }

        try {
            const logo = await this.fetchLogo(domain);
            if (logo) {
                const img = this.querySelector('#selectedLogo');
                if (img) {
                    img.src = logo;
                }
            }
        } catch (error) {
            console.error('Error fetching logo:', error);
        }
    }

    updateLogoPreview(logoUrl) {
        const previewImg = this.querySelector('#selectedLogo');
        previewImg.src = logoUrl;
        previewImg.style.display = 'inline-block';
    }

    saveThumbnail(domain, logoUrl) {
        const thumbnails = JSON.parse(localStorage.getItem('logoThumbnails') || '[]');
        const newThumbnail = {
            domain,
            logoUrl,
            timestamp: new Date().toISOString()
        };
        
        // Add new thumbnail at the beginning and keep only last 12
        thumbnails.unshift(newThumbnail);
        if (thumbnails.length > 12) {
            thumbnails.pop();
        }
        
        localStorage.setItem('logoThumbnails', JSON.stringify(thumbnails));
    }

    loadThumbnails() {
        const container = this.querySelector('.thumbnails-container');
        const thumbnails = JSON.parse(localStorage.getItem('logoThumbnails') || '[]');
        
        container.innerHTML = thumbnails.map(thumb => `
            <div class="thumbnail" style="cursor: pointer; text-align: center;">
                <img src="${thumb.logoUrl}" 
                     alt="${thumb.domain}" 
                     title="${thumb.domain}\n${new Date(thumb.timestamp).toLocaleString()}"
                     style="width: 48px; height: 48px; object-fit: contain; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
                     onclick="this.closest('web-logo-fetch').updateLogoPreview('${thumb.logoUrl}')" />
            </div>
        `).join('');
    }

    async fetchLogo(domain) {
        if (!domain) {
            console.error('Domain is required');
            return null;
        }

        const cleanedDomain = this.cleanDomain(domain);
        if (!this.isValidDomain(cleanedDomain)) {
            console.error('Invalid domain:', cleanedDomain);
            return null;
        }

        // Special cases for known domains
        const specialCases = {
            'x.com': 'twitter.com',
            'gmail.com': 'google.com',
            'youtube.com': 'youtube.com',
            'github.com': 'github.com'
        };

        const domainToUse = specialCases[cleanedDomain] || cleanedDomain;

        // Special case providers for known services
        const specialProviders = {
            'google.com': [
                'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png'
            ],
            'youtube.com': [
                'https://www.youtube.com/s/desktop/12d6b690/img/favicon_144x144.png'
            ],
            'github.com': [
                'https://github.githubassets.com/favicons/favicon.png'
            ],
            'twitter.com': [
                'https://abs.twimg.com/responsive-web/client-web/icon-default.522d363a.png'
            ]
        };

        // Try special case providers first
        if (specialProviders[domainToUse]) {
            for (const provider of specialProviders[domainToUse]) {
                try {
                    const logo = await this.tryFetchLogo(provider);
                    if (logo) return logo;
                } catch (error) {
                    console.warn(`Failed to fetch special logo for ${domainToUse}:`, error);
                }
            }
        }

        // General providers
        const providers = [
            `https://logo.clearbit.com/${domainToUse}`,
            `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${domainToUse}&size=128`,
            `https://icons.duckduckgo.com/ip3/${domainToUse}.ico`,
            `https://${domainToUse}/favicon.ico`
        ];

        for (const provider of providers) {
            try {
                const logo = await this.tryFetchLogo(provider);
                if (logo) return logo;
            } catch (error) {
                console.warn(`Failed to fetch from ${provider}:`, error);
                continue;
            }
        }

        console.log('No logo found, creating default logo');
        return this.createDefaultLogo(cleanedDomain);
    }

    async tryFetchLogo(provider) {
        // Check cache first
        if (this.logoCache.has(provider)) {
            return this.logoCache.get(provider);
        }

        // Check if we've exceeded retry attempts
        const attempts = this.failedAttempts.get(provider) || 0;
        if (attempts >= this.maxRetries) {
            console.warn(`Max retries exceeded for ${provider}`);
            return null;
        }

        console.log(`Attempting to fetch logo from: ${provider}`);
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(provider)}`;
                
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(proxyUrl, {
                signal: controller.signal,
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 504) {
                    console.warn(`Timeout fetching from ${provider}`);
                    this.failedAttempts.set(provider, attempts + 1);
                    // Retry after delay
                    if (attempts < this.maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                        return this.tryFetchLogo(provider);
                    }
                    return null;
                }
                console.warn(`Failed to fetch from ${provider}: ${response.status} - ${errorText}`);
                return null;
            }

            const blob = await response.blob();
            if (!blob || blob.size < 50) {
                console.warn(`Image too small or invalid from ${provider}: ${blob?.size || 0} bytes`);
                return null;
            }

            const objectUrl = URL.createObjectURL(blob);

            try {
                const dimensions = await Promise.race([
                    new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => {
                            const valid = img.width >= 8 && img.height >= 8;
                            resolve(valid ? { width: img.width, height: img.height } : null);
                        };
                        img.onerror = () => reject(new Error('Failed to load image'));
                        img.src = objectUrl;
                    }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Image load timeout')), 3000)
                    )
                ]).catch(error => {
                    console.warn(`Error loading image from ${provider}:`, error);
                    return null;
                });

                if (!dimensions) {
                    console.warn(`Invalid image dimensions from ${provider}`);
                    URL.revokeObjectURL(objectUrl);
                    return null;
                }

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = canvas.height = 48;

                const img = await Promise.race([
                    new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => resolve(img);
                        img.src = objectUrl;
                    }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Image processing timeout')), 3000)
                    )
                ]).catch(error => {
                    console.warn(`Error processing image from ${provider}:`, error);
                    return null;
                });

                if (!img) {
                    URL.revokeObjectURL(objectUrl);
                    return null;
                }

                ctx.clearRect(0, 0, 48, 48);

                const scale = Math.min(48 / img.width, 48 / img.height);
                const width = img.width * scale;
                const height = img.height * scale;
                const x = (48 - width) / 2;
                const y = (48 - height) / 2;

                ctx.drawImage(img, x, y, width, height);

                URL.revokeObjectURL(objectUrl);
                const result = canvas.toDataURL('image/png');
                
                // Cache successful result
                this.logoCache.set(provider, result);
                this.failedAttempts.delete(provider);
                
                return result;
            } catch (error) {
                console.warn(`Error processing image from ${provider}:`, error);
                URL.revokeObjectURL(objectUrl);
                return null;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn(`Request timeout for ${provider}`);
                this.failedAttempts.set(provider, attempts + 1);
                // Retry after delay
                if (attempts < this.maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                    return this.tryFetchLogo(provider);
                }
            } else {
                console.warn(`Network error fetching from ${provider}:`, error);
            }
            return null;
        }
    }

    isValidDomain(domain) {
        if (!domain) return false;
        if (domain.length < 4 || !domain.includes('.')) return false;
        const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
        return domainRegex.test(domain);
    }

    cleanDomain(url) {
        try {
            if (!url) return null;
            let domain = url.replace(/^(https?:\/\/)?(www\.)?/, '');
            domain = domain.split('/')[0];
            domain = domain.split('?')[0].split('#')[0];
            domain = domain.toLowerCase().trim();
            return domain.length < 4 || !domain.includes('.') ? null : domain;
        } catch (e) {
            console.error('Error cleaning domain:', e);
            return null;
        }
    }

    createDefaultLogo(domain) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#1a73e8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Text (first two letters of domain)
        const text = domain.substring(0, 2).toUpperCase();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        return canvas.toDataURL('image/png');
    }

    async showLogoSelectionDialog(logos, domain) {
        // Clean up any existing dialogs
        const existingDialogs = document.querySelectorAll('.logo-selection-dialog');
        const existingOverlays = document.querySelectorAll('.logo-selection-overlay');
        existingDialogs.forEach(dialog => dialog.remove());
        existingOverlays.forEach(overlay => overlay.remove());

        return new Promise((resolve) => {
            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'logo-selection-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.75);
                z-index: 999;
            `;

            // Create dialog
            const dialog = document.createElement('div');
            dialog.className = 'logo-selection-dialog';
            dialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #2d2d2d;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                z-index: 1000;
                min-width: 500px;
            `;

            // Add title
            const title = document.createElement('h3');
            title.textContent = 'Select Logo';
            title.style.cssText = `
                margin: 0 0 20px 0;
                color: white;
                font-size: 18px;
                text-align: center;
            `;
            dialog.appendChild(title);

            // Create logo options container
            const optionsContainer = document.createElement('div');
            optionsContainer.style.cssText = `
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            `;

            // Add logo options
            const options = [
                {
                    type: 'actual',
                    label: 'Company Logo',
                    url: logos[0]?.url || this.createDefaultLogo(domain)
                },
                {
                    type: 'default',
                    label: 'Default Logo',
                    url: this.createDefaultLogo(domain)
                },
                {
                    type: 'upload',
                    label: 'Upload Logo',
                    icon: '⬆️'
                }
            ];

            let selectedOption = options[0];

            options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.style.cssText = `
                    border: 2px solid ${index === 0 ? '#1a73e8' : '#404040'};
                    border-radius: 8px;
                    padding: 15px;
                    cursor: pointer;
                    text-align: center;
                    background: #363636;
                    transition: all 0.2s;
                `;

                if (option.url) {
                    const img = document.createElement('img');
                    img.src = option.url;
                    img.style.cssText = `
                        width: 64px;
                        height: 64px;
                        margin-bottom: 10px;
                        object-fit: contain;
                    `;
                    optionElement.appendChild(img);
                } else if (option.icon) {
                    const iconDiv = document.createElement('div');
                    iconDiv.innerHTML = option.icon;
                    iconDiv.style.cssText = `
                        font-size: 32px;
                        margin-bottom: 10px;
                    `;
                    optionElement.appendChild(iconDiv);
                }

                const label = document.createElement('div');
                label.textContent = option.label;
                label.style.cssText = `
                    color: white;
                    font-size: 14px;
                `;
                optionElement.appendChild(label);

                optionElement.addEventListener('click', () => {
                    if (option.type === 'upload') {
                        fileInput.click();
                        return;
                    }
                    optionsContainer.querySelectorAll('div').forEach(div => {
                        div.style.borderColor = '#404040';
                    });
                    optionElement.style.borderColor = '#1a73e8';
                    selectedOption = option;
                });

                optionsContainer.appendChild(optionElement);
            });

            dialog.appendChild(optionsContainer);

            // Add file input for upload option
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            fileInput.addEventListener('change', async () => {
                const file = fileInput.files[0];
                if (file) {
                    try {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            cleanup();
                            resolve({
                                url: e.target.result,
                                type: 'uploaded',
                                label: 'Uploaded Logo'
                            });
                        };
                        reader.readAsDataURL(file);
                    } catch (error) {
                        console.error('Error processing upload:', error);
                    }
                }
            });
            dialog.appendChild(fileInput);

            // Add buttons
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = `
                display: flex;
                justify-content: center;
                gap: 10px;
            `;

            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'Confirm';
            confirmBtn.style.cssText = `
                padding: 8px 20px;
                border: none;
                border-radius: 4px;
                background: #1a73e8;
                color: white;
                cursor: pointer;
            `;

            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.style.cssText = `
                padding: 8px 20px;
                border: none;
                border-radius: 4px;
                background: #dc3545;
                color: white;
                cursor: pointer;
            `;

            const cleanup = () => {
                document.body.removeChild(overlay);
                document.body.removeChild(dialog);
            };

            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(selectedOption);
            });

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(null);
            });

            buttonContainer.appendChild(confirmBtn);
            buttonContainer.appendChild(cancelBtn);
            dialog.appendChild(buttonContainer);

            document.body.appendChild(overlay);
            document.body.appendChild(dialog);
        });
    }
}

// Register the web component
customElements.define('web-logo-fetch', WebLogoFetch); 