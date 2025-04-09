document.getElementById('logoForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const input = document.getElementById('websiteInput');
    const display = document.getElementById('logoDisplay');
    const domain = input.value.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    
    display.innerHTML = '<div class="loading"></div>';
    
    if (!domain) {
        display.innerHTML = '<p class="error">Please enter a website URL</p>';
        return;
    }

    // Specific service logos
    const serviceLogos = {
        'gmail.com': [
            'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail_1x.png',
            'https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_32dp.png'
        ],
        'google.com': [
            'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_112dp.png'
        ],
        'youtube.com': [
            'https://www.youtube.com/s/desktop/12d6b690/img/favicon_144x144.png'
        ],
        'github.com': [
            'https://github.githubassets.com/favicons/favicon.png'
        ]
    };

    // Try to load logo from multiple sources
    async function tryLoadImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = url;
        });
    }

    let loadedImage = null;

    // 1. Try service-specific logos first
    if (serviceLogos[domain]) {
        for (const url of serviceLogos[domain]) {
            loadedImage = await tryLoadImage(url);
            if (loadedImage) break;
        }
    }

    // 2. Try Google's favicon service
    if (!loadedImage) {
        loadedImage = await tryLoadImage(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
    }

    // 3. Try DuckDuckGo's icon service
    if (!loadedImage) {
        loadedImage = await tryLoadImage(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
    }

    // 4. Try direct favicon
    if (!loadedImage) {
        loadedImage = await tryLoadImage(`https://${domain}/favicon.ico`);
    }

    // 5. Try Clearbit's logo API
    if (!loadedImage) {
        loadedImage = await tryLoadImage(`https://logo.clearbit.com/${domain}`);
    }

    if (loadedImage && loadedImage.width > 1) {
        display.innerHTML = '';
        display.appendChild(loadedImage);
        const info = document.createElement('p');
        info.textContent = `Logo fetched for: ${domain}`;
        info.className = 'success';
        display.appendChild(info);
    } else {
        // Create text-based logo
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 128, 128);
        gradient.addColorStop(0, '#1a73e8');
        gradient.addColorStop(1, '#4285f4');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);

        // Add text
        const text = domain.substring(0, 2).toUpperCase();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 64);

        display.innerHTML = '';
        display.appendChild(canvas);
        const info = document.createElement('p');
        info.textContent = `Generated logo for: ${domain}`;
        info.className = 'success';
        display.appendChild(info);
    }
});
  