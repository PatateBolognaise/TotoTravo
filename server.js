const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
// Configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-872ba319f3d0467f9c3167e00654c333';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const PORT = process.env.PORT || 3000;

// Configuration Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024, files: 5 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Seules les images sont autorisées'), false);
        }
    }
});

// Configuration CORS pour Vercel
app.use(cors({
    origin: ['http://localhost:3000', 'https://*.vercel.app', 'https://*.now.sh'],
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

console.log('🔑 Configuration:');
console.log('   DEEPSEEK_API_KEY:', DEEPSEEK_API_KEY.substring(0, 20) + '...');
console.log('   PORT:', PORT);

// Fonction pour analyser les images avec DeepSeek Chat
async function analyzeImagesWithAI(imageFiles, description = '', userProfile = {}) {
    try {
        console.log('📸 Analyse de', imageFiles.length, 'images avec DeepSeek');
        
        // Créer une description des images basée sur leurs métadonnées
        const imageInfo = imageFiles.map((file, index) => {
            const sizeKB = Math.round(file.size / 1024);
            const dimensions = `${file.originalname} (${sizeKB}KB, ${file.mimetype})`;
            return `Image ${index + 1}: ${dimensions}`;
        }).join('\n');
        
        // Prompt simplifié et efficace pour l'analyse d'images
        const prompt = `Tu es un artisan expert en rénovation. Analyse ces images et donne une estimation réaliste.

PROFIL: ${userProfile.niveau_bricolage || 'standard'} - ${userProfile.budget || 'moyen'} - ${userProfile.delai || 'normal'}
IMAGES: ${imageInfo}
PROJET: ${description || 'Rénovation générale'}

INSTRUCTIONS:
- Identifie les pièces visibles dans les images
- Décris l'état actuel de chaque pièce
- Liste les travaux nécessaires avec prix RÉALISTES 2024
- Distingue artisan vs bricolage selon le profil

PRIX RÉALISTES 2024:
- Peinture: 15-25€/m², Carrelage: 40-80€/m², Électricité: 80-150€/point
- Vidéoprojecteur: 300-800€ (pas 5500€!), Plomberie: 200-500€/point

ADAPTATION PROFIL:
- Budget "serré": Matériaux basiques, bricolage maximum
- Budget "confortable": Matériaux qualité, artisan si nécessaire
- Niveau "débutant": Artisan pour tout sauf peinture
- Niveau "expert": Bricolage maximum, artisan électricité/plomberie

Réponds en JSON SIMPLE sans caractères spéciaux:

{
  "pieces": [
    {
      "nom": "Nom pièce",
      "etat": "Description courte",
      "travaux": [
        {
          "nom": "Travail",
          "description": "Description courte",
          "type_execution": "artisan",
          "cout_materiaux": 500,
          "cout_main_oeuvre": 800,
          "cout_total": 1300,
          "duree_estimee": "2-3 jours",
          "priorite": "haute",
          "conseils": "Conseils courts"
        }
      ],
      "cout_total_piece": 5000
    }
  ],
  "analyse_globale": {
    "score_global": "moyen",
    "niveau_difficulte": 65,
    "cout_total": 20000,
    "commentaire_general": "Commentaire court",
    "travaux_artisan": [
      {
        "nom": "Travail artisan",
        "description": "Description",
        "cout": 1500,
        "duree": "3-5 jours",
        "raison_artisan": "Pourquoi artisan"
      }
    ],
    "travaux_bricolage": [
      {
        "nom": "Travail bricolage",
        "description": "Description",
        "cout_materiaux": 300,
        "duree": "1-2 jours",
        "conseils_bricolage": "Conseils bricolage"
      }
    ],
    "planning": {
      "phase1_duree": "1-2 semaines",
      "phase1_taches": ["Démolition", "Préparation"],
      "phase2_duree": "2-4 semaines",
      "phase2_taches": ["Installation", "Rénovation"],
      "phase3_duree": "1 semaine",
      "phase3_taches": ["Finitions", "Peinture"],
      "duree_totale": "4-7 semaines"
    }
  }
}`;

        const requestData = {
            model: "deepseek-chat",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.1
        };

        console.log('📤 Envoi à DeepSeek Chat...');
        
        const response = await axios.post(DEEPSEEK_API_URL, requestData, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 300000 // 5 minutes
        });

        console.log('✅ Réponse DeepSeek reçue');
        
        const content = response.data.choices[0].message.content.trim();
        console.log('🤖 Réponse IA:', content.substring(0, 200) + '...');

        // Parser le JSON avec gestion d'erreur robuste
        try {
            // Nettoyer le contenu des marqueurs de code
            let cleanContent = content;
            
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
            console.log('📄 Contenu reçu:', content.substring(0, 500) + '...');
            
            // Tentative de récupération avec regex plus robuste
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
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
            
            // Tentative de récupération avec correction des erreurs courantes
            try {
                console.log('🔄 Tentative de correction JSON...');
                let correctedContent = content;
                
                // Corriger les guillemets non fermés
                correctedContent = correctedContent.replace(/([^"\\])(["])([^"]*)$/g, '$1$2$3"');
                
                // Corriger les virgules manquantes
                correctedContent = correctedContent.replace(/([^,}])\s*}/g, '$1}');
                
                // Supprimer les caractères invalides
                correctedContent = correctedContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
                
                const parsed = JSON.parse(correctedContent);
                console.log('✅ JSON corrigé avec succès');
                return parsed;
            } catch (correctionError) {
                console.error('❌ Échec de la correction JSON:', correctionError);
            }
            
            // Fallback avec une réponse basique mais complète
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
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            throw new Error('L\'analyse prend plus de temps que prévu. Veuillez réessayer.');
        }
        throw error;
    }
}

// Fonction chatbot améliorée
async function chatWithAI(message, projectContext = '') {
    try {
        console.log('💬 Chatbot:', message);
        
        let contextInfo = '';
        if (projectContext) {
            try {
                const context = JSON.parse(projectContext);
                if (context.travaux && context.travaux.analyse_globale) {
                    const global = context.travaux.analyse_globale;
                    contextInfo = `
PROJET ACTUEL:
- Coût total: ${global.cout_total || 'N/A'}€
- Durée: ${global.duree_totale || 'N/A'}
- Difficulté: ${global.niveau_difficulte || 'N/A'}/100
- Pièces analysées: ${context.travaux.pieces ? context.travaux.pieces.length : 0}
`;
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
        
        const prompt = `Tu es un artisan expert en rénovation. Réponds de manière concise et pratique.

${contextInfo}
Question: ${message}

PRIX RÉALISTES 2024:
- Peinture: 15-25€/m²
- Carrelage: 40-80€/m²  
- Vidéoprojecteur: 300-800€ (pas 5500€!)
- Électricité: 80-150€/point
- Plomberie: 100-200€/point
- Menuiserie: 200-500€/m²

Réponse courte et pratique (max 2 phrases):`;

        const requestData = {
            model: "deepseek-chat",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 100,
            temperature: 0.3
        };

        const response = await axios.post(DEEPSEEK_API_URL, requestData, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 secondes
        });

        return response.data.choices[0].message.content.trim();

    } catch (error) {
        console.error('❌ Erreur chatbot:', error.message);
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            return 'L\'assistant prend du temps à répondre. Veuillez réessayer.';
        }
        return 'Désolé, je ne peux pas répondre pour le moment.';
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/analyze-images', upload.array('images', 5), async (req, res) => {
    console.log('📥 Requête analyse reçue');
    
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Aucune image fournie' });
        }

        console.log('📸 Images reçues:', req.files.length);
        
        const description = req.body.description || '';
        const userProfile = req.body.userProfile ? JSON.parse(req.body.userProfile) : {};
        
        console.log('👤 Profil utilisateur:', userProfile);
        
        // Analyser avec DeepSeek Chat
        const analysis = await analyzeImagesWithAI(req.files, description, userProfile);
        
        const result = {
            images: req.files.map(file => ({
                filename: file.filename,
                originalname: file.originalname,
                path: `/uploads/${file.filename}`
            })),
            travaux: analysis
        };
        
        console.log('🎉 Analyse terminée avec succès');
        res.json(result);
        
    } catch (error) {
        console.error('❌ Erreur analyse:', error.message);
        res.status(500).json({ error: error.message });
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
    res.json({ message: 'API TotoTravo fonctionne!' });
});

// Gestion erreurs
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: 'Erreur upload fichier' });
    }
    
    console.error('❌ Erreur serveur:', error);
    res.status(500).json({ error: 'Erreur interne' });
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});

