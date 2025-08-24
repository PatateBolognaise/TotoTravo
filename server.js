const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Log de démarrage pour production
console.log('🚀 Démarrage serveur TotoTravo');
console.log('   PORT:', process.env.PORT);
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   OPENAI_API_KEY configurée:', !!process.env.OPENAI_API_KEY);

const app = express();

// Configuration CORS pour Render et production
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://localhost:5000',
        'https://*.vercel.app', 
        'https://*.now.sh',
        'https://*.onrender.com',
        'https://tototravo.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Route pour la page d'accueil
app.get('/', (req, res) => {
    try {
        console.log('📄 Demande page d\'accueil');
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } catch (error) {
        console.error('❌ Erreur page d\'accueil:', error);
        res.status(500).json({ error: 'Erreur chargement page d\'accueil' });
    }
});

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const PORT = process.env.PORT || 8080;

// Debug des variables d'environnement
console.log('🔍 Debug variables d\'environnement:');
console.log('   PORT:', process.env.PORT);
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   OPENAI_API_KEY existe:', !!process.env.OPENAI_API_KEY);
console.log('   OPENAI_API_KEY preview:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'Non définie');

// Vérification de la configuration
if (!OPENAI_API_KEY) {
    console.error('❌ ERREUR: OPENAI_API_KEY non configurée dans les variables d\'environnement');
    console.error('❌ Ajoutez OPENAI_API_KEY dans votre fichier .env ou variables d\'environnement');
    process.exit(1);
}

// Configuration Multer pour Vercel (mémoire uniquement)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
        files: 5 // 5 fichiers max
    },
    fileFilter: (req, file, cb) => {
        // Vérifier le type de fichier
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Seuls les fichiers images sont autorisés'), false);
        }
    }
});

// Fonction pour analyser les images avec GPT-4 Vision
async function analyzeImagesWithAI(files, userProfile, description = '') {
    try {
        console.log('📸 Analyse de', files.length, 'images avec GPT-4 Vision');
        
        // Convertir les images en base64
        const imageContents = await Promise.all(files.map(async (file) => {
            const base64 = file.buffer.toString('base64');
            return {
                type: "image_url",
                image_url: {
                    url: `data:${file.mimetype};base64,${base64}`
                }
            };
        }));

        console.log('📤 Envoi à GPT-4 Vision...');
        
        const prompt = `Tu es un expert artisan en rénovation immobilière. Analyse ces images et réponds UNIQUEMENT avec un objet JSON valide.

PROFIL UTILISATEUR:
- Niveau bricolage: ${userProfile.niveau_bricolage}
- Budget: ${userProfile.budget}
- Délai: ${userProfile.delai}
- Implication: ${userProfile.implication}
- Type projet: ${userProfile.type_projet}

DESCRIPTION DU PROJET (TRÈS IMPORTANT):
${description || 'Aucune description fournie'}

INSTRUCTIONS STRICTES:
1. Identifie les pièces visibles dans les images
2. Évalue l'état actuel (bon/moyen/mauvais)
3. Liste les travaux nécessaires avec coûts réalistes 2024
4. INCLUS OBLIGATOIREMENT les éléments demandés dans la description du projet
5. Distingue artisan vs bricolage selon le profil
6. Fournis un planning réaliste
7. Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après

PRIX RÉALISTES 2024:
- Peinture: 15-25€/m²
- Carrelage: 40-80€/m²
- Électricité: 80-150€/point
- Plomberie: 100-200€/point
- Menuiserie: 200-500€/m²
- Démolition: 20-40€/m²
- Télé motorisé: 2000-5000€
- Table motorisée: 3000-8000€
- Systèmes automatisés: 5000-15000€

FORMAT JSON OBLIGATOIRE (réponds exactement comme ça):
{
  "pieces": [
    {
      "nom": "Nom de la pièce",
      "etat": "bon/moyen/mauvais",
      "surface_estimee": "XXm²",
      "travaux": [
        {
          "nom": "Nom du travail",
          "description": "Description courte",
          "type_execution": "artisan ou bricolage",
          "cout_materiaux": 1000,
          "cout_main_oeuvre": 2000,
          "cout_total": 3000,
          "duree_estimee": "X semaines",
          "priorite": "haute/moyenne/basse",
          "conseils": "Conseils courts"
        }
      ],
      "cout_total_piece": 5000
    }
  ],
  "analyse_globale": {
    "score_global": "bon/moyen/mauvais",
    "niveau_difficulte": 75,
    "cout_total": 15000,
    "duree_totale": "8 semaines",
    "commentaire_general": "Commentaire court",
    "travaux_artisan": [
      {
        "nom": "Travail artisan",
        "description": "Description",
        "cout": 8000,
        "duree": "4 semaines",
        "raison_artisan": "Pourquoi artisan"
      }
    ],
    "travaux_bricolage": [
      {
        "nom": "Travail bricolage",
        "description": "Description",
        "cout_materiaux": 2000,
        "duree": "2 semaines",
        "conseils_bricolage": "Conseils bricolage"
      }
    ],
    "planning": {
      "phase1_duree": "2 semaines",
      "phase1_taches": ["Démolition", "Préparation"],
      "phase2_duree": "4 semaines",
      "phase2_taches": ["Installation", "Rénovation"],
      "phase3_duree": "2 semaines",
      "phase3_taches": ["Finitions", "Peinture"],
      "duree_totale": "8 semaines"
    }
  }
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans \`\`\`json ni texte avant/après.`;

        const requestData = {
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'Tu es un expert artisan en rénovation immobilière. Tu analyses des images et fournis des estimations détaillées et réalistes des travaux nécessaires.'
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: "text",
                            text: prompt
                        },
                        ...imageContents
                    ]
                }
            ],
            max_tokens: 4000,
            temperature: 0.7
        };

        console.log('🔑 Clé API utilisée:', OPENAI_API_KEY.substring(0, 20) + '...');
        console.log('📤 Envoi à OpenAI...');
        console.log('URL:', OPENAI_API_URL);
        console.log('Modèle:', requestData.model);
        
        let response;
        try {
            response = await axios.post(OPENAI_API_URL, requestData, {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 120000 // Augmenté à 2 minutes pour Render
            });
        } catch (apiError) {
            console.error('❌ Erreur API OpenAI:', apiError.response?.status, apiError.response?.statusText);
            console.error('❌ Détails erreur:', apiError.response?.data);
            console.error('❌ Message erreur:', apiError.message);
            console.error('❌ URL appelée:', OPENAI_API_URL);
            console.error('❌ Modèle utilisé:', requestData.model);
            
            if (apiError.response?.status === 401) {
                throw new Error('Clé API OpenAI invalide ou expirée - Vérifiez OPENAI_API_KEY');
            } else if (apiError.response?.status === 429) {
                throw new Error('Limite de requêtes OpenAI dépassée - Réessayez plus tard');
            } else if (apiError.response?.status === 400) {
                throw new Error('Requête OpenAI invalide: ' + JSON.stringify(apiError.response?.data));
            } else if (apiError.response?.status === 404) {
                throw new Error('Modèle OpenAI non trouvé - Vérifiez le nom du modèle');
            } else {
                throw new Error('Erreur API OpenAI: ' + apiError.message);
            }
        }

        console.log('✅ Réponse OpenAI reçue');
        console.log('📊 Status:', response.status);
        console.log('📊 Headers:', response.headers);
        
        if (!response.data || !response.data.choices || !response.data.choices[0]) {
            throw new Error('Réponse OpenAI invalide: ' + JSON.stringify(response.data));
        }
        
        const aiResponse = response.data.choices[0].message.content;
        console.log('🤖 Réponse IA:', aiResponse.substring(0, 200) + '...');

        // Parser le JSON avec gestion d'erreur robuste
        try {
            // Nettoyer le contenu des marqueurs de code
            let cleanContent = aiResponse;
            
            // Supprimer les marqueurs ```json et ```
            cleanContent = cleanContent.replace(/```json\s*/g, '');
            cleanContent = cleanContent.replace(/```\s*/g, '');
            
            // Supprimer les espaces en début et fin
            cleanContent = cleanContent.trim();
            
            console.log('🧹 Contenu nettoyé:', cleanContent.substring(0, 200) + '...');
            
            const parsed = JSON.parse(cleanContent);
            console.log('✅ JSON parsé avec succès');
            return parsed;
        } catch (parseError) {
            console.error('❌ Erreur parsing JSON:', parseError);
            console.log('📄 Contenu reçu:', aiResponse.substring(0, 500) + '...');
            
            // Tentative de récupération avec regex
            try {
                const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const recoveredJson = jsonMatch[0];
                    console.log('🔄 Tentative de récupération JSON...');
                    const parsed = JSON.parse(recoveredJson);
                    console.log('✅ JSON récupéré avec succès');
                    return parsed;
                }
            } catch (recoveryError) {
                console.error('❌ Échec de la récupération JSON:', recoveryError);
            }
            
            // Fallback avec une réponse basique
            console.log('🔄 Utilisation du fallback...');
            return {
                travaux: {
                    pieces: [
                        {
                            nom: "Pièce analysée",
                            etat: "Nécessite rénovation complète",
                            travaux: [
                                {
                                    nom: "Rénovation générale",
                                    description: "Travaux de rénovation nécessaires selon les images",
                                    type_execution: "artisan",
                                    cout_materiaux: 1000,
                                    cout_main_oeuvre: 2000,
                                    cout_total: 3000,
                                    duree_estimee: "1-2 semaines",
                                    priorite: "moyenne",
                                    conseils: "Faites appel à un artisan qualifié pour un devis précis"
                                }
                            ],
                            cout_total_piece: 3000
                        }
                    ],
                    analyse_globale: {
                        score_global: "moyen",
                        niveau_difficulte: 50,
                        cout_total: 3000,
                        duree_totale: "4 semaines",
                        commentaire_general: "Analyse basique - veuillez réessayer pour plus de détails",
                        travaux_artisan: [
                            {
                                nom: "Rénovation générale",
                                description: "Travaux nécessitant un artisan",
                                cout: 3000,
                                duree: "1-2 semaines",
                                raison_artisan: "Travaux complexes nécessitant expertise"
                            }
                        ],
                        travaux_bricolage: [
                            {
                                nom: "Préparation",
                                description: "Travaux de préparation",
                                cout_materiaux: 200,
                                duree: "1 jour",
                                conseils_bricolage: "Préparer la zone de travail"
                            }
                        ],
                        planning: {
                            phase1_duree: "1 semaine",
                            phase1_taches: ["Préparation", "Démolition"],
                            phase2_duree: "2 semaines",
                            phase2_taches: ["Installation", "Rénovation"],
                            phase3_duree: "1 semaine",
                            phase3_taches: ["Finitions", "Peinture"],
                            duree_totale: "4 semaines"
                        }
                    }
                }
            };
        }
    } catch (error) {
        console.error('❌ Erreur analyse images:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        throw new Error(`Impossible d'analyser les images avec l'IA: ${error.message}`);
    }
}

// Fonction pour le chatbot avec GPT-4
async function chatWithAI(message, projectContext = '') {
    try {
        console.log('💬 Chatbot: ' + message);
        
        const systemPrompt = `Tu es un assistant expert en rénovation immobilière. Tu réponds de manière concise et pratique aux questions des utilisateurs.

CONTEXTE DU PROJET: ${projectContext}

INSTRUCTIONS:
- Réponds de manière claire et concise
- Donne des conseils pratiques et réalistes
- Évite les réponses trop longues
- Sois direct et utile`;

        const requestData = {
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            max_tokens: 1000,
            temperature: 0.7
        };

        const response = await axios.post(OPENAI_API_URL, requestData, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        const aiResponse = response.data.choices[0].message.content;
        console.log('🤖 Chatbot réponse:', aiResponse);
        return aiResponse;
    } catch (error) {
        console.error('❌ Erreur chatbot:', error.message);
        return 'Désolé, je ne peux pas répondre pour le moment. Veuillez réessayer.';
    }
}

// Routes
app.post('/api/analyze-images', upload.array('images', 5), async (req, res) => {
    console.log('📥 Requête analyse reçue');
    console.log('🔍 Headers:', req.headers);
    console.log('📊 Body keys:', Object.keys(req.body));
    
    try {
        if (!req.files || req.files.length === 0) {
            console.error('❌ Aucune image fournie');
            return res.status(400).json({ error: 'Aucune image fournie' });
        }

        console.log('📸 Images reçues:', req.files.length);
        console.log('📸 Types d\'images:', req.files.map(f => f.mimetype));
        
        let userProfile = {};
        let description = '';
        
        try {
            userProfile = req.body.userProfile ? JSON.parse(req.body.userProfile) : {};
            description = req.body.description || '';
        } catch (parseError) {
            console.error('❌ Erreur parsing userProfile:', parseError);
            userProfile = {};
            description = req.body.description || '';
        }
        
        console.log('👤 Profil utilisateur:', userProfile);
        console.log('📝 Description du projet:', description);
        
        // Analyser avec OpenAI
        const analysis = await analyzeImagesWithAI(req.files, userProfile, description);
        
        const result = {
            images: req.files.map(file => ({
                filename: file.originalname,
                originalname: file.originalname,
                size: file.size,
                mimetype: file.mimetype
            })),
            travaux: analysis
        };
        
        console.log('🎉 Analyse terminée avec succès');
        res.json(result);
        
    } catch (error) {
        console.error('❌ Erreur analyse complète:', error);
        console.error('❌ Stack trace:', error.stack);
        
        // Réponse d'erreur plus détaillée pour le debugging
        res.status(500).json({ 
            error: 'Erreur lors de l\'analyse des images',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.post('/api/chat', async (req, res) => {
    console.log('💬 Requête chatbot reçue');
    
    try {
        const { message, projectContext } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message requis' });
        }
        
        const response = await chatWithAI(message, projectContext);
        res.json({ response });
        
    } catch (error) {
        console.error('❌ Erreur chatbot:', error.message);
        res.status(500).json({ error: 'Erreur chatbot' });
    }
});

app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'API TotoTravo fonctionne!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        openai_key_exists: !!OPENAI_API_KEY,
        openai_key_preview: OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 20) + '...' : 'Non définie'
    });
});

// Gestion d'erreurs globale
app.use((error, req, res, next) => {
    console.error('❌ Erreur serveur:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ URL:', req.url);
    console.error('❌ Method:', req.method);
    console.error('❌ Headers:', req.headers);
    
    res.status(500).json({
        error: 'Erreur interne du serveur',
        message: error.message,
        timestamp: new Date().toISOString(),
        url: req.url,
        method: req.method
    });
});

// Route de santé pour Vercel
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log('🔑 Configuration:');
    console.log('   OPENAI_API_KEY:', OPENAI_API_KEY.substring(0, 20) + '...');
    console.log('   PORT:', PORT);
    console.log('🚀 Serveur démarré sur http://localhost:' + PORT);
    console.log('🌍 Environnement:', process.env.NODE_ENV || 'development');
});

// Export pour Vercel
module.exports = app;

