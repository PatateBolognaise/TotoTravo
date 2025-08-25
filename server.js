const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const { getJson } = require('serpapi');
const DeepSeek = require('deepseek');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();

// Configuration des variables d'environnement
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const PORT = process.env.PORT || 5000;

// Configuration DeepSeek
const deepseek = new DeepSeek({
    apiKey: DEEPSEEK_API_KEY || 'default-key'
});

// Configuration OpenAI
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

// Vérification de la configuration
if (!OPENAI_API_KEY) {
    console.warn('⚠️ ATTENTION: OPENAI_API_KEY non configurée');
    console.warn('⚠️ L\'analyse IA ne fonctionnera pas sans cette clé');
    console.warn('⚠️ Mais les questions dynamiques fonctionneront pour les tests');
}

if (!DEEPSEEK_API_KEY) {
    console.warn('⚠️ ATTENTION: DEEPSEEK_API_KEY non configurée');
    console.warn('⚠️ Les questions DeepSeek ne fonctionneront pas sans cette clé');
    console.warn('⚠️ Fallback vers questions statiques activé');
}

// Middleware pour parser le JSON
app.use(express.json());

// Configuration CORS
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

// Configuration Multer pour les uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Seules les images sont autorisées'), false);
        }
    }
});

// Fonctions d'aide
function getBricolageLevel(niveau) {
    const levels = {
        'debutant': 'Peu d\'expérience, conseils détaillés nécessaires',
        'intermediaire': 'Expérience modérée, peut faire des travaux simples',
        'expert': 'Expérience avancée, peut faire des travaux complexes'
    };
    return levels[niveau] || 'Niveau non spécifié';
}

function getBudgetRange(budget) {
    const ranges = {
        'serre': 'Budget limité, optimiser les coûts',
        'moyen': 'Budget standard, qualité équilibrée',
        'confortable': 'Budget élevé, qualité premium'
    };
    return ranges[budget] || 'Budget non spécifié';
}

function getDelaiInfo(delai) {
    const infos = {
        'urgent': 'Travaux prioritaires, planning accéléré',
        'normal': 'Délai standard, planning équilibré',
        'flexible': 'Délai flexible, optimisation possible'
    };
    return infos[delai] || 'Délai non spécifié';
}

function getImplicationInfo(implication) {
    const infos = {
        'minimale': 'Intervention minimale, artisan principal',
        'moderee': 'Participation modérée, mix artisan/bricolage',
        'maximale': 'Participation maximale, bricolage principal'
    };
    return infos[implication] || 'Implication non spécifiée';
}

function getProjectTypeInfo(type) {
    const infos = {
        'reparation': 'Travaux de réparation et maintenance',
        'renovation': 'Rénovation complète',
        'amenagement': 'Aménagement et décoration',
        'construction': 'Travaux de construction'
    };
    return infos[type] || 'Type non spécifié';
}

// Fonction pour générer des questions avec DeepSeek
async function generateAIQuestions(userProfile, description) {
    try {
        console.log('🚀 Génération des questions DeepSeek en cours...');
        
        const prompt = `Tu es un expert en rénovation immobilière avec 20 ans d'expérience. Génère 4-6 questions ULTRA-PERTINENTES et SPÉCIFIQUES pour personnaliser l'analyse d'un projet de rénovation.

PROFIL UTILISATEUR DÉTAILLÉ:
- Niveau bricolage: ${userProfile.niveau_bricolage} (${getBricolageLevel(userProfile.niveau_bricolage)})
- Budget: ${userProfile.budget} (${getBudgetRange(userProfile.budget)})
- Délai: ${userProfile.delai} (${getDelaiInfo(userProfile.delai)})
- Implication: ${userProfile.implication} (${getImplicationInfo(userProfile.implication)})
- Type projet: ${userProfile.type_projet} (${getProjectTypeInfo(userProfile.type_projet)})

DESCRIPTION DU PROJET: ${description}

INSTRUCTIONS ULTRA-PRÉCISES:
1. Génère des questions UNIQUEMENT basées sur le profil et la description
2. Questions courtes et précises (max 8 mots)
3. Options de réponses concises et pertinentes (max 4 options)
4. Focus sur les détails qui impactent DIRECTEMENT l'analyse finale
5. Adapte selon le niveau de bricolage et le budget
6. Questions qui révèlent les VRAIES priorités de l'utilisateur
7. Évite les questions génériques, sois SPÉCIFIQUE au projet

EXEMPLES DE QUESTIONS PERTINENTES:
- Pour une cuisine: "Quelle fonctionnalité privilégier ?" (cuisine sociale, pratique, esthétique, optimale)
- Pour un budget serré: "Comment optimiser votre budget ?" (matériaux éco, travaux essentiels, phases étalées)
- Pour un expert: "Quels matériaux préférez-vous ?" (naturels, modernes, écologiques, durables)

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
        {"value": "option4", "label": "Réponse courte"}
      ],
      "required": true
    }
  ]
}

Réponds UNIQUEMENT avec le JSON valide.`;

        const response = await deepseek.chat.completions.create({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
            max_tokens: 1500
        });

        const content = response.choices[0].message.content;
        console.log('🤖 Réponse DeepSeek questions:', content);

        // Nettoyer et parser la réponse
        const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanedContent);

        console.log('✅ Questions DeepSeek générées avec succès !');
        return parsed.questions || [];
    } catch (error) {
        console.error('❌ Erreur génération questions DeepSeek:', error);
        console.log('🔄 Fallback vers questions statiques...');
        return generateFallbackQuestions(userProfile, description);
    }
}

// Fonction de fallback pour les questions statiques
function generateFallbackQuestions(userProfile, description) {
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
                { value: 'moderne', label: 'Moderne et contemporain' }
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
                { value: 'fonctionnalite', label: 'Fonctionnalité' }
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
                { value: 'continue', label: 'En continu' }
            ],
            required: true
        }
    ];

    // Ajouter des questions spécifiques selon le type de projet
    if (description.toLowerCase().includes('cuisine')) {
        questions.push({
            id: 'fonctionnalite_cuisine',
            question: 'Quelle fonctionnalité privilégier ?',
            type: 'radio',
            options: [
                { value: 'cuisine_sociale', label: 'Cuisine sociale et ouverte' },
                { value: 'cuisine_pratique', label: 'Cuisine pratique et fonctionnelle' },
                { value: 'cuisine_esthetique', label: 'Cuisine esthétique et design' },
                { value: 'cuisine_optimale', label: 'Cuisine optimale et moderne' }
            ],
            required: true
        });
    }

    if (description.toLowerCase().includes('chambre') || description.toLowerCase().includes('salle de bain')) {
        questions.push({
            id: 'fonction_chambre',
            question: 'Quelle fonction principale ?',
            type: 'radio',
            options: [
                { value: 'repos', label: 'Repos et détente' },
                { value: 'travail', label: 'Travail et concentration' },
                { value: 'stockage', label: 'Stockage et organisation' },
                { value: 'polyvalente', label: 'Polyvalente' }
            ],
            required: true
        });
    }

    questions.push({
        id: 'preference_materiaux',
        question: 'Quels matériaux préférez-vous ?',
        type: 'radio',
        options: [
            { value: 'naturels', label: 'Naturels (bois, pierre)' },
            { value: 'modernes', label: 'Modernes (métal, verre)' },
            { value: 'ecologiques', label: 'Écologiques' },
            { value: 'durables', label: 'Durables et résistants' }
        ],
        required: true
    });

    return questions;
}

// Route pour générer les questions dynamiques
app.post('/api/get-questions', async (req, res) => {
    try {
        console.log('📥 Requête questions reçue');
        console.log('📊 Body:', req.body);
        
        const { userProfile, description } = req.body;
        
        console.log('👤 Profil reçu:', userProfile);
        console.log('📝 Description reçue:', description);
        
        // Générer les questions avec DeepSeek
        const questions = await generateAIQuestions(userProfile, description);
        
        console.log('❓ Questions générées:', questions);
        
        res.json({ questions });
    } catch (error) {
        console.error('❌ Erreur génération questions:', error);
        res.status(500).json({ error: 'Erreur lors de la génération des questions' });
    }
});

// Route pour analyser les images
app.post('/api/analyze', upload.array('images', 5), async (req, res) => {
    try {
        console.log('📥 Requête analyse reçue');
        
        const images = req.files;
        const description = req.body.description;
        const userProfile = JSON.parse(req.body.userProfile);
        
        console.log('📸 Images reçues:', images.length);
        console.log('👤 Profil utilisateur:', userProfile);
        console.log('📝 Description du projet:', description);
        
        if (!images || images.length === 0) {
            return res.status(400).json({ error: 'Aucune image fournie' });
        }
        
        console.log('📸 Analyse de', images.length, 'images avec GPT-4 Vision');
        
        // Vérification de la clé API
        if (!OPENAI_API_KEY) {
            throw new Error('Clé API OpenAI non configurée');
        }

        // Préparer les images pour OpenAI
        const imageContents = images.map(image => ({
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
        console.log('🤖 Réponse OpenAI reçue');

        // Parser la réponse JSON
        let parsedResponse;
        try {
            const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
            parsedResponse = JSON.parse(cleanedContent);
        } catch (parseError) {
            console.error('❌ Erreur parsing JSON:', parseError);
            throw new Error('Format de réponse invalide');
        }

        console.log('✅ Analyse terminée avec succès');
        res.json(parsedResponse);

    } catch (error) {
        console.error('❌ Erreur analyse:', error);
        
        if (error.message.includes('Clé API OpenAI')) {
            res.status(401).json({ error: 'Clé API OpenAI invalide ou expirée - Vérifiez OPENAI_API_KEY' });
        } else {
            res.status(500).json({ error: 'Erreur lors de l\'analyse des images' });
        }
    }
});

// Servir les fichiers statiques
app.use(express.static('public'));

// Route de health check pour Render
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Route par défaut
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
console.log('🚀 Démarrage serveur TotoTravo');
console.log('   PORT:', PORT);
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   OPENAI_API_KEY configurée:', !!OPENAI_API_KEY);
console.log('   DEEPSEEK_API_KEY configurée:', !!DEEPSEEK_API_KEY);

app.listen(PORT, () => {
    console.log('🚀 Serveur démarré sur http://localhost:' + PORT);
    console.log('🌍 Environnement:', process.env.NODE_ENV || 'development');
});

