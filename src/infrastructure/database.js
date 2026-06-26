// ══════════════════════════════════════════════════════════════════════════
// CAPA DE INFRAESTRUCTURA (INFRASTRUCTURE LAYER)
// ──────────────────────────────────────────────────────────────────────────
// Responsabilidad: Implementa el acceso a fuentes de datos externas, APIs,
// bases de datos reales o simuladas. Traduce la información física a estructuras
// que el sistema pueda consumir.
// En este caso, simula una base de datos determinista mediante la semilla Mulberry32
// para garantizar datos variados pero consistentes entre recargas.
// ══════════════════════════════════════════════════════════════════════════

import { CICLO, ALL_CURSOS, PERFILES, SYLLABUS_SAN_MARCOS } from '../domain/syllabus.js';

export let DATABASE = {};

let s1 = 0xDEAEBEEF;

export function initRng(seed = 0xDEAEBEEF) {
  s1 = seed >>> 0;
}

export function rand() {
  s1 = (s1 + 0x6d2b79f5) | 0;
  let t = Math.imul(s1 ^ (s1 >>> 15), 1 | s1);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function rInt(a, b) {
  return Math.floor(rand() * (b - a + 1)) + a;
}

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function generarBaseDeDatos() {
  initRng();
  DATABASE = {};

  for (let s = 1; s <= CICLO.semanas; s++) {
    DATABASE[s] = {
      semana: s,
      tipo: CICLO.semanasFeedback.includes(s) ? 'feedback' : 'avance',
      cursos: {}
    };

    ALL_CURSOS.forEach(curso => {
      const perfil = PERFILES[curso] || { base: 0.7, sigma: 0.08 };
      
      const temasCurso = SYLLABUS_SAN_MARCOS[curso] || [];
      const temaIndex = (s - 1) % temasCurso.length;
      const temaNombre = temasCurso[temaIndex] || `Tema Semanal ${s}`;

      const subtemas = [
        `Conceptos Teóricos de ${temaNombre}`,
        `Práctica Dirigida de ${temaNombre}`,
        `Evaluación Semanal de ${temaNombre}`
      ];

      // Variabilidad simulada con mayor dispersión
      const ruidoSemanal = (rand() - 0.5) * perfil.sigma * 3.6;
      const baseW = clamp(perfil.base + ruidoSemanal, 0.12, 0.99);

      const detallesSubtemas = {};
      let totalCorrectas = 0;
      let totalBlancas = 0;
      let totalIncorrectas = 0;
      let totalPreguntas = 0;

      subtemas.forEach(sub => {
        const ruidoSub = (rand() - 0.5) * 0.08;
        const precisionSub = clamp(baseW + ruidoSub, 0.05, 0.99);

        const preguntas = rInt(CICLO.preguntasPorExamen.min, CICLO.preguntasPorExamen.max);
        const correctas = Math.round(preguntas * precisionSub);
        
        // Simular de 0 a 2 respuestas en blanco sin sobrepasar el total restante
        const blancasMax = Math.max(0, preguntas - correctas);
        const blancas = rInt(0, Math.min(2, blancasMax));
        const incorrectas = preguntas - correctas - blancas;

        detallesSubtemas[sub] = {
          preguntas,
          correctas,
          blancas,
          incorrectas,
          precision: preguntas > 0 ? (correctas / preguntas) * 100 : 0
        };

        totalCorrectas += correctas;
        totalBlancas += blancas;
        totalIncorrectas += incorrectas;
        totalPreguntas += preguntas;
      });

      DATABASE[s].cursos[curso] = {
        tema: temaNombre,
        subtemas: detallesSubtemas,
        correctas: totalCorrectas,
        blancas: totalBlancas,
        incorrectas: totalIncorrectas,
        preguntas: totalPreguntas,
        precision: totalPreguntas > 0 ? (totalCorrectas / totalPreguntas) * 100 : 0
      };
    });
  }
  return DATABASE;
}
export { DATABASE as default };
