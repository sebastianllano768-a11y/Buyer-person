/**
 * Genera el prompt estructurado para Groq basado en los datos del usuario
 * @param {object} data - Datos mapeados del usuario
 * @returns {string} - Prompt para Groq
 */
function generateGroqPrompt(data) {
  return `Evalúa el siguiente perfil de cliente ideal para un programa de posgrado en Colombia:

DATOS DEL CANDIDATO:
- Rango de edad: ${data.rangoEdad}
- Género: ${data.genero}
- Nivel de formación actual: ${data.formacion}
- Nivel de formación previa: ${data.formacionPrevia}
- Estrato socioeconómico: ${data.estrato}
- Salario actual: ${data.salarioSMLV}
- Pertenencia a redes sociales: ${data.redesSociales}
- Ascenso laboral: ${data.ascensoLaboral} (1-5)
- Desarrollo personal: ${data.desarrolloPersonal} (1-5)
- Situación laboral: ${data.empleo}
- Objetivo del postgrado: ${data.objetivoPostgrado}
- Precio del programa: ${data.precioSMLV}
- Modalidad preferida: ${data.modalidad}
- Programa de interés: ${data.programa}

Nota: Los salarios y precios están expresados en Salarios Mínimos Legales Vigentes (SMLV) de Colombia 2025.

Proporciona tu análisis en formato JSON con esta estructura exacta:
{
  "validacion": ["mensaje de validación 1", "mensaje de validación 2"],
  "puntajes": [
    {"dimension": "Perfil Demográfico", "puntaje": 0-100, "analisis": "breve análisis"},
    {"dimension": "Capacidad Financiera", "puntaje": 0-100, "analisis": "breve análisis"},
    {"dimension": "Perfil Profesional", "puntaje": 0-100, "analisis": "breve análisis"},
    {"dimension": "Motivación y Engagement", "puntaje": 0-100, "analisis": "breve análisis"},
    {"dimension": "Fit con el Programa", "puntaje": 0-100, "analisis": "breve análisis"}
  ],
  "score_total": número entre 0-100,
  "tier": "Premium | Alto | Medio | Bajo",
  "analisis": ["punto de análisis 1", "punto de análisis 2", "punto de análisis 3"],
  "fortalezas": ["fortaleza 1", "fortaleza 2", "fortaleza 3"],
  "fricciones": ["fricción 1", "fricción 2", "fricción 3"],
  "resumen": "resumen ejecutivo de 2-3 oraciones"
}`;
}

/**
 * Parsea la respuesta de Groq y la valida
 * @param {string} response - Respuesta cruda de Groq
 * @returns {object} - Objeto parseado y validado
 */
function parseGroqResponse(response) {
  if (!response || typeof response !== 'string') {
    throw new Error('La respuesta de Groq está vacía o es inválida');
  }

  let parsed;
  try {
    parsed = JSON.parse(response);
  } catch (e) {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (innerE) {
        throw new Error('No se pudo parsear la respuesta como JSON');
      }
    } else {
      throw new Error('No se encontró JSON en la respuesta');
    }
  }

  // Validar estructura mínima
  const requiredFields = ['validacion', 'puntajes', 'score_total', 'tier', 'analisis', 'fortalezas', 'fricciones', 'resumen'];
  const missingFields = requiredFields.filter(field => !(field in parsed));

  if (missingFields.length > 0) {
    throw new Error(`La respuesta falta los campos requeridos: ${missingFields.join(', ')}`);
  }


  // Asegurar que puntajes sea un array
  if (!Array.isArray(parsed.puntajes)) parsed.puntajes = [];

  // Asegurar arrays
  parsed.validacion = Array.isArray(parsed.validacion) ? parsed.validacion : [];
  parsed.analisis = Array.isArray(parsed.analisis) ? parsed.analisis : [];
  parsed.fortalezas = Array.isArray(parsed.fortalezas) ? parsed.fortalezas : [];
  parsed.fricciones = Array.isArray(parsed.fricciones) ? parsed.fricciones : [];

  // Asegurar que score_total sea número
  parsed.score_total = Number(parsed.score_total) || 0;

  return parsed;
}

module.exports = {
  generateGroqPrompt,
  parseGroqResponse
};
