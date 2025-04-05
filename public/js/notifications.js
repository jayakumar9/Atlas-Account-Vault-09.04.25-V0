// Debug CSS loading
console.log('[NotificationSystem] Checking loaded stylesheets:');
Array.from(document.styleSheets).forEach((sheet, i) => {
    try {
        console.log(`Stylesheet ${i}:`, {
            href: sheet.href,
            rules: sheet.cssRules ? sheet.cssRules.length : 'No access to rules'
        });
    } catch (e) {
        console.log(`Stylesheet ${i}: No access (probably CORS)`);
    }
});

// Notification System
window.NotificationSystem = {
    show(message, type = 'success') {
        console.log('[NotificationSystem] Creating notification:', { message, type });
        
        // Remove any existing notifications
        this.removeAll();

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `app-notification ${type}`;
        
        console.log('[NotificationSystem] Created element with class:', notification.className);
        console.log('[NotificationSystem] Element styles:', window.getComputedStyle(notification));

        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        messageEl.textContent = message;
        notification.appendChild(messageEl);

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => this.remove(notification);
        notification.appendChild(closeBtn);

        // Add to document
        document.body.appendChild(notification);
        
        // Log computed styles after adding to document
        console.log('[NotificationSystem] Final computed styles:', {
            backgroundColor: window.getComputedStyle(notification).backgroundColor,
            color: window.getComputedStyle(notification).color,
            classes: notification.className
        });

        // Remove automatically after animation
        notification.addEventListener('animationend', (e) => {
            if (e.animationName === 'fadeOut') {
                this.remove(notification);
            }
        });

        return notification;
    },

    success(message) {
        console.log('[NotificationSystem] Success called with message:', message);
        return this.show(message, 'success');
    },

    error(message) {
        console.log('[NotificationSystem] Error called with message:', message);
        return this.show(message, 'error');
    },

    remove(notification) {
        console.log('[NotificationSystem] Removing notification');
        if (notification && notification.parentElement) {
            notification.parentElement.removeChild(notification);
        }
    },

    removeAll() {
        console.log('[NotificationSystem] Removing all notifications');
        const notifications = document.querySelectorAll('.app-notification');
        notifications.forEach(notification => this.remove(notification));
    }
}; 