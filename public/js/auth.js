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
            } else {
                UI.showNotification(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            UI.showNotification('Login failed. Please try again.', 'error');
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
    },

    getToken() {
        return localStorage.getItem('token');
    },

    isAuthenticated() {
        return !!this.getToken();
    }
};

// Export the Auth module
window.Auth = Auth; 