/**
 * Buyer Persona - Frontend Application v5.0
 * UTP Posgrados - Premium Edition
 * Integrates: AI avatar generation, GSAP animations, robust error handling
 */
(function() {
  'use strict';

  const TOTAL_VARIABLES = 14;

  const State = { current: 'empty', data: null, error: null };

  const DOM = {
    form: document.getElementById('icpForm'),
    submitBtn: document.getElementById('submitBtn'),
    emptyState: document.getElementById('emptyState'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    resultState: document.getElementById('resultState'),
    errorMessage: document.getElementById('errorMessage'),
    retryBtn: document.getElementById('retryBtn'),
    formProgress: document.getElementById('formProgress'),
    formProgressText: document.getElementById('formProgressText'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    groqApiKeyInput: document.getElementById('groqApiKey'),
    hfApiKeyInput: document.getElementById('hfApiKey'),
    apiKeyStatus: document.getElementById('apiKeyStatus'),
    tierValue: document.getElementById('tierValue'),
    scoreProgress: document.getElementById('scoreProgress'),
    scoreValue: document.getElementById('scoreValue'),
    metaAge: document.getElementById('metaAge'),
    metaGender: document.getElementById('metaGender'),
    metaJob: document.getElementById('metaJob'),
    metaEducation: document.getElementById('metaEducation'),
    resumenText: document.getElementById('resumenText'),
    dimensionsGrid: document.getElementById('dimensionsGrid'),
    analysisList: document.getElementById('analysisList'),
    strengthsList: document.getElementById('strengthsList'),
    frictionsList: document.getElementById('frictionsList'),
    validationsList: document.getElementById('validationsList'),
    avatarPlaceholder: document.getElementById('avatarPlaceholder'),
    avatarImage: document.getElementById('avatarImage'),
    avatarGenerating: document.getElementById('avatarGenerating'),
    generatedAt: document.getElementById('generatedAt'),
    exportBtn: document.getElementById('exportBtn'),
    exampleBtn: document.getElementById('exampleBtn'),
    algoScoreSection: document.getElementById('algoScoreSection'),
    algoScoreValue: document.getElementById('algoScoreValue'),
    algoScoreBar: document.getElementById('algoScoreBar'),
    algoTierBadge: document.getElementById('algoTierBadge')
  };

  const PANELS = {
    emptyState: DOM.emptyState,
    loadingState: DOM.loadingState,
    errorState: DOM.errorState,
    resultState: DOM.resultState
  };

  const ValidationRules = {
    V01: { required: true, min: 1, max: 8, label: 'Rango de edad' },
    V02: { required: true, min: 1, max: 4, label: 'Género' },
    V03: { required: true, min: 1, max: 6, label: 'Nivel de formación actual' },
    V04: { required: true, min: 1, max: 6, label: 'Estrato social' },
    V05: { required: true, min: 1, max: 6, label: 'Salario (SMLV)' },
    V06: { required: true, min: 1, max: 7, label: 'Pertenencia a redes sociales' },
    V07: { required: true, min: 1, max: 5, label: 'Ascenso laboral' },
    V08: { required: true, min: 1, max: 5, label: 'Desarrollo personal' },
    V09: { required: true, min: 1, max: 4, label: 'Situación laboral' },
    V10: { required: true, min: 1, max: 6, label: 'Precio programa (SMLV)' },
    V11: { required: true, min: 1, max: 3, label: 'Modalidad' },
    V12: { required: true, min: 1, max: 66, label: 'Programa de interés' },
    V13: { required: true, min: 1, max: 6, label: 'Formación previa' },
    V14: { required: true, min: 1, max: 7, label: 'Objetivo del postgrado' }
  };

  function formatDate(isoString) {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(isoString));
  }

  function getScoreColor(score) {
    if (score >= 80) return '#22C55E';
    if (score >= 60) return '#6366F1';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  }

  function getTierClass(tier) {
    const t = tier.toLowerCase();
    if (t.includes('premium')) return 'premium';
    if (t.includes('alto')) return 'alto';
    if (t.includes('medio')) return 'medio';
    return 'bajo';
  }

  // ============================================
  // Avatar (from API response or built-in SVG fallback)
  // ============================================
  function generateSVGFallback(inputData, evaluation) {
    const tier = evaluation?.tier || 'Medio';
    const colors = {
      'Premium': { primary: '#FFD700', bg: '#1a1a2e' },
      'Alto': { primary: '#22C55E', bg: '#0f3460' },
      'Medio': { primary: '#6366F1', bg: '#16213e' },
      'Bajo': { primary: '#F59E0B', bg: '#1e1e2e' }
    };
    const c = colors[tier] || colors['Medio'];
    const isFemale = inputData.genero === 'Femenino';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${c.bg}"/>
        <stop offset="100%" style="stop-color:#0a0f1a"/>
      </linearGradient>
      <linearGradient id="avatarGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${c.primary};stop-opacity:0.4"/>
        <stop offset="100%" style="stop-color:${c.primary};stop-opacity:0"/>
      </linearGradient>
    </defs>
    <rect width="200" height="200" fill="url(#bg)" rx="100"/>
    <circle cx="100" cy="100" r="85" fill="url(#avatarGlow)"/>
    <circle cx="100" cy="100" r="70" fill="${c.primary}" opacity="0.12"/>
    <circle cx="100" cy="80" r="${isFemale ? 28 : 30}" fill="#D4A574"/>
    ${isFemale
      ? '<path d="M70 72 Q75 48 100 42 Q125 48 130 72 Q125 62 100 58 Q75 62 70 72" fill="#2D2D2D"/><ellipse cx="72" cy="78" rx="7" ry="18" fill="#2D2D2D"/><ellipse cx="128" cy="78" rx="7" ry="18" fill="#2D2D2D"/>'
      : '<ellipse cx="100" cy="62" rx="33" ry="18" fill="#2D2D2D"/><rect x="67" y="53" width="66" height="22" rx="5" fill="#2D2D2D"/>'
    }
    <ellipse cx="88" cy="78" rx="4" ry="5" fill="#2D2D2D"/>
    <ellipse cx="112" cy="78" rx="4" ry="5" fill="#2D2D2D"/>
    <circle cx="90" cy="76" r="1.5" fill="white"/>
    <circle cx="114" cy="76" r="1.5" fill="white"/>
    <path d="M90 98 Q100 108 110 98" stroke="#2D2D2D" stroke-width="2" fill="none"/>
    <path d="M50 155 Q60 128 100 122 Q140 128 150 155" fill="${c.primary}" opacity="0.8"/>
    <path d="M88 122 L100 135 L112 122" fill="white" opacity="0.25"/>
    <text x="100" y="180" font-family="Arial" font-size="11" font-weight="bold" fill="${c.primary}" text-anchor="middle">${tier.toUpperCase()}</text>
    <text x="100" y="40" font-family="Arial" font-size="20" font-weight="bold" fill="${c.primary}" text-anchor="middle" opacity="0.7">${evaluation?.score_total || 0}</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  function displayAvatar(avatarData, inputData, evaluation) {
    if (!avatarData && !inputData) return;

    DOM.avatarGenerating.classList.add('hidden');

    let imgSrc;
    if (avatarData && avatarData.url) {
      imgSrc = avatarData.url;
    } else {
      imgSrc = generateSVGFallback(inputData, evaluation);
    }

    DOM.avatarImage.src = imgSrc;
    DOM.avatarImage.classList.remove('hidden');
    DOM.avatarPlaceholder.classList.add('hidden');

    // GSAP reveal animation
    if (typeof Animations !== 'undefined') {
      Animations.animateAvatarReveal(DOM.avatarImage);
    }
  }

  // ============================================
  // Form Progress
  // ============================================
  function updateFormProgress() {
    const formData = API.collectFormData(DOM.form);
    let filled = 0;
    for (let i = 1; i <= TOTAL_VARIABLES; i++) {
      const key = 'V' + i.toString().padStart(2, '0');
      if (formData[key] !== null && formData[key] !== '') filled++;
    }
    const pct = Math.round((filled / TOTAL_VARIABLES) * 100);

    if (typeof Animations !== 'undefined') {
      Animations.animateProgressBar(DOM.formProgress, pct);
    } else {
      DOM.formProgress.style.width = pct + '%';
    }
    if (DOM.formProgressText) DOM.formProgressText.textContent = pct + '% completado';
  }

  // ============================================
  // LocalStorage
  // ============================================
  const STORAGE_KEY = 'icp_form_data';
  function saveFormToStorage() { localStorage.setItem(STORAGE_KEY, JSON.stringify(API.collectFormData(DOM.form))); }
  function loadFormFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const formData = JSON.parse(saved);
        for (const key in formData) {
          const input = DOM.form.elements[key];
          if (input && formData[key] !== null) input.value = formData[key];
        }
        updateFormProgress();
      }
    } catch (e) { /* ignore */ }
  }
  function clearFormStorage() { localStorage.removeItem(STORAGE_KEY); }

  // ============================================
  // Example Data
  // ============================================
  const EXAMPLE_PROFILES = [
    { name: 'Profesional Junior', desc: 'Joven profesional buscando ascenso', data: { V01: '2', V02: '1', V03: '4', V04: '3', V05: '3', V06: '7', V07: '3', V08: '4', V09: '2', V10: '3', V11: '2', V12: '45', V13: '4', V14: '3' } },
    { name: 'Ejecutiva Senior', desc: 'Líder con visión internacional', data: { V01: '5', V02: '2', V03: '5', V04: '5', V05: '6', V06: '4', V07: '4', V08: '5', V09: '2', V10: '5', V11: '3', V12: '46', V13: '5', V14: '1' } },
    { name: 'Emprendedor Digital', desc: 'Independiente en tecnología', data: { V01: '3', V02: '1', V03: '4', V04: '4', V05: '5', V06: '7', V07: '5', V08: '5', V09: '3', V10: '4', V11: '2', V12: '53', V13: '4', V14: '4' } }
  ];

  function loadExampleProfile(index) {
    const profile = EXAMPLE_PROFILES[index];
    if (!profile) return;
    DOM.form.reset();
    for (const key in profile.data) {
      const input = DOM.form.elements[key];
      if (input) input.value = profile.data[key];
    }
    updateFormProgress();
    saveFormToStorage();
    document.querySelector('.sidebar').scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ============================================
  // Export
  // ============================================
  async function exportResults(data) {
    if (!window.html2canvas || !window.jspdf) {
      alert('Las librerías de exportación aún no se han cargado. Intenta de nuevo en unos segundos.');
      return;
    }

    const exportBtn = DOM.exportBtn;
    const originalHTML = exportBtn.innerHTML;
    exportBtn.innerHTML = '<svg class="spinner" viewBox="0 0 24 24" style="width:16px;height:16px"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/></svg> Generando PDF...';
    exportBtn.disabled = true;

    try {
      const resultContent = document.querySelector('.result-content');
      if (!resultContent) throw new Error('No hay resultados para exportar');

      // Temporarily adjust styles for better capture
      const mainContent = document.querySelector('.main-content');
      const originalOverflow = mainContent.style.overflow;
      const originalHeight = mainContent.style.height;
      mainContent.style.overflow = 'visible';
      mainContent.style.height = 'auto';

      const canvas = await html2canvas(resultContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#060B18',
        logging: false,
        windowWidth: resultContent.scrollWidth,
        windowHeight: resultContent.scrollHeight
      });

      // Restore styles
      mainContent.style.overflow = originalOverflow;
      mainContent.style.height = originalHeight;

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pageWidth - (margin * 2);
      const usableHeight = pageHeight - (margin * 2) - 12; // 12mm for footer

      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      if (imgHeight <= usableHeight) {
        // Fits on one page
        pdf.setFillColor(6, 11, 24);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
        addPDFFooter(pdf, pageWidth, pageHeight, 1, 1);
      } else {
        // Multi-page: slice the canvas
        const totalPages = Math.ceil(imgHeight / usableHeight);
        const sliceCanvasHeight = canvas.height / totalPages;

        for (let i = 0; i < totalPages; i++) {
          if (i > 0) pdf.addPage();

          // Background
          pdf.setFillColor(6, 11, 24);
          pdf.rect(0, 0, pageWidth, pageHeight, 'F');

          // Create a slice canvas
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = Math.min(sliceCanvasHeight, canvas.height - (i * sliceCanvasHeight));
          const sliceCtx = sliceCanvas.getContext('2d');
          sliceCtx.drawImage(
            canvas,
            0, i * sliceCanvasHeight,
            canvas.width, sliceCanvas.height,
            0, 0,
            sliceCanvas.width, sliceCanvas.height
          );

          const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92);
          const sliceImgHeight = (sliceCanvas.height * imgWidth) / sliceCanvas.width;
          pdf.addImage(sliceData, 'JPEG', margin, margin, imgWidth, sliceImgHeight);
          addPDFFooter(pdf, pageWidth, pageHeight, i + 1, totalPages);
        }
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      pdf.save(`Buyer-Persona-UTP-${timestamp}.pdf`);

    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor intenta de nuevo.');
    } finally {
      exportBtn.innerHTML = originalHTML;
      exportBtn.disabled = false;
    }
  }

  function addPDFFooter(pdf, pageWidth, pageHeight, currentPage, totalPages) {
    pdf.setFontSize(7);
    pdf.setTextColor(107, 127, 163);
    pdf.text(`Buyer Persona AI — UTP Posgrados Colombia`, 10, pageHeight - 5);
    pdf.text(`Página ${currentPage} de ${totalPages}`, pageWidth - 10, pageHeight - 5, { align: 'right' });
  }

  // ============================================
  // UI State Management
  // ============================================
  function setState(newState) {
    State.current = newState;

    // Use GSAP-animated transitions if available
    if (typeof Animations !== 'undefined') {
      Animations.animateToState(newState, PANELS);
    } else {
      DOM.emptyState.classList.add('hidden');
      DOM.loadingState.classList.add('hidden');
      DOM.errorState.classList.add('hidden');
      DOM.resultState.classList.add('hidden');
      switch (newState) {
        case 'empty': DOM.emptyState.classList.remove('hidden'); break;
        case 'loading': DOM.loadingState.classList.remove('hidden'); break;
        case 'error': DOM.errorState.classList.remove('hidden'); break;
        case 'result': DOM.resultState.classList.remove('hidden'); break;
      }
    }

    // Button state
    if (newState === 'loading') {
      DOM.submitBtn.disabled = true;
      DOM.submitBtn.classList.add('loading');
      if (typeof Animations !== 'undefined') {
        Animations.animateButtonLoading(DOM.submitBtn, true);
        Animations.animateLoadingSteps();
      }
    } else {
      DOM.submitBtn.disabled = false;
      DOM.submitBtn.classList.remove('loading');
      if (typeof Animations !== 'undefined') {
        Animations.animateButtonLoading(DOM.submitBtn, false);
      }
    }
  }

  // ============================================
  // Validation
  // ============================================
  function validateField(name, value) {
    const rules = ValidationRules[name];
    if (!rules) return { valid: true };
    if (rules.required && (value === null || value === undefined || value === ''))
      return { valid: false, message: rules.label + ' es requerido' };
    return { valid: true };
  }

  function validateForm() {
    const formData = API.collectFormData(DOM.form);
    let isValid = true;
    for (const name in ValidationRules) {
      const result = validateField(name, formData[name]);
      const input = DOM.form.elements[name];
      const errorEl = document.getElementById(name + '-error');
      if (!result.valid) {
        isValid = false;
        if (input) input.classList.add('error');
        if (errorEl) errorEl.textContent = result.message;
      } else {
        if (input) input.classList.remove('error');
        if (errorEl) errorEl.textContent = '';
      }
    }
    return isValid;
  }

  function clearErrors() {
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  }

  // ============================================
  // Render Results
  // ============================================
  function renderResult(data) {
    const ev = data.evaluation;
    const input = data.input;

    DOM.metaAge.textContent = input.rangoEdad || input.edad + ' años';
    DOM.metaGender.textContent = input.genero;
    DOM.metaJob.textContent = input.empleo;
    DOM.metaEducation.textContent = input.formacion;

    DOM.tierValue.textContent = ev.tier;
    DOM.tierValue.className = 'tier-value ' + getTierClass(ev.tier);

    const score = ev.score_total || 0;

    // Score circle (manual set, then animate)
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (score / 100) * circumference;
    DOM.scoreProgress.style.strokeDasharray = circumference;
    DOM.scoreProgress.style.strokeDashoffset = circumference; // Start at 0

    // Use GSAP for animated score
    if (typeof Animations !== 'undefined') {
      Animations.animateScoreCounter(DOM.scoreValue, 0, score, 1.8);
      Animations.animateScoreCircle(DOM.scoreProgress, score);
    } else {
      DOM.scoreValue.textContent = score;
      DOM.scoreProgress.style.strokeDashoffset = offset;
    }

    // Algorithmic Score
    if (ev.algorithmicScore) {
      DOM.algoScoreSection.classList.remove('hidden');
      DOM.algoScoreValue.textContent = ev.algorithmicScore.total;
      DOM.algoScoreBar.style.width = '0%';
      DOM.algoScoreBar.style.background = getScoreColor(ev.algorithmicScore.total);
      DOM.algoTierBadge.textContent = ev.algorithmicScore.tier;
      DOM.algoTierBadge.className = 'algo-tier-value ' + getTierClass(ev.algorithmicScore.tier);

      if (typeof Animations !== 'undefined') {
        Animations.animateAlgoBar(DOM.algoScoreBar, ev.algorithmicScore.total);
      } else {
        DOM.algoScoreBar.style.width = ev.algorithmicScore.total + '%';
      }
    } else {
      DOM.algoScoreSection.classList.add('hidden');
    }

    DOM.resumenText.textContent = ev.resumen || 'Sin resumen disponible.';
    renderDimensions(ev.puntajes || []);
    renderList(DOM.analysisList, ev.analisis, 'No hay puntos de análisis.');
    renderList(DOM.strengthsList, ev.fortalezas, 'No hay fortalezas identificadas.');
    renderList(DOM.frictionsList, ev.fricciones, 'No hay fricciones identificadas.');
    renderValidations(ev.validacion || []);
    DOM.generatedAt.textContent = formatDate(data.generatedAt);

    State.data = data;
    if (DOM.exportBtn) DOM.exportBtn.classList.remove('hidden');

    // Display avatar from API response
    displayAvatar(data.avatar, input, ev);

    // Trigger GSAP result animations
    if (typeof Animations !== 'undefined') {
      requestAnimationFrame(() => {
        Animations.animateResults();
        Animations.animateDimensionBars();
      });
    }
  }

  function renderDimensions(puntajes) {
    DOM.dimensionsGrid.innerHTML = '';
    if (!puntajes.length) { DOM.dimensionsGrid.innerHTML = '<p style="color:var(--text-muted)">Sin datos.</p>'; return; }
    puntajes.forEach((dim, index) => {
      const color = getScoreColor(dim.puntaje);
      const item = document.createElement('div');
      item.className = 'dimension-item';
      item.innerHTML = `<div class="dimension-header">
        <span class="dimension-name">${dim.dimension || 'Dimensión ' + (index + 1)}</span>
        <span class="dimension-score" style="color:${color}">${dim.puntaje}/100</span>
      </div>
      <div class="dimension-bar"><div class="dimension-bar-fill" style="width:${dim.puntaje}%;background:${color}"></div></div>
      <p class="dimension-analysis">${dim.analisis || ''}</p>`;
      DOM.dimensionsGrid.appendChild(item);
    });
  }

  function renderList(container, items, emptyMsg) {
    container.innerHTML = '';
    if (!items || !items.length) { container.innerHTML = '<li>' + emptyMsg + '</li>'; return; }
    items.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      container.appendChild(li);
    });
  }

  function renderValidations(validaciones) {
    DOM.validationsList.innerHTML = '';
    if (!validaciones.length) {
      DOM.validationsList.innerHTML = '<div class="validation-item valid">Todos los datos son válidos</div>';
      return;
    }
    validaciones.forEach(v => {
      const div = document.createElement('div');
      const isValid = v.toLowerCase().includes('válido') || v.toLowerCase().includes('correcto');
      div.className = 'validation-item ' + (isValid ? 'valid' : 'invalid');
      div.textContent = (isValid ? '✓ ' : '✗ ') + v;
      DOM.validationsList.appendChild(div);
    });
  }

  // ============================================
  // Event Handlers
  // ============================================
  async function handleSubmit(e) {
    e.preventDefault();
    if (State.current === 'loading') return;

    clearErrors();
    if (!validateForm()) return;

    const formData = API.collectFormData(DOM.form);
    setState('loading');

    // Show avatar generating state
    DOM.avatarGenerating.classList.remove('hidden');
    DOM.avatarPlaceholder.classList.add('hidden');
    DOM.avatarImage.classList.add('hidden');

    try {
      const result = await API.evaluateICP(formData);
      State.data = result.data;
      setState('result');
      renderResult(result.data);
      clearFormStorage();
    } catch (error) {
      State.error = error;
      setState('error');
      DOM.errorMessage.textContent = error.message || 'Error inesperado.';
    }
  }

  function handleRetry() {
    if (typeof Animations !== 'undefined') {
      Animations.killActiveTimelines();
    }
    setState('empty');
    clearErrors();
    DOM.form.reset();
    clearFormStorage();
    if (DOM.exportBtn) DOM.exportBtn.classList.add('hidden');
    updateFormProgress();
  }

  function handleFieldBlur(e) {
    const name = e.target.name;
    if (!ValidationRules[name]) return;
    const result = validateField(name, e.target.value);
    const errorEl = document.getElementById(name + '-error');
    if (!result.valid) {
      e.target.classList.add('error');
      if (errorEl) errorEl.textContent = result.message;
    } else {
      e.target.classList.remove('error');
      if (errorEl) errorEl.textContent = '';
    }
    updateFormProgress();
    saveFormToStorage();
  }

  // ============================================
  // Settings Modal
  // ============================================
  function openSettingsModal() {
    const modal = DOM.settingsModal;
    const groqInput = DOM.groqApiKeyInput;
    const hfInput = DOM.hfApiKeyInput;

    const savedGroqKey = localStorage.getItem('groq_api_key');
    const savedHfKey = localStorage.getItem('hf_api_key');
    if (groqInput && savedGroqKey) groqInput.value = savedGroqKey;
    if (hfInput && savedHfKey) hfInput.value = savedHfKey;
    if (savedGroqKey && DOM.apiKeyStatus) DOM.apiKeyStatus.innerHTML = '<span class="status-saved">Keys cargadas</span>';

    if (typeof Animations !== 'undefined') {
      Animations.animateModalIn(modal);
    } else {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }
    if (groqInput) groqInput.focus();
  }

  function closeSettingsModal() {
    const modal = DOM.settingsModal;
    if (typeof Animations !== 'undefined') {
      Animations.animateModalOut(modal, () => {
        if (DOM.groqApiKeyInput) DOM.groqApiKeyInput.value = '';
        if (DOM.hfApiKeyInput) DOM.hfApiKeyInput.value = '';
      });
    } else {
      modal.classList.add('hidden');
      modal.style.display = 'none';
      if (DOM.groqApiKeyInput) DOM.groqApiKeyInput.value = '';
      if (DOM.hfApiKeyInput) DOM.hfApiKeyInput.value = '';
    }
  }

  // Make accessible globally for inline onclick on HTML
  window.openSettingsModalDirect = openSettingsModal;
  window.closeSettingsModalDirect = closeSettingsModal;

  function saveSettings() {
    const groqKey = DOM.groqApiKeyInput.value.trim();
    const hfKey = DOM.hfApiKeyInput.value.trim();
    let valid = true;

    if (!groqKey || !groqKey.startsWith('gsk_')) {
      DOM.groqApiKeyInput.classList.add('error');
      document.getElementById('groqApiKey-error').textContent = 'API key requerida (gsk_...)';
      valid = false;
    } else {
      DOM.groqApiKeyInput.classList.remove('error');
      document.getElementById('groqApiKey-error').textContent = '';
    }

    if (hfKey && !hfKey.startsWith('hf_')) {
      DOM.hfApiKeyInput.classList.add('error');
      document.getElementById('hfApiKey-error').textContent = 'Debe comenzar con hf_';
      valid = false;
    } else {
      DOM.hfApiKeyInput.classList.remove('error');
      document.getElementById('hfApiKey-error').textContent = '';
    }

    if (!valid) return;

    localStorage.setItem('groq_api_key', groqKey);
    if (hfKey) localStorage.setItem('hf_api_key', hfKey);
    DOM.apiKeyStatus.innerHTML = '<span class="status-saved">✓ Guardadas correctamente</span>';
    setTimeout(closeSettingsModal, 800);
  }

  // ============================================
  // Example Modal
  // ============================================
  function showExampleModal() {
    const existingModal = document.querySelector('.example-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'modal example-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content" style="max-width:480px;">
        <div class="modal-header">
          <h2>Perfiles de Ejemplo</h2>
          <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-description">Selecciona un perfil para poblar automáticamente el formulario:</p>
          <div class="example-profiles-list">
            ${EXAMPLE_PROFILES.map((p, i) => `
              <button class="example-profile-btn" data-index="${i}">
                <div class="profile-avatar">${p.name.charAt(0)}</div>
                <div>
                  <div class="profile-name">${p.name}</div>
                  <div class="profile-sub">${p.desc}</div>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);

    if (typeof Animations !== 'undefined') {
      Animations.animateModalIn(modal);
    } else {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }

    const closeModal = () => {
      if (typeof Animations !== 'undefined') {
        Animations.animateModalOut(modal, () => modal.remove());
      } else {
        modal.remove();
      }
    };

    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    modal.querySelectorAll('.example-profile-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        closeModal();
        loadExampleProfile(parseInt(this.dataset.index));
      });
    });
  }

  // ============================================
  // Init
  // ============================================
  function init() {
    DOM.form.addEventListener('submit', handleSubmit);
    DOM.retryBtn.addEventListener('click', handleRetry);

    DOM.form.querySelectorAll('input, select').forEach(field => {
      field.addEventListener('blur', handleFieldBlur);
      field.addEventListener('change', handleFieldBlur);
      field.addEventListener('input', () => { updateFormProgress(); saveFormToStorage(); });
    });

    if (DOM.settingsBtn) DOM.settingsBtn.addEventListener('click', openSettingsModal);
    if (DOM.closeSettingsBtn) DOM.closeSettingsBtn.addEventListener('click', closeSettingsModal);
    if (DOM.saveSettingsBtn) DOM.saveSettingsBtn.addEventListener('click', saveSettings);
    if (DOM.settingsModal) {
      const backdrop = DOM.settingsModal.querySelector('.modal-backdrop');
      if (backdrop) backdrop.addEventListener('click', closeSettingsModal);
    }
    if (DOM.exportBtn) DOM.exportBtn.addEventListener('click', () => { if (State.data) exportResults(State.data); });
    if (DOM.exampleBtn) DOM.exampleBtn.addEventListener('click', showExampleModal);

    // ============================================
    // Program Level Filter (2-dropdown system)
    // ============================================
    const levelSelect = document.getElementById('V12_level');
    const programSelect = document.getElementById('V12');
    if (levelSelect && programSelect) {
      // Store all original optgroups
      const allOptgroups = Array.from(programSelect.querySelectorAll('optgroup'));
      const defaultOption = programSelect.querySelector('option[value=""]');

      levelSelect.addEventListener('change', function() {
        const level = this.value;
        // Reset program selection
        programSelect.value = '';

        // Remove all optgroups
        allOptgroups.forEach(og => {
          if (og.parentNode) og.parentNode.removeChild(og);
        });

        // Add back the matching ones
        allOptgroups.forEach(og => {
          const label = og.label.toLowerCase();
          if (!level ||
              (level === 'esp' && label.includes('especialización')) ||
              (level === 'mae' && label.includes('maestría')) ||
              (level === 'doc' && label.includes('doctorado'))) {
            programSelect.appendChild(og);
          }
        });

        updateFormProgress();
        saveFormToStorage();
      });
    }

    loadFormFromStorage();
    updateFormProgress();
    setState('empty');

    // GSAP Entry animations
    if (typeof Animations !== 'undefined') {
      Animations.initEntryAnimations();
      Animations.initMicroInteractions();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
