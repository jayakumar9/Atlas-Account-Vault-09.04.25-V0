// Authentication Module
const Auth = {
    currentUser: null,

    async handleLogin(e) {
        e.preventDefault();
        console.log('Login form submitted');
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok) {
                // Store token and user data
                localStorage.setItem('token', data.token);
                this.currentUser = data.user;
                
                // Show main content and load accounts
                UI.showMainContent();
                AccountManager.loadAccounts();
                UI.showNotification('✅ Successfully logged in!', 'success');
            } else {
                UI.showNotification('❌ ' + (data.message || 'Login failed'), 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            UI.showNotification('❌ Login failed. Please try again.', 'error');
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        console.log('Register form submitted');
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            console.log('Register response:', data);

            if (response.ok) {
                UI.showNotification('✅ Registration successful! Please log in.', 'success');
                showLoginForm(); // Switch to login form
            } else {
                UI.showNotification('❌ ' + (data.message || 'Registration failed'), 'error');
            }
        } catch (error) {
            console.error('Register error:', error);
            UI.showNotification('❌ Registration failed. Please try again.', 'error');
        }
    },

    async checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            UI.showAuthForms();
            return;
        }

        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.currentUser = await response.json();
                UI.showMainContent();
                AccountManager.loadAccounts();
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.logout();
        }
    },

    logout() {
        localStorage.removeItem('token');
        this.currentUser = null;
        UI.showAuthForms();
        UI.showNotification('👋 Successfully logged out!', 'success');
    },

    getToken() {
        return localStorage.getItem('token');
    },

    isAuthenticated() {
        return !!this.getToken();
    }
};

// Add event listeners for forms
document.getElementById('login-form').addEventListener('submit', (e) => Auth.handleLogin(e));
document.getElementById('register-form').addEventListener('submit', (e) => Auth.handleRegister(e));

// Export the Auth module
window.Auth = Auth; 