// Account Manager Module
window.AccountManager = {
    isEditing: false,

    async loadAccounts() {
        console.log('Starting loadAccounts function');
        const accountsList = document.getElementById('accounts-list');
        
        if (!accountsList) {
            console.error('accounts-list element not found');
            return;
        }

        try {
            const token = Auth.getToken();
            if (!token) {
                console.error('No authentication token found');
                UI.showAuthForms();
                return;
            }

            console.log('Fetching accounts...');
            const response = await fetch('/api/accounts', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const accounts = await response.json();
            console.log('Accounts loaded successfully:', accounts.length);
            await this.displayAccounts(accounts);
        } catch (error) {
            console.error('Error in loadAccounts:', error);
            accountsList.innerHTML = '<div class="error-message">Error loading accounts: ' + error.message + '</div>';
            UI.showNotification('Failed to load accounts', 'error');
        }
    },

    async displayAccounts(accounts) {
        console.log('Starting displayAccounts function');
        const accountsList = document.getElementById('accounts-list');
        const accountsTitle = document.querySelector('.accounts-container h2');
        
        if (!accountsList) {
            console.error('accounts-list element not found');
            return;
        }

        if (!window.UI) {
            console.error('UI module not loaded');
            return;
        }

        try {
            if (!Array.isArray(accounts)) {
                throw new Error('Invalid accounts data received');
            }

            console.log('Processing', accounts.length, 'accounts');
            
            if (accountsTitle) {
                accountsTitle.textContent = `Stored Accounts (${accounts.length})`;
            }

            if (accounts.length === 0) {
                accountsList.innerHTML = '<div class="no-accounts">No accounts found. Add your first account using the form above.</div>';
                return;
            }

            accountsList.innerHTML = '';
            accounts.sort((a, b) => (a.serialNumber || 0) - (b.serialNumber || 0));

            accounts.forEach((account, index) => {
                try {
                    console.log(`Processing account ${index + 1}:`, account.name);
                    
                    const accountCard = document.createElement('div');
                    accountCard.className = 'account-card';
                    
                    const serialNumber = account.serialNumber || (index + 1);
                    const accountLogo = window.UI.createAccountLogo(account);
                    
                    accountCard.innerHTML = `
                        <div class="serial-number">#${serialNumber}</div>
                        <div class="account-content">
                            <div class="account-logo-container">
                                <img 
                                    src="${accountLogo}"
                                    alt="${account.name || 'Account'}"
                                    class="account-logo"
                                    onerror="this.src='${accountLogo}';"
                                />
                            </div>
                            <div class="account-info">
                                <h3>${account.name || 'Unnamed Account'}</h3>
                                <p><strong>Website:</strong> ${account.website || 'N/A'}</p>
                                <p><strong>Username:</strong> ${account.username || 'N/A'}</p>
                                <p><strong>Email:</strong> ${account.email || 'N/A'}</p>
                                <div class="password-field">
                                    <strong>Password:</strong> 
                                    <span class="password-value" data-password="${account.password || ''}">••••••••</span>
                                    <button type="button" class="show-password" onclick="UI.togglePasswordVisibility(this)">Show</button>
                                </div>
                                ${account.note ? `<p><strong>Note:</strong> ${account.note}</p>` : ''}
                                ${account.attachedFile ? `
                                    <div class="file-info">
                                        <strong>File:</strong> 
                                        <a href="#" onclick="AccountManager.viewFile('${account._id}', '${account.attachedFile.filename}'); return false;" 
                                           class="file-link">
                                            <i class="fas fa-paperclip"></i>
                                            ${account.attachedFile.filename}
                                        </a>
                                    </div>` : ''}
                            </div>
                            <div class="account-actions">
                                <button onclick="AccountManager.editAccount('${account._id}')" class="edit-btn">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button onclick="AccountManager.deleteAccount('${account._id}')" class="delete-btn">
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
            accountsList.innerHTML = '<div class="error-message">Error displaying accounts: ' + error.message + '</div>';
            UI.showNotification('Failed to display accounts', 'error');
        }
    },

    async handleAccountSubmit(e) {
        e.preventDefault();
        
        try {
            const accountId = document.getElementById('account-id').value;
            const website = document.getElementById('website').value.trim();
            const name = document.getElementById('name').value.trim();
            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const note = document.getElementById('note').value.trim();
            const fileInput = document.getElementById('attachedFile');

            if (!name) throw new Error('Name is required');
            if (!username) throw new Error('Username is required');
            if (!email) throw new Error('Email is required');
            if (!password) throw new Error('Password is required');

            if (fileInput.files[0] && fileInput.files[0].size > 50 * 1024 * 1024) {
                throw new Error('File size must be less than 50MB');
            }

            const accountData = { website, name, username, email, password, note };
            const token = Auth.getToken();
            if (!token) throw new Error('Not authenticated');

            const method = accountId ? 'PUT' : 'POST';
            const url = accountId ? `/api/accounts/${accountId}` : '/api/accounts';

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

            if (fileInput.files[0]) {
                UI.showNotification('Uploading file...', 'success');
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
                    throw new Error('File upload failed');
                }
            }

            UI.resetForm();
            await this.loadAccounts();
            UI.showNotification(
                accountId ? '✅ Account updated successfully!' : '✅ Account created successfully!',
                'success'
            );
        } catch (error) {
            console.error('Error saving account:', error);
            UI.showNotification('❌ ' + (error.message || 'Error saving account'), 'error');
        }
    },

    async editAccount(id) {
        try {
            const token = Auth.getToken();
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
            UI.fillAccountForm(account);
            this.isEditing = true;
            
            document.querySelector('.account-form-container').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error loading account details:', error);
            UI.showNotification(error.message || 'Error loading account details', 'error');
        }
    },

    async deleteAccount(id) {
        if (!confirm('Are you sure you want to delete this account?')) {
            return;
        }

        try {
            const token = Auth.getToken();
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`/api/accounts/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                await this.loadAccounts();
                UI.showNotification('✅ Account deleted successfully!', 'success');
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            UI.showNotification('❌ ' + (error.message || 'Error deleting account'), 'error');
        }
    },

    async viewFile(accountId, filename) {
        try {
            const token = Auth.getToken();
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`/api/accounts/file/${accountId}/generate-access`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to generate file access URL');
            }

            const data = await response.json();
            if (data.success && data.url) {
                const baseUrl = data.url;
                const authToken = encodeURIComponent(token);
                const finalUrl = `${baseUrl}&token=${authToken}`;
                window.open(finalUrl, '_blank');
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Error viewing file:', error);
            UI.showNotification(error.message || 'Error viewing file', 'error');
        }
    }
}; 