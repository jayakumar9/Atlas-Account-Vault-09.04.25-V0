// UI Module
window.UI = {
    showMainContent() {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        if (Auth.currentUser) {
            document.getElementById('username-display').textContent = `Welcome, ${Auth.currentUser.username}`;
        }
    },

    showAuthForms() {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('main-content').classList.add('hidden');
    },

    showNotification(message, type = 'success') {
        console.log('[UI] Showing notification:', { message, type });
        
        if (!window.NotificationSystem) {
            console.error('[UI] NotificationSystem not loaded!');
            return;
        }
        
        console.log('[UI] NotificationSystem available, calling method:', type);
        if (type === 'success') {
            NotificationSystem.success(message);
        } else {
            NotificationSystem.error(message);
        }
    },

    fillAccountForm(account) {
        document.getElementById('account-id').value = account._id || '';
        document.getElementById('website').value = account.website || '';
        document.getElementById('name').value = account.name || '';
        document.getElementById('username').value = account.username || '';
        document.getElementById('email').value = account.email || '';
        document.getElementById('password').value = account.password || '';
        document.getElementById('note').value = account.note || '';
    },

    resetForm() {
        const form = document.getElementById('account-form');
        form.reset();
        document.getElementById('account-id').value = '';
        document.getElementById('attachedFile').value = '';
        if (window.AccountManager) {
            AccountManager.isEditing = false;
        }
    },

    createAccountLogo(account) {
        if (!account || typeof account !== 'object') {
            console.error('Invalid account object:', account);
            return this.createDefaultLogo();
        }

        try {
            // If website URL exists, try to get its favicon
            if (account.website) {
                let websiteUrl = account.website.toLowerCase();
                
                // Add https:// if no protocol is specified
                if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
                    websiteUrl = 'https://' + websiteUrl;
                }

                try {
                    const url = new URL(websiteUrl);
                    const hostname = url.hostname.replace(/^www\./, '');
                    
                    // Use a default logo initially
                    const defaultLogo = this.createDefaultLogoFromName(account.name);
                    
                    // Create an image element to test logo URLs
                    const img = new Image();
                    let currentServiceIndex = 0;
                    
                    const services = [
                        // 1. Clearbit Logo API (high quality, includes brand logos)
                        `https://logo.clearbit.com/${hostname}`,
                        // 2. Google S2 Favicon Service (reliable, basic favicons)
                        `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
                        // 3. DuckDuckGo Favicon Service (good fallback)
                        `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
                        // 4. Direct favicon from website
                        `${url.origin}/favicon.ico`
                    ];

                    // Cache successful logo URLs
                    if (!window.UI.logoCache) {
                        window.UI.logoCache = new Map();
                    }

                    // Check cache first
                    if (window.UI.logoCache.has(hostname)) {
                        return window.UI.logoCache.get(hostname);
                    }

                    // Try loading the logo from each service
                    const tryLoadLogo = () => {
                        if (currentServiceIndex >= services.length) {
                            return defaultLogo;
                        }

                        return new Promise((resolve) => {
                            const logoUrl = services[currentServiceIndex];
                            img.onload = () => {
                                // Cache successful result
                                window.UI.logoCache.set(hostname, logoUrl);
                                resolve(logoUrl);
                            };
                            img.onerror = () => {
                                currentServiceIndex++;
                                if (currentServiceIndex < services.length) {
                                    img.src = services[currentServiceIndex];
                                } else {
                                    // Cache default logo to prevent future attempts
                                    window.UI.logoCache.set(hostname, defaultLogo);
                                    resolve(defaultLogo);
                                }
                            };
                            img.src = logoUrl;
                        });
                    };

                    // Return default logo immediately while trying to load the actual logo
                    tryLoadLogo().then(logoUrl => {
                        // Update all instances of this website's logo
                        document.querySelectorAll('.account-logo').forEach(logoImg => {
                            if (logoImg.dataset.website === hostname) {
                                logoImg.src = logoUrl;
                            }
                        });
                    });

                    return defaultLogo;
                } catch (urlError) {
                    console.error('Invalid URL:', urlError);
                    return this.createDefaultLogoFromName(account.name);
                }
            }

            return this.createDefaultLogoFromName(account.name);
        } catch (error) {
            console.error('Error creating account logo:', error);
            return this.createDefaultLogo();
        }
    },

    createDefaultLogoFromName(name) {
        // Generate logo from name
        const displayName = name || '??';
        const hash = displayName.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        const hue = hash % 360;
        const color = `hsl(${hue}, 65%, 45%)`;
        const initial = displayName.substring(0, 2).toUpperCase();
        
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
                <rect width="40" height="40" fill="${color}" rx="4"/>
                <text x="50%" y="50%" font-family="Arial" font-size="20" 
                    fill="white" text-anchor="middle" dy=".3em"
                    font-weight="bold">${initial}</text>
            </svg>
        `)}`;
    },

    createDefaultLogo() {
        return this.createDefaultLogoFromName('??');
    },

    togglePasswordVisibility(element) {
        if (!element) return;
        
        try {
            // Check if this is a show/hide button in an account card
            if (element.classList.contains('show-password')) {
                const passwordSpan = element.previousElementSibling;
                if (passwordSpan && passwordSpan.classList.contains('password-value')) {
                    const password = passwordSpan.getAttribute('data-password');
                    if (passwordSpan.textContent === '••••••••') {
                        passwordSpan.textContent = password;
                        element.textContent = 'Hide';
                    } else {
                        passwordSpan.textContent = '••••••••';
                        element.textContent = 'Show';
                    }
                    return;
                }
            }

            // Handle password input fields (for forms)
            const input = element.previousElementSibling;
            if (!input || !input.type) {
                console.error('No password input found');
                return;
            }

            if (input.type === 'password') {
                input.type = 'text';
                element.classList.remove('fa-eye');
                element.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                element.classList.remove('fa-eye-slash');
                element.classList.add('fa-eye');
            }
        } catch (error) {
            console.error('Error toggling password visibility:', error);
        }
    },

    generatePassword(targetId = null) {
        try {
            const length = 16;
            const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
            let password = '';
            
            // Ensure at least one of each type
            password += charset.match(/[a-z]/)[0];
            password += charset.match(/[A-Z]/)[0];
            password += charset.match(/[0-9]/)[0];
            password += charset.match(/[^a-zA-Z0-9]/)[0];
            
            // Fill the rest randomly
            for (let i = password.length; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * charset.length);
                password += charset[randomIndex];
            }
            
            // Shuffle the password
            password = password.split('').sort(() => Math.random() - 0.5).join('');
            
            // Set the password in the input field
            const passwordInput = document.getElementById(targetId || 'password');
            if (passwordInput) {
                passwordInput.value = password;
                passwordInput.type = 'text';
                setTimeout(() => {
                    passwordInput.type = 'password';
                }, 2000);
            }
        } catch (error) {
            console.error('Error generating password:', error);
            UI.showNotification('Error generating password', 'error');
        }
    }
};

// Update database info in header
async function updateDatabaseInfo() {
    try {
        const response = await fetch('/api/db-info');
        const data = await response.json();
        
        document.getElementById('db-name').textContent = data.dbName;
        document.getElementById('collection-name').textContent = data.collectionName;
    } catch (error) {
        console.error('Error fetching database info:', error);
    }
}

// Call this when initializing the UI
document.addEventListener('DOMContentLoaded', () => {
    // ... existing initialization code ...
    updateDatabaseInfo();
}); 