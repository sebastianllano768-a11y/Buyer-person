/**
 * Genera un avatar SVG representativo del candidato
 * @param {object} data - Datos del usuario
 * @param {object} evaluation - Resultado de la evaluación
 * @returns {object} - Avatar como data URL SVG
 */
function generateAvatarSVG(data, evaluation) {
  const tier = evaluation?.tier || 'Medio';
  const tierColors = {
    'Premium': { primary: '#FFD700', secondary: '#FFA500', bg: '#1a1a2e' },
    'Alto': { primary: '#22C55E', secondary: '#4ADE80', bg: '#0f3460' },
    'Medio': { primary: '#6366F1', secondary: '#8B5CF6', bg: '#16213e' },
    'Bajo': { primary: '#F59E0B', secondary: '#FBBF24', bg: '#1e1e2e' }
  };
  const colors = tierColors[tier] || tierColors['Medio'];

  const age = data.edad || 30;
  const genero = data.genero || 'Masculino';
  const formacion = data.formacion || 'Profesional';

  // Determinar estilo basado en datos
  const isFemale = genero === 'Femenino';
  const hasHighEdu = formacion.includes('Maestría') || formacion.includes('Doctorado') || formacion.includes('Especialización');

  // Colores del avatar
  const skinTone = '#D4A574';
  const hairColor = '#2D2D2D';
  const clothesColor = colors.primary;

  // SVG del avatar
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.bg}"/>
      <stop offset="100%" style="stop-color:#0a0f1a"/>
    </linearGradient>
    <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.primary}"/>
      <stop offset="100%" style="stop-color:${colors.secondary}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="${colors.primary}" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="200" height="200" fill="url(#bgGrad)" rx="20"/>

  <!-- Decorative circles -->
  <circle cx="30" cy="30" r="40" fill="${colors.primary}" opacity="0.1"/>
  <circle cx="170" cy="170" r="50" fill="${colors.secondary}" opacity="0.1"/>

  <!-- Avatar container circle -->
  <circle cx="100" cy="100" r="70" fill="url(#circleGrad)" filter="url(#shadow)"/>

  <!-- Head -->
  <ellipse cx="100" cy="85" rx="${isFemale ? 28 : 32}" ry="${isFemale ? 32 : 30}" fill="${skinTone}"/>

  <!-- Hair -->
  ${isFemale ? `
    <path d="M70 75 Q75 50 100 45 Q125 50 130 75 Q125 65 100 62 Q75 65 70 75" fill="${hairColor}"/>
    <ellipse cx="72" cy="80" rx="8" ry="20" fill="${hairColor}"/>
    <ellipse cx="128" cy="80" rx="8" ry="20" fill="${hairColor}"/>
  ` : `
    <ellipse cx="100" cy="65" rx="35" ry="20" fill="${hairColor}"/>
    <rect x="65" y="55" width="70" height="25" rx="5" fill="${hairColor}"/>
  `}

  <!-- Eyes -->
  <ellipse cx="88" cy="82" rx="5" ry="6" fill="#2D2D2D"/>
  <ellipse cx="112" cy="82" rx="5" ry="6" fill="#2D2D2D"/>
  <circle cx="90" cy="80" r="2" fill="white"/>
  <circle cx="114" cy="80" r="2" fill="white"/>

  <!-- Eyebrows -->
  <path d="M80 72 Q88 69 96 72" stroke="#2D2D2D" stroke-width="2" fill="none"/>
  <path d="M104 72 Q112 69 120 72" stroke="#2D2D2D" stroke-width="2" fill="none"/>

  <!-- Nose -->
  <path d="M100 85 Q103 95 100 100" stroke="${skinTone}" stroke-width="2" fill="none" opacity="0.5"/>

  <!-- Smile -->
  <path d="M90 105 Q100 115 110 105" stroke="#2D2D2D" stroke-width="2" fill="none" stroke-linecap="round"/>

  <!-- Body/Shoulders -->
  <path d="M50 160 Q60 130 100 125 Q140 130 150 160 L150 200 L50 200 Z" fill="${clothesColor}"/>

  <!-- Collar -->
  <path d="M85 125 L100 140 L115 125" fill="white" opacity="0.3"/>

  <!-- Tier badge -->
  <rect x="65" y="165" width="70" height="22" rx="11" fill="${colors.primary}" opacity="0.9"/>
  <text x="100" y="181" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="white" text-anchor="middle">${tier.toUpperCase()}</text>

  <!-- Score -->
  <text x="100" y="50" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${colors.primary}" text-anchor="middle">${evaluation?.score_total || 0}</text>
  <text x="100" y="62" font-family="Arial, sans-serif" font-size="8" fill="${colors.secondary}" text-anchor="middle">PUNTUACIÓN</text>
</svg>`;

  const base64 = Buffer.from(svg).toString('base64');
  return {
    url: `data:image/svg+xml;base64,${base64}`,
    revised_prompt: 'Avatar SVG generado',
    model: 'svg-avatar',
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  generateAvatarSVG
};
