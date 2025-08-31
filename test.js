// Test simple pour vérifier les fonctionnalités de base
const axios = require('axios');

async function testAPI() {
    try {
        console.log('🧪 Test de l\'API TotoTravo...');
        
        // Test de la route de test
        const testResponse = await axios.get('http://localhost:3000/api/test');
        console.log('✅ Route de test:', testResponse.data.message);
        
        // Test de la page principale
        const homeResponse = await axios.get('http://localhost:3000/');
        console.log('✅ Page principale accessible:', homeResponse.status === 200);
        
        console.log('\n🎉 Tests réussis ! L\'application est prête à être utilisée.');
        console.log('📱 Ouvrez http://localhost:3000 dans votre navigateur');
        
    } catch (error) {
        console.error('❌ Erreur lors des tests:', error.message);
        console.log('💡 Assurez-vous que l\'application est démarrée avec "npm start"');
    }
}

// Test de la configuration DeepSeek
function testDeepSeekConfig() {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey || apiKey === 'your-deepseek-api-key') {
        console.log('⚠️  Attention: Clé API DeepSeek non configurée');
        console.log('📝 Ajoutez votre clé API dans le fichier .env');
        console.log('🔗 Obtenez votre clé sur https://platform.deepseek.com/');
    } else {
        console.log('✅ Clé API DeepSeek configurée');
    }
}

// Exécuter les tests
if (require.main === module) {
    testDeepSeekConfig();
    testAPI();
}

module.exports = { testAPI, testDeepSeekConfig };






