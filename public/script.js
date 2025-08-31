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
        console.log('🔄 Navigation vers l\'étape:', step);
        
        // Masquer toutes les sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        
        // Afficher la section demandée
        const targetSection = document.getElementById(`${step}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
            console.log('✅ Section affichée:', targetSection.id);
        } else {
            console.error('❌ Section non trouvée:', `${step}Section`);
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
        console.log('✅ Navigation terminée vers:', step);
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
            
            console.log('🎉 Analyse terminée, navigation vers les résultats...');
            
            setTimeout(() => {
                NavigationManager.goToStep('results');
                setTimeout(() => {
                    ResultsManager.displayResults(result);
                }, 100);
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
        console.log('📊 Affichage des résultats:', results);
        
        const container = document.getElementById('resultsContainer');
        if (!container) {
            console.error('❌ Container des résultats non trouvé');
            return;
        }

        try {
            const analysis = results.analysis || results;
            console.log('🔍 Analyse à afficher:', analysis);
            
            container.innerHTML = `
                <div class="results-header">
                    <h2>🏗️ Diagnostic Technique Complet</h2>
                    <p>Analyse professionnelle basée sur ${results.images?.length || 0} image(s) - Niveau Bureau d'Études</p>
                </div>

                ${analysis.resume_executif ? ResultsManager.renderExecutiveSummary(analysis.resume_executif) : ''}
                
                ${analysis.diagnostic_lots ? ResultsManager.renderTechnicalLots(analysis.diagnostic_lots) : ''}
                
                ${analysis.decomposition_couts ? ResultsManager.renderDetailedCostBreakdown(analysis.decomposition_couts) : ''}
                
                ${analysis.planning_travaux ? ResultsManager.renderDetailedPlanning(analysis.planning_travaux) : ''}
                
                ${analysis.scenarios ? ResultsManager.renderScenarios(analysis.scenarios) : ''}
                
                ${analysis.questions_complementaires ? ResultsManager.renderQuestions(analysis.questions_complementaires) : ''}
                
                ${analysis.hypotheses_prises ? ResultsManager.renderHypotheses(analysis.hypotheses_prises) : ''}
                
                ${analysis.risques_et_inconnues ? ResultsManager.renderRisks(analysis.risques_et_inconnues) : ''}
            `;
            
            console.log('✅ Résultats affichés avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'affichage des résultats:', error);
            container.innerHTML = `
                <div class="results-header">
                    <h2>❌ Erreur d'affichage</h2>
                    <p>Impossible d'afficher les résultats. Veuillez réessayer.</p>
                    <pre>${JSON.stringify(results, null, 2)}</pre>
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
                                    ${piece.duree_estimee ? `<span><strong>Durée:</strong> ${piece.duree_estimee}</span>` : ''}
                                </div>
                                <div class="piece-description">
                                    <p><strong>Travaux nécessaires:</strong></p>
                                    <p>${piece.travaux_necessaires || 'Aucune information disponible'}</p>
                                </div>
                                ${piece.materiaux_principaux ? `
                                    <div class="piece-materials">
                                        <p><strong>Matériaux principaux:</strong></p>
                                        <ul>${piece.materiaux_principaux.map(m => `<li>${m}</li>`).join('')}</ul>
                                    </div>
                                ` : ''}
                                ${piece.corps_metier ? `
                                    <div class="piece-trades">
                                        <p><strong>Corps de métier:</strong></p>
                                        <div class="trades-tags">
                                            ${piece.corps_metier.map(trade => `<span class="trade-tag">${trade}</span>`).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                                ${piece.conseils_specifiques ? `
                                    <div class="piece-advice">
                                        <p><strong>Conseils spécifiques:</strong></p>
                                        <p>${piece.conseils_specifiques}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderExecutiveSummary: (resume) => {
        if (!resume) return '';
        
        return `
            <div class="executive-summary-section">
                <h3>📋 Résumé Exécutif</h3>
                <div class="executive-summary-grid">
                    <div class="summary-card">
                        <i class="fas fa-ruler-combined"></i>
                        <h4>Surface totale</h4>
                        <div class="summary-value">${resume.surface_totale || 'N/A'}</div>
                    </div>
                    <div class="summary-card">
                        <i class="fas fa-tools"></i>
                        <h4>Complexité</h4>
                        <div class="summary-value">${resume.complexite_globale || 'N/A'}</div>
                    </div>
                    <div class="summary-card">
                        <i class="fas fa-clock"></i>
                        <h4>Durée totale</h4>
                        <div class="summary-value">${resume.duree_totale || 'N/A'}</div>
                    </div>
                    <div class="summary-card">
                        <i class="fas fa-euro-sign"></i>
                        <h4>Coût médian</h4>
                        <div class="summary-value">${resume.cout_total?.mediane || 'N/A'}</div>
                    </div>
                </div>
                
                ${resume.priorites_urgentes ? `
                    <div class="priorities-section">
                        <h4>🚨 Priorités urgentes (P0/P1)</h4>
                        <ul>${resume.priorites_urgentes.map(p => `<li>${p}</li>`).join('')}</ul>
                    </div>
                ` : ''}
                
                ${resume.risques_majeurs ? `
                    <div class="major-risks-section">
                        <h4>⚠️ Risques majeurs</h4>
                        <ul>${resume.risques_majeurs.map(r => `<li>${r}</li>`).join('')}</ul>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderTechnicalLots: (lots) => {
        if (!Array.isArray(lots) || lots.length === 0) return '';
        
        return `
            <div class="technical-lots-section">
                <h3>🔧 Diagnostic par Lots Techniques</h3>
                <div class="lots-grid">
                    ${lots.map(lot => `
                        <div class="lot-card">
                            <div class="lot-header">
                                <h4>${lot.lot}</h4>
                                <span class="lot-status ${lot.etat?.toLowerCase()}">${lot.etat || 'N/A'}</span>
                                <span class="lot-urgency ${lot.urgence?.toLowerCase()}">${lot.urgence || 'N/A'}</span>
                            </div>
                            <div class="lot-details">
                                ${lot.causes_probables ? `
                                    <div class="lot-causes">
                                        <h5>🔍 Causes probables</h5>
                                        <ul>${lot.causes_probables.map(c => `<li>${c}</li>`).join('')}</ul>
                                    </div>
                                ` : ''}
                                
                                ${lot.risques ? `
                                    <div class="lot-risks">
                                        <h5>⚠️ Risques</h5>
                                        <ul>${lot.risques.map(r => `<li>${r}</li>`).join('')}</ul>
                                    </div>
                                ` : ''}
                                
                                ${lot.travaux_recommandes ? `
                                    <div class="lot-works">
                                        <h5>🔨 Travaux recommandés</h5>
                                        <p><strong>Description:</strong> ${lot.travaux_recommandes.description}</p>
                                        ${lot.travaux_recommandes.quantites ? `
                                            <div class="quantities">
                                                <strong>Quantités:</strong>
                                                ${lot.travaux_recommandes.quantites.surface ? `<span>Surface: ${lot.travaux_recommandes.quantites.surface}</span>` : ''}
                                                ${lot.travaux_recommandes.quantites.longueur ? `<span>Longueur: ${lot.travaux_recommandes.quantites.longueur}</span>` : ''}
                                                ${lot.travaux_recommandes.quantites.unites ? `<span>Unités: ${lot.travaux_recommandes.quantites.unites}</span>` : ''}
                                            </div>
                                        ` : ''}
                                        <p><strong>Sévérité:</strong> ${lot.travaux_recommandes.severite}</p>
                                    </div>
                                ` : ''}
                                
                                <div class="lot-costs">
                                    <h5>💰 Coûts estimés</h5>
                                    <div class="cost-ranges">
                                        <span class="cost-range low">Basse: ${lot.cout_estime?.basse || 'N/A'}</span>
                                        <span class="cost-range medium">Médiane: ${lot.cout_estime?.mediane || 'N/A'}</span>
                                        <span class="cost-range high">Haute: ${lot.cout_estime?.haute || 'N/A'}</span>
                                    </div>
                                </div>
                                
                                <div class="lot-info">
                                    <span><strong>Durée:</strong> ${lot.duree || 'N/A'}</span>
                                    <span><strong>Impact occupation:</strong> ${lot.impact_occupation || 'N/A'}</span>
                                </div>
                                
                                ${lot.dependances ? `
                                    <div class="lot-dependencies">
                                        <h5>🔗 Dépendances</h5>
                                        <p>${lot.dependances.join(', ')}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderDetailedCostBreakdown: (decomposition) => {
        if (!decomposition) return '';
        
        return `
            <div class="detailed-cost-breakdown-section">
                <h3>💰 Décomposition Détaillée des Coûts</h3>
                <div class="cost-breakdown-table">
                    <div class="cost-breakdown-header">
                        <div class="cost-category">Catégorie</div>
                        <div class="cost-basse">Fourchette Basse</div>
                        <div class="cost-mediane">Fourchette Médiane</div>
                        <div class="cost-haute">Fourchette Haute</div>
                    </div>
                    <div class="cost-breakdown-row">
                        <div class="cost-category">Matériaux</div>
                        <div class="cost-basse">${decomposition.materiaux?.basse || 'N/A'}</div>
                        <div class="cost-mediane">${decomposition.materiaux?.mediane || 'N/A'}</div>
                        <div class="cost-haute">${decomposition.materiaux?.haute || 'N/A'}</div>
                    </div>
                    <div class="cost-breakdown-row">
                        <div class="cost-category">Main d'œuvre</div>
                        <div class="cost-basse">${decomposition.main_oeuvre?.basse || 'N/A'}</div>
                        <div class="cost-mediane">${decomposition.main_oeuvre?.mediane || 'N/A'}</div>
                        <div class="cost-haute">${decomposition.main_oeuvre?.haute || 'N/A'}</div>
                    </div>
                    <div class="cost-breakdown-row">
                        <div class="cost-category">Évacuation/Déchets</div>
                        <div class="cost-basse">${decomposition.evacuation_dechets?.basse || 'N/A'}</div>
                        <div class="cost-mediane">${decomposition.evacuation_dechets?.mediane || 'N/A'}</div>
                        <div class="cost-haute">${decomposition.evacuation_dechets?.haute || 'N/A'}</div>
                    </div>
                    <div class="cost-breakdown-row">
                        <div class="cost-category">Marge/Aléas</div>
                        <div class="cost-basse">${decomposition.marge_aleas?.basse || 'N/A'}</div>
                        <div class="cost-mediane">${decomposition.marge_aleas?.mediane || 'N/A'}</div>
                        <div class="cost-haute">${decomposition.marge_aleas?.haute || 'N/A'}</div>
                    </div>
                </div>
                <div class="cost-parameters">
                    <span><strong>TVA:</strong> ${decomposition.tva || '20%'}</span>
                    <span><strong>Multiplicateur régional:</strong> ${decomposition.multiplicateur_regional || '1.0'}</span>
                </div>
            </div>
        `;
    },

    renderDetailedPlanning: (planning) => {
        if (!planning) return '';
        
        const phases = Object.entries(planning).map(([phase, details]) => `
            <div class="planning-phase">
                <h4>${details.nom || phase.replace('phase_', 'Phase ').toUpperCase()}</h4>
                <div class="phase-details">
                    <p><strong>Lots inclus:</strong> ${details.lots?.join(', ') || 'N/A'}</p>
                    <p><strong>Durée:</strong> ${details.duree || 'N/A'}</p>
                    <p><strong>Dépendances:</strong> ${details.dependances?.join(', ') || 'Aucune'}</p>
                    <p><strong>Impact occupation:</strong> ${details.impact_occupation || 'N/A'}</p>
                </div>
            </div>
        `).join('');
        
        return `
            <div class="detailed-planning-section">
                <h3>📅 Planning Détaillé des Travaux</h3>
                <div class="planning-phases">
                    ${phases}
                </div>
            </div>
        `;
    },

    renderScenarios: (scenarios) => {
        if (!scenarios) return '';
        
        return `
            <div class="scenarios-section">
                <h3>🔄 Scénarios de Travaux</h3>
                <div class="scenarios-grid">
                    ${scenarios.eco ? `
                        <div class="scenario-card eco">
                            <h4>${scenarios.eco.nom}</h4>
                            <p class="scenario-description">${scenarios.eco.description}</p>
                            <div class="scenario-cost">${scenarios.eco.cout_total}</div>
                            <div class="scenario-details">
                                <span><strong>Performance énergétique:</strong> ${scenarios.eco.performance_energetique}</span>
                                <span><strong>Durée:</strong> ${scenarios.eco.duree}</span>
                            </div>
                            <div class="scenario-pros-cons">
                                <div class="pros">
                                    <h5>Avantages</h5>
                                    <ul>${scenarios.eco.avantages?.map(a => `<li>${a}</li>`).join('') || ''}</ul>
                                </div>
                                <div class="cons">
                                    <h5>Inconvénients</h5>
                                    <ul>${scenarios.eco.inconvenients?.map(i => `<li>${i}</li>`).join('') || ''}</ul>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${scenarios.standard ? `
                        <div class="scenario-card standard">
                            <h4>${scenarios.standard.nom}</h4>
                            <p class="scenario-description">${scenarios.standard.description}</p>
                            <div class="scenario-cost">${scenarios.standard.cout_total}</div>
                            <div class="scenario-details">
                                <span><strong>Performance énergétique:</strong> ${scenarios.standard.performance_energetique}</span>
                                <span><strong>Durée:</strong> ${scenarios.standard.duree}</span>
                            </div>
                            <div class="scenario-pros-cons">
                                <div class="pros">
                                    <h5>Avantages</h5>
                                    <ul>${scenarios.standard.avantages?.map(a => `<li>${a}</li>`).join('') || ''}</ul>
                                </div>
                                <div class="cons">
                                    <h5>Inconvénients</h5>
                                    <ul>${scenarios.standard.inconvenients?.map(i => `<li>${i}</li>`).join('') || ''}</ul>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${scenarios.premium ? `
                        <div class="scenario-card premium">
                            <h4>${scenarios.premium.nom}</h4>
                            <p class="scenario-description">${scenarios.premium.description}</p>
                            <div class="scenario-cost">${scenarios.premium.cout_total}</div>
                            <div class="scenario-details">
                                <span><strong>Performance énergétique:</strong> ${scenarios.premium.performance_energetique}</span>
                                <span><strong>Durée:</strong> ${scenarios.premium.duree}</span>
                            </div>
                            <div class="scenario-pros-cons">
                                <div class="pros">
                                    <h5>Avantages</h5>
                                    <ul>${scenarios.premium.avantages?.map(a => `<li>${a}</li>`).join('') || ''}</ul>
                                </div>
                                <div class="cons">
                                    <h5>Inconvénients</h5>
                                    <ul>${scenarios.premium.inconvenients?.map(i => `<li>${i}</li>`).join('') || ''}</ul>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    renderQuestions: (questions) => {
        if (!Array.isArray(questions) || questions.length === 0) return '';
        
        return `
            <div class="questions-section">
                <h3>❓ Questions Complémentaires</h3>
                <p>Ces questions permettront d'affiner le diagnostic et le chiffrage</p>
                <div class="questions-list">
                    ${questions.map((q, index) => `
                        <div class="question-item">
                            <h4>Question ${index + 1}</h4>
                            <p class="question-text">${q.question}</p>
                            <div class="question-details">
                                <p><strong>Objectif:</strong> ${q.objectif}</p>
                                <p><strong>Impact sur estimation:</strong> ${q.impact_estimation}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderHypotheses: (hypotheses) => {
        if (!Array.isArray(hypotheses) || hypotheses.length === 0) return '';
        
        return `
            <div class="hypotheses-section">
                <h3>📝 Hypothèses Prises</h3>
                <p>Informations manquantes et hypothèses retenues pour l'estimation</p>
                <div class="hypotheses-list">
                    ${hypotheses.map((h, index) => `
                        <div class="hypothesis-item">
                            <h4>Hypothèse ${index + 1}</h4>
                            <p class="hypothesis-text">${h.hypothese}</p>
                            <div class="hypothesis-details">
                                <p><strong>Conséquence:</strong> ${h.consequence}</p>
                                <p><strong>Marge d'aléas ajoutée:</strong> ${h.marge_aleas}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderRisks: (risks) => {
        if (!Array.isArray(risks) || risks.length === 0) return '';
        
        return `
            <div class="risks-section">
                <h3>⚠️ Risques et Inconnues</h3>
                <p>Risques identifiés et leurs impacts potentiels</p>
                <div class="risks-list">
                    ${risks.map((r, index) => `
                        <div class="risk-item">
                            <h4>Risque ${index + 1}</h4>
                            <p class="risk-text">${r.risque}</p>
                            <div class="risk-details">
                                <p><strong>Impact potentiel:</strong> ${r.impact_potentiel}</p>
                                <p><strong>Probabilité:</strong> <span class="probability ${r.probabilite?.toLowerCase()}">${r.probabilite}</span></p>
                                <p><strong>Mesure de mitigation:</strong> ${r.mitigation}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderAlternatives: (alternatives) => {
        if (!Array.isArray(alternatives) || alternatives.length === 0) return '';
        
        return `
            <div class="alternatives-section">
                <h3>🔄 Alternatives possibles</h3>
                <div class="alternatives-grid">
                    ${alternatives.map(alt => `
                        <div class="alternative-card">
                            <h4>${alt.option}</h4>
                            <p class="alternative-description">${alt.description}</p>
                            <div class="alternative-cost">${alt.cout}</div>
                            <div class="alternative-pros-cons">
                                <div class="pros">
                                    <h5>Avantages</h5>
                                    <ul>${alt.avantages?.map(a => `<li>${a}</li>`).join('') || ''}</ul>
                                </div>
                                <div class="cons">
                                    <h5>Inconvénients</h5>
                                    <ul>${alt.inconvenients?.map(i => `<li>${i}</li>`).join('') || ''}</ul>
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

    renderSafety: (recommandations) => {
        if (!Array.isArray(recommandations) || recommandations.length === 0) return '';
        
        return `
            <div class="safety-section">
                <h3>⚠️ Recommandations de sécurité</h3>
                <div class="safety-list">
                    ${recommandations.map(rec => `
                        <div class="safety-item">
                            <i class="fas fa-shield-alt"></i>
                            <span>${rec}</span>
                        </div>
                    `).join('')}
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
