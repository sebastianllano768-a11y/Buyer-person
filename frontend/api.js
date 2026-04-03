/**
 * Buyer Persona API Client v2
 * Handles backend communication including avatar image generation
 */
const API = {
  baseURL: window.location.origin,

  /**
   * Sends form data to backend for evaluation + avatar generation
   */
  async evaluateICP(formData) {
    const url = `${this.baseURL}/api/evaluate`;
    const groqApiKey = localStorage.getItem('groq_api_key');
    const hfApiKey = localStorage.getItem('hf_api_key');

    if (!groqApiKey) {
      throw new Error('API key de Groq no configurada. Haz clic en ⚙️ para ingresarla.');
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Groq-API-Key': groqApiKey
      };

      // Send HF token if available for AI avatar generation
      if (hfApiKey && hfApiKey.startsWith('hf_')) {
        headers['X-HF-API-Key'] = hfApiKey;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error?.message || 'Error en la evaluación');
        error.status = response.status;
        error.code = data.error?.code;
        error.details = data.error?.details;
        throw error;
      }

      if (!data.success) {
        const error = new Error(data.error?.message || 'Error desconocido');
        error.code = data.error?.code;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
      }
      throw error;
    }
  },

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/api/health`);
      return response.ok;
    } catch {
      return false;
    }
  },

  collectFormData(form) {
    const formData = new FormData(form);
    const data = {};
    for (let i = 1; i <= 14; i++) {
      const key = `V${i.toString().padStart(2, '0')}`;
      const value = formData.get(key);
      if (value !== null && value !== '') {
        const num = Number(value);
        data[key] = isNaN(num) ? value : num;
      } else {
        data[key] = null;
      }
    }
    return data;
  }
};

window.API = API;
