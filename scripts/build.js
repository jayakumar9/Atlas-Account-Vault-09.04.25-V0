const fs = require('fs');
const path = require('path');

// Ensure build directory exists
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

// Base URL for GitHub Pages
const baseUrl = '/Atlas-Account-Vault-04.04.25-V0';

// Update paths in HTML files to be relative
const updateHtmlFiles = (directory) => {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
        if (file.endsWith('.html')) {
            const filePath = path.join(directory, file);
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Update paths to use base URL
            content = content.replace(/href="\//g, `href="${baseUrl}/`);
            content = content.replace(/src="\//g, `src="${baseUrl}/`);
            content = content.replace(/url\(\//g, `url(${baseUrl}/`);
            
            // Update image paths
            content = content.replace(/\/images\//g, `${baseUrl}/images/`);
            
            // Update API endpoints to use the production URL
            content = content.replace(/\/api\//g, 'https://atlas-account-vault.herokuapp.com/api/');
            
            fs.writeFileSync(filePath, content);
        }
    });
};

// Update CSS files to use correct image paths
const updateCssFiles = (directory) => {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
        if (file.endsWith('.css')) {
            const filePath = path.join(directory, file);
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Update image paths in CSS
            content = content.replace(/url\(\//g, `url(${baseUrl}/`);
            content = content.replace(/\/images\//g, `${baseUrl}/images/`);
            
            fs.writeFileSync(filePath, content);
        }
    });
};

// Copy necessary files to public directory
const copyDirectory = (source, destination) => {
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination);
    }

    const files = fs.readdirSync(source);
    files.forEach(file => {
        const sourcePath = path.join(source, file);
        const destPath = path.join(destination, file);

        if (fs.lstatSync(sourcePath).isDirectory()) {
            copyDirectory(sourcePath, destPath);
        } else {
            fs.copyFileSync(sourcePath, destPath);
        }
    });
};

// Create 404.html
const create404Page = () => {
    const content = `
<!DOCTYPE html>
<html>
<head>
    <title>Page Not Found</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="${baseUrl}/css/style.css">
    <script>
        // Single Page Apps for GitHub Pages
        (function(l) {
            if (l.search[1] === '/') {
                var decoded = l.search.slice(1).split('&').map(function(s) { 
                    return s.replace(/~and~/g, '&')
                }).join('?');
                window.history.replaceState(null, null,
                    l.pathname.slice(0, -1) + decoded + l.hash
                );
            }
        }(window.location))
    </script>
</head>
<body>
    <div class="error-container">
        <h1>404 - Page Not Found</h1>
        <p>Redirecting to home page...</p>
    </div>
    <script>
        setTimeout(function() {
            window.location.href = '${baseUrl}/';
        }, 2000);
    </script>
</body>
</html>`;

    fs.writeFileSync(path.join(publicDir, '404.html'), content);
};

// Main build process
console.log('Starting build process...');

// Copy static files
console.log('Copying static files...');
copyDirectory(path.join(__dirname, '..', 'public'), publicDir);

// Update HTML files
console.log('Updating HTML files...');
updateHtmlFiles(publicDir);

// Update CSS files
console.log('Updating CSS files...');
updateCssFiles(publicDir);

// Create 404 page
console.log('Creating 404 page...');
create404Page();

console.log('Build completed successfully!'); 