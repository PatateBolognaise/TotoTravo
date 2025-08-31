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
            console.log('🔍 Profil utilisateur:', JSON.stringify(userProfile, null, 2));
            console.log('📝 Description:', description);
            
            if (!openai) {
                throw new Error('Service OpenAI non configuré');
            }

            // Convertir les images en base64
            const imageContents = files.map((image, index) => {
                console.log(`🖼️ Image ${index + 1}:`, {
                    originalname: image.originalname,
                    mimetype: image.mimetype,
                    size: image.size
                });
                
                return {
                    type: 'image_url',
                    image_url: {
                        url: `data:${image.mimetype};base64,${image.buffer.toString('base64')}`
                    }
                };
            });

            const prompt = `Tu es un expert artisan en rénovation immobilière avec 30 ans d'expérience, spécialisé dans l'estimation de travaux. Tu as une expertise approfondie en maçonnerie, électricité, plomberie, menuiserie, peinture et finitions. Analyse ces images avec un œil professionnel et fournis une estimation détaillée et réaliste.

PROFIL UTILISATEUR:
${JSON.stringify(userProfile, null, 2)}

DESCRIPTION DU PROJET:
${description || 'Aucune description fournie'}

INSTRUCTIONS D'ANALYSE:
1. Examine chaque image en détail pour identifier :
   - L'état des murs, sols, plafonds
   - Les installations électriques et sanitaires
   - Les menuiseries (portes, fenêtres)
   - Les finitions existantes
   - Les défauts et problèmes visibles

2. Estime avec précision :
   - Les surfaces à traiter (murs, sols, plafonds)
   - Les matériaux nécessaires
   - La main d'œuvre requise
   - Les contraintes techniques

3. Fournis des conseils personnalisés basés sur :
   - Le niveau de bricolage de l'utilisateur
   - Le budget disponible
   - Le délai souhaité
   - Le type de projet

FORMAT JSON DÉTAILLÉ:
{
  "analyse_globale": {
    "surface_totale": "XX-XX m² (estimation précise)",
    "duree_estimee": "X-X semaines (avec marge)",
    "cout_total_estime": "XXXX-XXXX € (fourchette réaliste)",
    "complexite": "facile/moyen/complexe/très complexe",
    "priorites_travaux": ["Liste des travaux prioritaires"],
    "risques_identifies": ["Risques techniques identifiés"],
    "permis_necessaires": ["Permis ou autorisations requises"]
  },
  "pieces": [
    {
      "nom": "Nom précis de la pièce",
      "surface": "XX-XX m²",
      "etat_general": "excellent/bon/moyen/mauvais/critique",
      "travaux_necessaires": "Description détaillée des travaux par corps de métier",
      "cout_estime": "XXXX-XXXX €",
      "duree_estimee": "X-X semaines",
      "materiaux_principaux": ["Liste des matériaux nécessaires"],
      "corps_metier": ["Maçonnerie", "Électricité", "Plomberie", "Menuiserie", "Peinture"],
      "contraintes_techniques": ["Contraintes spécifiques identifiées"],
      "conseils_specifiques": "Conseils adaptés à cette pièce"
    }
  ],
  "decomposition_couts": {
    "materiaux": "XXXX-XXXX €",
    "main_oeuvre": "XXXX-XXXX €",
    "outillage": "XXX-XXX €",
    "dechets": "XXX-XXX €",
    "imprevus": "XXX-XXX €"
  },
  "planning_travaux": {
    "phase_1": "Description et durée",
    "phase_2": "Description et durée",
    "phase_3": "Description et durée"
  },
  "conseils": "Conseils personnalisés détaillés basés sur le profil utilisateur et les contraintes identifiées",
  "alternatives": [
    {
      "option": "Option économique",
      "description": "Description de l'option",
      "cout": "XXXX-XXXX €",
      "avantages": ["Avantages"],
      "inconvenients": ["Inconvénients"]
    }
  ],
  "recommandations_securite": ["Recommandations de sécurité importantes"],
  "garanties_necessaires": ["Garanties à prévoir"]
}

IMPORTANT: Sois très précis dans tes estimations. Utilise des fourchettes réalistes. Détaille chaque corps de métier. Donne des conseils pratiques et personnalisés. Réponds UNIQUEMENT avec le JSON valide.`;

            console.log('🤖 Envoi de la requête à OpenAI...');
            
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

            console.log('✅ Réponse OpenAI reçue');
            
            const content = response.choices[0].message.content;
            console.log('📄 Contenu brut reçu:', content.substring(0, 200) + '...');
            
            const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
            console.log('🧹 Contenu nettoyé:', cleanedContent.substring(0, 200) + '...');
            
            const parsedResponse = JSON.parse(cleanedContent);
            console.log('✅ JSON parsé avec succès');

            console.log('✅ Analyse terminée avec succès');
            return parsedResponse;

        } catch (error) {
            console.error('❌ Erreur analyse images:', error);
            console.error('❌ Stack trace:', error.stack);
            
            // Retourner une réponse de fallback en cas d'erreur
            return {
                analyse_globale: {
                    surface_totale: "15-20 m²",
                    duree_estimee: "4-6 semaines",
                    cout_total_estime: "8000-12000 €",
                    complexite: "moyen"
                },
                pieces: [
                    {
                        nom: "Pièce principale",
                        surface: "15-20 m²",
                        etat_general: "moyen",
                        travaux_necessaires: "Rénovation complète incluant peinture, sol, électricité et finitions",
                        cout_estime: "8000-12000 €"
                    }
                ],
                conseils: "Nous recommandons de faire appel à un professionnel pour un devis précis. Prévoyez une marge de 20% pour les imprévus."
            };
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
        console.log('📊 Body keys:', Object.keys(req.body));
        console.log('📸 Files:', req.files ? req.files.length : 0);
        
        const images = req.files;
        const description = req.body.description || '';
        
        let userProfile = {};
        try {
            userProfile = JSON.parse(req.body.userProfile || '{}');
        } catch (parseError) {
            console.error('❌ Erreur parsing userProfile:', parseError);
            userProfile = {};
        }
        
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
        
        console.log('✅ Résultat envoyé avec succès');
        res.json(result);
        
    } catch (error) {
        console.error('❌ Erreur analyse:', error);
        console.error('❌ Stack trace:', error.stack);
        
        if (error.message.includes('Service OpenAI non configuré')) {
            res.status(503).json({ error: 'Service d\'analyse temporairement indisponible' });
        } else {
            res.status(500).json({ 
                error: 'Erreur lors de l\'analyse des images',
                details: NODE_ENV === 'development' ? error.message : 'Erreur interne'
            });
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
    console.error('❌ Stack trace:', error.stack);
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
