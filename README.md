# 🏠 TotoTravo - IA Rénovation Intelligente

Application web innovante qui utilise l'IA DeepSeek pour analyser vos photos de rénovation et fournir des estimations détaillées avec recommandations personnalisées.

## ✨ Fonctionnalités

- **📸 Analyse d'images** : Upload de photos pour analyse IA
- **🤖 IA DeepSeek** : Analyse intelligente des pièces et travaux
- **💰 Estimations détaillées** : Coûts matériaux + main d'œuvre
- **👷 Artisan vs Bricolage** : Recommandations adaptées à votre niveau
- **📋 Planning personnalisé** : Phases de travaux détaillées
- **💬 Chatbot IA** : Assistant pour vos questions
- **📱 Design responsive** : Interface moderne style startup

## 🚀 Déploiement Vercel

### Prérequis
- Compte GitHub
- Compte Vercel
- Clé API DeepSeek

### Étapes de déploiement

1. **Fork/Clone le repository**
   ```bash
   git clone https://github.com/votre-username/tototravo.git
   cd tototravo
   ```

2. **Configuration des variables d'environnement**
   - Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
   - Créez un nouveau projet
   - Dans les paramètres du projet, ajoutez la variable d'environnement :
     - `DEEPSEEK_API_KEY` = votre clé API DeepSeek

3. **Déploiement automatique**
   - Connectez votre repository GitHub à Vercel
   - Vercel détectera automatiquement la configuration
   - L'application sera déployée à chaque push

### Configuration manuelle

Si vous préférez déployer manuellement :

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Suivre les instructions pour configurer l'API key
```

## 🛠️ Développement local

```bash
# Installation
npm install

# Variables d'environnement
cp .env.example .env
# Ajoutez votre DEEPSEEK_API_KEY dans .env

# Démarrage
npm start

# L'application sera disponible sur http://localhost:3000
```

## 📁 Structure du projet

```
tototravo/
├── public/                 # Fichiers statiques
│   ├── index.html         # Interface utilisateur
│   ├── styles.css         # Styles CSS
│   └── script.js          # JavaScript frontend
├── server.js              # Serveur Express + API
├── package.json           # Dépendances
├── vercel.json           # Configuration Vercel
└── README.md             # Documentation
```

## 🔧 Technologies utilisées

- **Backend** : Node.js, Express.js
- **Frontend** : HTML5, CSS3, JavaScript vanilla
- **IA** : DeepSeek API
- **Upload** : Multer
- **Déploiement** : Vercel

## 📱 Fonctionnalités détaillées

### Questionnaire personnalisé
- Niveau de bricolage (débutant/expert)
- Budget (serré/confortable)
- Délai (urgent/flexible)
- Type de projet

### Analyse IA
- Identification des pièces
- Évaluation de l'état
- Travaux nécessaires
- Prix réalistes 2024

### Recommandations
- **Artisan** : Travaux complexes
- **Bricolage** : Travaux accessibles
- **Planning** : Phases détaillées

## 🔐 Sécurité

- Variables d'environnement pour les clés API
- Validation des uploads
- Gestion d'erreurs robuste

## 📈 Roadmap

- [ ] Export PDF des devis
- [ ] Comparaison de devis
- [ ] Géolocalisation des artisans
- [ ] Application mobile
- [ ] Intégration d'autres IA

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Soumettre des pull requests

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Contactez l'équipe de développement

---

**TotoTravo** - Transformez vos projets de rénovation avec l'IA ! 🏠✨

