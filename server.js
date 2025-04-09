const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');
const fetch = require('node-fetch');

dotenv.config();

const app = express();

// Enable CORS for all routes with credentials
app.use((req, res, next) => {
    const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Basic middleware with increased limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 200, // limit each IP to 200 requests per minute
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiting only in production
if (process.env.NODE_ENV === 'production') {
    app.use('/api/', limiter);
} else {
    console.log('Rate limiting disabled in development mode');
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ message: 'Invalid JSON' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Request entity too large' });
    }
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
    minPoolSize: 2,
    family: 4
}).then(() => {
    console.log('Connected to MongoDB Atlas');
    console.log('Database Name:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
}).catch(err => {
    console.error('MongoDB connection error. Please check your connection string and network.');
    console.error('Error details:', err.message);
    if (err.name === 'MongoServerSelectionError') {
        console.error('Could not connect to any MongoDB server.');
        console.error('Please check if:');
        console.error('1. Your MongoDB Atlas cluster is running');
        console.error('2. Your IP address is whitelisted in MongoDB Atlas');
        console.error('3. Your credentials are correct');
        console.error('4. Your network connection is stable');
        console.error('5. VPN or firewall settings are not blocking the connection');
    }
});

// Session configuration
app.use(session({
    secret: process.env.JWT_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions',
        ttl: 24 * 60 * 60
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: true, // Secure the cookie
        secure: process.env.NODE_ENV === 'production', // Secure in production
        sameSite: 'lax' // Prevent CSRF attacks
    }
}));

// API Routes - Define API routes before static files
app.use('/api', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
});

// Database status endpoint
app.get('/api/status', (req, res) => {
    try {
        const status = {
            isConnected: mongoose.connection.readyState === 1,
            state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
            gridFS: mongoose.connection.readyState === 1,
            lastError: mongoose.connection.lastError || null
        };
        res.json(status);
    } catch (error) {
        console.error('Error checking database status:', error);
        res.status(500).json({
            isConnected: false,
            state: 'error',
            gridFS: false,
            lastError: error.message
        });
    }
});

// Database info endpoint
app.get('/api/db-info', (req, res) => {
    try {
        const dbInfo = {
            dbName: mongoose.connection.db ? mongoose.connection.db.databaseName : 'Not connected',
            collectionName: 'accounts'  // This is the collection we're using for storing accounts
        };
        res.json(dbInfo);
    } catch (error) {
        console.error('Error getting database info:', error);
        res.status(500).json({
            dbName: 'Error',
            collectionName: 'Error'
        });
    }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/accounts', require('./routes/accounts'));

// Proxy endpoint for fetching images
app.get('/api/proxy-image', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('URL parameter is required');
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000); // 4 second timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        clearTimeout(timeout);

        if (!response.ok) {
            return res.status(response.status).send(`Failed to fetch image: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        
        // Set response headers
        res.set({
            'Content-Type': response.headers.get('content-type') || 'image/png',
            'Content-Length': buffer.byteLength,
            'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
            'Access-Control-Allow-Origin': '*'
        });

        return res.send(Buffer.from(buffer));
    } catch (error) {
        if (error.name === 'AbortError') {
            return res.status(504).send('Request timeout');
        }
        console.error('Error fetching image:', error);
        return res.status(500).send('Error fetching image');
    }
});

// Static files - after API routes
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
    }
}));

// Catch-all route for SPA - must be last
app.get('*', (req, res) => {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        res.status(404).json({ error: 'Not Found' });
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Monitor database connection
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    // Attempt to reconnect with exponential backoff
    setTimeout(() => {
        mongoose.connect(process.env.MONGODB_URI).catch(err => 
            console.error('Immediate reconnection failed:', err)
        );
    }, 5000);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB connection disconnected');
    // Attempt to reconnect with exponential backoff
    let retryAttempts = 0;
    const maxRetries = 5;
    const backoff = () => Math.min(1000 * Math.pow(2, retryAttempts), 60000);

    const attemptReconnection = () => {
        if (retryAttempts < maxRetries) {
            retryAttempts++;
            console.log(`Attempting to reconnect... (Attempt ${retryAttempts}/${maxRetries})`);
            
            mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 45000,
                connectTimeoutMS: 30000,
                family: 4
            }).then(() => {
                console.log('Successfully reconnected to MongoDB');
                retryAttempts = 0;
            }).catch(err => {
                console.error(`Reconnection attempt ${retryAttempts} failed:`, err);
                setTimeout(attemptReconnection, backoff());
            });
        } else {
            console.error('Max reconnection attempts reached. Please check your database connection.');
        }
    };

    attemptReconnection();
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('=================================');
    console.log(`Server is running on port ${PORT}`);
    console.log(`MongoDB Status: ${mongoose.connection.readyState}`);
    console.log(`MongoDB Connection State: ${['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState]}`);
    console.log('=================================');
});

// Add error handler for uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    console.error('Stack:', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
});

// Serve static files from the current directory
app.use(express.static('./'));

// Proxy endpoint for fetching logos
app.get('/fetch-logo', async (req, res) => {
    const { domain } = req.query;
    if (!domain) {
        return res.status(400).json({ error: 'Domain parameter is required' });
    }

    const providers = [
        `https://logo.clearbit.com/${domain}?size=256`,
        `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${domain}&size=128`,
        `https://icon.horse/icon/${domain}`
    ];

    for (const provider of providers) {
        try {
            const response = await axios.get(provider, {
                responseType: 'arraybuffer',
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            // Check if we got an image
            if (response.headers['content-type'].startsWith('image/')) {
                res.setHeader('Content-Type', response.headers['content-type']);
                return res.send(response.data);
            }
        } catch (error) {
            console.log(`Failed to fetch from ${provider}:`, error.message);
            continue;
        }
    }

    // If all providers fail, return 404
    res.status(404).json({ error: 'No logo found' });
});

// Proxy endpoint for fetching logos
app.get('/api/fetch-logo', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).send('URL parameter is required');
        }

        const response = await fetch(url);
        if (!response.ok) {
            return res.status(response.status).send(response.statusText);
        }

        const contentType = response.headers.get('content-type');
        const buffer = await response.buffer();

        // Set appropriate headers
        res.set({
            'Content-Type': contentType || 'image/png',
            'Cache-Control': 'public, max-age=31536000',
            'Access-Control-Allow-Origin': '*'
        });

        res.send(buffer);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send('Error fetching logo');
    }
});

// Serve the example.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'example.html'));
});
