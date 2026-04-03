/**
 * Scoring Algorithm Local para ICP
 * Proporciona un score algorítmico base que complementa el análisis del LLM
 * Adaptado para variables basadas en rangos y SMLV
 */

const SMLV = 1423500; // SMLV 2025 Colombia

const SCORING_WEIGHTS = {
  // Pesos por dimensión
  dimensions: {
    demographic: 0.20,      // 20% del score total
    financial: 0.25,        // 25% del score total
    professional: 0.25,     // 25% del score total
    motivation: 0.30        // 30% del score total (incluye objetivo postgrado)
  },

  // Ponderación individual de cada variable
  variables: {
    V01_rangoEdad: {
      weight: 0.10,
      // Rangos: 1=18-24, 2=25-30, 3=31-35, 4=36-40, 5=41-45, 6=46-50, 7=51-60, 8=61+
      scores: { 1: 40, 2: 90, 3: 100, 4: 85, 5: 70, 6: 55, 7: 35, 8: 15 }
    },
    V03_formacion: {
      weight: 0.20,
      scores: { 1: 5, 2: 15, 3: 30, 4: 60, 5: 85, 6: 100 }
    },
    V13_formacionPrevia: {
      weight: 0.10,
      scores: { 1: 5, 2: 15, 3: 30, 4: 60, 5: 85, 6: 100 }
    },
    V04_estrato: {
      weight: 0.15,
      scores: { 1: 10, 2: 20, 3: 40, 4: 65, 5: 85, 6: 100 }
    },
    V05_salarioSMLV: {
      weight: 0.25,
      // 1=<1SMLV, 2=1-2, 3=2-4, 4=4-6, 5=6-10, 6=>10
      scores: { 1: 10, 2: 25, 3: 50, 4: 75, 5: 90, 6: 100 }
    },
    V06_redes: {
      weight: 0.10,
      // 1=Ninguna, 2=Facebook, 3=Instagram, 4=LinkedIn, 5=TikTok, 6=Twitter/X, 7=Múltiples
      scores: { 1: 10, 2: 50, 3: 60, 4: 85, 5: 55, 6: 60, 7: 95 }
    },
    V07_ascenso: {
      weight: 0.15,
      scores: { 1: 15, 2: 30, 3: 50, 4: 75, 5: 95 }
    },
    V08_desarrollo: {
      weight: 0.20,
      scores: { 1: 15, 2: 30, 3: 50, 4: 75, 5: 95 }
    },
    V09_empleo: {
      weight: 0.10,
      scores: { 1: 0, 2: 40, 3: 60, 4: 100 }
    },
    V14_objetivo: {
      weight: 0.20,
      // 1=Internacionalización, 2=Crecimiento personal, 3=Ascenso laboral, 4=Emprendimiento, 5=Investigación, 6=Networking, 7=Cambio de carrera
      scores: { 1: 90, 2: 80, 3: 85, 4: 75, 5: 70, 6: 65, 7: 60 }
    }
  }
};

/**
 * Calcula el score para una variable con scoring discreto
 * @param {number} value - Valor de la variable
 * @param {object} config - Configuración de scoring
 * @returns {number} - Score 0-100
 */
function discreteScore(value, config) {
  return config.scores[value] || 0;
}

/**
 * Calcula el ajuste de precio vs salario basado en rangos SMLV
 * @param {number} salaryRange - Rango de salario (1-6)
 * @param {number} priceRange - Rango de precio (1-6)
 * @returns {number} - Ajuste -20 a +20
 */
function calculatePriceFit(salaryRange, priceRange) {
  // Midpoints en SMLV
  const salaryMid = { 1: 0.5, 2: 1.5, 3: 3, 4: 5, 5: 8, 6: 12 };
  const priceMid = { 1: 3, 2: 7.5, 3: 12.5, 4: 17.5, 5: 25, 6: 35 };

  const salary = salaryMid[salaryRange] || 1;
  const price = priceMid[priceRange] || 10;

  // Relación precio vs salario anual (en SMLV)
  const annualSalary = salary * 12;
  const priceRatio = price / annualSalary;

  if (priceRatio <= 0.1) return 20;      // Excelente: <10% del salario anual
  if (priceRatio <= 0.3) return 10;      // Bueno: 10-30%
  if (priceRatio <= 0.5) return 0;       // Regular: 30-50%
  if (priceRatio <= 1.0) return -10;     // Caro: 50-100%
  return -20;                            // Muy caro: >100%
}

/**
 * Calcula el ajuste por rango de edad
 * @param {number} ageRange - Rango de edad (1-8)
 * @returns {number} - Ajuste -15 a +10
 */
function calculateAgeFit(ageRange) {
  const fits = { 1: -5, 2: 10, 3: 10, 4: 5, 5: 0, 6: -5, 7: -10, 8: -15 };
  return fits[ageRange] || 0;
}

/**
 * Score principal por dimensión
 */
function calculateDimensionScores(data) {
  const { V01, V03, V04, V05, V06, V07, V08, V09, V13, V14 } = data;

  // Perfil Demográfico (rango edad + formación + estrato + formación previa)
  const demographicScore =
    (discreteScore(V01, SCORING_WEIGHTS.variables.V01_rangoEdad) * 0.30) +
    (discreteScore(V03, SCORING_WEIGHTS.variables.V03_formacion) * 0.30) +
    (discreteScore(V13 || V03, SCORING_WEIGHTS.variables.V13_formacionPrevia) * 0.15) +
    (discreteScore(V04, SCORING_WEIGHTS.variables.V04_estrato) * 0.25);

  // Capacidad Financiera (salario SMLV + ajuste precio/salario)
  const baseFinancial = discreteScore(V05, SCORING_WEIGHTS.variables.V05_salarioSMLV);
  const priceFit = calculatePriceFit(V05, data.V10);
  const financialScore = Math.max(0, Math.min(100, baseFinancial + priceFit));

  // Perfil Profesional (redes + ascenso + empleo)
  const professionalScore =
    (discreteScore(V06, SCORING_WEIGHTS.variables.V06_redes) * 0.25) +
    (discreteScore(V07, SCORING_WEIGHTS.variables.V07_ascenso) * 0.40) +
    (discreteScore(V09, SCORING_WEIGHTS.variables.V09_empleo) * 0.35);

  // Motivación y Engagement (desarrollo personal + ascenso + objetivo postgrado)
  const motivationScore =
    (discreteScore(V08, SCORING_WEIGHTS.variables.V08_desarrollo) * 0.35) +
    (discreteScore(V07, SCORING_WEIGHTS.variables.V07_ascenso) * 0.25) +
    (discreteScore(V14 || 2, SCORING_WEIGHTS.variables.V14_objetivo) * 0.40);

  return {
    demographic: Math.round(demographicScore),
    financial: Math.round(financialScore),
    professional: Math.round(professionalScore),
    motivation: Math.round(motivationScore)
  };
}

/**
 * Calcula el score total algorítmico
 * @param {object} data - Datos del formulario
 * @returns {object} - Resultado del scoring
 */
function calculateAlgorithmicScore(data) {
  const dimensionScores = calculateDimensionScores(data);
  const { dimensions } = SCORING_WEIGHTS;

  // Score total ponderado
  const totalScore = Math.round(
    (dimensionScores.demographic * dimensions.demographic) +
    (dimensionScores.financial * dimensions.financial) +
    (dimensionScores.professional * dimensions.professional) +
    (dimensionScores.motivation * dimensions.motivation)
  );

  // Ajustes por fit
  const ageFit = calculateAgeFit(data.V01);
  const priceFit = calculatePriceFit(data.V05, data.V10);
  const adjustedScore = Math.max(0, Math.min(100, totalScore + ageFit + priceFit));

  // Determinar tier
  let tier;
  if (adjustedScore >= 85) tier = 'Premium';
  else if (adjustedScore >= 70) tier = 'Alto';
  else if (adjustedScore >= 50) tier = 'Medio';
  else tier = 'Bajo';

  // Análisis rápido de fortalezas y fricciones algorítmicas
  const strengths = [];
  const frictions = [];

  // Rango de edad
  const rangoEdadLabels = { 1: '18-24', 2: '25-30', 3: '31-35', 4: '36-40', 5: '41-45', 6: '46-50', 7: '51-60', 8: '61+' };
  if (data.V01 >= 2 && data.V01 <= 4) {
    strengths.push(`Rango de edad óptimo (${rangoEdadLabels[data.V01]} años) para programas de posgrado`);
  } else if (data.V01 >= 7) {
    frictions.push(`Rango de edad avanzado (${rangoEdadLabels[data.V01]}) puede reducir el ROI`);
  }

  // Formación
  if (data.V03 >= 4) {
    strengths.push(`Nivel de formación alto (${getFormacionLabel(data.V03)})`);
  }

  // Formación previa
  if (data.V13 && data.V13 >= 4) {
    strengths.push(`Formación previa sólida (${getFormacionLabel(data.V13)})`);
  }

  // Estrato
  if (data.V04 >= 4) {
    strengths.push(`Estrato ${data.V04}: mayor capacidad de pago`);
  }

  // Salario SMLV
  if (data.V05 >= 4) {
    strengths.push(`Salario competitivo para inversión educativa`);
  }

  // Fit precio
  if (priceFit >= 10) {
    strengths.push(`Excelente relación precio/salario`);
  } else if (priceFit <= -10) {
    frictions.push(`Precio puede ser prohibitivo para su nivel de ingreso`);
  }

  // Ascenso
  if (data.V07 >= 4) {
    strengths.push(`Alta aspiración de crecimiento profesional`);
  }

  // Empleo
  if (data.V09 === 4) {
    strengths.push(`Perfil empresarial: mayor capacidad de inversión`);
  } else if (data.V09 === 1) {
    frictions.push(`Situación laboral actual puede dificultar el financiamiento`);
  }

  // Objetivo del postgrado
  const objetivoLabels = { 1: 'Internacionalización', 2: 'Crecimiento personal', 3: 'Ascenso laboral', 4: 'Emprendimiento', 5: 'Investigación', 6: 'Networking profesional', 7: 'Cambio de carrera' };
  if (data.V14) {
    strengths.push(`Objetivo claro del postgrado: ${objetivoLabels[data.V14] || 'No especificado'}`);
  }

  // Redes sociales
  if (data.V06 === 7) {
    strengths.push(`Presencia en múltiples redes sociales: mayor alcance digital`);
  } else if (data.V06 === 4) {
    strengths.push(`Presencia en LinkedIn: perfil profesional fuerte`);
  } else if (data.V06 === 1) {
    frictions.push(`Sin presencia en redes sociales`);
  }

  return {
    dimensionScores,
    rawScore: totalScore,
    ageFit,
    priceFit,
    totalScore: adjustedScore,
    tier,
    strengths,
    frictions,
    // Comparación LLM vs Algoritmo
    comparison: {
      description: 'El score algorítmico proporciona una línea base objetiva. El análisis del LLM aporta contexto cualitativo.'
    }
  };
}

/**
 * Helper para obtener label de formación
 */
function getFormacionLabel(value) {
  const map = { 1: 'Bachillerato', 2: 'Técnico', 3: 'Tecnólogo', 4: 'Profesional', 5: 'Especialización', 6: 'Maestría/Doctorado' };
  return map[value] || 'No especificado';
}

module.exports = {
  calculateAlgorithmicScore,
  calculateDimensionScores,
  SCORING_WEIGHTS
};
