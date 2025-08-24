# 🚨 RÉCUPÉRATION RAPIDE - Clé API compromise

## ⚡ Actions immédiates (5 minutes)

### 1. Créer une nouvelle clé API
1. **Va sur :** [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. **Connecte-toi avec :** `ngess004@gmail.com`
3. **Clique :** "Create new secret key"
4. **Nom :** "TotoTravo Production"
5. **Copie la clé immédiatement**

### 2. Mettre à jour le fichier .env local
```bash
# Remplace le contenu de .env par :
PORT=5000
OPENAI_API_KEY=TA_NOUVELLE_CLE_ICI
NODE_ENV=production
```

### 3. Mettre à jour Render
1. **Dashboard Render** → **Ton service TotoTravo**
2. **Environment** → **OPENAI_API_KEY**
3. **Remplace par la nouvelle clé**
4. **Manual Deploy** → **Clear build cache & deploy**

## 🔒 Sécurité renforcée

### ✅ Modifications apportées
- ✅ **Logs sécurisés** : Plus d'exposition de la clé API
- ✅ **Gitignore vérifié** : `.env` est bien ignoré
- ✅ **Variables d'environnement** : Utilisation sécurisée

### 🛡️ Bonnes pratiques
- **Jamais** commiter la clé API
- **Toujours** utiliser des variables d'environnement
- **Ne jamais** partager la clé publiquement

## 🚀 Test après récupération

### Test local
```bash
npm start
curl http://localhost:5000/api/test
```

### Test production
```bash
curl https://tototravo.onrender.com/api/test
```

**Attendu :**
```json
{
  "message": "API TotoTravo fonctionne!",
  "openai_key_exists": true,
  "port": "10000"
}
```

## 📞 Si problème d'accès

Si tu ne peux pas accéder aux clés API :
- Contacte l'admin de ton organisation OpenAI
- Demande une nouvelle clé API
- Vérifie tes permissions

**Ton application sera opérationnelle en 5 minutes !** ⚡
