// Données de démonstration pour tester l'interface
const demoData = {
    annonce: {
        titre: "Appartement T3 rénové - Centre-ville",
        prix: "285 000 €",
        surface: "65 m²",
        description: "Bel appartement T3 entièrement rénové, situé en centre-ville. Cuisine équipée, salle de bain moderne, deux chambres. Parquet ancien restauré, murs repeints. Idéal pour investissement ou résidence principale."
    },
    images: [
        {
            imageUrl: "https://via.placeholder.com/400x300/667eea/ffffff?text=Salon",
            caption: "Salon lumineux avec parquet ancien en bon état, murs blancs propres, fenêtres double vitrage. État général : bon."
        },
        {
            imageUrl: "https://via.placeholder.com/400x300/28a745/ffffff?text=Cuisine",
            caption: "Cuisine moderne équipée avec électroménagers récents, plan de travail en granit, meubles en bon état. État général : très bon."
        },
        {
            imageUrl: "https://via.placeholder.com/400x300/ffc107/ffffff?text=Salle+de+bain",
            caption: "Salle de bain avec carrelage moderne, douche à l'italienne, lavabo et WC en bon état. État général : bon."
        },
        {
            imageUrl: "https://via.placeholder.com/400x300/dc3545/ffffff?text=Chambre",
            caption: "Chambre principale avec parquet à restaurer, murs nécessitant une peinture, fenêtre à rénover. État général : moyen."
        }
    ],
    travaux: {
        travaux: [
            {
                type: "Peinture",
                observation: "Murs de la chambre principale nécessitent une nouvelle peinture",
                cout_min: 800,
                cout_max: 1200
            },
            {
                type: "Parquet",
                observation: "Parquet de la chambre principale à restaurer et vitrer",
                cout_min: 1500,
                cout_max: 2500
            },
            {
                type: "Fenêtres",
                observation: "Fenêtre de la chambre à remplacer par du double vitrage",
                cout_min: 800,
                cout_max: 1200
            },
            {
                type: "Électricité",
                observation: "Installation électrique en bon état, quelques prises à ajouter",
                cout_min: 300,
                cout_max: 600
            },
            {
                type: "Plomberie",
                observation: "Installation plomberie en bon état, pas de travaux nécessaires",
                cout_min: 0,
                cout_max: 0
            }
        ],
        score_global: "faible",
        cout_total_min: 3400,
        cout_total_max: 6100
    }
};

// Route de démonstration pour tester l'interface
function addDemoRoute(app) {
    app.get('/api/demo', (req, res) => {
        // Simuler un délai pour l'analyse
        setTimeout(() => {
            res.json(demoData);
        }, 2000);
    });
}

module.exports = { demoData, addDemoRoute };






