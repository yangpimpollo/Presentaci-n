// ══════════════════════════════════════════════════════════════════════════
// CAPA DE APLICACIÓN (APPLICATION LAYER / CASOS DE USO)
// ──────────────────────────────────────────────────────────────────────────
// Responsabilidad: Contiene las reglas y algoritmos específicos de la
// aplicación (casos de uso). Orquesta el flujo de datos desde la infraestructura
// y el dominio para realizar cálculos de negocio (ej. promedios, coberturas).
// No se preocupa de cómo se muestran los datos ni de dónde proceden físicamente.
// ══════════════════════════════════════════════════════════════════════════

import { DATABASE } from '../infrastructure/database.js';
import { GRUPOS_CURSOS, CICLO } from '../domain/syllabus.js';

/**
 * Calcula el rendimiento acumulado de un curso sumando correctas, incorrectas y blancas.
 */
export function calcularRendimientoCurso(curso, semanas) {
  let correctas = 0;
  let blancas = 0;
  let incorrectas = 0;
  let preguntas = 0;
  
  semanas.forEach(s => {
    const dataCurso = DATABASE[s]?.cursos[curso];
    if (!dataCurso) return;
    correctas += dataCurso.correctas;
    blancas += dataCurso.blancas || 0;
    incorrectas += dataCurso.incorrectas || 0;
    preguntas += dataCurso.preguntas;
  });
  
  return {
    correctas,
    blancas,
    incorrectas,
    preguntas,
    precision: preguntas > 0 ? (correctas / preguntas) * 100 : 0
  };
}

/**
 * Obtiene el rendimiento de todos los temas de un curso evaluados en el periodo seleccionado.
 */
export function calcularTemasCurso(curso, semanas) {
  const temasRes = [];
  
  semanas.forEach(s => {
    const dataCurso = DATABASE[s]?.cursos[curso];
    if (!dataCurso) return;

    temasRes.push({
      nombre: dataCurso.tema,
      semana: s,
      correctas: dataCurso.correctas,
      blancas: dataCurso.blancas || 0,
      incorrectas: dataCurso.incorrectas || 0,
      preguntas: dataCurso.preguntas,
      precision: dataCurso.precision,
      subtemas: dataCurso.subtemas
    });
  });
  
  return temasRes;
}

/**
 * Obtiene los subtemas granulares asociados a un tema de un curso.
 */
export function calcularSubtemasTema(curso, temaNombre) {
  let subtemasRes = [];
  
  for (let s = 1; s <= CICLO.semanas; s++) {
    const dataCurso = DATABASE[s]?.cursos[curso];
    if (dataCurso && dataCurso.tema === temaNombre) {
      Object.entries(dataCurso.subtemas).forEach(([sub, det]) => {
        subtemasRes.push({
          nombre: sub,
          correctas: det.correctas,
          blancas: det.blancas || 0,
          incorrectas: det.incorrectas || 0,
          preguntas: det.preguntas,
          precision: det.precision
        });
      });
      break;
    }
  }
  
  return subtemasRes;
}

/**
 * Calcula los promedios globales agregados por cada grupo académico.
 */
export function calcularResumenGrupos(semanas) {
  const resumen = {};
  
  Object.entries(GRUPOS_CURSOS).forEach(([grupo, cursos]) => {
    let correctas = 0;
    let blancas = 0;
    let incorrectas = 0;
    let preguntas = 0;
    
    cursos.forEach(curso => {
      const rend = calcularRendimientoCurso(curso, semanas);
      correctas += rend.correctas;
      blancas += rend.blancas;
      incorrectas += rend.incorrectas;
      preguntas += rend.preguntas;
    });
    
    resumen[grupo] = {
      correctas,
      blancas,
      incorrectas,
      preguntas,
      precision: preguntas > 0 ? (correctas / preguntas) * 100 : 0,
      cursosActivos: cursos.length
    };
  });
  
  return resumen;
}
