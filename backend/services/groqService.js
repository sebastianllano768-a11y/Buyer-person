const axios = require('axios');

const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Evalúa el perfil ICP usando la API de Groq
 * @param {string} prompt - Prompt estructurado con los datos del usuario
 * @param {string} apiKey - API key de Groq (del cliente)
 * @returns {Promise<object>} - Respuesta de Groq
 */
async function evaluateICP(prompt, apiKey) {
  if (!apiKey) {
    throw new Error('API key de Groq es requerida');
  }

  const systemPrompt = `Eres un experto analista de marketing educativo especializado en programas de posgrado en Colombia.
Tu tarea es evaluar el Perfil de Cliente Ideal (ICP) de un candidato basándote EXCLUSIVAMENTE en los datos proporcionados.

REGLAS ESTRICTAS:
- NO inventes nombres, cargos, empresas, roles ni títulos que NO estén en los datos proporcionados.
- NO asumas que la persona es "director", "gerente", "coordinador" ni ningún cargo específico a menos que se indique explícitamente.
- Basa tu análisis SOLO en las variables numéricas y categóricas proporcionadas.
- NO menciones carreras, programas ni áreas profesionales específicas que no estén en los datos.
- Usa lenguaje genérico como "el candidato", "el perfil evaluado", etc.

Analiza cada variable y proporciona:
1. Validación de los datos ingresados
2. Puntajes por dimensión (escala 1-100)
3. Score total del perfil
4. Tier del cliente (Premium, Alto, Medio, Bajo)
5. Análisis detallado por categoría
6. Fortalezas del perfil
7. Fricciones o puntos débiles
8. Resumen ejecutivo (basado SOLO en los datos reales proporcionados)

IMPORTANTE: Responde SOLO con JSON válido en el formato exacto solicitado, sin texto adicional, sin markdown, sin explicaciones.`;

  const response = await axios.post(
    GROQ_API_URL,
    {
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.15,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 segundos
    }
  );

  if (!response.data || !response.data.choices || !response.data.choices[0]) {
    throw new Error('Respuesta inválida de la API de Groq');
  }

  const content = response.data.choices[0].message.content;

  if (!content) {
    throw new Error('No se recibió contenido en la respuesta de Groq');
  }

  return content;
}

module.exports = {
  evaluateICP
};
