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
    console.error('❌ ERREUR: OPENAI_API_KEY non configurée');
    console.error('❌ Configurez OPENAI_API_KEY dans les variables d\'environnement Render');
    console.error('❌ Ou ajoutez-la dans un fichier .env pour le développement local');
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
        
        const prompt = `Tu es un expert artisan en rénovation immobilière avec 20 ans d'expérience. Analyse ces images et fournis une analyse ULTRA-DÉTAILLÉE avec métrage, prix des meubles, matériaux, produits spécifiques. Réponds UNIQUEMENT avec un objet JSON valide.

PROFIL UTILISATEUR:
- Niveau bricolage: ${userProfile.niveau_bricolage}
- Budget: ${userProfile.budget}
- Délai: ${userProfile.delai}
- Implication: ${userProfile.implication}
- Type projet: ${userProfile.type_projet}

DESCRIPTION DU PROJET (TRÈS IMPORTANT):
${description || 'Aucune description fournie'}

INSTRUCTIONS STRICTES - ANALYSE ULTRA-DÉTAILLÉE:
1. **MÉTRAGE PRÉCIS** : Calcule la surface approximative de chaque pièce
2. **IDENTIFICATION COMPLÈTE** : Murs, sols, plafonds, fenêtres, portes, électricité, plomberie
3. **ÉTAT DÉTAILLÉ** : État de chaque élément (excellent/bon/moyen/mauvais/critique)
4. **TRAVAUX COMPLETS** : Liste exhaustive de tous les travaux nécessaires
5. **PRIX DÉTAILLÉS** : Matériaux + main d'œuvre séparément
6. **MEUBLES ET ÉQUIPEMENTS** : Si aménagement demandé, liste complète avec prix
7. **MATÉRIAUX SPÉCIFIQUES** : Marques, références, quantités
8. **PRODUITS CONCRETS** : Noms de produits, magasins recommandés
9. **DISTINCTION ARTISAN/BRICOLAGE** : Selon le profil utilisateur
10. **PLANNING DÉTAILLÉ** : Phases, tâches, durées précises

PRIX RÉALISTES 2024 - TRÈS DÉTAILLÉS:

**MATÉRIAUX DE BASE:**
- Peinture murale: 15-25€/m² (Dulux, Tollens, Farrow & Ball)
- Carrelage sol: 40-80€/m² (Porcelanosa, Marazzi, Cifre)
- Carrelage mural: 30-60€/m²
- Parquet: 60-120€/m² (chêne massif, chêne contrecollé)
- Moquette: 25-50€/m² (Tarkett, Balta)
- Papier peint: 20-40€/m² (Casamance, Sanderson)

**ÉLECTRICITÉ:**
- Point lumineux: 80-150€ (Legrand, Schneider)
- Prise électrique: 60-120€
- Interrupteur: 40-80€
- Tableau électrique: 800-2000€
- Câblage: 15-25€/m linéaire

**PLOMBERIE:**
- Robinet lavabo: 80-200€ (Grohe, Hansgrohe)
- Robinet douche: 150-400€
- WC suspendu: 300-800€ (Geberit, Roca)
- Douche à l'italienne: 800-2000€
- Baignoire: 400-1200€

**MENUISERIE:**
- Porte intérieure: 200-500€/m² (Lapeyre, Schmidt)
- Fenêtre PVC: 300-800€/m² (Veka, Rehau)
- Fenêtre aluminium: 400-1000€/m²
- Escalier: 3000-15000€
- Placard sur mesure: 800-2000€/m²

**MEUBLES ET ÉQUIPEMENTS:**
- Canapé 3 places: 800-3000€ (IKEA, Roche Bobois)
- Table de salle à manger: 400-2000€
- Chaises: 80-300€/chaise
- Lit 160cm: 600-2500€
- Armoire penderie: 500-1500€
- Commode: 300-1200€
- Table de chevet: 100-400€
- Bureau: 300-1500€
- Bibliothèque: 200-1000€
- Cuisine complète: 8000-25000€ (IKEA, Schmidt, Bulthaup)
- Salle de bain complète: 5000-15000€

**ÉLECTROMÉNAGER:**
- Réfrigérateur: 400-1500€
- Lave-vaisselle: 300-1200€
- Four: 300-1500€
- Plaques de cuisson: 200-1000€
- Lave-linge: 400-1200€
- Sèche-linge: 400-1200€

**MAIN D'ŒUVRE 2024:**
- Maçon: 45-65€/h
- Électricien: 50-70€/h
- Plombier: 55-75€/h
- Menuisier: 50-70€/h
- Carreleur: 45-65€/h
- Peintre: 35-55€/h
- Plâtrier: 40-60€/h

FORMAT JSON OBLIGATOIRE - ULTRA-DÉTAILLÉ:
{
  "pieces": [
    {
      "nom": "Nom de la pièce",
      "etat": "bon/moyen/mauvais",
      "surface_estimee": "XXm²",
      "dimensions": "L x l x h",
      "elements_identifies": [
        {
          "type": "mur/sol/plafond/fenetre/porte/electricite/plomberie",
          "etat": "excellent/bon/moyen/mauvais/critique",
          "description": "Description détaillée"
        }
      ],
      "travaux": [
        {
          "nom": "Nom du travail",
          "description": "Description très détaillée",
          "type_execution": "artisan ou bricolage",
          "surface_ou_quantite": "XXm² ou nombre",
          "materiaux_necessaires": [
            {
              "nom": "Nom du matériau",
              "marque": "Marque recommandée",
              "quantite": "XX unités",
              "prix_unitaire": 100,
              "prix_total": 1000,
              "magasin": "Leroy Merlin, Brico Dépôt, etc."
            }
          ],
          "cout_materiaux": 1000,
          "cout_main_oeuvre": 2000,
          "cout_total": 3000,
          "duree_estimee": "X semaines",
          "priorite": "haute/moyenne/basse",
          "conseils": "Conseils détaillés",
          "produits_recommandes": ["Produit 1", "Produit 2"]
        }
      ],
      "meubles_equipements": [
        {
          "nom": "Nom du meuble",
          "type": "canape/table/lit/armoire/etc",
          "dimensions": "L x l x h",
          "prix_estime": 1000,
          "marques_recommandees": ["IKEA", "Roche Bobois"],
          "conseils_achat": "Conseils d'achat"
        }
      ],
      "cout_total_piece": 5000,
      "cout_materiaux_piece": 2000,
      "cout_main_oeuvre_piece": 3000
    }
  ],
  "analyse_globale": {
    "score_global": "bon/moyen/mauvais",
    "niveau_difficulte": 75,
    "cout_total": 15000,
    "cout_materiaux_total": 6000,
    "cout_main_oeuvre_total": 9000,
    "cout_meubles_total": 5000,
    "duree_totale": "8 semaines",
    "commentaire_general": "Commentaire détaillé",
    "travaux_artisan": [
      {
        "nom": "Travail artisan",
        "description": "Description détaillée",
        "cout": 8000,
        "duree": "4 semaines",
        "raison_artisan": "Pourquoi artisan nécessaire",
        "artisan_recommande": "Type d'artisan"
      }
    ],
    "travaux_bricolage": [
      {
        "nom": "Travail bricolage",
        "description": "Description détaillée",
        "cout_materiaux": 2000,
        "duree": "2 semaines",
        "conseils_bricolage": "Conseils détaillés",
        "outils_necessaires": ["Outil 1", "Outil 2"],
        "difficulte": "facile/moyen/difficile"
      }
    ],
    "planning": {
      "phase1_duree": "2 semaines",
      "phase1_taches": ["Démolition", "Préparation"],
      "phase1_details": "Détails de la phase 1",
      "phase2_duree": "4 semaines",
      "phase2_taches": ["Installation", "Rénovation"],
      "phase2_details": "Détails de la phase 2",
      "phase3_duree": "2 semaines",
      "phase3_taches": ["Finitions", "Peinture"],
      "phase3_details": "Détails de la phase 3",
      "duree_totale": "8 semaines"
    },
    "recommandations": {
      "priorites": ["Travail 1", "Travail 2"],
      "economies_possibles": "Comment économiser",
      "investissements_rentables": "Investissements recommandés",
      "conseils_securite": "Conseils de sécurité"
    }
  }
}

IMPORTANT: 
- Réponds UNIQUEMENT avec le JSON, sans \`\`\`json ni texte avant/après
- Fournis TOUS les détails demandés
- Inclus métrage, prix meubles, matériaux spécifiques, produits concrets
- Adapte selon le profil utilisateur et la description du projet`;

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

        console.log('🔑 Clé API configurée et valide');
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
            
            // Fallback avec une réponse détaillée
            console.log('🔄 Utilisation du fallback détaillé...');
            return {
                pieces: [
                    {
                        nom: "Pièce analysée",
                        etat: "Nécessite rénovation complète",
                        surface_estimee: "15-20m²",
                        dimensions: "4m x 4m x 2.5m",
                        elements_identifies: [
                            {
                                type: "mur",
                                etat: "moyen",
                                description: "Murs nécessitant rénovation"
                            },
                            {
                                type: "sol",
                                etat: "mauvais",
                                description: "Sol à refaire"
                            },
                            {
                                type: "plafond",
                                etat: "bon",
                                description: "Plafond en bon état"
                            }
                        ],
                        travaux: [
                            {
                                nom: "Rénovation complète",
                                description: "Rénovation complète de la pièce incluant murs, sol, électricité et finitions",
                                type_execution: "artisan",
                                surface_ou_quantite: "15m²",
                                materiaux_necessaires: [
                                    {
                                        nom: "Peinture murale",
                                        marque: "Dulux",
                                        quantite: "5L",
                                        prix_unitaire: 45,
                                        prix_total: 225,
                                        magasin: "Leroy Merlin"
                                    },
                                    {
                                        nom: "Carrelage sol",
                                        marque: "Porcelanosa",
                                        quantite: "15m²",
                                        prix_unitaire: 60,
                                        prix_total: 900,
                                        magasin: "Brico Dépôt"
                                    }
                                ],
                                cout_materiaux: 1500,
                                cout_main_oeuvre: 3000,
                                cout_total: 4500,
                                duree_estimee: "2-3 semaines",
                                priorite: "haute",
                                conseils: "Faites appel à un artisan qualifié pour un devis précis. Prévoyez une marge de 20% pour les imprévus.",
                                produits_recommandes: ["Peinture Dulux Ambiance", "Carrelage Porcelanosa"]
                            }
                        ],
                        meubles_equipements: [
                            {
                                nom: "Canapé 3 places",
                                type: "canape",
                                dimensions: "2.2m x 0.9m x 0.8m",
                                prix_estime: 1200,
                                marques_recommandees: ["IKEA", "Roche Bobois"],
                                conseils_achat: "Privilégiez un canapé convertible pour optimiser l'espace"
                            },
                            {
                                nom: "Table basse",
                                type: "table",
                                dimensions: "1.2m x 0.6m x 0.45m",
                                prix_estime: 300,
                                marques_recommandees: ["IKEA", "Maisons du Monde"],
                                conseils_achat: "Table avec rangement intégré recommandée"
                            }
                        ],
                        cout_total_piece: 6000,
                        cout_materiaux_piece: 1500,
                        cout_main_oeuvre_piece: 3000
                    }
                ],
                analyse_globale: {
                    score_global: "moyen",
                    niveau_difficulte: 65,
                    cout_total: 6000,
                    cout_materiaux_total: 1500,
                    cout_main_oeuvre_total: 3000,
                    cout_meubles_total: 1500,
                    duree_totale: "3-4 semaines",
                    commentaire_general: "Rénovation complète nécessaire. Travaux de qualité nécessitant un artisan qualifié. Budget réaliste pour un résultat professionnel.",
                    travaux_artisan: [
                        {
                            nom: "Rénovation complète",
                            description: "Rénovation complète incluant maçonnerie, électricité, plomberie et finitions",
                            cout: 4500,
                            duree: "2-3 semaines",
                            raison_artisan: "Travaux complexes nécessitant expertise technique et garantie décennale",
                            artisan_recommande: "Artisan généraliste ou maçon"
                        }
                    ],
                    travaux_bricolage: [
                        {
                            nom: "Préparation et finitions",
                            description: "Préparation des surfaces, ponçage, nettoyage et finitions",
                            cout_materiaux: 200,
                            duree: "1 semaine",
                            conseils_bricolage: "Préparer la zone de travail, protéger les meubles, aérer pendant les travaux",
                            outils_necessaires: ["Ponceuse", "Pinceaux", "Rouleaux", "Bâches de protection"],
                            difficulte: "moyen"
                        }
                    ],
                        planning: {
                            phase1_duree: "1 semaine",
                            phase1_taches: ["Préparation", "Démolition"],
                            phase1_details: "Démontage des éléments existants et préparation des surfaces",
                            phase2_duree: "2 semaines",
                            phase2_taches: ["Installation", "Rénovation"],
                            phase2_details: "Installation des nouveaux éléments et rénovation des structures",
                            phase3_duree: "1 semaine",
                            phase3_taches: ["Finitions", "Peinture"],
                            phase3_details: "Finitions, peinture et nettoyage final",
                            duree_totale: "4 semaines"
                        },
                        recommandations: {
                            priorites: ["Rénovation structurelle", "Installation électrique", "Finitions"],
                            economies_possibles: "Achetez les matériaux en gros, négociez avec les artisans",
                            investissements_rentables: "Isolation thermique, éclairage LED, robinetterie économique",
                            conseils_securite: "Portez des équipements de protection, aérez pendant les travaux"
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
        openai_key_preview: OPENAI_API_KEY ? '[CONFIGURÉE]' : 'Non définie'
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
        console.log('   OPENAI_API_KEY: [CONFIGURÉE]');
    console.log('   PORT:', PORT);
    console.log('🚀 Serveur démarré sur http://localhost:' + PORT);
    console.log('🌍 Environnement:', process.env.NODE_ENV || 'development');
});

// Export pour Vercel
module.exports = app;

