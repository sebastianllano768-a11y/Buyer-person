/**
 * Buyer Persona - Animations Module v3 (GSAP Best Practices)
 * Following greensock/gsap-skills official patterns:
 * - autoAlpha instead of opacity
 * - Timelines with defaults
 * - gsap.matchMedia() for prefers-reduced-motion
 * - Transform aliases (x, y, scale, rotation)
 * - Proper easing (power2, power3, back, elastic)
 * - Stagger with object syntax
 */
(function() {
  'use strict';

  const GSAP_AVAILABLE = typeof gsap !== 'undefined' && gsap !== null;

  // Duration multiplier — set to 0 for reduced-motion users
  let durationScale = 1;
  let matchMediaInstance = null;

  // ============================================
  // Initialization with gsap.matchMedia()
  // ============================================
  function initGSAP() {
    if (!GSAP_AVAILABLE) return;

    try {
      // Set global defaults per GSAP best practices
      gsap.defaults({ duration: 0.6, ease: 'power2.out' });

      // gsap.matchMedia for accessibility
      matchMediaInstance = gsap.matchMedia();
      matchMediaInstance.add(
        {
          full: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)'
        },
        (context) => {
          const { reduced } = context.conditions;
          durationScale = reduced ? 0 : 1;
        }
      );

      // Animate ambient background orbs
      initAmbientOrbs();
    } catch (e) {
      console.warn('GSAP init fallback:', e.message);
    }
  }

  // ============================================
  // Ambient Background Orbs (replaces CSS @keyframes)
  // ============================================
  function initAmbientOrbs() {
    if (!GSAP_AVAILABLE) return;
    try {
      // Floating orbs with GSAP instead of CSS
      gsap.to('.orb-1', {
        x: 80, y: 60,
        duration: 25 * durationScale,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true
      });
      gsap.to('.orb-2', {
        x: -60, y: -80,
        duration: 30 * durationScale,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 5
      });
      gsap.to('.orb-3', {
        x: 40, y: -50,
        duration: 20 * durationScale,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 10
      });
    } catch (e) { /* ignore */ }
  }

  // ============================================
  // Entry Animations (page load)
  // ============================================
  function initEntryAnimations() {
    if (!GSAP_AVAILABLE || durationScale === 0) return;
    try {
      // Use set + to pattern for reliability (from() with autoAlpha can leave elements
      // invisible if there's any error or race condition)
      const sections = document.querySelectorAll('.form-section');
      const submitBtn = document.querySelector('.submit-btn');
      const quickActions = document.querySelector('.quick-actions');
      const mainContent = document.querySelector('.main-content');

      // Set initial states
      gsap.set(sections, { y: 20, autoAlpha: 0 });
      gsap.set(submitBtn, { y: 10, autoAlpha: 0 });
      gsap.set(quickActions, { y: 10, autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out', duration: 0.7 * durationScale },
        onComplete: () => {
          // Ensure everything is visible after animation completes
          gsap.set([sections, submitBtn, quickActions, mainContent], { clearProps: 'all' });
        }
      });

      tl.to(sections, {
          y: 0,
          autoAlpha: 1,
          stagger: { amount: 0.4, from: 'start' }
        }, 0.15)
        .to(submitBtn, { y: 0, autoAlpha: 1, duration: 0.4 * durationScale }, '-=0.2')
        .to(quickActions, { y: 0, autoAlpha: 1, duration: 0.3 * durationScale }, '-=0.15');
    } catch (e) {
      // Safety: if GSAP fails, make sure form is visible
      document.querySelectorAll('.form-section, .submit-btn, .quick-actions').forEach(el => {
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.transform = 'none';
      });
    }
  }

  // ============================================
  // Micro-interactions (hover effects)
  // ============================================
  function initMicroInteractions() {
    if (!GSAP_AVAILABLE || durationScale === 0) return;
    try {
      document.querySelectorAll('.form-section').forEach(section => {
        section.addEventListener('mouseenter', () => {
          gsap.to(section, { y: -3, scale: 1.005, duration: 0.25, ease: 'power2.out' });
        });
        section.addEventListener('mouseleave', () => {
          gsap.to(section, { y: 0, scale: 1, duration: 0.25, ease: 'power2.out' });
        });
      });

      // Settings button rotate on hover
      const settingsBtn = document.getElementById('settingsBtn');
      if (settingsBtn) {
        settingsBtn.addEventListener('mouseenter', () => {
          gsap.to(settingsBtn, { rotation: 90, duration: 0.4, ease: 'back.out(1.7)' });
        });
        settingsBtn.addEventListener('mouseleave', () => {
          gsap.to(settingsBtn, { rotation: 0, duration: 0.3, ease: 'power2.out' });
        });
      }
    } catch (e) { /* ignore */ }
  }

  // ============================================
  // State Transitions (empty → loading → result → error)
  // ============================================
  function animateToState(newState, panels) {
    if (!GSAP_AVAILABLE || durationScale === 0) {
      // Fallback: no animation
      Object.values(panels).forEach(p => p && p.classList.add('hidden'));
      const target = panels[newState + 'State'];
      if (target) target.classList.remove('hidden');
      return;
    }
    try {
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut', duration: 0.35 * durationScale }
      });

      const allPanels = Object.values(panels);
      const currentPanel = allPanels.find(p => p && !p.classList.contains('hidden'));
      const targetPanel = panels[newState + 'State'];

      if (currentPanel && currentPanel !== targetPanel) {
        tl.to(currentPanel, {
          autoAlpha: 0,
          y: -15,
          duration: 0.25 * durationScale,
          onComplete: () => { currentPanel.classList.add('hidden'); gsap.set(currentPanel, { y: 0 }); }
        });
      }

      if (targetPanel) {
        tl.add(() => {
          targetPanel.classList.remove('hidden');
          gsap.set(targetPanel, { autoAlpha: 0, y: 20 });
        });
        tl.to(targetPanel, {
          autoAlpha: 1,
          y: 0,
          duration: 0.4 * durationScale,
          ease: 'power3.out'
        });
      }
    } catch (e) {
      // Fallback
      Object.values(panels).forEach(p => p && p.classList.add('hidden'));
      const target = panels[newState + 'State'];
      if (target) target.classList.remove('hidden');
    }
  }

  // ============================================
  // Modal Animations (back.out for punch)
  // ============================================
  function animateModalIn(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('hidden');
    modalEl.style.display = 'flex';

    if (!GSAP_AVAILABLE || durationScale === 0) return;
    try {
      const backdrop = modalEl.querySelector('.modal-backdrop');
      const content = modalEl.querySelector('.modal-content');

      // Reset any inline styles left by previous animateModalOut
      if (backdrop) gsap.set(backdrop, { clearProps: 'all' });
      if (content) gsap.set(content, { clearProps: 'all' });

      const tl = gsap.timeline({
        defaults: { duration: 0.35 * durationScale }
      });

      if (backdrop) {
        gsap.set(backdrop, { autoAlpha: 0 });
        tl.to(backdrop, { autoAlpha: 1, duration: 0.2 * durationScale });
      }
      if (content) {
        gsap.set(content, { scale: 0.85, autoAlpha: 0, y: 30 });
        tl.to(content, {
          scale: 1,
          autoAlpha: 1,
          y: 0,
          ease: 'back.out(1.4)',
          duration: 0.4 * durationScale
        }, '-=0.1');
      }
    } catch (e) { /* ignore */ }
  }

  function animateModalOut(modalEl, onComplete) {
    if (!modalEl) return;
    if (!GSAP_AVAILABLE || durationScale === 0) {
      modalEl.classList.add('hidden');
      modalEl.style.display = 'none';
      if (onComplete) onComplete();
      return;
    }
    try {
      const content = modalEl.querySelector('.modal-content');
      const backdrop = modalEl.querySelector('.modal-backdrop');
      const tl = gsap.timeline({
        onComplete: () => {
          // Clear all inline styles so next open starts fresh
          if (content) gsap.set(content, { clearProps: 'all' });
          if (backdrop) gsap.set(backdrop, { clearProps: 'all' });
          modalEl.classList.add('hidden');
          modalEl.style.display = 'none';
          if (onComplete) onComplete();
        }
      });
      if (content) {
        tl.to(content, { scale: 0.9, autoAlpha: 0, y: 20, duration: 0.25 * durationScale, ease: 'power2.in' });
      }
    } catch (e) {
      modalEl.classList.add('hidden');
      modalEl.style.display = 'none';
      if (onComplete) onComplete();
    }
  }

  // ============================================
  // Progress Bar
  // ============================================
  function animateProgressBar(progressEl, percentage) {
    if (!progressEl) return;
    if (!GSAP_AVAILABLE || durationScale === 0) {
      progressEl.style.width = percentage + '%';
      return;
    }
    try {
      gsap.to(progressEl, {
        width: percentage + '%',
        duration: 0.4 * durationScale,
        ease: 'power2.out'
      });
    } catch (e) {
      progressEl.style.width = percentage + '%';
    }
  }

  // ============================================
  // Score Animations (counter + circle)
  // ============================================
  function animateScoreCounter(element, start, end, duration) {
    if (!GSAP_AVAILABLE || !element || durationScale === 0) {
      if (element) element.textContent = end;
      return;
    }
    try {
      const obj = { val: start };
      gsap.to(obj, {
        val: end,
        duration: (duration || 1.8) * durationScale,
        ease: 'power3.out',
        onUpdate: () => { element.textContent = Math.round(obj.val); }
      });
    } catch (e) {
      if (element) element.textContent = end;
    }
  }

  function animateScoreCircle(progressEl, score) {
    if (!GSAP_AVAILABLE || !progressEl || durationScale === 0) return;
    try {
      const circumference = 2 * Math.PI * 52;
      const offset = circumference - (score / 100) * circumference;

      gsap.set(progressEl, {
        strokeDasharray: circumference,
        strokeDashoffset: circumference
      });

      gsap.to(progressEl, {
        strokeDashoffset: offset,
        duration: 1.5 * durationScale,
        ease: 'power3.inOut',
        delay: 0.4
      });
    } catch (e) { /* ignore */ }
  }

  // ============================================
  // Results Entry (full timeline orchestration)
  // ============================================
  function animateResults() {
    if (!GSAP_AVAILABLE || durationScale === 0) return;
    try {
      const hero = document.querySelector('.persona-hero');
      const scoreCircle = document.querySelector('.score-circle');
      const tierBadge = document.querySelector('.tier-badge');
      const metaChips = document.querySelectorAll('.meta-chip');
      const resultSections = document.querySelectorAll('.result-section');

      // Set initial states
      if (hero) gsap.set(hero, { y: 40, autoAlpha: 0 });
      if (scoreCircle) gsap.set(scoreCircle, { scale: 0.5, autoAlpha: 0 });
      if (tierBadge) gsap.set(tierBadge, { scale: 0.7, autoAlpha: 0 });
      if (metaChips.length) gsap.set(metaChips, { y: 10, autoAlpha: 0 });
      if (resultSections.length) gsap.set(resultSections, { y: 30, autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out', duration: 0.6 * durationScale },
        onComplete: () => {
          // Clear all inline styles so elements stay visible
          const allEls = [hero, scoreCircle, tierBadge, ...metaChips, ...resultSections];
          allEls.forEach(el => { if (el) gsap.set(el, { clearProps: 'all' }); });
        }
      });

      // Hero card
      if (hero) tl.to(hero, { y: 0, autoAlpha: 1, duration: 0.7 * durationScale });

      // Score circle with elastic feel
      if (scoreCircle) tl.to(scoreCircle, {
        scale: 1, autoAlpha: 1,
        duration: 0.8 * durationScale,
        ease: 'back.out(1.7)'
      }, '-=0.4');

      // Tier badge
      if (tierBadge) tl.to(tierBadge, {
        scale: 1, autoAlpha: 1,
        duration: 0.4 * durationScale,
        ease: 'back.out(2)'
      }, '-=0.5');

      // Meta chips staggered
      if (metaChips.length) tl.to(metaChips, {
        y: 0, autoAlpha: 1,
        stagger: { amount: 0.3, from: 'start' },
        duration: 0.3 * durationScale
      }, '-=0.3');

      // Result sections staggered cascade
      if (resultSections.length) tl.to(resultSections, {
        y: 0, autoAlpha: 1,
        stagger: { amount: 0.5, from: 'start' },
        duration: 0.5 * durationScale
      }, '-=0.2');
    } catch (e) { /* ignore */ }
  }

  // ============================================
  // Dimension Bars (staggered fill)
  // ============================================
  function animateDimensionBars() {
    if (!GSAP_AVAILABLE || durationScale === 0) return;
    try {
      const bars = document.querySelectorAll('.dimension-bar-fill');
      bars.forEach((bar, index) => {
        const width = bar.style.width || '0%';
        gsap.set(bar, { width: '0%' });
        gsap.to(bar, {
          width: width,
          duration: 0.8 * durationScale,
          delay: 0.6 + index * 0.08,
          ease: 'power2.out'
        });
      });
    } catch (e) { /* ignore */ }
  }

  // ============================================
  // List Items Animation
  // ============================================
  function animateListItems(containerSelector) {
    if (!GSAP_AVAILABLE || durationScale === 0) return;
    try {
      const items = document.querySelectorAll(containerSelector + ' li');
      if (items.length) {
        gsap.from(items, {
          x: -20,
          autoAlpha: 0,
          duration: 0.35 * durationScale,
          stagger: { amount: 0.4, from: 'start' },
          ease: 'power2.out'
        });
      }
    } catch (e) { /* ignore */ }
  }

  // ============================================
  // Validation items animation
  // ============================================
  function animateValidations() {
    if (!GSAP_AVAILABLE || durationScale === 0) return;
    try {
      const items = document.querySelectorAll('.validation-item');
      if (items.length) {
        gsap.from(items, {
          x: -15,
          autoAlpha: 0,
          duration: 0.3 * durationScale,
          stagger: { amount: 0.3, from: 'start' },
          ease: 'power2.out'
        });
      }
    } catch (e) { /* ignore */ }
  }

  // ============================================
  // Algorithmic Score Bar
  // ============================================
  function animateAlgoBar(barEl, percentage) {
    if (!GSAP_AVAILABLE || !barEl || durationScale === 0) {
      if (barEl) barEl.style.width = percentage + '%';
      return;
    }
    try {
      gsap.from(barEl, { width: '0%', duration: 0 });
      gsap.to(barEl, {
        width: percentage + '%',
        duration: 1.2 * durationScale,
        ease: 'power3.out',
        delay: 0.3
      });
    } catch (e) {
      if (barEl) barEl.style.width = percentage + '%';
    }
  }

  // ============================================
  // Button Loading feedback
  // ============================================
  function animateButtonLoading(btn, isLoading) {
    if (!btn || !GSAP_AVAILABLE || durationScale === 0) return;
    try {
      if (isLoading) {
        gsap.to(btn, { scale: 0.96, duration: 0.2, ease: 'power2.in' });
      } else {
        gsap.to(btn, { scale: 1, duration: 0.3, ease: 'back.out(1.4)' });
      }
    } catch (e) { /* ignore */ }
  }

  // ============================================
  // Avatar Reveal
  // ============================================
  function animateAvatarReveal(avatarImg) {
    if (!avatarImg || !GSAP_AVAILABLE || durationScale === 0) return;
    try {
      gsap.from(avatarImg, {
        scale: 0.3,
        autoAlpha: 0,
        rotation: -10,
        duration: 0.7 * durationScale,
        ease: 'back.out(1.7)'
      });
    } catch (e) { /* ignore */ }
  }

  // ============================================
  // Export Button Reveal
  // ============================================
  function animateExportReveal(btn) {
    if (!btn || !GSAP_AVAILABLE || durationScale === 0) return;
    try {
      gsap.from(btn, {
        scale: 0,
        autoAlpha: 0,
        duration: 0.4 * durationScale,
        ease: 'back.out(2)'
      });
    } catch (e) { /* ignore */ }
  }

  // ============================================
  // Loading Steps (sequential activation)
  // ============================================
  function animateLoadingSteps() {
    if (!GSAP_AVAILABLE || durationScale === 0) {
      // Fallback: activate all steps immediately
      document.querySelectorAll('.step').forEach(s => s.classList.add('active'));
      return;
    }
    try {
      const steps = document.querySelectorAll('.step');
      const tl = gsap.timeline();

      steps.forEach((step, idx) => {
        tl.to(step, {
          duration: 0.01,
          onStart: () => step.classList.add('active')
        }, idx * 0.8 * durationScale);

        // Animate indicator glow
        const indicator = step.querySelector('.step-indicator');
        if (indicator) {
          tl.from(indicator, {
            scale: 0,
            duration: 0.3 * durationScale,
            ease: 'back.out(2)'
          }, idx * 0.8 * durationScale);
        }
      });
    } catch (e) { /* ignore */ }
  }

  // ============================================
  // Cleanup
  // ============================================
  function killActiveTimelines() {
    if (!GSAP_AVAILABLE) return;
    try {
      gsap.killTweensOf('.result-section, .persona-hero, .meta-chip, .dimension-bar-fill');
    } catch (e) { /* ignore */ }
  }

  // ============================================
  // Initialize on load
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGSAP);
  } else {
    initGSAP();
  }

  // ============================================
  // Public API
  // ============================================
  window.Animations = {
    initEntryAnimations,
    initMicroInteractions,
    animateToState,
    animateModalIn,
    animateModalOut,
    animateProgressBar,
    animateScoreCounter,
    animateScoreCircle,
    animateResults,
    animateDimensionBars,
    animateListItems,
    animateValidations,
    animateAlgoBar,
    animateButtonLoading,
    animateAvatarReveal,
    animateExportReveal,
    animateLoadingSteps,
    killActiveTimelines,
    initGSAP
  };
})();
