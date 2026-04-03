/**
 * Genera imágenes usando Hugging Face Serverless Inference API
 * Modelo: FLUX.1-schnell (Rápido, alta calidad, gratuito con Token)
 * Descarga la imagen en el backend para evitar bloqueos del navegador y permitir
 * el fallback a SVG si la key es inválida o falla.
 * @param {string} prompt - Prompt para generar la imagen
 * @param {string} apiKey - API Token de Hugging Face
 * @param {number} retries - Número de reintentos
 * @returns {Promise<object>} - Datos con la URL de la imagen en Base64
 */
async function generateImage(prompt, apiKey = '', retries = 2) {
  const axios = require('axios');
  
  const imagePrompt = cleanPromptForImage(prompt);
  
  if (!apiKey) {
    throw new Error('Servicio de imagen requiere API Token de Hugging Face');
  }

  // Endpoint de FLUX en Hugging Face (Nuevo router API debido a deprecación 410 del anterior)
  const hfUrl = 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Hugging Face AI - Intento ${attempt} de ${retries}...`);
      
      const response = await axios.post(
        hfUrl,
        { 
          inputs: imagePrompt,
          parameters: {
            width: 1024,
            height: 1024,
            num_inference_steps: 4
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'image/jpeg'
          },
          timeout: 45000,
          responseType: 'arraybuffer'
        }
      );

      const contentType = response.headers['content-type'] || 'image/jpeg';
      const base64Image = Buffer.from(response.data).toString('base64');
      const dataUrl = `data:${contentType};base64,${base64Image}`;

      return {
        url: dataUrl,
        revised_prompt: imagePrompt,
        model: 'flux-1-schnell',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      const isUnauthorized = error.response && error.response.status === 401;
      const isForbidden = error.response && error.response.status === 403;
      const isModelLoading = error.response && error.response.status === 503;
      
      let errorMsg = error.message;
      if (error.response && error.response.data) {
        try {
          const rawError = Buffer.from(error.response.data).toString('utf8');
          errorMsg += ` - Detalles reales de HF: ${rawError}`;
        } catch (e) {}
      }

      if (isUnauthorized) errorMsg = '401 Unauthorized (Se requiere Token válido)';
      if (isForbidden) errorMsg = '403 Forbidden (Hugging Face: Token sin permisos o modelo requiere aceptar términos)';
      
      console.warn(`Hugging Face AI - Error en intento ${attempt}: ${errorMsg}`);
      
      if (attempt === retries || isUnauthorized || isForbidden) {
        throw new Error(isUnauthorized || isForbidden ? errorMsg : 'Servicio de imagen no disponible');
      }
      
      // Si el modelo está cargando, esperamos 5 segundos antes de reintentar
      await new Promise(resolve => setTimeout(resolve, isModelLoading ? 5000 : 2000));
    }
  }
}

/**
 * Limpia el prompt para la generación de imagen
 * @param {string} prompt - Prompt original
 * @returns {string} - Prompt limpio
 */
function cleanPromptForImage(prompt) {
  // Remove technical instructions and keep visual description
  let cleaned = prompt
    .replace(/Responde SOLO con JSON/gi, '')
    .replace(/formato exacto/gi, '')
    .replace(/importante/gi, '')
    .replace(/sin texto adicional/gi, '')
    .replace(/sin markdown/gi, '')
    .replace(/explicaciones/gi, '')
    .replace(/[\{\}\[\]\(\)]/g, '') // Remove brackets/parentheses that can break URLs
    .replace(/\s+/g, ' ') // Quitar espacios múltiples
    .trim();

  // Limit length for URL safety (approx 800 chars is usually safe)
  return cleaned.substring(0, 800);
}

module.exports = {
  generateImage
};
