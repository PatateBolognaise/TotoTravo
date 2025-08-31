# 🔑 Guide des APIs pour TotoTravo

## 📋 APIs nécessaires

### 1. **ScrapingBee API** (Recommandé pour le scraping)

**Pourquoi ScrapingBee ?**
- ✅ Contourne DataDome et autres protections anti-bot
- ✅ Proxies premium français
- ✅ Rendu JavaScript
- ✅ 1000 requêtes gratuites par mois
- ✅ Fallback automatique vers Puppeteer

**Comment obtenir une clé :**

1. **Inscrivez-vous** sur [ScrapingBee.com](https://www.scrapingbee.com/)
2. **Créez un compte** gratuit
3. **Récupérez votre clé API** dans le dashboard
4. **Ajoutez la clé** dans votre fichier `.env` :
   ```
   SCRAPINGBEE_API_KEY=votre-cle-scrapingbee
   ```

**Prix :**
- **Gratuit** : 1000 requêtes/mois
- **Payant** : À partir de $29/mois pour 5000 requêtes

---

### 2. **Alternatives à ScrapingBee**

#### **A. Bright Data (anciennement Luminati)**
- **URL** : [brightdata.com](https://brightdata.com/)
- **Avantages** : Proxies résidentiels, très fiable
- **Prix** : À partir de $500/mois

#### **B. ScraperAPI**
- **URL** : [scraperapi.com](https://www.scraperapi.com/)
- **Avantages** : Simple d'utilisation, bon rapport qualité/prix
- **Prix** : À partir de $29/mois

#### **C. ZenRows**
- **URL** : [zenrows.com](https://www.zenrows.com/)
- **Avantages** : Spécialisé anti-bot, API simple
- **Prix** : À partir de $49/mois

#### **D. Apify**
- **URL** : [apify.com](https://apify.com/)
- **Avantages** : Scrapers pré-construits, très puissant
- **Prix** : À partir de $49/mois

---

### 3. **DeepSeek API** (Pour l'analyse IA)

**Déjà configuré** avec votre clé actuelle.

---

## 🚀 Configuration rapide

### Étape 1 : Obtenir ScrapingBee
1. Allez sur [ScrapingBee.com](https://www.scrapingbee.com/)
2. Créez un compte gratuit
3. Copiez votre clé API

### Étape 2 : Configurer l'application
1. **Créez/modifiez** le fichier `.env` :
   ```bash
   DEEPSEEK_API_KEY=sk-29fe954370e5428f8fa7e1cd81dc57d6
   SCRAPINGBEE_API_KEY=votre-cle-scrapingbee-ici
   PORT=3000
   ```

2. **Redémarrez** le serveur :
   ```bash
   npm start
   ```

### Étape 3 : Tester
1. Ouvrez `http://localhost:3000`
2. Collez une URL Leboncoin
3. Vérifiez les logs dans la console

---

## 🔧 Intégration d'autres APIs

Si vous voulez utiliser une autre API, modifiez `server.js` :

```javascript
// Exemple avec ScraperAPI
const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY;
const SCRAPERAPI_URL = 'http://api.scraperapi.com/';

async function scrapeWithScraperAPI(url) {
    const params = new URLSearchParams({
        'api_key': SCRAPERAPI_KEY,
        'url': url,
        'render': 'true',
        'country_code': 'fr'
    });
    
    const response = await axios.get(`${SCRAPERAPI_URL}?${params}`);
    return response.data;
}
```

---

## 💡 Conseils

### **Pour le développement :**
- Commencez avec ScrapingBee (gratuit)
- Testez avec des URLs Leboncoin réelles
- Surveillez les logs pour détecter les erreurs

### **Pour la production :**
- Utilisez un plan payant pour plus de requêtes
- Configurez des retry automatiques
- Surveillez les coûts d'API

### **En cas de blocage :**
- Changez de proxy
- Modifiez les User-Agents
- Ajoutez des délais entre les requêtes

---

## 🆘 Dépannage

### **Erreur "API key invalid"**
- Vérifiez que la clé est correcte
- Assurez-vous qu'elle est dans le fichier `.env`

### **Erreur "Quota exceeded"**
- Passez à un plan payant
- Ou utilisez le mode manuel en attendant

### **Aucune donnée extraite**
- Vérifiez les sélecteurs CSS
- Testez avec une URL différente
- Consultez les logs de debug

---

## 📞 Support

- **ScrapingBee** : [support@scrapingbee.com](mailto:support@scrapingbee.com)
- **DeepSeek** : [support@deepseek.com](mailto:support@deepseek.com)

---

*Ce guide sera mis à jour avec de nouvelles APIs et solutions.*






