async function displayAccounts(accounts) {
    console.log('Starting displayAccounts function');
    const accountsList = document.getElementById('accounts-list');
    const accountsTitle = document.querySelector('.accounts-container h2');
    
    if (!accountsList) {
        console.error('accounts-list element not found');
        return;
    }

    try {
        if (!Array.isArray(accounts)) {
            console.error('Accounts is not an array:', accounts);
            accountsList.innerHTML = '<div class="text-danger">Invalid account data received</div>';
            return;
        }

        console.log('Processing', accounts.length, 'accounts');
        
        // Update the title to show total accounts
        if (accountsTitle) {
            accountsTitle.textContent = `Stored Accounts (${accounts.length})`;
        }

        if (accounts.length === 0) {
            accountsList.innerHTML = '<div class="text-center">No accounts found. Add your first account using the form above.</div>';
            return;
        }

        // Clear the list
        accountsList.innerHTML = '';

        // Sort accounts by serialNumber
        accounts.sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0));

        // Create account cards
        accounts.forEach((account, index) => {
            try {
                console.log(`Processing account ${index + 1}:`, account.name);
                
                const accountCard = document.createElement('div');
                accountCard.className = 'account-card';
                
                // Add serial number display
                const serialNumber = account.serialNumber || (index + 1);
                
                accountCard.innerHTML = `
                    <div class="serial-number">#${serialNumber}</div>
                    <div class="account-content">
                        <div class="account-logo-container">
                            <img 
                                src="${account.weblogo || createAccountLogo(account)}"
                                alt="${account.name || 'Account'}"
                                class="account-logo"
                                onerror="this.src='${createAccountLogo(account)}';"
                            />
                        </div>
                        <div class="account-info">
                            <h3>${account.name || 'Unnamed Account'}</h3>
                            <p><strong>Website:</strong> ${account.website || 'N/A'}</p>
                            <p><strong>Username:</strong> ${account.username || 'N/A'}</p>
                            <p><strong>Email:</strong> ${account.email || 'N/A'}</p>
                            <div class="password-field">
                                <strong>Password:</strong>
                                <span class="password-value">••••••••</span>
                                <button class="show-password" onclick="togglePasswordVisibility(this, '${account.password}')">Show</button>
                            </div>
                            ${account.note ? `<p><strong>Note:</strong> ${account.note}</p>` : ''}
                            ${account.attachedFile ? `
                                <div class="file-info">
                                    <strong>File:</strong> 
                                    <a href="#" onclick="viewFile('${account._id}', '${account.attachedFile.filename}'); return false;" 
                                       class="file-link">
                                        <i class="fas fa-paperclip"></i>
                                        ${account.attachedFile.filename}
                                    </a>
                                </div>` : ''}
                        </div>
                        <div class="account-actions">
                            <button onclick="editAccount('${account._id}')" class="edit-btn">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button onclick="deleteAccount('${account._id}')" class="delete-btn">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
                
                accountsList.appendChild(accountCard);
                console.log(`Account ${index + 1} added to DOM`);
            } catch (error) {
                console.error(`Error processing account ${index + 1}:`, error);
            }
        });

        console.log('Finished displaying all accounts');
    } catch (error) {
        console.error('Error in displayAccounts:', error);
        accountsList.innerHTML = '<div class="text-danger">Error displaying accounts: ' + error.message + '</div>';
    }
}

// Update password visibility toggle function
function togglePasswordVisibility(button, password) {
    const passwordValue = button.previousElementSibling;
    if (passwordValue.textContent === '••••••••') {
        passwordValue.textContent = password;
        button.textContent = 'Hide';
    } else {
        passwordValue.textContent = '••••••••';
        button.textContent = 'Show';
    }
}

// Login form handler
async function handleLogin(e) {
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
            currentUser = data.user;
            
            // Show main content and load accounts
            showMainContent();
            loadAccounts();
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Add form submit event listeners
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Check authentication on page load
    checkAuth();
});

// Show/Hide UI sections
function showMainContent() {
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    if (currentUser) {
        document.getElementById('username-display').textContent = currentUser.username;
    }
}

function showAuthForms() {
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('main-content').classList.add('hidden');
}

// Check authentication status
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        showAuthForms();
        return;
    }

    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            showMainContent();
            loadAccounts();
        } else {
            localStorage.removeItem('token');
            showAuthForms();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        showAuthForms();
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    showAuthForms();
}

// Global variables
let currentUser = null;

// Load accounts from the server
async function loadAccounts() {
    console.log('Starting loadAccounts function');
    const accountsList = document.getElementById('accounts-list');
    
    if (!accountsList) {
        console.error('accounts-list element not found');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            accountsList.innerHTML = '<div class="text-danger">Please log in to view accounts</div>';
            return;
        }

        console.log('Fetching accounts...');
        const response = await fetch('/api/accounts', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        console.log('Account fetch response status:', response.status);
        
        if (response.ok) {
            const accounts = await response.json();
            console.log('Accounts loaded successfully:', accounts.length);
            await displayAccounts(accounts);
        } else {
            const errorData = await response.json();
            console.error('Failed to load accounts:', errorData);
            accountsList.innerHTML = '<div class="text-danger">Failed to load accounts: ' + (errorData.message || 'Unknown error') + '</div>';
        }
    } catch (error) {
        console.error('Error in loadAccounts:', error);
        accountsList.innerHTML = '<div class="text-danger">Error loading accounts: ' + error.message + '</div>';
    }
}

// Generate account logo
function createAccountLogo(account) {
    // Generate a consistent color based on the name
    const hash = (account.name || '').split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const hue = hash % 360;
    const color = `hsl(${hue}, 65%, 45%)`;
    
    // Get initials from account name
    const initial = (account.name || '??').substring(0, 2).toUpperCase();
    
    // Create SVG logo
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
            <rect width="40" height="40" fill="${color}" rx="4"/>
            <text x="50%" y="50%" font-family="Arial" font-size="20" 
                fill="white" text-anchor="middle" dy=".3em"
                font-weight="bold">${initial}</text>
        </svg>
    `)}`;
}

// Handle account form submission
async function handleAccountSubmit(e) {
    e.preventDefault();
    
    try {
        // Get form data
        const accountId = document.getElementById('account-id').value;
        const website = document.getElementById('website').value.trim();
        const name = document.getElementById('name').value.trim();
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const note = document.getElementById('note').value.trim();
        const fileInput = document.getElementById('attachedFile');

        // Validate required fields
        if (!name) throw new Error('Name is required');
        if (!username) throw new Error('Username is required');
        if (!email) throw new Error('Email is required');
        if (!password) throw new Error('Password is required');

        // Check file size if present
        if (fileInput.files[0] && fileInput.files[0].size > 50 * 1024 * 1024) {
            throw new Error('File size must be less than 50MB');
        }

        // Prepare account data
        const accountData = {
            website,
            name,
            username,
            email,
            password,
            note
        };

        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        // Determine if we're editing or creating
        const method = accountId ? 'PUT' : 'POST';
        const url = accountId ? `/api/accounts/${accountId}` : '/api/accounts';

        // Save account data
        const response = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(accountData)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to save account');
        }

        const savedAccount = await response.json();

        // Handle file upload if present
        if (fileInput.files[0]) {
            const formData = new FormData();
            formData.append('attachedFile', fileInput.files[0]);

            const uploadResponse = await fetch(`/api/accounts/upload/${savedAccount._id}`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                throw new Error('Account saved but file upload failed: ' + uploadData.message);
            }
        }

        // Reset form and reload accounts
        resetForm();
        await loadAccounts();
        showNotification(accountId ? 'Account updated successfully!' : 'Account created successfully!');
    } catch (error) {
        console.error('Error saving account:', error);
        showNotification(error.message || 'Error saving account', 'error');
    }
}

// Reset the account form
function resetForm() {
    const form = document.getElementById('account-form');
    form.reset();
    document.getElementById('account-id').value = '';
    document.getElementById('attachedFile').value = '';
    isEditing = false;
}

// Edit account
async function editAccount(id) {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`/api/accounts/${id}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to load account details');
        }

        const account = await response.json();
        fillAccountForm(account);
        isEditing = true;
        
        // Scroll to form
        document.querySelector('.account-form-container').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading account details:', error);
        showNotification(error.message || 'Error loading account details', 'error');
    }
}

// Fill the account form with data
function fillAccountForm(account) {
    document.getElementById('account-id').value = account._id || '';
    document.getElementById('website').value = account.website || '';
    document.getElementById('name').value = account.name || '';
    document.getElementById('username').value = account.username || '';
    document.getElementById('email').value = account.email || '';
    document.getElementById('password').value = account.password || '';
    document.getElementById('note').value = account.note || '';
}

// Delete account
async function deleteAccount(id) {
    if (!confirm('Are you sure you want to delete this account?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`/api/accounts/${id}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showNotification('Account deleted successfully');
            loadAccounts();
        } else {
            const data = await response.json();
            throw new Error(data.message || 'Failed to delete account');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        showNotification(error.message || 'Error deleting account', 'error');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Generate strong password
function generatePassword() {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let password = '';
    
    // Ensure at least one of each character type
    password += charset.match(/[a-z]/)[0]; // lowercase
    password += charset.match(/[A-Z]/)[0]; // uppercase
    password += charset.match(/[0-9]/)[0]; // number
    password += charset.match(/[^a-zA-Z0-9]/)[0]; // special character
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    // Set the password field value
    document.getElementById('password').value = password;
}

// Add event listener for account form
document.addEventListener('DOMContentLoaded', () => {
    const accountForm = document.getElementById('account-form');
    if (accountForm) {
        accountForm.addEventListener('submit', handleAccountSubmit);
    }
});

// Global variable for editing state
let isEditing = false;