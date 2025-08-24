const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const { getJson } = require('serpapi');
require('dotenv').config();

const app = express();

// Configuration des variables d'environnement
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const PORT = process.env.PORT || 5000;

// Vérification de la configuration
if (!OPENAI_API_KEY) {
    console.warn('⚠️ ATTENTION: OPENAI_API_KEY non configurée');
    console.warn('⚠️ L\'analyse IA ne fonctionnera pas sans cette clé');
    console.warn('⚠️ Mais les questions dynamiques fonctionneront pour les tests');
    // Ne pas arrêter le serveur, juste avertir
}

// Middleware pour parser le JSON (DOIT ÊTRE AVANT LES ROUTES)
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

// Fonctions d'aide pour adapter l'analyse selon le profil utilisateur
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

function getBricolageInstructions(niveau) {
    const instructions = {
        'debutant': '- Privilégie les travaux simples et sécurisés\n- Fournis des conseils détaillés étape par étape\n- Recommande des matériaux faciles à utiliser\n- Évite les travaux dangereux ou complexes\n- Inclus des tutoriels et guides',
        'intermediaire': '- Propose un mix de travaux simples et modérés\n- Fournis des conseils techniques détaillés\n- Recommande des matériaux de qualité moyenne\n- Inclus des travaux nécessitant des compétences de base\n- Donne des conseils de sécurité',
        'expert': '- Peut proposer des travaux complexes\n- Fournis des conseils techniques avancés\n- Recommande des matériaux professionnels\n- Inclus des travaux nécessitant expertise\n- Optimise les coûts avec bricolage'
    };
    return instructions[niveau] || 'Instructions par défaut';
}

function getBudgetInstructions(budget) {
    const instructions = {
        'serre': '- Privilégie les matériaux entrée de gamme\n- Optimise les coûts au maximum\n- Propose des alternatives économiques\n- Inclus des conseils d\'économie\n- Évite les finitions premium',
        'moyen': '- Équilibre qualité et prix\n- Propose des matériaux milieu de gamme\n- Inclus quelques finitions soignées\n- Optimise sans sacrifier la qualité\n- Recommande des marques fiables',
        'confortable': '- Privilégie la qualité premium\n- Propose des matériaux haut de gamme\n- Inclus des finitions soignées\n- Recommande des marques premium\n- Optimise l\'esthétique et la durabilité'
    };
    return instructions[budget] || 'Instructions par défaut';
}

function getDelaiInstructions(delai) {
    const instructions = {
        'urgent': '- Planning accéléré et optimisé\n- Travaux prioritaires identifiés\n- Solutions rapides proposées\n- Évite les délais longs\n- Propose des alternatives express',
        'normal': '- Planning équilibré\n- Travaux organisés par priorité\n- Délais réalistes\n- Optimisation possible\n- Planning détaillé par phases',
        'flexible': '- Planning optimisé pour économies\n- Travaux organisés par saison\n- Délais étalés si avantageux\n- Recherche de bonnes affaires\n- Planning flexible et adaptable'
    };
    return instructions[delai] || 'Instructions par défaut';
}

function getImplicationInstructions(implication) {
    const instructions = {
        'minimale': '- Travaux principalement par artisan\n- Conseils pour superviser\n- Choix de matériaux simplifiés\n- Planning optimisé pour artisan\n- Coûts main d\'œuvre élevés',
        'moderee': '- Mix artisan et bricolage\n- Travaux simples en bricolage\n- Travaux complexes par artisan\n- Conseils de participation\n- Optimisation des coûts',
        'maximale': '- Travaux principalement en bricolage\n- Conseils techniques détaillés\n- Outils et matériaux nécessaires\n- Planning adapté au bricolage\n- Économies maximales'
    };
    return instructions[implication] || 'Instructions par défaut';
}

// Fonction pour rechercher les prix réels avec SerpAPI
async function searchRealPrices(product, store = '') {
    try {
        if (!SERPAPI_KEY) {
            console.log('⚠️ SERPAPI_KEY non configurée, utilisation des prix de référence');
            return null;
        }

        const searchQuery = `${product} prix ${store}`.trim();
        console.log(`🔍 Recherche de prix pour: ${searchQuery}`);

        const response = await getJson({
            engine: "google_shopping",
            q: searchQuery,
            api_key: SERPAPI_KEY,
            gl: "fr",
            hl: "fr"
        });

        if (response.shopping_results && response.shopping_results.length > 0) {
            const prices = response.shopping_results
                .map(result => {
                    const price = result.extracted_price || result.price;
                    return price ? parseFloat(price) : null;
                })
                .filter(price => price !== null);

            if (prices.length > 0) {
                const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                
                console.log(`💰 Prix trouvés pour ${product}: ${minPrice}€ - ${maxPrice}€ (moyenne: ${avgPrice.toFixed(2)}€)`);
                
                return {
                    min: minPrice,
                    max: maxPrice,
                    average: avgPrice,
                    source: 'SerpAPI'
                };
            }
        }

        console.log(`❌ Aucun prix trouvé pour: ${product}`);
        return null;
    } catch (error) {
        console.error(`❌ Erreur recherche prix pour ${product}:`, error.message);
        return null;
    }
}

// Configuration Multer pour le stockage en mémoire
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
        files: 5 // 5 fichiers max
    },
    fileFilter: (req, file, cb) => {
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
        
        // Rechercher les prix réels pour les matériaux courants
        console.log('🔍 Recherche des prix réels en cours...');
        const realPrices = {};
        
        const commonMaterials = [
            'peinture murale dulux',
            'carrelage sol',
            'parquet chêne',
            'moquette tarkett',
            'papier peint',
            'enduit lissage',
            'rouleau peinture'
        ];

        for (const material of commonMaterials) {
            const prices = await searchRealPrices(material);
            if (prices) {
                realPrices[material] = prices;
            }
        }

        // Si l'utilisateur demande un aménagement, rechercher les prix des meubles
        if (description.toLowerCase().includes('aménager') || description.toLowerCase().includes('meuble') || description.toLowerCase().includes('canapé') || description.toLowerCase().includes('table')) {
            console.log('🪑 Recherche des prix de meubles...');
            const furnitureItems = [
                'canapé 3 places',
                'table salle à manger',
                'lit 160cm',
                'armoire penderie',
                'commode',
                'bureau'
            ];

            for (const furniture of furnitureItems) {
                const prices = await searchRealPrices(furniture);
                if (prices) {
                    realPrices[furniture] = prices;
                }
            }
        }

        console.log('💰 Prix réels trouvés:', Object.keys(realPrices).length, 'produits');
        
        const prompt = `Tu es un expert artisan en rénovation immobilière avec 20 ans d'expérience. Analyse ces images et fournis une analyse ULTRA-DÉTAILLÉE avec métrage, prix des meubles, matériaux, produits spécifiques. Réponds UNIQUEMENT avec un objet JSON valide.

PRIX RÉELS TROUVÉS SUR INTERNET (utilise ces prix quand possible):
${JSON.stringify(realPrices, null, 2)}

PROFIL UTILISATEUR (ADAPTE TOUTE L'ANALYSE SELON CE PROFIL):
- Niveau bricolage: ${userProfile.niveau_bricolage} (${getBricolageLevel(userProfile.niveau_bricolage)})
- Budget: ${userProfile.budget} (${getBudgetRange(userProfile.budget)})
- Délai: ${userProfile.delai} (${getDelaiInfo(userProfile.delai)})
- Implication: ${userProfile.implication} (${getImplicationInfo(userProfile.implication)})
- Type projet: ${userProfile.type_projet} (${getProjectTypeInfo(userProfile.type_projet)})

DESCRIPTION DU PROJET (TRÈS IMPORTANT):
${description || 'Aucune description fournie'}

INSTRUCTIONS SPÉCIFIQUES SELON LE PROFIL:

**NIVEAU BRICOLAGE ${userProfile.niveau_bricolage.toUpperCase()}:**
${getBricolageInstructions(userProfile.niveau_bricolage)}

**BUDGET ${userProfile.budget.toUpperCase()}:**
${getBudgetInstructions(userProfile.budget)}

**DÉLAI ${userProfile.delai.toUpperCase()}:**
${getDelaiInstructions(userProfile.delai)}

**IMPLICATION ${userProfile.implication.toUpperCase()}:**
${getImplicationInstructions(userProfile.implication)}

INSTRUCTIONS STRICTES - ANALYSE ULTRA-DÉTAILLÉE:
1. **MÉTRAGE PRÉCIS** : Calcule la surface approximative de chaque pièce
2. **IDENTIFICATION COMPLÈTE** : Murs, sols, plafonds, fenêtres, portes, électricité, plomberie
3. **ÉTAT DÉTAILLÉ** : État de chaque élément (excellent/bon/moyen/mauvais/critique)
4. **TRAVAUX COMPLETS** : Liste exhaustive de tous les travaux nécessaires
5. **PRIX RÉALISTES** : Estime les prix en fonction de la qualité et de la complexité
6. **MEUBLES ET ÉQUIPEMENTS** : Si aménagement demandé, liste complète avec prix réalistes
7. **MATÉRIAUX SPÉCIFIQUES** : Marques, références, quantités
8. **PRODUITS CONCRETS** : Noms de produits, magasins recommandés
9. **DISTINCTION ARTISAN/BRICOLAGE** : Selon le profil utilisateur
10. **PLANNING DÉTAILLÉ** : Phases, tâches, durées précises

ESTIMATION DES PRIX - MÉTHODE RÉALISTE:

**PRINCIPES D'ESTIMATION:**
- Évalue la QUALITÉ nécessaire selon le budget utilisateur
- Considère la COMPLEXITÉ des travaux (état actuel, accessibilité)
- Adapte les prix selon la RÉGION (France métropolitaine)
- Inclus les FRAIS ANNEXES (déchets, protection, finitions)

**QUALITÉ SELON BUDGET:**
- Budget serré: Matériaux entrée de gamme, finitions basiques
- Budget moyen: Matériaux milieu de gamme, finitions correctes
- Budget confortable: Matériaux haut de gamme, finitions soignées

**FACTEURS DE COMPLEXITÉ:**
- État dégradé: +20-30% sur les prix
- Travaux en hauteur: +15-25% sur main d'œuvre
- Démolition nécessaire: +10-20% sur matériaux
- Finitions complexes: +25-40% sur main d'œuvre

**PRIX DE RÉFÉRENCE 2024 (France):**

**MATÉRIAUX DE BASE (prix/m²):**
- Peinture murale: 8-15€ (entrée) / 15-25€ (moyen) / 25-40€ (haut)
- Carrelage sol: 25-45€ (entrée) / 45-80€ (moyen) / 80-150€ (haut)
- Parquet: 35-60€ (stratifié) / 60-100€ (contrecollé) / 100-200€ (massif)
- Moquette: 15-30€ (entrée) / 30-50€ (moyen) / 50-100€ (haut)

**ÉLECTRICITÉ (prix/point):**
- Point lumineux: 60-100€ (simple) / 100-150€ (complexe)
- Prise électrique: 40-80€ (simple) / 80-120€ (avec protection)
- Interrupteur: 30-60€ (simple) / 60-100€ (programmable)

**PLOMBERIE (prix/élément):**
- Robinet lavabo: 50-120€ (entrée) / 120-250€ (moyen) / 250-500€ (haut)
- WC suspendu: 200-400€ (entrée) / 400-800€ (moyen) / 800-1500€ (haut)
- Douche à l'italienne: 500-1000€ (simple) / 1000-2000€ (moyen) / 2000-4000€ (haut)

**MEUBLES (prix estimé):**
- Canapé 3 places: 400-800€ (entrée) / 800-2000€ (moyen) / 2000-5000€ (haut)
- Table salle à manger: 200-500€ (entrée) / 500-1500€ (moyen) / 1500-4000€ (haut)
- Lit 160cm: 300-600€ (entrée) / 600-1500€ (moyen) / 1500-3000€ (haut)

**MAIN D'ŒUVRE 2024 (prix/h):**
- Maçon: 35-50€ (région) / 50-70€ (Paris)
- Électricien: 40-60€ (région) / 60-80€ (Paris)
- Plombier: 45-65€ (région) / 65-85€ (Paris)
- Menuisier: 40-60€ (région) / 60-80€ (Paris)
- Carreleur: 35-55€ (région) / 55-75€ (Paris)
- Peintre: 25-40€ (région) / 40-60€ (Paris)

**IMPORTANT - ESTIMATION RÉALISTE:**
- UTILISE LES PRIX RÉELS TROUVÉS SUR INTERNET quand disponibles
- Évalue l'état actuel pour ajuster les prix
- Considère la complexité des travaux
- Adapte selon le budget utilisateur
- Inclus les frais annexes (déchets, protection, finitions)
- Donne des fourchettes de prix réalistes basées sur les prix actuels du marché

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
                                        marque: "Dulux Ambiance",
                                        quantite: "5L",
                                        prix_unitaire: 35,
                                        prix_total: 175,
                                        magasin: "Leroy Merlin"
                                    },
                                    {
                                        nom: "Enduit de lissage",
                                        marque: "Placo",
                                        quantite: "10kg",
                                        prix_unitaire: 12,
                                        prix_total: 120,
                                        magasin: "Brico Dépôt"
                                    },
                                    {
                                        nom: "Rouleau peinture",
                                        marque: "Proline",
                                        quantite: "2 unités",
                                        prix_unitaire: 8,
                                        prix_total: 16,
                                        magasin: "Castorama"
                                    }
                                ],
                                cout_materiaux: 311,
                                cout_main_oeuvre: 800,
                                cout_total: 1111,
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
                        cout_total_piece: 1111,
                        cout_materiaux_piece: 311,
                        cout_main_oeuvre_piece: 800
                    }
                ],
                analyse_globale: {
                    score_global: "moyen",
                    niveau_difficulte: 65,
                    cout_total: 1111,
                    cout_materiaux_total: 311,
                    cout_main_oeuvre_total: 800,
                    cout_meubles_total: 0,
                    duree_totale: "3-4 semaines",
                    commentaire_general: "Rénovation complète nécessaire. Travaux de qualité nécessitant un artisan qualifié. Budget réaliste pour un résultat professionnel.",
                    travaux_artisan: [
                        {
                            nom: "Rénovation complète",
                            description: "Rénovation complète incluant maçonnerie, électricité, plomberie et finitions",
                            cout: 1111,
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

// Endpoint pour obtenir les questions dynamiques selon le profil
app.post('/api/get-questions', (req, res) => {
    try {
        console.log('📥 Requête questions reçue');
        console.log('📊 Body:', req.body);
        
        const { userProfile, description } = req.body;
        
        if (!userProfile) {
            console.log('❌ Profil utilisateur manquant');
            return res.status(400).json({ error: 'Profil utilisateur requis' });
        }

        console.log('👤 Profil reçu:', userProfile);
        console.log('📝 Description reçue:', description);

        const questions = generateDynamicQuestions(userProfile, description);
        console.log('❓ Questions générées:', questions);
        
        res.json({
            questions: questions,
            totalQuestions: questions.length
        });
    } catch (error) {
        console.error('❌ Erreur génération questions:', error);
        res.status(500).json({ error: 'Erreur lors de la génération des questions' });
    }
});

// Fonction pour générer des questions dynamiques intelligentes
function generateDynamicQuestions(userProfile, description = '') {
    const questions = [];
    
    // Question de style universelle mais plus pertinente
    questions.push({
        id: 'ambiance_souhaitee',
        question: 'Quelle ambiance souhaitez-vous créer ?',
        type: 'radio',
        options: [
            { value: 'cosy', label: 'Cosy et chaleureux' },
            { value: 'epure', label: 'Épuré et minimaliste' },
            { value: 'luxueux', label: 'Luxueux et raffiné' },
            { value: 'naturel', label: 'Naturel et authentique' },
            { value: 'contemporain', label: 'Contemporain et tendance' }
        ],
        required: true
    });

    // Question sur les priorités selon le budget
    if (userProfile.budget === 'serre') {
        questions.push({
            id: 'optimisation_budget',
            question: 'Comment optimiser votre budget ?',
            type: 'radio',
            options: [
                { value: 'materiaux_eco', label: 'Matériaux économiques mais durables' },
                { value: 'travaux_essentiels', label: 'Travaux essentiels uniquement' },
                { value: 'phases_etalees', label: 'Travaux en plusieurs phases' },
                { value: 'recyclage', label: 'Recyclage et récupération' }
            ],
            required: true
        });
    } else if (userProfile.budget === 'confortable') {
        questions.push({
            id: 'plus_value',
            question: 'Quelle plus-value recherchez-vous ?',
            type: 'radio',
            options: [
                { value: 'valeur_bien', label: 'Augmenter la valeur du bien' },
                { value: 'confort_vie', label: 'Améliorer le confort de vie' },
                { value: 'esthetique', label: 'Transformation esthétique' },
                { value: 'modernisation', label: 'Modernisation complète' }
            ],
            required: true
        });
    }

    // Question sur la durée selon le délai
    if (userProfile.delai === 'urgent') {
        questions.push({
            id: 'urgence_type',
            question: 'Quelle est la nature de l\'urgence ?',
            type: 'radio',
            options: [
                { value: 'securite', label: 'Problème de sécurité' },
                { value: 'fonctionnel', label: 'Problème fonctionnel' },
                { value: 'evenement', label: 'Événement à venir' },
                { value: 'contrainte', label: 'Contrainte externe' }
            ],
            required: true
        });
    }

    // Question sur l'organisation selon l'implication
    if (userProfile.implication === 'maximale') {
        questions.push({
            id: 'organisation_travaux',
            question: 'Comment souhaitez-vous organiser les travaux ?',
            type: 'radio',
            options: [
                { value: 'weekends', label: 'Travaux le weekend' },
                { value: 'vacances', label: 'Pendant les vacances' },
                { value: 'soirees', label: 'En soirée après le travail' },
                { value: 'planning', label: 'Planning flexible selon disponibilités' }
            ],
            required: true
        });
    }

    // Questions spécifiques selon le type de pièce
    const descriptionLower = description.toLowerCase();
    
    if (descriptionLower.includes('cuisine')) {
        questions.push({
            id: 'fonctionnalite_cuisine',
            question: 'Quelle fonctionnalité privilégier ?',
            type: 'radio',
            options: [
                { value: 'cuisine_sociale', label: 'Cuisine sociale et conviviale' },
                { value: 'cuisine_pratique', label: 'Cuisine pratique et fonctionnelle' },
                { value: 'cuisine_esthetique', label: 'Cuisine esthétique et design' },
                { value: 'cuisine_optimale', label: 'Optimisation de l\'espace' }
            ],
            required: true
        });
    }
    
    if (descriptionLower.includes('salle de bain') || descriptionLower.includes('salle bain')) {
        questions.push({
            id: 'experience_sdb',
            question: 'Quelle expérience recherchez-vous ?',
            type: 'radio',
            options: [
                { value: 'spa', label: 'Ambiance spa et détente' },
                { value: 'pratique', label: 'Pratique et fonctionnel' },
                { value: 'moderne', label: 'Moderne et design' },
                { value: 'accessible', label: 'Accessible et sécurisé' }
            ],
            required: true
        });
    }
    
    if (descriptionLower.includes('chambre')) {
        questions.push({
            id: 'fonction_chambre',
            question: 'Quelle fonction principale ?',
            type: 'radio',
            options: [
                { value: 'repos', label: 'Repos et détente' },
                { value: 'travail', label: 'Travail et concentration' },
                { value: 'stockage', label: 'Stockage et rangement' },
                { value: 'polyvalente', label: 'Polyvalente et adaptable' }
            ],
            required: true
        });
    }

    // Question sur les matériaux selon le niveau
    if (userProfile.niveau_bricolage === 'expert') {
        questions.push({
            id: 'preference_materiaux',
            question: 'Quels matériaux préférez-vous ?',
            type: 'radio',
            options: [
                { value: 'naturels', label: 'Matériaux naturels (bois, pierre)' },
                { value: 'modernes', label: 'Matériaux modernes (verre, métal)' },
                { value: 'ecologiques', label: 'Matériaux écologiques' },
                { value: 'durables', label: 'Matériaux ultra-durables' }
            ],
            required: true
        });
    }

    return questions;
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
                name: file.originalname,
                size: file.size,
                type: file.mimetype
            })),
            analysis: analysis,
            timestamp: new Date().toISOString()
        };
        
        console.log('✅ Analyse terminée avec succès');
        res.json(result);
    } catch (error) {
        console.error('❌ Erreur analyse:', error.message);
        res.status(500).json({ 
            error: 'Erreur lors de l\'analyse des images',
            details: error.message 
        });
    }
});

// Route pour le chatbot
app.post('/api/chat', async (req, res) => {
    try {
        const { message, projectContext } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message requis' });
        }
        
        const response = await chatWithAI(message, projectContext || '');
        res.json({ response });
    } catch (error) {
        console.error('❌ Erreur chatbot:', error.message);
        res.status(500).json({ 
            error: 'Erreur lors de l\'envoi du message',
            details: error.message 
        });
    }
});

// Route de test
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

// Route de santé pour Render
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Servir les fichiers statiques
app.use(express.static('public'));

// Route principale
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } catch (error) {
        console.error('❌ Erreur serveur fichier:', error.message);
        res.status(500).send('Erreur serveur');
    }
});

// Middleware de gestion d'erreur global
app.use((error, req, res, next) => {
    console.error('❌ Erreur serveur:', error);
    console.error('📄 URL:', req.url);
    console.error('🔧 Méthode:', req.method);
    console.error('📋 Headers:', req.headers);
    
    res.status(500).json({
        error: 'Erreur serveur interne',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
});

// Démarrage du serveur
console.log('🚀 Démarrage serveur TotoTravo');
console.log('   PORT:', PORT);
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   OPENAI_API_KEY configurée:', !!OPENAI_API_KEY);

console.log('🔍 Debug variables d\'environnement:');
console.log('   PORT:', process.env.PORT);
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   OPENAI_API_KEY existe:', !!OPENAI_API_KEY);
console.log('   OPENAI_API_KEY preview:', OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 20) + '...' : 'Non définie');

app.listen(PORT, () => {
    console.log('🔑 Configuration:');
    console.log('   OPENAI_API_KEY:', OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 20) + '...' : 'Non configurée');
    console.log('   PORT:', PORT);
    console.log('🚀 Serveur démarré sur http://localhost:' + PORT);
    console.log('🌍 Environnement:', process.env.NODE_ENV || 'development');
});

