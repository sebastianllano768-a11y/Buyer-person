const express = require('express');
const router = express.Router();
const groqService = require('../services/groqService');
const parser = require('../utils/parser');
const scoringAlgorithm = require('../utils/scoringAlgorithm');
const pollinationsService = require('../services/pollinationsService');
const { generateAvatarSVG } = require('../services/avatarService');

// SMLV 2025 Colombia
const SMLV = 1423500;

// Validación de variables de entrada
const validateInput = (body) => {
  const errors = [];

  if (!body.V01 || body.V01 < 1 || body.V01 > 8) errors.push('V01: Rango de edad debe estar entre 1 y 8');
  if (!body.V02 || body.V02 < 1 || body.V02 > 4) errors.push('V02: Género debe estar entre 1 y 4');
  if (!body.V03 || body.V03 < 1 || body.V03 > 6) errors.push('V03: Nivel de formación actual debe estar entre 1 y 6');
  if (!body.V04 || body.V04 < 1 || body.V04 > 6) errors.push('V04: Estrato social debe estar entre 1 y 6');
  if (!body.V05 || body.V05 < 1 || body.V05 > 6) errors.push('V05: Salario (SMLV) debe estar entre 1 y 6');
  if (!body.V06 || body.V06 < 1 || body.V06 > 7) errors.push('V06: Pertenencia a redes sociales debe estar entre 1 y 7');
  if (!body.V07 || body.V07 < 1 || body.V07 > 5) errors.push('V07: Ascenso laboral debe estar entre 1 y 5');
  if (!body.V08 || body.V08 < 1 || body.V08 > 5) errors.push('V08: Desarrollo personal debe estar entre 1 y 5');
  if (!body.V09 || body.V09 < 1 || body.V09 > 4) errors.push('V09: Situación laboral debe estar entre 1 y 4');
  if (!body.V10 || body.V10 < 1 || body.V10 > 6) errors.push('V10: Precio del programa (SMLV) debe estar entre 1 y 6');
  if (!body.V11 || body.V11 < 1 || body.V11 > 3) errors.push('V11: Modalidad debe estar entre 1 y 3');
  if (!body.V12 || body.V12 < 1 || body.V12 > 66) errors.push('V12: Programa de interés debe estar entre 1 y 66');
  if (!body.V13 || body.V13 < 1 || body.V13 > 6) errors.push('V13: Formación previa debe estar entre 1 y 6');
  if (!body.V14 || body.V14 < 1 || body.V14 > 7) errors.push('V14: Objetivo del postgrado debe estar entre 1 y 7');

  return errors;
};

// Mapeo de valores a labels
const mapValuesToLabels = (data) => {
  const rangoEdadMap = {
    1: '18 - 24 años', 2: '25 - 30 años', 3: '31 - 35 años', 4: '36 - 40 años',
    5: '41 - 45 años', 6: '46 - 50 años', 7: '51 - 60 años', 8: '61+ años'
  };
  const generoMap = { 1: 'Masculino', 2: 'Femenino', 3: 'Otro', 4: 'Prefiero no decir' };
  const formacionMap = { 1: 'Bachillerato', 2: 'Técnico', 3: 'Tecnólogo', 4: 'Profesional', 5: 'Especialización', 6: 'Maestría/Doctorado' };
  const estratoMap = { 1: 'Estrato 1', 2: 'Estrato 2', 3: 'Estrato 3', 4: 'Estrato 4', 5: 'Estrato 5', 6: 'Estrato 6' };
  const salarioSMLVMap = {
    1: 'Menos de 1 SMLV', 2: '1 - 2 SMLV', 3: '2 - 4 SMLV',
    4: '4 - 6 SMLV', 5: '6 - 10 SMLV', 6: 'Más de 10 SMLV'
  };
  const redesMap = {
    1: 'Ninguna', 2: 'Facebook', 3: 'Instagram', 4: 'LinkedIn',
    5: 'TikTok', 6: 'Twitter/X', 7: 'Múltiples redes'
  };
  const ascensoMap = { 1: 'Muy lento', 2: 'Lento', 3: 'Regular', 4: 'Rápido', 5: 'Muy rápido' };
  const desarrolloMap = { 1: 'Muy bajo', 2: 'Bajo', 3: 'Medio', 4: 'Alto', 5: 'Muy alto' };
  const empleoMap = { 1: 'Desempleado', 2: 'Empleado', 3: 'Independiente', 4: 'Empresario' };
  const precioSMLVMap = {
    1: '1 - 5 SMLV', 2: '5 - 10 SMLV', 3: '10 - 15 SMLV',
    4: '15 - 20 SMLV', 5: '20 - 30 SMLV', 6: 'Más de 30 SMLV'
  };
  const modalidadMap = { 1: 'Presencial', 2: 'Virtual', 3: 'Híbrida' };
  const programaMap = {
    1: 'Especialización en Dramaturgia del Actor',
    2: 'Especialización en Gestión Ambiental Local',
    3: 'Especialización en Gestión Ambiental Local (Virtual)',
    4: 'Especialización en Enseñanza de la Física',
    5: 'Especialización en Entrenamiento Deportivo y Readaptación Funcional',
    6: 'Especialización en Gerencia del Deporte',
    7: 'Especialización en Gerencia en Sistemas de Salud',
    8: 'Especialización en Ginecología y Obstetricia',
    9: 'Especialización en Medicina Crítica y Cuidado Intensivo',
    10: 'Especialización en Medicina de Urgencias',
    11: 'Especialización en Medicina Interna',
    12: 'Especialización en Pediatría',
    13: 'Especialización en Psiquiatría',
    14: 'Especialización en Analítica y Ciencia de Datos Aplicada',
    15: 'Especialización en Gerencia de Proyectos',
    16: 'Especialización en Gestión de la Calidad y Normalización Técnica',
    17: 'Especialización en Seguridad y Salud en el Trabajo',
    18: 'Especialización en Soldadura',
    19: 'Especialización en Tecnologías de la Información y las Comunicaciones',
    20: 'Especialización en Logística Empresarial',
    21: 'Maestría en Educación Bilingüe',
    22: 'Maestría en Educación y Arte',
    23: 'Maestría en Estética y Creación',
    24: 'Maestría en Estudios Culturales y Narrativas Contemporáneas',
    25: 'Maestría en Filosofía',
    26: 'Maestría en Literatura',
    27: 'Maestría en Música',
    28: 'Maestría en Ciencias Ambientales',
    29: 'Maestría en Ecotecnología',
    30: 'Maestría en Gestión del Riesgo de Desastres',
    31: 'Maestría en Enseñanza de la Física',
    32: 'Maestría en Enseñanza de la Matemática',
    33: 'Maestría en Instrumentación Física',
    34: 'Maestría en Matemática',
    35: 'Maestría en Comunicación Educativa',
    36: 'Maestría en Educación',
    37: 'Maestría en Educación (Virtual)',
    38: 'Maestría en Historia',
    39: 'Maestría en Infancia',
    40: 'Maestría en Lingüística',
    41: 'Maestría en Migraciones Internacionales',
    42: 'Maestría en Biología Molecular y Biotecnología',
    43: 'Maestría en Gerencia de las Organizaciones del Deporte',
    44: 'Maestría en Gerencia en Sistemas de Salud',
    45: 'Maestría en Administración de Empresas',
    46: 'Maestría en Administración del Desarrollo Humano y Organizacional',
    47: 'Maestría en Administración Económica y Financiera',
    48: 'Maestría en Gestión y Dirección de Proyectos',
    49: 'Maestría en Investigación Operativa y Estadística',
    50: 'Maestría en Sistemas Integrados de Gestión de la Calidad',
    51: 'Maestría en Ingeniería Mecánica',
    52: 'Maestría en Sistemas Automáticos de Producción',
    53: 'Maestría en Ingeniería de Sistemas y Computación',
    54: 'Maestría en Ingeniería Eléctrica',
    55: 'Maestría en Ciencias Químicas',
    56: 'Maestría en Gerencia de la Cadena de Suministros',
    57: 'Maestría en Agronegocios del Café',
    58: 'Maestría en Desarrollo Agroindustrial',
    59: 'Doctorado en Literatura',
    60: 'Doctorado en Ciencias Ambientales',
    61: 'Doctorado en Ciencias',
    62: 'Doctorado en Ciencias de la Educación',
    63: 'Doctorado en Didáctica',
    64: 'Doctorado en Ciencias Biomédicas',
    65: 'Doctorado en Ingeniería',
    66: 'Doctorado en Biotecnología'
  };
  const objetivoMap = {
    1: 'Internacionalización', 2: 'Crecimiento personal', 3: 'Ascenso laboral',
    4: 'Emprendimiento', 5: 'Investigación', 6: 'Networking profesional', 7: 'Cambio de carrera'
  };

  // Calcular valores aproximados de SMLV para el scoring algorítmico
  const salarioMidpoints = { 1: SMLV * 0.5, 2: SMLV * 1.5, 3: SMLV * 3, 4: SMLV * 5, 5: SMLV * 8, 6: SMLV * 12 };
  const precioMidpoints = { 1: SMLV * 3, 2: SMLV * 7.5, 3: SMLV * 12.5, 4: SMLV * 17.5, 5: SMLV * 25, 6: SMLV * 35 };
  // Edad media del rango
  const edadMidpoints = { 1: 21, 2: 27, 3: 33, 4: 38, 5: 43, 6: 48, 7: 55, 8: 65 };

  return {
    rangoEdad: rangoEdadMap[data.V01] || 'No especificado',
    edad: edadMidpoints[data.V01] || 30,
    genero: generoMap[data.V02] || 'No especificado',
    formacion: formacionMap[data.V03] || 'No especificado',
    estrato: estratoMap[data.V04] || 'No especificado',
    salarioSMLV: salarioSMLVMap[data.V05] || 'No especificado',
    salario: salarioMidpoints[data.V05] || 0,
    salarioFormateado: salarioSMLVMap[data.V05] || 'No especificado',
    redesSociales: redesMap[data.V06] || 'No especificado',
    ascensoLaboral: ascensoMap[data.V07] || 'No especificado',
    desarrolloPersonal: desarrolloMap[data.V08] || 'No especificado',
    empleo: empleoMap[data.V09] || 'No especificado',
    precioSMLV: precioSMLVMap[data.V10] || 'No especificado',
    precio: precioMidpoints[data.V10] || 0,
    precioFormateado: precioSMLVMap[data.V10] || 'No especificado',
    modalidad: modalidadMap[data.V11] || 'No especificado',
    programa: programaMap[data.V12] || 'No especificado',
    formacionPrevia: formacionMap[data.V13] || 'No especificado',
    objetivoPostgrado: objetivoMap[data.V14] || 'No especificado'
  };
};

/**
 * Genera un prompt descriptivo para la imagen del avatar
 * Usa múltiples parámetros para generar imágenes diversas y realistas
 */
function buildAvatarPrompt(mappedData, tier) {
  // --- Género ---
  let genderDesc;
  if (mappedData.genero === 'Femenino') {
    genderDesc = 'woman';
  } else if (mappedData.genero === 'Masculino') {
    genderDesc = 'man';
  } else {
    // "Otro" o "Prefiero no decir" → persona sin género específico
    genderDesc = 'person';
  }

  // --- Edad (8 rangos distintos) ---
  const ageDescMap = {
    21: 'young adult in their early twenties',
    27: 'person in their late twenties',
    33: 'person in their early thirties',
    38: 'person in their late thirties',
    43: 'person in their mid forties',
    48: 'person in their late forties',
    55: 'person in their fifties with some gray hair',
    65: 'senior person in their sixties with gray hair'
  };
  const ageDesc = ageDescMap[mappedData.edad] || 'adult';

  // --- Vestimenta según tier + empleo ---
  let dressCode;
  if (tier === 'Premium') {
    dressCode = 'formal executive business suit';
  } else if (tier === 'Alto') {
    dressCode = 'professional business casual attire';
  } else if (mappedData.empleo === 'Empresario') {
    dressCode = 'smart business attire with confident posture';
  } else if (mappedData.empleo === 'Independiente') {
    dressCode = 'modern casual smart clothes';
  } else {
    dressCode = 'casual everyday professional clothing';
  }

  // --- Contexto visual según área del programa ---
  const programa = (mappedData.programa || '').toLowerCase();
  let contextVisual = 'university campus or modern office background';
  
  if (programa.includes('medicina') || programa.includes('pediatría') || programa.includes('ginecología') || programa.includes('psiquiatría') || programa.includes('salud') || programa.includes('biomédicas')) {
    contextVisual = 'modern hospital or clinical setting background';
    dressCode = 'white medical coat over professional clothes';
  } else if (programa.includes('ingeniería') || programa.includes('mecánica') || programa.includes('eléctrica') || programa.includes('sistemas') || programa.includes('soldadura') || programa.includes('producción')) {
    contextVisual = 'engineering laboratory or tech office background';
  } else if (programa.includes('educación') || programa.includes('enseñanza') || programa.includes('didáctica') || programa.includes('infancia') || programa.includes('comunicación educativa')) {
    contextVisual = 'modern classroom or university lecture hall background';
  } else if (programa.includes('arte') || programa.includes('estética') || programa.includes('dramaturgia') || programa.includes('música') || programa.includes('literatura')) {
    contextVisual = 'creative studio or cultural center background';
  } else if (programa.includes('ambiental') || programa.includes('ecotecnología') || programa.includes('riesgo') || programa.includes('agro') || programa.includes('café')) {
    contextVisual = 'lush green natural environment or agricultural field background';
  } else if (programa.includes('deporte') || programa.includes('entrenamiento')) {
    contextVisual = 'sports facility or athletic training center background';
  } else if (programa.includes('administración') || programa.includes('gerencia') || programa.includes('logística') || programa.includes('proyectos') || programa.includes('financiera') || programa.includes('cadena de suministros') || programa.includes('calidad')) {
    contextVisual = 'modern corporate office or boardroom background';
  } else if (programa.includes('biotecnología') || programa.includes('biología') || programa.includes('químicas') || programa.includes('ciencias')) {
    contextVisual = 'scientific research laboratory background';
  } else if (programa.includes('filosofía') || programa.includes('historia') || programa.includes('lingüística') || programa.includes('culturales') || programa.includes('migraciones')) {
    contextVisual = 'university library or humanities study room background';
  } else if (programa.includes('datos') || programa.includes('tecnologías de la información') || programa.includes('computación')) {
    contextVisual = 'modern tech workspace with monitors background';
  }

  // --- Nivel académico ---
  let academicVibe = '';
  if (programa.includes('doctorado')) {
    academicVibe = ', scholarly and intellectual appearance';
  } else if (programa.includes('maestría')) {
    academicVibe = ', professional and studious appearance';
  }

  return `Authentic and realistic headshot portrait of a ${ageDesc} Colombian ${genderDesc}, ${dressCode}. Friendly and approachable expression, natural lighting, real everyday person, not a fashion model, typical Latin American Colombian features, warm skin tone, ${contextVisual}${academicVibe}, candid photography style, photorealistic, 4k quality, high detail`;
}

// POST /api/evaluate
router.post('/evaluate', async (req, res) => {
  try {
    console.log('=== Iniciando evaluación ICP ===');

    // Validar entrada
    const validationErrors = validateInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Datos de entrada inválidos', code: 'VALIDATION_ERROR', details: validationErrors }
      });
    }

    // Mapear valores a etiquetas legibles
    const mappedData = mapValuesToLabels(req.body);

    // Generar prompt para Groq
    const groqPrompt = parser.generateGroqPrompt(mappedData);

    // Consultar Groq
    let groqResult;
    const groqApiKey = req.headers['x-groq-api-key'];
    try {
      groqResult = await groqService.evaluateICP(groqPrompt, groqApiKey);
      console.log('Respuesta Groq recibida');
    } catch (groqError) {
      console.error('Error en Groq:', groqError.message);
      return res.status(502).json({
        success: false,
        error: { message: 'Error al consultar el servicio de IA', code: 'GROQ_ERROR', details: groqError.message }
      });
    }

    // Calcular score algorítmico (pasar datos originales + midpoints para el cálculo)
    const algorithmData = {
      ...req.body,
      V01_midpoint: { 1: 21, 2: 27, 3: 33, 4: 38, 5: 43, 6: 48, 7: 55, 8: 65 }[req.body.V01] || 30,
      V05_midpoint: { 1: SMLV * 0.5, 2: SMLV * 1.5, 3: SMLV * 3, 4: SMLV * 5, 5: SMLV * 8, 6: SMLV * 12 }[req.body.V05] || 0,
      V10_midpoint: { 1: SMLV * 3, 2: SMLV * 7.5, 3: SMLV * 12.5, 4: SMLV * 17.5, 5: SMLV * 25, 6: SMLV * 35 }[req.body.V10] || 0
    };
    const algorithmicScore = scoringAlgorithm.calculateAlgorithmicScore(algorithmData);

    // Parsear resultado de Groq
    let parsedResult;
    try {
      parsedResult = parser.parseGroqResponse(groqResult);
      parsedResult.algorithmicScore = {
        total: algorithmicScore.totalScore,
        dimensions: algorithmicScore.dimensionScores,
        tier: algorithmicScore.tier,
        strengths: algorithmicScore.strengths,
        frictions: algorithmicScore.frictions
      };
    } catch (parseError) {
      console.error('Error al parsear respuesta de Groq:', parseError.message);
      return res.status(502).json({
        success: false,
        error: { message: 'Error al procesar la respuesta del análisis', code: 'PARSE_ERROR', details: parseError.message }
      });
    }

    // ===== GENERAR IMAGEN DEL AVATAR =====
    let avatarData = null;
    const hfApiKey = req.headers['x-hf-api-key'];
    const tier = parsedResult.tier || algorithmicScore.tier || 'Medio';

    if (hfApiKey && hfApiKey.startsWith('hf_')) {
      try {
        const avatarPrompt = buildAvatarPrompt(mappedData, tier);
        console.log('Generando imagen AI con HF FLUX...');
        avatarData = await pollinationsService.generateImage(avatarPrompt, hfApiKey, 2);
        console.log('Imagen AI generada exitosamente');
      } catch (imgError) {
        console.warn('Error generando imagen AI, usando SVG fallback:', imgError.message);
        avatarData = generateAvatarSVG(mappedData, { tier, score_total: parsedResult.score_total });
      }
    } else {
      console.log('No HF token, usando SVG fallback');
      avatarData = generateAvatarSVG(mappedData, { tier, score_total: parsedResult.score_total });
    }

    // Responder al cliente
    res.json({
      success: true,
      data: {
        input: mappedData,
        evaluation: parsedResult,
        avatar: avatarData,
        generatedAt: new Date().toISOString()
      }
    });

    console.log('=== Evaluación completada exitosamente ===');

  } catch (error) {
    console.error('Error inesperado:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' }
    });
  }
});

module.exports = router;
