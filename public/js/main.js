// Main application initialization
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize base URL for API calls
        window.API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? ''
            : 'https://atlas-account-vault.herokuapp.com';

        // Initialize UI components
        await UI.initialize();
        
        // Check authentication status
        const token = localStorage.getItem('token');
        if (token) {
            try {
                await Auth.verifyToken(token);
                UI.showMainContent();
            } catch (error) {
                console.error('Token verification failed:', error);
                UI.showAuthForms();
            }
        } else {
            UI.showAuthForms();
        }

        // Remove loading message
        document.getElementById('loading').style.display = 'none';
    } catch (error) {
        console.error('Initialization error:', error);
        UI.showNotification('Error initializing application. Please try again.', 'error');
    }
});

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing application...');

    // Initialize password toggle icons
    const initializePasswordToggles = () => {
        document.querySelectorAll('.toggle-password').forEach(icon => {
            icon.removeEventListener('click', handlePasswordToggle);
            icon.addEventListener('click', handlePasswordToggle);
        });
    };

    const handlePasswordToggle = function(e) {
        e.preventDefault();
        e.stopPropagation();
        UI.togglePasswordVisibility(this);
    };

    // Initial setup of password toggles
    initializePasswordToggles();

    // Function to show login form
    window.showLoginForm = () => {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
        document.querySelector('.auth-toggle button:first-child').classList.add('active');
        document.querySelector('.auth-toggle button:last-child').classList.remove('active');
        initializePasswordToggles(); // Reinitialize toggles after form switch
    };

    // Function to show register form
    window.showRegisterForm = () => {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
        document.querySelector('.auth-toggle button:first-child').classList.remove('active');
        document.querySelector('.auth-toggle button:last-child').classList.add('active');
        initializePasswordToggles(); // Reinitialize toggles after form switch
    };

    // Add form submit event listeners
    const accountForm = document.getElementById('account-form');
    if (accountForm) {
        accountForm.addEventListener('submit', (e) => AccountManager.handleAccountSubmit(e));
    }

    // Add click handlers for auth toggle buttons
    const loginToggle = document.querySelector('.auth-toggle button:first-child');
    const registerToggle = document.querySelector('.auth-toggle button:last-child');
    
    if (loginToggle) {
        loginToggle.addEventListener('click', showLoginForm);
    }

    if (registerToggle) {
        registerToggle.addEventListener('click', showRegisterForm);
    }

    // Add click handler for logout button
    const logoutButton = document.querySelector('button[onclick="Auth.logout()"]');
    if (logoutButton) {
        logoutButton.onclick = () => Auth.logout();
    }

    // Add click handler for generate password button
    const generatePasswordButton = document.querySelector('button[onclick="UI.generatePassword()"]');
    if (generatePasswordButton) {
        generatePasswordButton.onclick = () => UI.generatePassword();
    }

    // Check authentication status on page load
    Auth.checkAuth();

    console.log('Application initialized');
}); 