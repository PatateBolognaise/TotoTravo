// Point d'entrée API pour Vercel
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Configuration CORS pour Vercel
app.use(cors({
    origin: ['http://localhost:3000', 'https://*.vercel.app', 'https://*.now.sh'],
    credentials: true
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));

// Routes spécifiques pour les fichiers statiques
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/styles.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, '../public/styles.css'));
});

app.get('/script.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, '../public/script.js'));
});

// Importer le serveur principal
const mainServer = require('../server.js');

// Utiliser les routes du serveur principal
app.use('/api', mainServer);

// Export pour Vercel
module.exports = app;
