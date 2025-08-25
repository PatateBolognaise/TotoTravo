# 🔧 Diagnostic Problème API - Render

## 🚨 Erreur 500 sur `/api/analyze-images`

### **Problème identifié :**
L'erreur 500 est probablement liée à l'API OpenAI. Voici les causes possibles :

## 🔍 Diagnostic étape par étape

### 1. Vérifier les Logs Render
Dans le dashboard Render → Ton service → Logs, cherche :

**✅ Logs normaux :**
```
🚀 Démarrage serveur TotoTravo
PORT: 10000
NODE_ENV: production
OPENAI_API_KEY configurée: true
📥 Requête analyse reçue
📸 Images reçues: 1
🔑 Clé API utilisée: sk-proj-ANZ-IDimLrot...
📤 Envoi à OpenAI...
URL: https://api.openai.com/v1/chat/completions
Modèle: gpt-4o
```

**❌ Erreurs possibles :**
```
❌ Erreur API OpenAI: 401 Unauthorized
❌ Clé API OpenAI invalide ou expirée
❌ Erreur API OpenAI: 404 Not Found
❌ Modèle OpenAI non trouvé
❌ Erreur API OpenAI: 429 Too Many Requests
```

### 2. Vérifier les Variables d'Environnement Render

**Dashboard Render** → **Environment** → Vérifie :

```
OPENAI_API_KEY = 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
NODE_ENV = production
PORT = 10000
```

**⚠️ Important :**
- Pas d'espaces avant/après les valeurs
- Clé API exactement comme ci-dessus
- Pas de guillemets autour des valeurs

### 3. Test API Simple

Teste d'abord l'API de base :
```bash
curl https://tototravo.onrender.com/api/test
```

Doit retourner :
```json
{
  "message": "API TotoTravo fonctionne!",
  "openai_key_exists": true,
  "port": "10000"
}
```

### 4. Solutions selon l'erreur

#### **Erreur 401 (Unauthorized)**
- ✅ Vérifie que `OPENAI_API_KEY` est correcte dans Render
- ✅ Redémarre le service Render
- ✅ Vérifie que la clé n'est pas expirée

#### **Erreur 404 (Not Found)**
- ✅ Le modèle `gpt-4o` est correct
- ✅ Vérifie l'URL de l'API : `https://api.openai.com/v1/chat/completions`

#### **Erreur 429 (Too Many Requests)**
- ✅ Attends quelques minutes
- ✅ Vérifie les limites de ton compte OpenAI

#### **Erreur de timeout**
- ✅ Augmenté à 2 minutes (120000ms)
- ✅ Vérifie la taille des images (< 10MB)

## 🛠️ Actions Correctives

### 1. Redémarrage Render
- **Dashboard Render** → **Ton service** → **Manual Deploy** → **Clear build cache & deploy**

### 2. Vérification Variables
- **Dashboard Render** → **Environment** → Supprime et rajoute `OPENAI_API_KEY`

### 3. Test avec Image Simple
- Utilise une image < 1MB
- Format JPG ou PNG
- Teste avec une seule image

## 🎯 Modifications Apportées

✅ **Modèle corrigé :** `gpt-5o` → `gpt-4o`  
✅ **Logs détaillés :** URL, modèle, erreurs spécifiques  
✅ **Gestion d'erreur robuste :** Messages d'erreur clairs  
✅ **Timeout augmenté :** 2 minutes pour Render  

## 📞 Prochaines Étapes

1. **Redémarre le service Render**
2. **Vérifie les logs pour l'erreur exacte**
3. **Teste avec une image simple**
4. **Vérifie les variables d'environnement**

L'erreur 500 devrait maintenant être résolue avec des logs détaillés pour identifier le problème exact !

