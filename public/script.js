// Global variables
let selectedFiles = [];
let currentQuestion = 1;
const totalQuestions = 5;
let userProfile = {};
let currentAnalysis = null;

// Messages de chargement réalistes
const loadingMessages = [
    "🔍 Analyse des images en cours...",
    "📐 Identification des pièces et mesures...",
    "🏗️ Évaluation de l'état des matériaux...",
    "💰 Recherche des prix actuels du marché...",
    "⚡ Calcul des coûts de main d'œuvre...",
    "📋 Élaboration du planning de travaux...",
    "🎯 Adaptation selon votre profil...",
    "📊 Finalisation de l'estimation..."
];

let currentLoadingMessage = 0;
let loadingInterval;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeQuestionnaire();
    initializeChatbot();
    initializeTabs();
});

function initializeEventListeners() {
    // File upload
    const dragDropZone = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (dragDropZone) {
        dragDropZone.addEventListener('click', () => fileInput?.click());
        dragDropZone.addEventListener('dragover', handleDragOver);
        dragDropZone.addEventListener('drop', handleDrop);
        dragDropZone.addEventListener('dragleave', handleDragLeave);
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Analysis
    const analyzeBtn = document.getElementById('analyzeBtn');
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeImages);
    }
    
    if (newAnalysisBtn) {
        newAnalysisBtn.addEventListener('click', startNewAnalysis);
    }
    
    // Questionnaire
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const finishBtn = document.getElementById('finishBtn');
    
    if (prevBtn) prevBtn.addEventListener('click', previousQuestion);
    if (nextBtn) nextBtn.addEventListener('click', nextQuestion);
    if (finishBtn) finishBtn.addEventListener('click', finishQuestionnaire);
    
    // Chatbot
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotClose = document.getElementById('chatbotClose');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatInput = document.getElementById('chatInput');
    
    if (chatbotToggle) chatbotToggle.addEventListener('click', toggleChatbot);
    if (chatbotClose) chatbotClose.addEventListener('click', closeChatbot);
    if (sendChatBtn) sendChatBtn.addEventListener('click', sendChatMessage);
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }
    
    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Radio button changes
    document.addEventListener('change', function(e) {
        if (e.target.type === 'radio') {
            updateQuestionnaireUI();
        }
    });
}

// Questionnaire functions
function initializeQuestionnaire() {
    const questionnaireSection = document.getElementById('questionnaireSection');
    if (!questionnaireSection) {
        console.error('Section questionnaire non trouvée');
        return;
    }
    
    // S'assurer que la section questionnaire est visible
    questionnaireSection.style.display = 'block';
    
    // Add progress indicator
    const questionnaire = questionnaireSection.querySelector('.questionnaire');
    if (questionnaire) {
        const progressHtml = `
            <div class="questionnaire-progress">
                <div class="progress-dots">
                    ${Array.from({length: totalQuestions}, (_, i) => 
                        `<div class="progress-dot ${i === 0 ? 'active' : ''}" data-question="${i + 1}"></div>`
                    ).join('')}
                </div>
            </div>
        `;
        questionnaire.insertAdjacentHTML('afterbegin', progressHtml);
    }
    
    // Initialiser l'interface
    currentQuestion = 1;
    updateQuestionnaireUI();
    
    console.log('Questionnaire initialisé');
}

function updateQuestionnaireUI() {
    // Show/hide questions
    for (let i = 1; i <= totalQuestions; i++) {
        const question = document.getElementById(`q${i}`);
        if (question) {
            question.style.display = i === currentQuestion ? 'block' : 'none';
        }
    }
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const finishBtn = document.getElementById('finishBtn');
    
    // S'assurer que les boutons sont visibles
    if (prevBtn) {
        prevBtn.style.display = currentQuestion > 1 ? 'inline-flex' : 'none';
        prevBtn.style.visibility = currentQuestion > 1 ? 'visible' : 'hidden';
    }
    
    if (nextBtn) {
        nextBtn.style.display = currentQuestion < totalQuestions ? 'inline-flex' : 'none';
        nextBtn.style.visibility = currentQuestion < totalQuestions ? 'visible' : 'hidden';
    }
    
    if (finishBtn) {
        finishBtn.style.display = currentQuestion === totalQuestions ? 'inline-flex' : 'none';
        finishBtn.style.visibility = currentQuestion === totalQuestions ? 'visible' : 'hidden';
    }
    
    // Update progress dots
    document.querySelectorAll('.progress-dot').forEach((dot, index) => {
        dot.classList.remove('active', 'completed');
        if (index + 1 === currentQuestion) {
            dot.classList.add('active');
        } else if (index + 1 < currentQuestion) {
            dot.classList.add('completed');
        }
    });
    
    // Check if current question is answered
    const currentQuestionElement = document.getElementById(`q${currentQuestion}`);
    if (currentQuestionElement) {
        const selectedOption = currentQuestionElement.querySelector('input:checked');
        if (nextBtn) nextBtn.disabled = !selectedOption;
        if (currentQuestion === totalQuestions && finishBtn) {
            finishBtn.disabled = !selectedOption;
        }
    }
    
    console.log('Question actuelle:', currentQuestion);
    console.log('Boutons - Précédent:', prevBtn?.style.display, 'Suivant:', nextBtn?.style.display, 'Terminer:', finishBtn?.style.display);
}

function previousQuestion() {
    if (currentQuestion > 1) {
        currentQuestion--;
        updateQuestionnaireUI();
    }
}

function nextQuestion() {
    if (currentQuestion < totalQuestions) {
        currentQuestion++;
        updateQuestionnaireUI();
    }
}

function finishQuestionnaire() {
    // Collect all answers
    userProfile = {
        niveau_bricolage: document.querySelector('input[name="niveau_bricolage"]:checked')?.value,
        budget: document.querySelector('input[name="budget"]:checked')?.value,
        delai: document.querySelector('input[name="delai"]:checked')?.value,
        implication: document.querySelector('input[name="implication"]:checked')?.value,
        type_projet: document.querySelector('input[name="type_projet"]:checked')?.value
    };
    
    // Hide questionnaire and show upload area
    const questionnaireSection = document.getElementById('questionnaireSection');
    const uploadSection = document.getElementById('uploadSection');
    const uploadArea = document.getElementById('uploadArea');
    
    if (questionnaireSection) questionnaireSection.style.display = 'none';
    if (uploadSection) uploadSection.classList.add('active');
    if (uploadArea) uploadArea.style.display = 'block';
    
    console.log('Profil utilisateur:', userProfile);
}

// File upload functions
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    handleFiles(files);
}

function handleFiles(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        showError('Veuillez sélectionner des images valides.');
        return;
    }
    
    if (selectedFiles.length + imageFiles.length > 5) {
        showError('Maximum 5 images autorisées.');
        return;
    }
    
    selectedFiles = [...selectedFiles, ...imageFiles];
    updateImagePreview();
    updateAnalyzeButton();
}

function updateImagePreview() {
    const imagePreview = document.getElementById('imagePreview');
    if (!imagePreview) return;
    
    imagePreview.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.createElement('div');
            preview.className = 'image-preview-item';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button class="remove-image" onclick="removeImage(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            imagePreview.appendChild(preview);
        };
        reader.readAsDataURL(file);
    });
}

function removeImage(index) {
    selectedFiles.splice(index, 1);
    updateImagePreview();
    updateAnalyzeButton();
}

function updateAnalyzeButton() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.disabled = selectedFiles.length === 0;
    }
}

// Analysis functions
async function analyzeImages() {
    if (selectedFiles.length === 0) {
        showError('Veuillez sélectionner au moins une image');
        return;
    }

    const description = document.getElementById('description')?.value || '';
    
    // Afficher la section de chargement
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    
    if (loadingSection) loadingSection.style.display = 'block';
    if (resultsSection) resultsSection.style.display = 'none';
    
    // Démarrer l'animation de chargement avec étapes détaillées
    startDetailedLoadingAnimation();

    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('images', file);
    });
    formData.append('description', description);
    formData.append('userProfile', JSON.stringify(userProfile));

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 360000); // 6 minutes

        const response = await fetch('/api/analyze-images', {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Arrêter l'animation de chargement
        stopLoadingAnimation();
        
        // Masquer la section de chargement
        if (loadingSection) loadingSection.style.display = 'none';
        
        // Afficher les résultats
        displayResults(result);
        if (resultsSection) resultsSection.style.display = 'block';

    } catch (error) {
        stopLoadingAnimation();
        if (loadingSection) loadingSection.style.display = 'none';
        
        if (error.name === 'AbortError') {
            showError('L\'analyse prend plus de temps que prévu. Veuillez réessayer avec moins d\'images.');
        } else {
            showError(`Erreur lors de l'analyse: ${error.message}`);
        }
    }
}

function showError(message) {
    stopLoadingAnimation();
    
    // Afficher l'erreur de manière plus élégante
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Erreur</h3>
            <p>${message}</p>
            <button onclick="this.parentElement.parentElement.remove()">Fermer</button>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Supprimer automatiquement après 10 secondes
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 10000);
}

function startNewAnalysis() {
    selectedFiles = [];
    currentAnalysis = null;
    userProfile = {};
    currentQuestion = 1;
    
    // Reset questionnaire
    document.querySelectorAll('input[type="radio"]').forEach(input => {
        input.checked = false;
    });
    
    // Reset forms
    const description = document.getElementById('description');
    const imagePreview = document.getElementById('imagePreview');
    
    if (description) description.value = '';
    if (imagePreview) imagePreview.innerHTML = '';
    
    // Show questionnaire again
    const questionnaireSection = document.getElementById('questionnaireSection');
    const uploadSection = document.getElementById('uploadSection');
    const uploadArea = document.getElementById('uploadArea');
    const resultsSection = document.getElementById('resultsSection');
    
    if (questionnaireSection) questionnaireSection.style.display = 'block';
    if (uploadSection) uploadSection.classList.remove('active');
    if (uploadArea) uploadArea.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'none';
    
    updateQuestionnaireUI();
    updateAnalyzeButton();
}

// Results display functions
function displayResults(result) {
    console.log('Résultat reçu:', result);
    
    // Vérifier si on a une analyse directe ou dans result.analysis
    const analysis = result.analysis || result;
    
    if (!analysis || (!analysis.pieces && !analysis.travaux)) {
        showError('Format de réponse invalide - Aucune analyse trouvée');
        console.error('Format invalide:', result);
        return;
    }
    
    currentAnalysis = result;
    
    // Adapter selon le format reçu
    const pieces = analysis.pieces || analysis.travaux?.pieces || [];
    const analyseGlobale = analysis.analyse_globale || analysis.travaux?.analyse_globale || {};
    
    // Mettre à jour les statistiques globales
    updateGlobalStats(analyseGlobale);
    
    displayPieces(pieces);
    displayTravauxArtisan(analyseGlobale);
    displayTravauxBricolage(analyseGlobale);
    displayPlanning(analyseGlobale);
}

function updateGlobalStats(analyseGlobale) {
    // Mettre à jour le coût total
    const totalCostElement = document.getElementById('totalCost');
    if (totalCostElement && analyseGlobale.cout_total) {
        totalCostElement.textContent = `${analyseGlobale.cout_total}€`;
    }
    
    // Mettre à jour la durée totale
    const totalDurationElement = document.getElementById('totalDuration');
    if (totalDurationElement && analyseGlobale.duree_totale) {
        totalDurationElement.textContent = analyseGlobale.duree_totale;
    }
    
    // Mettre à jour le niveau de difficulté
    const difficultyElement = document.getElementById('difficultyLevel');
    if (difficultyElement && analyseGlobale.niveau_difficulte) {
        difficultyElement.textContent = `${analyseGlobale.niveau_difficulte}%`;
    }
    
    // Mettre à jour les coûts détaillés
    const materialsCostElement = document.getElementById('materialsCost');
    if (materialsCostElement && analyseGlobale.cout_materiaux_total) {
        materialsCostElement.textContent = `${analyseGlobale.cout_materiaux_total}€`;
    }
    
    const laborCostElement = document.getElementById('laborCost');
    if (laborCostElement && analyseGlobale.cout_main_oeuvre_total) {
        laborCostElement.textContent = `${analyseGlobale.cout_main_oeuvre_total}€`;
    }
    
    const furnitureCostElement = document.getElementById('furnitureCost');
    if (furnitureCostElement && analyseGlobale.cout_meubles_total) {
        furnitureCostElement.textContent = `${analyseGlobale.cout_meubles_total}€`;
    }
    
    // Mettre à jour le score global
    const scoreElement = document.getElementById('globalScore');
    if (scoreElement && analyseGlobale.score_global) {
        scoreElement.textContent = analyseGlobale.score_global;
        scoreElement.className = `score-badge ${analyseGlobale.score_global}`;
    }
}

function displayPieces(pieces) {
    const tab = document.getElementById('piecesTab');
    if (!tab) return;
    
    if (pieces.length === 0) {
        tab.innerHTML = '<p class="no-data">Aucune pièce analysée</p>';
        return;
    }
    
    tab.innerHTML = pieces.map(piece => `
        <div class="piece-card">
            <div class="piece-header">
                <h3><i class="fas fa-home"></i> ${piece.nom}</h3>
                <span class="priority-badge ${piece.priorite_globale || 'moyenne'}">${piece.priorite_globale || 'moyenne'}</span>
            </div>
            
            <!-- Métrage et dimensions -->
            <div class="piece-metrics">
                <h4><i class="fas fa-ruler-combined"></i> Métrage :</h4>
                <p><strong>Surface :</strong> ${piece.surface_estimee || 'Non estimée'}</p>
                <p><strong>Dimensions :</strong> ${piece.dimensions || 'Non spécifiées'}</p>
            </div>
            
            <!-- Éléments identifiés -->
            ${piece.elements_identifies ? `
            <div class="piece-elements">
                <h4><i class="fas fa-list"></i> Éléments identifiés :</h4>
                ${piece.elements_identifies.map(element => `
                    <div class="element-item">
                        <span class="element-type">${element.type}</span>
                        <span class="element-state ${element.etat}">${element.etat}</span>
                        <p>${element.description}</p>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            <div class="piece-state">
                <h4>État actuel :</h4>
                <p>${piece.etat}</p>
            </div>
            
            <div class="piece-works">
                <h4>Travaux nécessaires :</h4>
                ${piece.travaux ? piece.travaux.map(travail => `
                    <div class="work-item">
                        <div class="work-header">
                            <h5>${travail.nom}</h5>
                            <span class="work-type ${travail.type_execution}">${travail.type_execution}</span>
                        </div>
                        <p class="work-description">${travail.description}</p>
                        
                        <!-- Surface ou quantité -->
                        ${travail.surface_ou_quantite ? `
                        <div class="work-surface">
                            <strong>Surface/Quantité :</strong> ${travail.surface_ou_quantite}
                        </div>
                        ` : ''}
                        
                        <!-- Matériaux nécessaires -->
                        ${travail.materiaux_necessaires ? `
                        <div class="work-materials">
                            <h6><i class="fas fa-tools"></i> Matériaux nécessaires :</h6>
                            ${travail.materiaux_necessaires.map(materiau => `
                                <div class="material-item">
                                    <div class="material-info">
                                        <strong>${materiau.nom}</strong> - ${materiau.marque}
                                        <span class="material-quantity">${materiau.quantite}</span>
                                    </div>
                                    <div class="material-price">
                                        <span class="price-unit">${materiau.prix_unitaire}€/unité</span>
                                        <span class="price-total">${materiau.prix_total}€</span>
                                    </div>
                                    <div class="material-store">
                                        <i class="fas fa-shopping-cart"></i> ${materiau.magasin}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        ` : ''}
                        
                        <div class="work-details">
                            <div class="work-cost">
                                <span class="label">Coût matériaux :</span>
                                <span class="value">${travail.cout_materiaux || 0}€</span>
                            </div>
                            <div class="work-cost">
                                <span class="label">Main d'œuvre :</span>
                                <span class="value">${travail.cout_main_oeuvre || 0}€</span>
                            </div>
                            <div class="work-cost total">
                                <span class="label">Coût total :</span>
                                <span class="value">${travail.cout_total}€</span>
                            </div>
                            <div class="work-duration">
                                <span class="label">Durée :</span>
                                <span class="value">${travail.duree_estimee}</span>
                            </div>
                            <div class="work-priority">
                                <span class="label">Priorité :</span>
                                <span class="value ${travail.priorite}">${travail.priorite}</span>
                            </div>
                        </div>
                        
                        <!-- Produits recommandés -->
                        ${travail.produits_recommandes ? `
                        <div class="work-products">
                            <h6><i class="fas fa-star"></i> Produits recommandés :</h6>
                            <div class="products-list">
                                ${travail.produits_recommandes.map(produit => `
                                    <span class="product-tag">${produit}</span>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="work-advice">
                            <strong>Conseils :</strong> ${travail.conseils}
                        </div>
                    </div>
                `).join('') : '<p>Aucun travail spécifique identifié</p>'}
            </div>
            
            <!-- Meubles et équipements -->
            ${piece.meubles_equipements ? `
            <div class="piece-furniture">
                <h4><i class="fas fa-couch"></i> Meubles et équipements :</h4>
                ${piece.meubles_equipements.map(meuble => `
                    <div class="furniture-item">
                        <div class="furniture-header">
                            <h5>${meuble.nom}</h5>
                            <span class="furniture-type">${meuble.type}</span>
                        </div>
                        <div class="furniture-details">
                            <p><strong>Dimensions :</strong> ${meuble.dimensions}</p>
                            <p><strong>Prix estimé :</strong> ${meuble.prix_estime}€</p>
                            <div class="furniture-brands">
                                <strong>Marques recommandées :</strong>
                                ${meuble.marques_recommandees.map(marque => `
                                    <span class="brand-tag">${marque}</span>
                                `).join('')}
                            </div>
                            <p class="furniture-advice"><strong>Conseils d'achat :</strong> ${meuble.conseils_achat}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : ''}
            
            <div class="piece-total">
                <div class="total-breakdown">
                    <div class="total-item">
                        <span class="label">Matériaux :</span>
                        <span class="value">${piece.cout_materiaux_piece || 0}€</span>
                    </div>
                    <div class="total-item">
                        <span class="label">Main d'œuvre :</span>
                        <span class="value">${piece.cout_main_oeuvre_piece || 0}€</span>
                    </div>
                    <div class="total-item total">
                        <span class="label">Total pièce :</span>
                        <span class="value">${piece.cout_total_piece}€</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function displayTravauxArtisan(analyseGlobale) {
    const tab = document.getElementById('artisanTab');
    if (!tab) return;
    
    const travauxArtisan = analyseGlobale.travaux_artisan || [];
    
    if (travauxArtisan.length === 0) {
        tab.innerHTML = '<p class="no-data">Aucun travail nécessitant un artisan identifié</p>';
        return;
    }
    
    tab.innerHTML = `
        <div class="artisan-summary">
            <h3><i class="fas fa-hard-hat"></i> Travaux nécessitant un artisan</h3>
            <p>Ces travaux nécessitent l'intervention d'un professionnel qualifié.</p>
        </div>
        ${travauxArtisan.map(travail => `
            <div class="work-item">
                <div class="work-header">
                    <h5>${travail.nom}</h5>
                    <span class="work-type artisan">Artisan</span>
                </div>
                <p class="work-description">${travail.description}</p>
                <div class="work-details">
                    <div class="work-cost">
                        <span class="label">Coût :</span>
                        <span class="value">${travail.cout}€</span>
                    </div>
                    <div class="work-duration">
                        <span class="label">Durée :</span>
                        <span class="value">${travail.duree}</span>
                    </div>
                </div>
                <div class="work-advice">
                    <strong>Pourquoi un artisan :</strong> ${travail.raison_artisan}
                </div>
            </div>
        `).join('')}
    `;
}

function displayTravauxBricolage(analyseGlobale) {
    const tab = document.getElementById('bricolageTab');
    if (!tab) return;
    
    const travauxBricolage = analyseGlobale.travaux_bricolage || [];
    
    if (travauxBricolage.length === 0) {
        tab.innerHTML = '<p class="no-data">Aucun travail en bricolage identifié</p>';
        return;
    }
    
    tab.innerHTML = `
        <div class="bricolage-summary">
            <h3><i class="fas fa-tools"></i> Travaux en bricolage</h3>
            <p>Ces travaux peuvent être réalisés par vos soins.</p>
        </div>
        ${travauxBricolage.map(travail => `
            <div class="work-item">
                <div class="work-header">
                    <h5>${travail.nom}</h5>
                    <span class="work-type bricolage">Bricolage</span>
                </div>
                <p class="work-description">${travail.description}</p>
                <div class="work-details">
                    <div class="work-cost">
                        <span class="label">Coût matériaux :</span>
                        <span class="value">${travail.cout_materiaux}€</span>
                    </div>
                    <div class="work-duration">
                        <span class="label">Durée :</span>
                        <span class="value">${travail.duree}</span>
                    </div>
                </div>
                <div class="work-advice">
                    <strong>Conseils bricolage :</strong> ${travail.conseils_bricolage}
                </div>
            </div>
        `).join('')}
    `;
}

function displayPlanning(analyseGlobale) {
    const tab = document.getElementById('planningTab');
    if (!tab) return;
    
    const planning = analyseGlobale.planning || {};
    
    tab.innerHTML = `
        <div class="planning-summary">
            <h3><i class="fas fa-calendar-alt"></i> Planning de travaux</h3>
            <p>Planning recommandé pour votre projet.</p>
        </div>
        <div class="planning-details">
            <div class="planning-phase">
                <h4>Phase 1 : Préparation (${planning.phase1_duree || '1-2 semaines'})</h4>
                <ul>
                    ${(planning.phase1_taches || ['Démolition', 'Préparation des supports']).map(tache => `<li>${tache}</li>`).join('')}
                </ul>
            </div>
            <div class="planning-phase">
                <h4>Phase 2 : Travaux principaux (${planning.phase2_duree || '2-4 semaines'})</h4>
                <ul>
                    ${(planning.phase2_taches || ['Installation', 'Rénovation']).map(tache => `<li>${tache}</li>`).join('')}
                </ul>
            </div>
            <div class="planning-phase">
                <h4>Phase 3 : Finitions (${planning.phase3_duree || '1 semaine'})</h4>
                <ul>
                    ${(planning.phase3_taches || ['Peinture', 'Installation des finitions']).map(tache => `<li>${tache}</li>`).join('')}
                </ul>
            </div>
        </div>
        <div class="planning-total">
            <strong>Durée totale estimée : ${planning.duree_totale || '4-7 semaines'}</strong>
        </div>
    `;
}

function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            switchTab(targetTab);
        });
    });
}

function switchTab(tabName) {
    // Remove active class from all tabs and panes
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    
    // Add active class to selected tab and pane
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedPane = document.getElementById(`${tabName}Tab`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedPane) selectedPane.classList.add('active');
}

// Chatbot functions
function initializeChatbot() {
    // Chatbot is already initialized in HTML
}

function toggleChatbot() {
    const chatbotPanel = document.getElementById('chatbotPanel');
    if (chatbotPanel) {
        chatbotPanel.classList.toggle('open');
    }
}

function closeChatbot() {
    const chatbotPanel = document.getElementById('chatbotPanel');
    if (chatbotPanel) {
        chatbotPanel.classList.remove('open');
    }
}

async function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput?.value.trim();
    if (!message) return;
    
    // Add user message
    addChatMessage('user', message);
    if (chatInput) chatInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                projectContext: currentAnalysis ? JSON.stringify(currentAnalysis) : ''
            })
        });
        
        if (!response.ok) {
            throw new Error('Erreur chatbot');
        }
        
        const data = await response.json();
        
        // Hide typing indicator and show response with typing effect
        hideTypingIndicator();
        addChatMessageWithTyping('bot', data.response);
        
    } catch (error) {
        console.error('Erreur chatbot:', error);
        hideTypingIndicator();
        addChatMessage('bot', 'Désolé, je ne peux pas répondre pour le moment.');
    }
}

function showTypingIndicator() {
    const chatbotMessages = document.getElementById('chatbotMessages');
    if (!chatbotMessages) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <i class="fas fa-robot"></i>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatbotMessages.appendChild(typingDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function addChatMessage(type, content) {
    const chatbotMessages = document.getElementById('chatbotMessages');
    if (!chatbotMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    if (type === 'bot') {
        messageDiv.innerHTML = `
            <i class="fas fa-robot"></i>
            <div class="message-content">${content}</div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
        `;
    }
    
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function addChatMessageWithTyping(type, content) {
    const chatbotMessages = document.getElementById('chatbotMessages');
    if (!chatbotMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    if (type === 'bot') {
        messageDiv.innerHTML = `
            <i class="fas fa-robot"></i>
            <div class="message-content">
                <span class="typing-text"></span>
                <span class="typing-cursor">|</span>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
        `;
    }
    
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    
    if (type === 'bot') {
        typeText(messageDiv.querySelector('.typing-text'), content);
    }
}

function typeText(element, text) {
    let index = 0;
    const cursor = element.nextElementSibling;
    
    function typeChar() {
        if (index < text.length) {
            element.textContent += text[index];
            index++;
            setTimeout(typeChar, 30); // Vitesse de frappe
        } else {
            // Animation terminée, masquer le curseur
            if (cursor) cursor.style.display = 'none';
        }
    }
    
    typeChar();
}

function startLoadingAnimation() {
    const loadingElement = document.getElementById('loadingMessage');
    if (!loadingElement) return;
    
    currentLoadingMessage = 0;
    
    // Afficher le premier message
    loadingElement.textContent = loadingMessages[0];
    
    // Changer de message toutes les 3 secondes
    loadingInterval = setInterval(() => {
        currentLoadingMessage = (currentLoadingMessage + 1) % loadingMessages.length;
        loadingElement.textContent = loadingMessages[currentLoadingMessage];
    }, 3000);
}

function startDetailedLoadingAnimation() {
    const loadingElement = document.getElementById('loadingMessage');
    if (!loadingElement) return;
    
    currentLoadingMessage = 0;
    
    // Messages de chargement détaillés et réalistes
    const detailedLoadingMessages = [
        "🔍 Analyse des images en cours...",
        "📏 Calcul du métrage et des dimensions...",
        "🏠 Identification des éléments (murs, sols, plafonds)...",
        "🌐 Recherche des prix réels sur internet...",
        "💰 Estimation des prix selon votre budget...",
        "🛠️ Analyse de la complexité des travaux...",
        "📋 Préparation du planning détaillé...",
        "🎯 Adaptation selon votre profil bricolage...",
        "📊 Finalisation de l'analyse ultra-détaillée..."
    ];
    
    // Afficher le premier message
    loadingElement.textContent = detailedLoadingMessages[0];
    
    // Changer de message toutes les 2.5 secondes
    loadingInterval = setInterval(() => {
        currentLoadingMessage = (currentLoadingMessage + 1) % detailedLoadingMessages.length;
        loadingElement.textContent = detailedLoadingMessages[currentLoadingMessage];
    }, 2500);
}

function stopLoadingAnimation() {
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
    }
}
