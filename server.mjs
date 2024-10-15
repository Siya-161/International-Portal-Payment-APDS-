import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import authRoutes from './routes/auth.mjs';
import paymentRoutes from './routes/payments.mjs';
import https from 'https';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet()); // Protects against some vulnerabilities
app.use(xss()); // Sanitize user input

// Rate limiting to prevent DDoS attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Secure Headers
app.use(helmet.frameguard({ action: 'deny' })); // Prevents clickjacking
app.use(helmet.hsts({
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
}));

// Database connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api', authRoutes);
app.use('/api', paymentRoutes);

// Serve the application over HTTPS
const PORT = process.env.PORT || 5000;

// SSL options (ensure you have valid SSL certificate files)
const sslOptions = {
    key: fs.readFileSync('keys/privatekey.pem'), // Path to your SSL key
    cert: fs.readFileSync('keys/certificate.pem'), // Path to your SSL certificate
};

// Create HTTPS server
https.createServer(sslOptions, app)
    .listen(PORT, () => {
        console.log(`Secure server running on port ${PORT}`);
    });
