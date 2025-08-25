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
    
    // ÉTAPE 1: Générer et afficher les questions hyper-pertinentes avec DeepSeek
    console.log('🔍 ÉTAPE 1: Génération des questions DeepSeek ultra-pertinentes...');
    console.log('👤 Profil utilisateur:', userProfile);
    console.log('📝 Description:', description);
    
    // Afficher le message de chargement DeepSeek
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    
    if (loadingSection) {
        loadingSection.style.display = 'block';
        // Mettre à jour le message pour DeepSeek
        const loadingText = loadingSection.querySelector('.loading-text');
        if (loadingText) {
            loadingText.innerHTML = `
                <h2>🤖 DeepSeek Génère vos Questions Ultra-Pertinentes</h2>
                <p>Analyse de votre profil et de votre projet en cours...</p>
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;
        }
    }
    if (resultsSection) resultsSection.style.display = 'none';
    
    const questions = await getDynamicQuestions(description);
    console.log('❓ Questions DeepSeek générées:', questions);
    
    if (questions && questions.length > 0) {
        console.log('✅ Affichage des questions DeepSeek ultra-pertinentes...');
        // Afficher les questions dans l'interface existante
        const answers = await showDynamicQuestionsInline(questions);
        console.log('📝 Réponses utilisateur:', answers);
        
        if (!answers) {
            console.log('❌ Utilisateur a annulé');
            return; // L'utilisateur a annulé
        }
        
        // Ajouter les réponses au profil utilisateur
        userProfile = { ...userProfile, ...answers };
        console.log('👤 Profil enrichi:', userProfile);
    } else {
        console.log('⚠️ Aucune question DeepSeek générée');
    }
    
    // Démarrer l'animation de chargement avec étapes détaillées pour l'analyse
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

        const response = await fetch('/api/analyze', {
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

// Results display functions - ULTRA-DÉTAILLÉE
function displayResults(result) {
    console.log('📊 Résultat ultra-détaillé reçu:', result);
    
    const resultsSection = document.getElementById('resultsSection');
    const loadingSection = document.getElementById('loadingSection');
    
    if (loadingSection) loadingSection.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'block';
    
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
    const planning = analysis.planning_detaille || analysis.travaux?.planning_detaille || {};
    const conseils = analysis.conseils_personnalises || analysis.travaux?.conseils_personnalises || {};
    
    // Afficher l'analyse ultra-détaillée
    displayUltraDetailedAnalysis(analyseGlobale, pieces, planning, conseils);
}

// Fonction d'affichage ultra-détaillée et magnifique
function displayUltraDetailedAnalysis(analyseGlobale, pieces, planning, conseils) {
    const resultsSection = document.getElementById('resultsSection');
    
    resultsSection.innerHTML = `
        <div class="container">
            <!-- Header Ultra-Détaillé -->
            <div class="results-header-ultra">
                <div class="header-content">
                    <h1>🏠 ANALYSE ULTRA-DÉTAILLÉE DE RÉNOVATION</h1>
                    <p>Étude complète et professionnelle de votre projet</p>
                    <div class="analysis-badges">
                        <span class="badge ultra">✨ Ultra-Complète</span>
                        <span class="badge ai">🤖 IA Avancée</span>
                        <span class="badge professional">👨‍🔧 Professionnel</span>
                    </div>
                </div>
            </div>
            
            <!-- Résumé Global Ultra-Détaillé -->
            <div class="global-summary-ultra">
                <h2>📊 RÉSUMÉ GLOBAL ULTRA-DÉTAILLÉ</h2>
                <div class="summary-grid-ultra">
                    <div class="summary-card-ultra">
                        <div class="card-icon">📏</div>
                        <div class="card-content">
                            <h3>Surface Totale</h3>
                            <span class="card-value">${analyseGlobale.surface_totale || analyseGlobale.totalSurface || 'Calcul en cours...'}</span>
                            <span class="card-detail">Surface calculée précisément</span>
                        </div>
                    </div>
                    <div class="summary-card-ultra">
                        <div class="card-icon">⏱️</div>
                        <div class="card-content">
                            <h3>Durée Estimée</h3>
                            <span class="card-value">${analyseGlobale.duree_estimee || analyseGlobale.estimatedDuration || 'Estimation en cours...'}</span>
                            <span class="card-detail">Planning optimisé</span>
                        </div>
                    </div>
                    <div class="summary-card-ultra">
                        <div class="card-icon">💰</div>
                        <div class="card-content">
                            <h3>Coût Total</h3>
                            <span class="card-value">${analyseGlobale.cout_total_estime || analyseGlobale.totalCost || 'Estimation en cours...'}</span>
                            <span class="card-detail">Prix réalistes inclus</span>
                        </div>
                    </div>
                    <div class="summary-card-ultra">
                        <div class="card-icon">🎯</div>
                        <div class="card-content">
                            <h3>Complexité</h3>
                            <span class="card-value">${analyseGlobale.complexite || analyseGlobale.complexity || 'Évaluation en cours...'}</span>
                            <span class="card-detail">Niveau de difficulté</span>
                        </div>
                    </div>
                    <div class="summary-card-ultra">
                        <div class="card-icon">📈</div>
                        <div class="card-content">
                            <h3>Valeur Ajoutée</h3>
                            <span class="card-value">${analyseGlobale.valeur_ajoutee || analyseGlobale.valueAdded || 'Calcul en cours...'}</span>
                            <span class="card-detail">Plus-value estimée</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Pièces Ultra-Détaillées -->
            <div class="rooms-ultra">
                <h2>🏠 ANALYSE ULTRA-DÉTAILLÉE PAR PIÈCE</h2>
                ${pieces.map((piece, index) => `
                    <div class="room-card-ultra">
                        <div class="room-header-ultra">
                            <h3>${piece.nom || piece.name || `Pièce ${index + 1}`}</h3>
                            <div class="room-status ${piece.etat_general || piece.generalCondition || 'unknown'}">
                                ${piece.etat_general || piece.generalCondition || 'Non évalué'}
                            </div>
                        </div>
                        
                        <div class="room-metrics-ultra">
                            <div class="metric-item">
                                <span class="metric-label">📏 Surface</span>
                                <span class="metric-value">${piece.surface || piece.area || 'Calcul en cours...'}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">📐 Dimensions</span>
                                <span class="metric-value">${piece.dimensions || piece.dimensions || 'Mesure en cours...'}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">🏗️ État</span>
                                <span class="metric-value">${piece.etat_general || piece.generalCondition || 'Évaluation en cours...'}</span>
                            </div>
                        </div>
                        
                        ${piece.elements_identifies && piece.elements_identifies.length > 0 ? `
                            <div class="elements-section-ultra">
                                <h4>🔍 ÉLÉMENTS IDENTIFIÉS ET ANALYSÉS</h4>
                                <div class="elements-grid-ultra">
                                    ${piece.elements_identifies.map(element => `
                                        <div class="element-card-ultra">
                                            <div class="element-header-ultra">
                                                <span class="element-icon">${getElementIcon(element.type)}</span>
                                                <span class="element-type">${element.type}</span>
                                                <span class="element-condition ${element.etat || element.condition}">${element.etat || element.condition}</span>
                                            </div>
                                            <div class="element-details-ultra">
                                                <p><strong>Matériau:</strong> ${element.materiau || element.material || 'Non identifié'}</p>
                                                <p><strong>Dimensions:</strong> ${element.dimensions || 'Non mesurées'}</p>
                                                <p><strong>Travaux nécessaires:</strong> ${element.travaux_necessaires || element.requiredWork || 'À évaluer'}</p>
                                                <div class="element-costs-ultra">
                                                    <span class="cost-item">Matériaux: ${element.cout_materiaux || element.materialCost || 'Non estimé'}</span>
                                                    <span class="cost-item">Main d'œuvre: ${element.cout_main_oeuvre || element.laborCost || 'Non estimé'}</span>
                                                    <span class="cost-item">Durée: ${element.duree || element.duration || 'Non estimée'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${piece.cout_total_piece ? `
                            <div class="room-costs-ultra">
                                <h4>💰 COÛTS DÉTAILLÉS DE LA PIÈCE</h4>
                                <div class="costs-breakdown-ultra">
                                    <div class="cost-category">
                                        <span class="cost-label">Matériaux</span>
                                        <span class="cost-value">${piece.cout_total_piece.materiaux || piece.cout_total_piece.materials || 'Non estimé'}</span>
                                    </div>
                                    <div class="cost-category">
                                        <span class="cost-label">Main d'œuvre</span>
                                        <span class="cost-value">${piece.cout_total_piece.main_oeuvre || piece.cout_total_piece.labor || 'Non estimé'}</span>
                                    </div>
                                    <div class="cost-category">
                                        <span class="cost-label">Meubles</span>
                                        <span class="cost-value">${piece.cout_total_piece.meubles || piece.cout_total_piece.furniture || 'Non estimé'}</span>
                                    </div>
                                    <div class="cost-category total">
                                        <span class="cost-label">TOTAL PIÈCE</span>
                                        <span class="cost-value">${piece.cout_total_piece.total || 'Non estimé'}</span>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            
            <!-- Planning Ultra-Détaillé -->
            ${planning.phases && planning.phases.length > 0 ? `
                <div class="planning-ultra">
                    <h2>📅 PLANNING ULTRA-DÉTAILLÉ</h2>
                    <div class="planning-overview-ultra">
                        <div class="planning-summary-ultra">
                            <span class="planning-duration">Durée totale: ${planning.duree_totale || planning.totalDuration || 'Non estimée'}</span>
                            <span class="planning-cost">Coût total: ${planning.cout_total || planning.totalCost || 'Non estimé'}</span>
                        </div>
                    </div>
                    <div class="phases-timeline-ultra">
                        ${planning.phases.map((phase, index) => `
                            <div class="phase-card-ultra">
                                <div class="phase-header-ultra">
                                    <div class="phase-number">${index + 1}</div>
                                    <div class="phase-info">
                                        <h3>${phase.nom || phase.name}</h3>
                                        <span class="phase-duration">${phase.duree || phase.duration}</span>
                                    </div>
                                    <div class="phase-cost">${phase.cout_estime || phase.estimatedCost || 'Non estimé'}</div>
                                </div>
                                ${phase.taches && phase.taches.length > 0 ? `
                                    <div class="tasks-ultra">
                                        <h4>📋 Tâches Détaillées</h4>
                                        ${phase.taches.map(task => `
                                            <div class="task-card-ultra">
                                                <div class="task-header-ultra">
                                                    <span class="task-name">${task.nom || task.name}</span>
                                                    <span class="task-duration">${task.duree || task.duration}</span>
                                                    <span class="task-difficulty ${task.difficulte || task.difficulty}">${task.difficulte || task.difficulty}</span>
                                                </div>
                                                <div class="task-description">${task.description || 'Description en cours...'}</div>
                                                ${task.dependances ? `<div class="task-dependencies">Dépendances: ${task.dependances}</div>` : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Conseils Ultra-Personnalisés -->
            ${Object.keys(conseils).length > 0 ? `
                <div class="advice-ultra">
                    <h2>💡 CONSEILS ULTRA-PERSONNALISÉS</h2>
                    <div class="advice-grid-ultra">
                        ${conseils.optimisations_budget ? `
                            <div class="advice-card-ultra">
                                <div class="advice-icon">💰</div>
                                <div class="advice-content">
                                    <h3>Optimisations Budget</h3>
                                    <p>${conseils.optimisations_budget}</p>
                                </div>
                            </div>
                        ` : ''}
                        ${conseils.risques ? `
                            <div class="advice-card-ultra">
                                <div class="advice-icon">⚠️</div>
                                <div class="advice-content">
                                    <h3>Risques Identifiés</h3>
                                    <p>${conseils.risques}</p>
                                </div>
                            </div>
                        ` : ''}
                        ${conseils.precautions ? `
                            <div class="advice-card-ultra">
                                <div class="advice-icon">🛡️</div>
                                <div class="advice-content">
                                    <h3>Précautions</h3>
                                    <p>${conseils.precautions}</p>
                                </div>
                            </div>
                        ` : ''}
                        ${conseils.valeur_ajoutée ? `
                            <div class="advice-card-ultra">
                                <div class="advice-icon">📈</div>
                                <div class="advice-content">
                                    <h3>Valeur Ajoutée</h3>
                                    <p>${conseils.valeur_ajoutée}</p>
                                </div>
                            </div>
                        ` : ''}
                        ${conseils.recommandations ? `
                            <div class="advice-card-ultra">
                                <div class="advice-icon">🎯</div>
                                <div class="advice-content">
                                    <h3>Recommandations Finales</h3>
                                    <p>${conseils.recommandations}</p>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            
            <!-- Bouton Nouvelle Analyse -->
            <div class="new-analysis-ultra">
                <button onclick="resetAnalysis()" class="btn-ultra">
                    <span class="btn-icon">🔄</span>
                    <span class="btn-text">Nouvelle Analyse Ultra-Détaillée</span>
                </button>
            </div>
        </div>
    `;
}

// Fonction helper pour les icônes d'éléments
function getElementIcon(type) {
    const icons = {
        'mur': '🧱',
        'sol': '🏠',
        'plafond': '⬆️',
        'fenetre': '🪟',
        'porte': '🚪',
        'electricite': '⚡',
        'plomberie': '🚿',
        'chauffage': '🔥'
    };
    return icons[type] || '🔍';
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
        "🔍 ÉTAPE 2 : Analyse ultra-détaillée en cours...",
        "📏 Calcul précis du métrage et dimensions...",
        "🏠 Identification complète des éléments...",
        "🌐 Recherche des prix réels sur internet...",
        "💰 Estimation détaillée des coûts...",
        "🛠️ Analyse de la complexité des travaux...",
        "📋 Création du planning détaillé...",
        "🎯 Personnalisation selon vos réponses...",
        "📊 Génération de l'analyse ultra-complète...",
        "✨ Finalisation de l'étude complète..."
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

// Fonction pour récupérer les questions dynamiques
async function getDynamicQuestions(description) {
    try {
        console.log('🌐 Envoi requête questions dynamiques...');
        console.log('📤 Données envoyées:', {
            userProfile: userProfile,
            description: description
        });
        
        const response = await fetch('/api/get-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userProfile: userProfile,
                description: description
            })
        });

        console.log('📥 Réponse reçue, status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Données reçues:', data);
        
        const questions = data.questions || [];
        console.log('❓ Questions extraites:', questions);
        
        return questions;
    } catch (error) {
        console.error('❌ Erreur récupération questions:', error);
        return [];
    }
}

// Fonction pour afficher les questions dynamiques intégrées dans l'interface
async function showDynamicQuestionsInline(questions) {
    return new Promise((resolve) => {
        // Masquer la section de chargement et résultats
        const loadingSection = document.getElementById('loadingSection');
        const resultsSection = document.getElementById('resultsSection');
        if (loadingSection) loadingSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'none';
        
        // Créer la section des questions dynamiques
        const questionsSection = document.createElement('div');
        questionsSection.id = 'dynamicQuestionsSection';
        questionsSection.className = 'questions-section';
        questionsSection.innerHTML = `
            <div class="container">
                <div class="questions-header">
                    <h2>🎯 Questions Hyper-Pertinentes</h2>
                    <p>Étape 1/2 : Répondez à ces questions générées par IA pour une analyse ultra-précise</p>
                </div>
                <form id="dynamicQuestionsForm" class="questions-form">
                    ${questions.map((q, index) => `
                        <div class="question-item">
                            <h3>${index + 1}. ${q.question}</h3>
                            <div class="options-container">
                                ${q.type === 'radio' ? 
                                    q.options.map(option => `
                                        <label class="radio-option">
                                            <input type="radio" name="${q.id}" value="${option.value}" ${q.required ? 'required' : ''}>
                                            <span class="radio-custom"></span>
                                            <span class="option-label">${option.label}</span>
                                        </label>
                                    `).join('') :
                                    q.options.map(option => `
                                        <label class="checkbox-option">
                                            <input type="checkbox" name="${q.id}" value="${option.value}" ${q.required ? 'required' : ''}>
                                            <span class="checkbox-custom"></span>
                                            <span class="option-label">${option.label}</span>
                                        </label>
                                    `).join('')
                                }
                            </div>
                        </div>
                    `).join('')}
                    <div class="questions-actions">
                        <button type="button" class="btn-secondary" onclick="cancelQuestions()">Retour</button>
                        <button type="submit" class="btn-primary">Étape 2 : Analyse Ultra-Détaillée</button>
                    </div>
                </form>
            </div>
        `;
        
        // Insérer après la section d'upload
        const uploadSection = document.getElementById('uploadSection');
        uploadSection.parentNode.insertBefore(questionsSection, uploadSection.nextSibling);
        
        // Gérer la soumission du formulaire
        const form = questionsSection.querySelector('#dynamicQuestionsForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const answers = {};
            questions.forEach(q => {
                if (q.type === 'radio') {
                    const selected = form.querySelector(`input[name="${q.id}"]:checked`);
                    if (selected) {
                        answers[q.id] = selected.value;
                    }
                } else {
                    const selected = Array.from(form.querySelectorAll(`input[name="${q.id}"]:checked`));
                    answers[q.id] = selected.map(input => input.value);
                }
            });
            
            // Validation
            const requiredQuestions = questions.filter(q => q.required);
            const missingAnswers = requiredQuestions.filter(q => {
                if (q.type === 'radio') {
                    return !answers[q.id];
                } else {
                    return !answers[q.id] || answers[q.id].length === 0;
                }
            });
            
            if (missingAnswers.length > 0) {
                showError('Veuillez répondre à toutes les questions obligatoires.');
                return;
            }
            
            // Masquer la section des questions et continuer l'analyse
            questionsSection.remove();
            resolve(answers);
        });
        
        // Gérer l'annulation
        window.cancelQuestions = () => {
            questionsSection.remove();
            resolve(null);
        };
    });
}
