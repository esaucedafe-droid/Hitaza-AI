import { config } from 'dotenv';
config();

const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const MODES = {
  NORMAL: 'NORMAL',
  RESUMEN: 'RESUMEN',
  INFORMACION_ACTUAL: 'INFORMACIÓN ACTUAL',
  BUSCAR_MAS_AFONDO: 'BUSCAR MÁS A FONDO',
  INFORMACION_GENERAL: 'INFORMACIÓN GENERAL',
};

function detectIntent(message) {
  const lower = message.toLowerCase();

  if (/(hola|buenas|buenos días|buenas tardes|buenas noches)/.test(lower)) {
    return 'saludo';
  }
  if (/(te quiero|me siento|estoy triste|ansioso|deprim|estres|angust|enfad|enoj|celos|apoyo)/.test(lower)) {
    return 'emocional';
  }
  if (/(hacer una broma|chiste|qué es|qué significa|cuál es|por qué|cómo)/.test(lower)) {
    return 'general';
  }
  if (/(física|química|astronom|planeta|agujero negro|galaxia|cosmolog|universo|exoplan|neutrino|tejido)/.test(lower)) {
    return 'ciencia';
  }
  if (/(filosof|ética|existencia|ser|consciencia|libertad|sentido|realidad|muerte|vida extraterrestre)/.test(lower)) {
    return 'filosofia';
  }
  if (/(fortnite|minecraft|lol|valorant|cyberpunk|pokemon|zelda|steam|xbox|playstation|pc gaming|juego)/.test(lower)) {
    return 'videojuegos';
  }
  if (/(actual|reciente|hoy|últimas|2025|2026|noticias|lanzamiento|anuncio|declaración|nasa|spacex)/.test(lower)) {
    return 'actual';
  }
  if (/(qué opinas|crees que|piensas sobre|te parece)/.test(lower)) {
    return 'opinion';
  }

  return 'general';
}

function buildSystemPrompt(mode) {
  const base = `Eres HITAZA, un asistente personal con personalidad cercana, técnica, cordial y un poco informal cuando encaja. Hablas como un colega inteligente. Tu tema principal es videojuegos, pero también dominas astronomía, astrofísica, ciencia, filosofía y preguntas generales. Tu tono cambia según la situación: serio cuando hace falta, cercano y natural en conversaciones normales.`;

  switch (mode) {
    case MODES.RESUMEN:
      return `${base} Responde con brevedad, clara y directa. Prioriza lo esencial, sin perder precisión.`;
    case MODES.INFORMACION_ACTUAL:
      return `${base} Prioriza información reciente, fiables y actualizada. Si no tienes datos actuales, dilo claramente y evita inventar novedades. Cuando algo depende de información reciente, indica que necesita comprobación y fuentes oficiales. `;
    case MODES.BUSCAR_MAS_AFONDO:
      return `${base} Responde con profundidad, compara ideas, explica contexto y da una respuesta más completa y razonada. Si hay una diferencia entre hechos, teorías e hipótesis, hazla visible.`;
    case MODES.INFORMACION_GENERAL:
      return `${base} Responde con conocimiento general útil, sin entrar en información reciente salvo que sea imprescindible. Mantén una explicación accesible y equilibrada.`;
    default:
      return `${base} Responde de forma equilibrada: natural, útil y con una profundidad adecuada al tema.`;
  }
}

function buildScienceSections(message, mode) {
  const lower = message.toLowerCase();

  if (/(agujero negro|galaxia|planeta|estrella|universo|cosmolog|astrofis|espacio)/.test(lower)) {
    return `
HECHOS COMPROBADOS:
- Los agujeros negros son regiones del espacio-tiempo con gravedad extrema.
- Las estrellas nacen en nubes cósmicas, generan energía por fusión y terminan de distintas maneras según su masa.
- Las galaxias son enormes agrupaciones de estrellas, gas, polvo y materia oscura.

TEORÍAS/EXPLICACIONES CIENTÍFICAS:
- La relatividad general explica cómo la masa curva el espacio-tiempo.
- La cosmología actual describe un universo en expansión que comenzó con el Big Bang.

HIPÓTESIS:
- La materia oscura y la energía oscura explican fenómenos observados, pero aún no se conocen de forma directa.

OPINIONES O INTERPRETACIONES:
- La idea de que el universo esté "hecho para nosotros" es una interpretación filosófica, no una conclusión científica.`;
  }

  return '';
}

function buildLocalResponse(message, mode) {
  const lower = message.toLowerCase();
  const intent = detectIntent(message);
  const scienceInfo = buildScienceSections(message, mode);

  let intro = '';
  if (intent === 'emocional') {
    intro = 'Entiendo que te haya tocado algo. Hablar de eso cuenta y no tienes que resolverlo solo en un instante.';
  } else if (intent === 'filosofia') {
    intro = 'La filosofía no se reduce a “depende”. Si lo piensas bien, hay argumentos que ayudan a distinguir entre lo observable y lo interpretado.';
  } else if (intent === 'videojuegos') {
    intro = 'Buena pregunta de gaming. Hay dos cosas que suelen importar: lo que hizo bien el juego y cómo lo siente la comunidad.';
  } else if (intent === 'ciencia') {
    intro = 'Vamos a separar bien los niveles: lo que sabemos, lo que se explica con teoría y lo que sigue siendo hipótesis.';
  } else if (intent === 'actual') {
    intro = 'Eso depende de información reciente y de fuentes oficiales. Sin mirar la última actualización, no conviene afirmar novedades como hechos.';
  } else {
    intro = 'Sí, esa es una buena pregunta para ponerla en contexto.';
  }

  let body = '';
  if (intent === 'filosofia') {
    body = `
Desde una postura razonada, la idea de que exista vida extraterrestre no es absurda. La ciencia no ha probado vida fuera de la Tierra, pero el universo es enorme y las condiciones necesarias para la vida no parecen imposibles. También hay argumentos sólidos a favor de la cautela: no sabemos qué formas de vida puede haber, ni si la vida avanzada necesita condiciones parecidas a la terrestre.

Mi postura personal sería: no hay pruebas de vida extraterrestre, pero tampoco hay un argumento científico fuerte para descartarla. En otras palabras: la falta de evidencia no es evidencia de falta.`;
  } else if (intent === 'ciencia') {
    body = `
${scienceInfo || 'La ciencia funciona mejor cuando distingue entre observación, teoría e hipótesis. Un dato observado es muy distinto de una explicación que todavía está en discusión.'}

En general, el mejor enfoque es: mirar pruebas, ver qué predice la teoría y reconocer cuándo seguimos sin saber algo con certeza.`;
  } else if (intent === 'videojuegos') {
    body = 'Si hablamos de videojuegos, lo importante suele ser la jugabilidad, la identidad del juego, la comunidad y, claro, si la propuesta aporta algo realmente memorable. No todo debe evaluarse solo por gráficos o marketing.';
  } else if (intent === 'emocional') {
    body = 'No necesitas tenerlo todo resuelto ahora mismo. A veces lo más útil es reducir la intensidad del problema, ponerle nombre y volver a revisarlo con calma.';
  } else if (intent === 'actual') {
    body = 'Si la pregunta exige información actual, conviene buscar la fuente oficial más reciente: una web del estudio, una nota de la agencia o documentación actualizada. La velocidad de la información cambia mucho el contexto.';
  } else if (/(chiste|broma|humor)/.test(lower)) {
    body = 'No lo tomo como amenaza, pero si la ciencia te da un agujero negro, yo te doy una explicación más corta: “todo se comprime cuando la gravedad decide hacer el trabajo pesado”.';
  } else {
    body = 'La idea clave aquí es poner la pregunta en su contexto correcto: si es técnica, sería mejor hablar de mecanismos y detalles; si es filosófica, importa la postura y los argumentos; si es general, una respuesta clara suele bastar.';
  }

  if (mode === MODES.RESUMEN) {
    return `${intro} ${body}`.replace(/\s+/g, ' ').trim();
  }

  if (mode === MODES.BUSCAR_MAS_AFONDO) {
    return `${intro}\n\n${body}\n\nSi quieres, puedo ir más allá: te lo explico desde una perspectiva técnica, filosófica o con un ejemplo concreto.`;
  }

  if (mode === MODES.INFORMACION_ACTUAL) {
    return `${intro}\n\n${body}\n\nComo regla práctica: prefiero fuentes oficiales y actualizadas antes que rumores o interpretaciones de terceros.`;
  }

  if (mode === MODES.INFORMACION_GENERAL) {
    return `${intro}\n\n${body}`;
  }

  return `${intro}\n\n${body}`;
}

async function callOpenAI(message, mode, history = []) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const client = new OpenAI({ apiKey });
  const promptHistory = history.slice(-8).map((entry) => ({
    role: entry.role === 'assistant' ? 'assistant' : 'user',
    content: entry.content,
  }));

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: buildSystemPrompt(mode) },
      ...promptHistory,
      { role: 'user', content: message },
    ],
    temperature: 0.8,
  });

  return response.choices[0]?.message?.content?.trim() || null;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'HITAZA' });
});

app.post('/api/chat', async (req, res) => {
  const { message, mode = MODES.NORMAL, history = [] } = req.body || {};

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'Falta el texto del mensaje.' });
  }

  try {
    const aiReply = (await callOpenAI(String(message).trim(), mode, history)) || buildLocalResponse(String(message).trim(), mode);
    return res.json({ reply: aiReply });
  } catch (error) {
    return res.json({ reply: buildLocalResponse(String(message).trim(), mode) });
  }
});

app.listen(port, () => {
  console.log(`HITAZA backend escuchando en http://localhost:${port}`);
});
