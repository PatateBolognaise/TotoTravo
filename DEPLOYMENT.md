# 🚀 Guide de Déploiement - VRAI SERVEUR

## Option 1: Render (Recommandé - Gratuit)

### 1. Créer un compte Render
- Va sur [render.com](https://render.com)
- Connecte-toi avec ton compte GitHub
- Clique sur "New Web Service"

### 2. Connecter ton repository
- Sélectionne le repository: `PatateBolognaise/TotoTravo`
- Render détectera automatiquement que c'est un projet Node.js

### 3. Configuration du service
- **Name:** `tototravo`
- **Environment:** `Node`
- **Region:** `Frankfurt (EU Central)` (plus proche de la France)
- **Branch:** `main`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`

### 4. Variables d'environnement
Dans la section "Environment Variables", ajoute:

```
OPENAI_API_KEY = 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
NODE_ENV = production
PORT = 3000
```

### 5. Déployer
- Clique sur "Create Web Service"
- Attends 2-3 minutes pour le déploiement
- Ton site sera accessible sur: `https://tototravo.onrender.com`

## Option 2: Railway (Alternative - Gratuit)

### 1. Créer un compte Railway
- Va sur [railway.app](https://railway.app)
- Connecte-toi avec GitHub
- Clique sur "New Project"

### 2. Déployer depuis GitHub
- Sélectionne "Deploy from GitHub repo"
- Choisis `PatateBolognaise/TotoTravo`
- Railway détectera automatiquement le projet Node.js

### 3. Variables d'environnement
Dans "Variables", ajoute:
```
OPENAI_API_KEY=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
NODE_ENV=production
```

## Option 3: Vercel (Alternative - Gratuit)

### 1. Créer un compte Vercel
- Va sur [vercel.com](https://vercel.com)
- Connecte-toi avec GitHub
- Clique sur "New Project"

### 2. Importer le projet
- Sélectionne `PatateBolognaise/TotoTravo`
- Vercel détectera automatiquement la configuration

### 3. Variables d'environnement
Dans "Environment Variables", ajoute:
```
OPENAI_API_KEY = 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
```

## ✅ Test après déploiement

Une fois déployé, teste ces URLs:

1. **Test API:** `https://ton-app.onrender.com/api/test`
   - Doit retourner: `{"openai_key_exists":true}`

2. **Health Check:** `https://ton-app.onrender.com/api/health`
   - Doit retourner: `{"status":"OK"}`

3. **Page principale:** `https://ton-app.onrender.com/`
   - Doit afficher l'interface utilisateur

## 🔧 Troubleshooting

### Erreur 502/500
- Vérifie que `OPENAI_API_KEY` est bien configurée
- Regarde les logs dans le dashboard
- Redémarre le service

### Images qui ne s'uploadent pas
- Vérifie que Multer est configuré pour la mémoire
- Teste avec des images < 10MB

### IA qui ne répond pas
- Vérifie la clé API OpenAI
- Regarde les logs pour les erreurs d'API

## 📊 Monitoring

- **Render:** Dashboard avec logs en temps réel
- **Railway:** Métriques et logs dans l'interface
- **Vercel:** Analytics et logs dans le dashboard

## 🎯 Avantages de chaque plateforme

### Render
✅ Gratuit à vie  
✅ Déploiement automatique  
✅ Logs détaillés  
✅ HTTPS automatique  

### Railway
✅ Très simple  
✅ Déploiement rapide  
✅ Interface moderne  

### Vercel
✅ Performance optimale  
✅ CDN global  
✅ Analytics intégrés


