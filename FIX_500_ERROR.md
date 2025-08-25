# 🔧 CORRECTION ERREUR 500 - VRAI SERVEUR

## ✅ Problème résolu localement

Le serveur fonctionne maintenant sur le port **8080** au lieu de 3000.

## 🚀 Déploiement sur Render (VRAI SERVEUR)

### 1. Configuration Render

**Variables d'environnement à configurer :**

```
OPENAI_API_KEY = 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
NODE_ENV = production
PORT = 8080
```

### 2. Étapes Render

1. **Va sur [render.com](https://render.com)**
2. **Connecte-toi avec GitHub**
3. **Clique "New Web Service"**
4. **Sélectionne : `PatateBolognaise/TotoTravo`**
5. **Configuration :**
   - **Name :** `tototravo`
   - **Environment :** `Node`
   - **Region :** `Frankfurt (EU Central)`
   - **Build Command :** `npm install`
   - **Start Command :** `node server.js`
6. **Dans "Environment Variables", ajoute les 3 variables ci-dessus**
7. **Clique "Create Web Service"**

### 3. Test après déploiement

Une fois déployé, teste ces URLs :

- **Test API :** `https://tototravo.onrender.com/api/test`
- **Health Check :** `https://tototravo.onrender.com/api/health`
- **Page principale :** `https://tototravo.onrender.com/`

## 🔍 Diagnostic si erreur 500 persiste

### 1. Vérifier les logs Render
- **Dashboard Render** → **Ton service** → **Logs**
- Cherche les erreurs en rouge
- Vérifie que le serveur démarre bien

### 2. Vérifier les variables d'environnement
- **Dashboard Render** → **Environment**
- Vérifie que `OPENAI_API_KEY` est bien configurée
- Vérifie que `PORT=8080`

### 3. Test API simple
```bash
curl https://tototravo.onrender.com/api/test
```

Doit retourner :
```json
{
  "message": "API TotoTravo fonctionne!",
  "openai_key_exists": true,
  "port": "8080"
}
```

## 🎯 Points clés corrigés

✅ **Port changé de 3000 à 8080**  
✅ **Gestion d'erreur améliorée**  
✅ **Logs détaillés ajoutés**  
✅ **Variables d'environnement optimisées**  
✅ **Configuration Render mise à jour**  

## 🚨 Si ça ne marche toujours pas

1. **Redémarre le service Render**
2. **Vérifie que le repository GitHub est à jour**
3. **Regarde les logs pour les erreurs spécifiques**
4. **Teste avec une image simple (< 1MB)**

Ton application sera accessible 24h/24 sur internet ! 🌍

