const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

// Configuration des variables d'environnement
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configuration OpenAI
let openai = null;
if (OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
}

// Configuration DeepSeek
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Initialisation Express
const app = express();

// Middleware de sécurité et configuration
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuration CORS pour production
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

// Configuration Multer pour upload d'images
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
        files: 5 // 5 fichiers max
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Seules les images sont autorisées'), false);
        }
    }
});

// Fonctions utilitaires
const utils = {
    getBricolageLevel: (niveau) => {
        const levels = {
            'debutant': 'Peu d\'expérience, conseils détaillés nécessaires',
            'intermediaire': 'Expérience modérée, peut faire des travaux simples',
            'expert': 'Expérience avancée, peut faire des travaux complexes'
        };
        return levels[niveau] || 'Niveau non spécifié';
    },

    getBudgetRange: (budget) => {
        const ranges = {
            'serre': 'Budget limité, optimiser les coûts',
            'moyen': 'Budget standard, qualité équilibrée',
            'confortable': 'Budget élevé, qualité premium'
        };
        return ranges[budget] || 'Budget non spécifié';
    },

    getDelaiInfo: (delai) => {
        const infos = {
            'urgent': 'Travaux prioritaires, planning accéléré',
            'normal': 'Délai standard, planning équilibré',
            'flexible': 'Délai flexible, optimisation possible'
        };
        return infos[delai] || 'Délai non spécifié';
    },

    getImplicationInfo: (implication) => {
        const infos = {
            'complete': 'Implication totale dans les travaux',
            'partielle': 'Implication modérée, aide ponctuelle',
            'minimale': 'Implication limitée, délégation'
        };
        return infos[implication] || 'Implication non spécifiée';
    },

    getProjectTypeInfo: (type) => {
        const infos = {
            'reparation': 'Travaux de réparation et maintenance',
            'renovation': 'Rénovation complète',
            'amenagement': 'Aménagement et décoration',
            'construction': 'Travaux de construction'
        };
        return infos[type] || 'Type non spécifié';
    }
};

// Service pour les questions dynamiques
class QuestionService {
    static async generateAIQuestions(userProfile, description) {
        try {
            console.log('🚀 Génération des questions DeepSeek...');
            
            const prompt = `Tu es un expert en rénovation immobilière avec 20 ans d'expérience. Génère 4-6 questions ULTRA-PERTINENTES et SPÉCIFIQUES pour personnaliser l'analyse d'un projet de rénovation.

PROFIL UTILISATEUR DÉTAILLÉ:
- Niveau bricolage: ${userProfile.niveau_bricolage} (${utils.getBricolageLevel(userProfile.niveau_bricolage)})
- Budget: ${userProfile.budget} (${utils.getBudgetRange(userProfile.budget)})
- Délai: ${userProfile.delai} (${utils.getDelaiInfo(userProfile.delai)})
- Implication: ${userProfile.implication} (${utils.getImplicationInfo(userProfile.implication)})
- Type projet: ${userProfile.type_projet} (${utils.getProjectTypeInfo(userProfile.type_projet)})

DESCRIPTION DU PROJET: ${description}

INSTRUCTIONS ULTRA-PRÉCISES:
1. Génère des questions UNIQUEMENT basées sur le profil et la description
2. Questions courtes et précises (max 8 mots)
3. Options de réponses concises et pertinentes (max 4 options)
4. Focus sur les détails qui impactent DIRECTEMENT l'analyse finale
5. Adapte selon le niveau de bricolage et le budget
6. Questions qui révèlent les VRAIES priorités de l'utilisateur
7. Évite les questions génériques, sois SPÉCIFIQUE au projet

FORMAT JSON STRICT:
{
  "questions": [
    {
      "id": "question_unique",
      "question": "Question courte et précise ?",
      "type": "radio",
      "options": [
        {"value": "option1", "label": "Réponse courte"},
        {"value": "option2", "label": "Réponse courte"},
        {"value": "option3", "label": "Réponse courte"},
        {"value": "option4", "label": "Réponse courte"},
        {"value": "autre", "label": "Autre"}
      ],
      "required": true
    }
  ]
}

IMPORTANT: Chaque question DOIT avoir une option "autre" avec value="autre" et label="Autre".

Réponds UNIQUEMENT avec le JSON valide.`;

            const response = await axios.post(DEEPSEEK_API_URL, {
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8,
                max_tokens: 1500
            }, {
                headers: {
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            const content = response.data.choices[0].message.content;
            const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
            const parsed = JSON.parse(cleanedContent);

            console.log('✅ Questions DeepSeek générées avec succès !');
            return parsed.questions || [];
        } catch (error) {
            console.error('❌ Erreur génération questions DeepSeek:', error);
            return this.generateFallbackQuestions(userProfile, description);
        }
    }

    static generateFallbackQuestions(userProfile, description) {
        console.log('🔄 Utilisation des questions de fallback...');
        
        const questions = [
            {
                id: 'ambiance_souhaitee',
                question: 'Quelle ambiance souhaitez-vous créer ?',
                type: 'radio',
                options: [
                    { value: 'cosy', label: 'Cosy et chaleureux' },
                    { value: 'epure', label: 'Épuré et minimaliste' },
                    { value: 'luxueux', label: 'Luxueux et raffiné' },
                    { value: 'naturel', label: 'Naturel et authentique' },
                    { value: 'moderne', label: 'Moderne et contemporain' },
                    { value: 'autre', label: 'Autre' }
                ],
                required: true
            },
            {
                id: 'plus_value',
                question: 'Quelle plus-value recherchez-vous ?',
                type: 'radio',
                options: [
                    { value: 'confort_vie', label: 'Confort de vie' },
                    { value: 'valeur_bien', label: 'Valeur du bien' },
                    { value: 'esthetique', label: 'Esthétique' },
                    { value: 'fonctionnalite', label: 'Fonctionnalité' },
                    { value: 'autre', label: 'Autre' }
                ],
                required: true
            },
            {
                id: 'organisation_travaux',
                question: 'Comment souhaitez-vous organiser les travaux ?',
                type: 'radio',
                options: [
                    { value: 'vacances', label: 'Pendant les vacances' },
                    { value: 'weekends', label: 'Weekends' },
                    { value: 'soirees', label: 'Soirées' },
                    { value: 'continue', label: 'En continu' },
                    { value: 'autre', label: 'Autre' }
                ],
                required: true
            }
        ];

        return questions;
    }
}

// Service pour l'analyse d'images
class AnalysisService {
    static async analyzeImages(files, userProfile, description) {
        try {
            console.log('📸 Analyse de', files.length, 'images avec GPT-4 Vision');
            
            if (!openai) {
                throw new Error('Service OpenAI non configuré');
            }

            // Convertir les images en base64
            const imageContents = files.map(image => ({
                type: 'image_url',
                image_url: {
                    url: `data:${image.mimetype};base64,${image.buffer.toString('base64')}`
                }
            }));

            const prompt = `Tu es un expert artisan en rénovation immobilière avec 30 ans d'expérience. Analyse ces images et fournis une analyse complète et détaillée. Réponds UNIQUEMENT avec un objet JSON valide.

PROFIL UTILISATEUR:
${JSON.stringify(userProfile, null, 2)}

DESCRIPTION DU PROJET:
${description || 'Aucune description fournie'}

FORMAT JSON:
{
  "analyse_globale": {
    "surface_totale": "XX m²",
    "duree_estimee": "X semaines",
    "cout_total_estime": "XXXX €",
    "complexite": "facile/moyen/complexe"
  },
  "pieces": [
    {
      "nom": "Nom de la pièce",
      "surface": "XX m²",
      "etat_general": "excellent/bon/moyen/mauvais/critique",
      "travaux_necessaires": "Description des travaux",
      "cout_estime": "XXX €"
    }
  ],
  "conseils": "Conseils personnalisés"
}

Réponds UNIQUEMENT avec le JSON valide.`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            ...imageContents
                        ]
                    }
                ],
                max_tokens: 4000,
                temperature: 0.3
            });

            const content = response.choices[0].message.content;
            const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
            const parsedResponse = JSON.parse(cleanedContent);

            console.log('✅ Analyse terminée avec succès');
            return parsedResponse;

        } catch (error) {
            console.error('❌ Erreur analyse images:', error);
            throw new Error(`Impossible d'analyser les images: ${error.message}`);
        }
    }
}

// Routes API
app.post('/api/get-questions', async (req, res) => {
    try {
        console.log('📥 Requête questions reçue');
        
        const { userProfile, description } = req.body;
        
        if (!userProfile) {
            return res.status(400).json({ error: 'Profil utilisateur requis' });
        }
        
        const questions = await QuestionService.generateAIQuestions(userProfile, description);
        
        res.json({ questions });
    } catch (error) {
        console.error('❌ Erreur génération questions:', error);
        res.status(500).json({ error: 'Erreur lors de la génération des questions' });
    }
});

app.post('/api/analyze', upload.array('images', 5), async (req, res) => {
    try {
        console.log('📥 Requête analyse reçue');
        
        const images = req.files;
        const description = req.body.description || '';
        const userProfile = JSON.parse(req.body.userProfile || '{}');
        
        if (!images || images.length === 0) {
            return res.status(400).json({ error: 'Aucune image fournie' });
        }
        
        console.log('📸 Images reçues:', images.length);
        console.log('👤 Profil utilisateur:', userProfile);
        console.log('📝 Description du projet:', description);
        
        const analysis = await AnalysisService.analyzeImages(images, userProfile, description);
        
        const result = {
            images: images.map(file => ({
                filename: file.originalname,
                size: file.size,
                mimetype: file.mimetype
            })),
            analysis: analysis
        };
        
        res.json(result);
        
    } catch (error) {
        console.error('❌ Erreur analyse:', error);
        
        if (error.message.includes('Service OpenAI non configuré')) {
            res.status(503).json({ error: 'Service d\'analyse temporairement indisponible' });
        } else {
            res.status(500).json({ error: 'Erreur lors de l\'analyse des images' });
        }
    }
});

// Route de santé
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        services: {
            openai: !!openai,
            deepseek: !!DEEPSEEK_API_KEY
        }
    });
});

// Servir les fichiers statiques
app.use(express.static('public'));

// Route par défaut
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Gestion d'erreurs globale
app.use((error, req, res, next) => {
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({
        error: 'Erreur interne du serveur',
        message: NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
});

// Démarrage du serveur
console.log('🚀 Démarrage serveur TotoTravo');
console.log('🔍 Configuration:');
console.log('   PORT:', PORT);
console.log('   NODE_ENV:', NODE_ENV);
console.log('   OPENAI_API_KEY:', OPENAI_API_KEY ? '[CONFIGURÉE]' : 'Non définie');
console.log('   DEEPSEEK_API_KEY:', DEEPSEEK_API_KEY ? '[CONFIGURÉE]' : 'Non définie');

app.listen(PORT, () => {
    console.log('🚀 Serveur démarré sur http://localhost:' + PORT);
    console.log('✅ Serveur prêt à recevoir des requêtes');
});

module.exports = app;
