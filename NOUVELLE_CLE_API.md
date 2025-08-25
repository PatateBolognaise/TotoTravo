# 🔑 NOUVELLE CLÉ API - Mise à jour Render

## ✅ Nouvelle clé API configurée localement

La nouvelle clé API a été mise à jour dans le fichier `.env` local.

## 🚀 Mise à jour sur Render

### **Étape 1 : Mise à jour des Variables d'Environnement**

Dans **Dashboard Render** → **Ton service TotoTravo** → **Environment**, remplace la variable `OPENAI_API_KEY` par :

```
OPENAI_API_KEY = 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
```

### **Étape 2 : Vérification Variables Complètes**

Assure-toi que toutes les variables sont configurées :

```
OPENAI_API_KEY = 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
NODE_ENV = production
PORT = 10000
```

### **Étape 3 : Redémarrage avec Cache Vidé**

1. **Dashboard Render** → **Ton service TotoTravo**
2. **Clique "Manual Deploy"**
3. **Sélectionne "Clear build cache & deploy"**
4. **Attends 3-4 minutes**

## 🔍 Vérification après mise à jour

### **Logs attendus :**
```
🚀 Démarrage serveur TotoTravo
PORT: 10000
NODE_ENV: production
OPENAI_API_KEY configurée: true
📥 Requête analyse reçue
🔑 Clé API utilisée: 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
📤 Envoi à OpenAI...
Modèle: gpt-4o
✅ Réponse OpenAI reçue
```

### **Test API :**
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

## 🎯 Résolution des Problèmes

### **Si erreur 401 (Unauthorized) :**
- ✅ Vérifie que la nouvelle clé API est bien copiée
- ✅ Pas d'espaces avant/après la clé
- ✅ Redémarre le service

### **Si erreur 404 (Model not found) :**
- ✅ Le modèle `gpt-4o` est correct
- ✅ Cache vidé lors du redémarrage

### **Si erreur 500 persistante :**
- ✅ Vérifie les logs Render pour l'erreur exacte
- ✅ Teste avec une image simple (< 1MB)

## 🚀 Actions prioritaires :

1. **Mets à jour OPENAI_API_KEY** dans Render
2. **Redémarre avec cache vidé**
3. **Vérifie les logs**
4. **Teste l'upload d'images**

**La nouvelle clé API devrait résoudre l'erreur 401 !** 🎉


