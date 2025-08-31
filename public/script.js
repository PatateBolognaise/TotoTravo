// ===== CONFIGURATION GLOBALE =====
const APP_CONFIG = {
    API_BASE_URL: window.location.origin,
    MAX_FILES: 5,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp']
};

// ===== ÉTAT GLOBAL =====
const AppState = {
    currentStep: 'questionnaire',
    currentQuestion: 1,
    totalQuestions: 5,
    userProfile: {},
    uploadedFiles: [],
    analysisResults: null,
    isLoading: false
};

// ===== UTILITAIRES =====
const Utils = {
    showNotification: (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    validateFile: (file) => {
        if (!APP_CONFIG.SUPPORTED_FORMATS.includes(file.type)) {
            return { valid: false, error: 'Format de fichier non supporté' };
        }
        
        if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
            return { valid: false, error: 'Fichier trop volumineux' };
        }
        
        return { valid: true };
    },

    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// ===== GESTIONNAIRE DE NAVIGATION =====
const NavigationManager = {
    init: () => {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const step = btn.dataset.step;
                NavigationManager.goToStep(step);
            });
        });
    },

    goToStep: (step) => {
        // Masquer toutes les sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Afficher la section demandée
        const targetSection = document.getElementById(`${step}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Mettre à jour la navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-step="${step}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        AppState.currentStep = step;
    },

    updateProgress: () => {
        const steps = ['questionnaire', 'upload', 'results'];
        const currentIndex = steps.indexOf(AppState.currentStep);
        
        steps.forEach((step, index) => {
            const btn = document.querySelector(`[data-step="${step}"]`);
            if (btn) {
                if (index < currentIndex) {
                    btn.classList.add('completed');
                } else if (index === currentIndex) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active', 'completed');
                }
            }
        });
    }
};

// ===== GESTIONNAIRE DE QUESTIONNAIRE =====
const QuestionnaireManager = {
    init: () => {
        const form = document.getElementById('questionnaireForm');
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const finishBtn = document.getElementById('finishBtn');

        nextBtn?.addEventListener('click', QuestionnaireManager.nextQuestion);
        prevBtn?.addEventListener('click', QuestionnaireManager.previousQuestion);
        finishBtn?.addEventListener('click', QuestionnaireManager.finishQuestionnaire);

        // Écouter les changements de sélection
        form?.addEventListener('change', (e) => {
            if (e.target.type === 'radio') {
                QuestionnaireManager.updateNavigationButtons();
            }
        });
    },

    nextQuestion: () => {
        if (AppState.currentQuestion < AppState.totalQuestions) {
            AppState.currentQuestion++;
            QuestionnaireManager.updateQuestionnaireUI();
        }
    },

    previousQuestion: () => {
        if (AppState.currentQuestion > 1) {
            AppState.currentQuestion--;
            QuestionnaireManager.updateQuestionnaireUI();
        }
    },

    finishQuestionnaire: () => {
        const formData = new FormData(document.getElementById('questionnaireForm'));
        const userProfile = {};
        
        for (let [key, value] of formData.entries()) {
            userProfile[key] = value;
        }
        
        // Vérifier que toutes les questions sont répondues
        const requiredFields = ['niveau_bricolage', 'budget', 'delai', 'implication', 'type_projet'];
        const missingFields = requiredFields.filter(field => !userProfile[field]);
        
        if (missingFields.length > 0) {
            Utils.showNotification('Veuillez répondre à toutes les questions', 'error');
            return;
        }
        
        AppState.userProfile = userProfile;
        Utils.showNotification('Profil enregistré avec succès !', 'success');
        
        // Passer à l'étape suivante
        setTimeout(() => {
            NavigationManager.goToStep('upload');
        }, 1000);
    },

    updateQuestionnaireUI: () => {
        // Afficher/masquer les questions
        for (let i = 1; i <= AppState.totalQuestions; i++) {
            const question = document.querySelector(`[data-question="${i}"]`);
            if (question) {
                question.style.display = i === AppState.currentQuestion ? 'block' : 'none';
            }
        }
        
        QuestionnaireManager.updateNavigationButtons();
    },

    updateNavigationButtons: () => {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const finishBtn = document.getElementById('finishBtn');
        
        // Bouton précédent
        if (prevBtn) {
            prevBtn.style.display = AppState.currentQuestion > 1 ? 'inline-flex' : 'none';
        }
        
        // Bouton suivant/finir
        if (nextBtn && finishBtn) {
            if (AppState.currentQuestion < AppState.totalQuestions) {
                nextBtn.style.display = 'inline-flex';
                finishBtn.style.display = 'none';
            } else {
                nextBtn.style.display = 'none';
                finishBtn.style.display = 'inline-flex';
            }
        }
    }
};

// ===== GESTIONNAIRE D'UPLOAD =====
const UploadManager = {
    init: () => {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const analyzeBtn = document.getElementById('analyzeBtn');

        // Gestion du drag & drop
        uploadArea?.addEventListener('dragover', UploadManager.handleDragOver);
        uploadArea?.addEventListener('dragleave', UploadManager.handleDragLeave);
        uploadArea?.addEventListener('drop', UploadManager.handleDrop);
        uploadArea?.addEventListener('click', () => fileInput?.click());

        // Gestion de la sélection de fichiers
        fileInput?.addEventListener('change', (e) => {
            UploadManager.handleFiles(e.target.files);
        });

        // Bouton d'analyse
        analyzeBtn?.addEventListener('click', UploadManager.analyzeImages);
    },

    handleDragOver: (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    },

    handleDragLeave: (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
    },

    handleDrop: (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        UploadManager.handleFiles(files);
    },

    handleFiles: (files) => {
        const validFiles = [];
        const errors = [];

        Array.from(files).forEach(file => {
            const validation = Utils.validateFile(file);
            if (validation.valid) {
                if (AppState.uploadedFiles.length + validFiles.length < APP_CONFIG.MAX_FILES) {
                    validFiles.push(file);
                } else {
                    errors.push(`${file.name}: Limite de fichiers atteinte`);
                }
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        });

        // Afficher les erreurs
        errors.forEach(error => {
            Utils.showNotification(error, 'error');
        });

        // Ajouter les fichiers valides
        if (validFiles.length > 0) {
            AppState.uploadedFiles.push(...validFiles);
            UploadManager.updateFilePreview();
            UploadManager.updateAnalyzeButton();
        }
    },

    updateFilePreview: () => {
        const preview = document.getElementById('imagePreview');
        if (!preview) return;

        preview.innerHTML = '';

        AppState.uploadedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-image" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                `;

                // Gestion de la suppression
                previewItem.querySelector('.remove-image').addEventListener('click', () => {
                    AppState.uploadedFiles.splice(index, 1);
                    UploadManager.updateFilePreview();
                    UploadManager.updateAnalyzeButton();
                });

                preview.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    },

    updateAnalyzeButton: () => {
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.disabled = AppState.uploadedFiles.length === 0;
        }
    },

    analyzeImages: async () => {
        if (AppState.uploadedFiles.length === 0) {
            Utils.showNotification('Veuillez sélectionner au moins une image', 'error');
            return;
        }

        AppState.isLoading = true;
        NavigationManager.goToStep('loading');

        try {
            const formData = new FormData();
            AppState.uploadedFiles.forEach(file => {
                formData.append('images', file);
            });

            const description = document.getElementById('description')?.value || '';
            formData.append('description', description);
            formData.append('userProfile', JSON.stringify(AppState.userProfile));

            // Simulation de progression
            UploadManager.updateLoadingProgress();

            const response = await fetch(`${APP_CONFIG.API_BASE_URL}/api/analyze`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            AppState.analysisResults = result;

            Utils.showNotification('Analyse terminée avec succès !', 'success');
            
            setTimeout(() => {
                NavigationManager.goToStep('results');
                ResultsManager.displayResults(result);
            }, 1000);

        } catch (error) {
            console.error('Erreur lors de l\'analyse:', error);
            Utils.showNotification(`Erreur lors de l'analyse: ${error.message}`, 'error');
            
            setTimeout(() => {
                NavigationManager.goToStep('upload');
            }, 2000);
        } finally {
            AppState.isLoading = false;
        }
    },

    updateLoadingProgress: () => {
        const messages = [
            'Analyse de vos images...',
            'Génération des estimations...',
            'Calcul des coûts...',
            'Finalisation du rapport...'
        ];

        let currentStep = 0;
        const progressText = document.querySelector('.progress-text');
        const loadingMessage = document.getElementById('loadingMessage');

        const interval = setInterval(() => {
            if (currentStep < messages.length) {
                if (progressText) {
                    progressText.textContent = `Étape ${currentStep + 1}/${messages.length}`;
                }
                if (loadingMessage) {
                    loadingMessage.textContent = messages[currentStep];
                }
                currentStep++;
            } else {
                clearInterval(interval);
            }
        }, 1000);
    }
};

// ===== GESTIONNAIRE DE RÉSULTATS =====
const ResultsManager = {
    init: () => {
        const newAnalysisBtn = document.getElementById('newAnalysisBtn');
        const downloadBtn = document.getElementById('downloadBtn');

        newAnalysisBtn?.addEventListener('click', ResultsManager.newAnalysis);
        downloadBtn?.addEventListener('click', ResultsManager.downloadReport);
    },

    displayResults: (results) => {
        const container = document.getElementById('resultsContainer');
        if (!container) {
            console.error('Container des résultats non trouvé');
            return;
        }

        try {
            const analysis = results.analysis || results;
            
            container.innerHTML = `
                <div class="results-header">
                    <h2>🎯 Analyse de votre projet</h2>
                    <p>Voici votre estimation personnalisée basée sur ${results.images?.length || 0} image(s)</p>
                </div>

                <div class="results-summary">
                    <div class="summary-grid">
                        <div class="summary-card">
                            <i class="fas fa-ruler-combined"></i>
                            <h3>Surface totale</h3>
                            <div class="summary-value">${analysis.analyse_globale?.surface_totale || 'N/A'}</div>
                        </div>
                        <div class="summary-card">
                            <i class="fas fa-clock"></i>
                            <h3>Durée estimée</h3>
                            <div class="summary-value">${analysis.analyse_globale?.duree_estimee || 'N/A'}</div>
                        </div>
                        <div class="summary-card">
                            <i class="fas fa-euro-sign"></i>
                            <h3>Coût total</h3>
                            <div class="summary-value">${analysis.analyse_globale?.cout_total_estime || 'N/A'}</div>
                        </div>
                        <div class="summary-card">
                            <i class="fas fa-tools"></i>
                            <h3>Complexité</h3>
                            <div class="summary-value">${analysis.analyse_globale?.complexite || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                ${analysis.pieces ? ResultsManager.renderPieces(analysis.pieces) : ''}
                
                ${analysis.conseils ? ResultsManager.renderAdvice(analysis.conseils) : ''}
            `;
        } catch (error) {
            console.error('Erreur lors de l\'affichage des résultats:', error);
            container.innerHTML = `
                <div class="results-header">
                    <h2>❌ Erreur d'affichage</h2>
                    <p>Impossible d'afficher les résultats. Veuillez réessayer.</p>
                </div>
            `;
        }
    },

    renderPieces: (pieces) => {
        if (!Array.isArray(pieces) || pieces.length === 0) {
            return '';
        }

        return `
            <div class="pieces-section">
                <h3>📋 Détail par pièce</h3>
                <div class="pieces-grid">
                    ${pieces.map(piece => `
                        <div class="piece-card">
                            <div class="piece-header">
                                <h4>${piece.nom || 'Pièce non nommée'}</h4>
                                <span class="piece-status ${piece.etat_general || 'moyen'}">${piece.etat_general || 'moyen'}</span>
                            </div>
                            <div class="piece-details">
                                <div class="piece-info">
                                    <span><strong>Surface:</strong> ${piece.surface || 'N/A'}</span>
                                    <span><strong>Coût estimé:</strong> ${piece.cout_estime || 'N/A'}</span>
                                </div>
                                <div class="piece-description">
                                    <p>${piece.travaux_necessaires || 'Aucune information disponible'}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderAdvice: (conseils) => {
        if (!conseils) {
            return '';
        }

        return `
            <div class="advice-section">
                <h3>💡 Conseils personnalisés</h3>
                <div class="advice-content">
                    <p>${conseils}</p>
                </div>
            </div>
        `;
    },

    newAnalysis: () => {
        // Réinitialiser l'état
        AppState.currentQuestion = 1;
        AppState.userProfile = {};
        AppState.uploadedFiles = [];
        AppState.analysisResults = null;
        
        // Réinitialiser les formulaires
        document.getElementById('questionnaireForm')?.reset();
        const description = document.getElementById('description');
        if (description) description.value = '';
        
        // Retourner au questionnaire
        NavigationManager.goToStep('questionnaire');
        QuestionnaireManager.updateQuestionnaireUI();
        
        Utils.showNotification('Nouvelle analyse prête !', 'success');
    },

    downloadReport: () => {
        if (!AppState.analysisResults) {
            Utils.showNotification('Aucun rapport à télécharger', 'error');
            return;
        }

        const report = {
            date: new Date().toISOString(),
            userProfile: AppState.userProfile,
            analysis: AppState.analysisResults,
            images: AppState.analysisResults.images
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tototravo-rapport-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Utils.showNotification('Rapport téléchargé avec succès !', 'success');
    }
};

// ===== GESTIONNAIRE DE CHATBOT =====
const ChatbotManager = {
    init: () => {
        const toggle = document.getElementById('chatbotToggle');
        const close = document.getElementById('chatbotClose');
        const sendBtn = document.getElementById('sendChatBtn');
        const input = document.getElementById('chatInput');

        toggle?.addEventListener('click', ChatbotManager.toggleChatbot);
        close?.addEventListener('click', ChatbotManager.closeChatbot);
        sendBtn?.addEventListener('click', ChatbotManager.sendMessage);
        
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                ChatbotManager.sendMessage();
            }
        });
    },

    toggleChatbot: () => {
        const chatbot = document.getElementById('chatbot');
        chatbot?.classList.toggle('active');
    },

    closeChatbot: () => {
        const chatbot = document.getElementById('chatbot');
        chatbot?.classList.remove('active');
    },

    sendMessage: async () => {
        const input = document.getElementById('chatInput');
        const message = input?.value.trim();
        
        if (!message) return;

        // Afficher le message utilisateur
        ChatbotManager.addMessage(message, 'user');
        input.value = '';

        // Simuler une réponse du chatbot
        setTimeout(() => {
            const response = ChatbotManager.generateResponse(message);
            ChatbotManager.addMessage(response, 'bot');
        }, 1000);
    },

    addMessage: (content, type) => {
        const messages = document.getElementById('chatbotMessages');
        if (!messages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${type === 'user' ? 'user' : 'robot'}"></i>
            </div>
            <div class="message-content">
                <p>${content}</p>
            </div>
        `;

        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    },

    generateResponse: (message) => {
        const responses = {
            'bonjour': 'Bonjour ! Comment puis-je vous aider avec votre projet de rénovation ?',
            'prix': 'Les prix varient selon la complexité et les matériaux. Pouvez-vous me donner plus de détails sur votre projet ?',
            'délai': 'Les délais dépendent de l\'ampleur des travaux. En général, comptez 2-8 semaines selon la complexité.',
            'matériaux': 'Je recommande de consulter un professionnel pour le choix des matériaux adaptés à votre projet.',
            'aide': 'Je suis là pour vous aider ! Posez-moi vos questions sur la rénovation.'
        };

        const lowerMessage = message.toLowerCase();
        for (const [key, response] of Object.entries(responses)) {
            if (lowerMessage.includes(key)) {
                return response;
            }
        }

        return 'Merci pour votre question. Pour une réponse plus précise, utilisez l\'analyse IA de l\'application !';
    }
};

// ===== STYLES POUR LES NOTIFICATIONS =====
const addNotificationStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            z-index: 10000;
            max-width: 300px;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .notification-success {
            border-left: 4px solid #10b981;
        }
        
        .notification-error {
            border-left: 4px solid #ef4444;
        }
        
        .notification-info {
            border-left: 4px solid #3b82f6;
        }
        
        .notification i {
            font-size: 1.2rem;
        }
        
        .notification-success i {
            color: #10b981;
        }
        
        .notification-error i {
            color: #ef4444;
        }
        
        .notification-info i {
            color: #3b82f6;
        }
    `;
    document.head.appendChild(style);
};

// ===== INITIALISATION DE L'APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initialisation de TotoTravo...');
    
    // Ajouter les styles de notification
    addNotificationStyles();
    
    // Initialiser tous les gestionnaires
    NavigationManager.init();
    QuestionnaireManager.init();
    UploadManager.init();
    ResultsManager.init();
    ChatbotManager.init();
    
    // Initialiser l'interface
    QuestionnaireManager.updateQuestionnaireUI();
    UploadManager.updateAnalyzeButton();
    
    console.log('✅ TotoTravo initialisé avec succès !');
});

// ===== GESTION DES ERREURS GLOBALES =====
window.addEventListener('error', (e) => {
    console.error('Erreur JavaScript:', e.error);
    Utils.showNotification('Une erreur est survenue', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Promesse rejetée:', e.reason);
    Utils.showNotification('Une erreur réseau est survenue', 'error');
});
