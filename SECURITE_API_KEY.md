# 🔒 SÉCURITÉ API KEY - Clé compromise

## 🚨 Problème identifié

La clé API OpenAI a été compromise et désactivée. Cela peut arriver si :
- La clé a été commitée sur GitHub
- La clé a été exposée dans des logs
- La clé a été partagée publiquement

## 🔧 Actions immédiates

### 1. Créer une nouvelle clé API
1. Va sur [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Connecte-toi avec ton compte `ngess004@gmail.com`
3. Clique sur **"Create new secret key"**
4. Donne un nom comme **"TotoTravo Production"**
5. **Copie la nouvelle clé immédiatement** (elle ne sera plus visible)

### 2. Mettre à jour le fichier .env local
Remplace la clé dans ton fichier `.env` :

```
PORT=5000
OPENAI_API_KEY=TA_NOUVELLE_CLE_API_ICI
NODE_ENV=production
```

### 3. Mettre à jour Render
Dans **Dashboard Render** → **Environment** :
- Remplace `OPENAI_API_KEY` par la nouvelle clé
- **Redémarre le service** avec cache vidé

## 🛡️ Sécurité pour éviter la compromission

### ✅ Bonnes pratiques
- ✅ **Jamais** commiter la clé API sur GitHub
- ✅ **Toujours** utiliser des variables d'environnement
- ✅ **Vérifier** que `.env` est dans `.gitignore`
- ✅ **Ne jamais** partager la clé publiquement

### ❌ À éviter
- ❌ Commiter la clé dans le code
- ❌ Partager la clé dans des messages
- ❌ Stocker la clé en dur dans le code
- ❌ Exposer la clé dans les logs

## 🔍 Vérification de sécurité

### 1. Vérifier .gitignore
Assure-toi que `.env` est dans `.gitignore` :

```
# Environment variables
.env
.env.local
.env.production
```

### 2. Vérifier l'historique Git
Si la clé a été commitée :
```bash
git log --all --full-history -- .env
```

### 3. Nettoyer l'historique si nécessaire
Si la clé est dans l'historique Git, il faut la nettoyer.

## 🚀 Après avoir créé la nouvelle clé

### 1. Test local
```bash
npm start
curl http://localhost:5000/api/test
```

### 2. Mise à jour Render
- **Dashboard Render** → **Environment**
- Remplace `OPENAI_API_KEY`
- **Manual Deploy** → **Clear build cache & deploy**

### 3. Test production
```bash
curl https://tototravo.onrender.com/api/test
```

## 📞 Support

Si tu ne peux pas accéder à la page des clés API :
- Contacte l'administrateur de ton organisation OpenAI
- Demande une nouvelle clé API
- Vérifie les permissions de ton compte

**La sécurité de la clé API est cruciale pour éviter les abus !** 🔒




