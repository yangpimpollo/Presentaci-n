// ══════════════════════════════════════════════════════════════════════════
// CAPA DE UI (INTERFAZ DE USUARIO / PRESENTACIÓN)
// ──────────────────────────────────────────────────────────────────────────
// Responsabilidad: Gestionar la interacción directa con el DOM, el manejo de
// eventos de usuario, el ciclo de vida visual de los filtros y la renderización.
// Cumple con SOLID al separar la manipulación de UI de la lógica de negocio (application)
// y los datos estructurados (domain).
// ══════════════════════════════════════════════════════════════════════════

import { CICLO, GRUPOS_CURSOS, COLORES_CATEGORIA, ICONOS_CATEGORIA, ALL_CURSOS } from '../domain/syllabus.js';
import { generarBaseDeDatos, DATABASE } from '../infrastructure/database.js';
import { calcularRendimientoCurso, calcularTemasCurso, calcularSubtemasTema, calcularResumenGrupos } from '../application/metrics.js';

// Estado global de la interfaz
let activeWeekType = 'avance'; // 'avance' | 'feedback'
let activeWeek = 1;            // Semana seleccionada en modo Semanal
let rangeStartWeek = 1;        // Semana de inicio en modo Acumulado
let rangeEndWeek = 11;         // Semana de fin en modo Acumulado
let isAccumulated = true;
let currentLevel = 'cursos';   // 'cursos' | 'temas' | 'subtemas'
let selectedCourse = null;
let selectedTheme = null;
let sortAscending = true;      // true = menor a mayor desempeño (Worst-to-Best)
let selectedCategory = null;   // Categoría académica para filtrado (Números, Ciencias, etc.)
let activeViewMode = 'rendimiento'; // 'rendimiento' | 'repaso'

// Estado del plan de repaso
let repasoViewType = 'temas';       // 'temas' | 'subtemas'
let repasoFiltroEstado = 'todos';   // 'todos' | 'pendiente' | 'en-progreso' | 'completado'
let repasoFiltroSemana = 'avance';   // 'avance' | 'feedback'
let temasExpandidos = new Set();

const tooltipEl = document.getElementById('tooltip');

/**
 * Determina el grupo académico al que pertenece un curso.
 * (Abstracción de búsqueda para evitar dependencias directas en la vista)
 */
function getNombreGrupoCurso(curso) {
  for (const [grupo, cursos] of Object.entries(GRUPOS_CURSOS)) {
    if (cursos.includes(curso)) return grupo;
  }
  return 'Otros';
}

/**
 * Retorna la variable CSS del color de rendimiento académico.
 * Basado en los rangos definidos por la coordinación pedagógica.
 */
function getColorDesempenio(precision) {
  if (precision < 60) return 'var(--perf-poor)';
  if (precision <= 85) return 'var(--perf-warning)';
  return 'var(--perf-excellent)';
}

/**
 * Obtiene la lista de semanas a evaluar aplicando el filtro de periodo activo.
 */
function getSemanasFiltro() {
  if (activeWeekType === 'comparativa') {
    return [...CICLO.semanasAvance, ...CICLO.semanasFeedback];
  }
  const listaTipo = activeWeekType === 'avance' ? CICLO.semanasAvance : CICLO.semanasFeedback;
  if (isAccumulated) {
    return listaTipo.filter(s => s >= rangeStartWeek && s <= rangeEndWeek);
  }
  return [activeWeek];
}

/**
 * Genera el elemento SVG del anillo de progreso para visualizaciones premium (Didáctico)
 */
function crearSvgCirculoProgreso(precision, color, size = 42, strokeWidth = 4) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * precision) / 100;
  
  return `
    <svg class="progress-ring" width="${size}" height="${size}" style="transform: rotate(-90deg); display: block;">
      <circle class="progress-ring-bg" stroke="var(--border)" stroke-width="${strokeWidth}" fill="transparent" r="${radius}" cx="${size/2}" cy="${size/2}"/>
      <circle class="progress-ring-circle" stroke="${color}" stroke-width="${strokeWidth}" fill="transparent" r="${radius}" cx="${size/2}" cy="${size/2}"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
    </svg>
  `;
}

/**
 * Cambia el nivel de navegación actual y renderiza el contenido correspondiente.
 * Conserva el filtro de categoría seleccionada al navegar (se resetea explícitamente en el breadcrumb "Inicio").
 */
export function navigateTo(level, course = null, theme = null) {
  currentLevel = level;
  selectedCourse = course;
  selectedTheme = theme;
  hideTooltip();
  render();
}

/**
 * Filtra por la categoría académica seleccionada.
 * Si se pulsa de nuevo, limpia el filtro. Si se está en temas/subtemas, regresa al inicio.
 */
export function selectCategory(grupo) {
  console.log("[EduMetric] click en categoría:", grupo);
  if (selectedCategory === grupo) {
    selectedCategory = null;
    console.log("[EduMetric] filtro de categoría desactivado");
  } else {
    selectedCategory = grupo;
    console.log("[EduMetric] filtro de categoría activado:", selectedCategory);
  }
  // Forzar regreso al nivel global de cursos para observar el resultado del filtro
  navigateTo('cursos');
}

export function setViewMode(mode) {
  activeViewMode = mode;
  const menuRendimiento = document.getElementById('menu-rendimiento');
  const menuRepaso = document.getElementById('menu-repaso');
  if (menuRendimiento) menuRendimiento.classList.toggle('active', mode === 'rendimiento');
  if (menuRepaso) menuRepaso.classList.toggle('active', mode === 'repaso');
  render();
}

/**
 * Construye de forma reactiva la ruta de navegación (Breadcrumbs).
 * Permite al estudiante o coordinador regresar jerárquicamente.
 */
function renderBreadcrumb() {
  const nav = document.getElementById('breadcrumb-nav');
  if (!nav) return;
  nav.innerHTML = '';

  const createBtn = (label, level, course = null, theme = null) => {
    const btn = document.createElement('button');
    btn.className = 'breadcrumb-link';
    btn.textContent = label;
    btn.onclick = () => {
      if (level === 'cursos') {
        selectedCategory = null; // Reiniciar filtro de categoría explícitamente al hacer clic en "Inicio"
      }
      navigateTo(level, course, theme);
    };
    return btn;
  };

  const sep = () => {
    const s = document.createElement('span');
    s.textContent = ' ➔ ';
    return s;
  };

  nav.appendChild(createBtn('Inicio', 'cursos'));

  if (currentLevel === 'temas') {
    nav.appendChild(sep());
    const span = document.createElement('span');
    span.className = 'breadcrumb-active';
    span.textContent = selectedCourse;
    nav.appendChild(span);
  } else if (currentLevel === 'subtemas') {
    nav.appendChild(sep());
    nav.appendChild(createBtn(selectedCourse, 'temas', selectedCourse));
    nav.appendChild(sep());
    const span = document.createElement('span');
    span.className = 'breadcrumb-active';
    span.textContent = selectedTheme;
    nav.appendChild(span);
  }
}

/**
 * Función orquestadora del renderizado de la UI.
 * Divide sus tareas en pequeñas funciones con responsabilidad única (SOLID).
 */
export function render() {
  console.log("[EduMetric] Renderizando UI. Nivel actual:", currentLevel, "| Categoría seleccionada:", selectedCategory, "| Vista:", activeViewMode);
  const semanas = getSemanasFiltro();
  
  const filtersEl = document.getElementById('filters-container');
  const categoriesEl = document.getElementById('categories-row');
  
  // 2. Control de renderizado por pestaña activa
  if (activeViewMode === 'rendimiento') {
    if (filtersEl) filtersEl.style.display = '';
    if (categoriesEl) categoriesEl.style.display = '';
    
    // 1. Renderiza las tarjetas de categorías superiores (con interactividad y estadísticas de preguntas)
    renderTarjetasGrupos(semanas);

    document.getElementById('rendimiento-view').style.display = 'block';
    document.getElementById('repaso-view').style.display = 'none';

    // Actualiza los breadcrumbs y títulos informativos
    renderBreadcrumb();
    actualizarTextosCabecera();
    
    // Obtiene la información procesada y estructurada según el nivel de navegación
    const datosFiltrados = obtenerDatosNivelYFiltrar(semanas);
    
    // Dibuja los elementos correspondientes en el grid de la vista
    renderizarGrid(datosFiltrados);
  } else {
    // En la vista de Plan de Repaso no mostramos los filtros ni categorías generales de arriba
    if (filtersEl) filtersEl.style.display = 'none';
    if (categoriesEl) categoriesEl.style.display = 'none';

    document.getElementById('rendimiento-view').style.display = 'none';
    document.getElementById('repaso-view').style.display = 'block';

    // Renderiza la vista de Plan de Repaso
    renderRepasoView();
  }
}

/**
 * Renderiza el panel de categorías superiores con el promedio de sus respectivos cursos.
 * Coloca el nombre de la categoría al costado del icono y simplifica las estadísticas con micro-iconos (✓, ✗, -, 📋).
 */
function renderTarjetasGrupos(semanas) {
  const isCompMode = activeWeekType === 'comparativa';
  
  let resumenGrupos = {};
  if (isCompMode) {
    const resumenAvance = calcularResumenGrupos(CICLO.semanasAvance);
    const resumenFeedback = calcularResumenGrupos(CICLO.semanasFeedback);
    
    Object.keys(resumenFeedback).forEach(grupo => {
      resumenGrupos[grupo] = {
        isComparativa: true,
        precAvance: resumenAvance[grupo].precision,
        precFeedback: resumenFeedback[grupo].precision,
        delta: resumenFeedback[grupo].precision - resumenAvance[grupo].precision,
        cursosActivos: resumenFeedback[grupo].cursosActivos,
        correctas: resumenFeedback[grupo].correctas,
        incorrectas: resumenFeedback[grupo].incorrectas,
        blancas: resumenFeedback[grupo].blancas,
        preguntas: resumenFeedback[grupo].preguntas
      };
    });
  } else {
    resumenGrupos = calcularResumenGrupos(semanas);
  }
  
  const categoriesRow = document.getElementById('categories-row');
  if (!categoriesRow) return;
  
  categoriesRow.innerHTML = '';
  Object.entries(resumenGrupos).forEach(([grupo, det]) => {
    const color = COLORES_CATEGORIA[grupo];
    const card = document.createElement('div');
    const isActive = selectedCategory === grupo;
    
    card.className = `category-card ${isActive ? 'active' : ''}`;
    card.style.setProperty('--c-accent', color);
    card.onclick = () => selectCategory(grupo);
    
    let headerRightHtml = '';
    if (isCompMode) {
      const delta = det.delta;
      const diffText = delta >= 0 ? `+${delta.toFixed(0)}%` : `${delta.toFixed(0)}%`;
      const icon = delta >= 0 ? '▲' : '▼';
      const deltaColor = delta >= 0 ? 'var(--perf-excellent)' : 'var(--perf-poor)';
      const deltaBg = delta >= 0 ? 'color-mix(in srgb, var(--perf-excellent) 12%, transparent)' : 'color-mix(in srgb, var(--perf-poor) 12%, transparent)';
      const feedbackColor = getColorDesempenio(det.precFeedback);
      
      headerRightHtml = `
        <div class="cat-comp-wrapper" style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
          <div style="display: flex; flex-direction: column; align-items: flex-end; line-height: 1.2;">
            <span style="font-size: 0.65rem; font-weight: 700; color: var(--text-sub);">Avance: <strong style="color: var(--text-main); font-size: 0.75rem;">${det.precAvance.toFixed(0)}%</strong></span>
            <span style="font-size: 0.65rem; font-weight: 700; color: var(--text-sub);">Feedback: <strong style="color: ${feedbackColor}; font-size: 0.75rem;">${det.precFeedback.toFixed(0)}%</strong></span>
          </div>
          <span style="font-size: 0.72rem; font-weight: 800; color: ${deltaColor}; background: ${deltaBg}; padding: 2px 6px; border-radius: var(--r-full); white-space: nowrap;">
            ${icon} ${diffText}
          </span>
        </div>
      `;
    } else {
      headerRightHtml = `
        <div class="cat-progress-wrapper" style="position: relative; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          ${crearSvgCirculoProgreso(det.precision, color, 52, 4.5)}
          <span class="cat-card-pct" style="position: absolute; font-family: var(--font-title); font-size: 0.95rem; font-weight: 800; color: ${color};">${det.precision.toFixed(0)}%</span>
        </div>
      `;
    }
    
    card.innerHTML = `
      <div class="cat-card-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
          <div class="cat-icon-container" style="flex-shrink: 0;">
            ${ICONOS_CATEGORIA[grupo]}
          </div>
          <span class="cat-card-name" style="font-family: var(--font-title); font-weight: 800; font-size: 1.15rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${grupo}</span>
        </div>
        ${headerRightHtml}
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
        <span class="cat-card-meta" style="font-size: 0.72rem; font-weight: 600; color: var(--text-muted);">${det.cursosActivos} cursos activos</span>
      </div>
      
      <!-- Desglose de preguntas respondidas con micro-iconos (✓, ✗, -, 📋) -->
      <div class="cat-card-stats" style="margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border); display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 0.72rem; font-weight: 700;">
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <span style="color: var(--perf-excellent); display: inline-flex; align-items: center;" title="Correctas">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" style="width:12px; height:12px; margin-right:5px; flex-shrink:0;"><polyline points="20 6 9 17 4 12"/></svg>
            ${det.correctas}
          </span>
          <span style="color: var(--perf-poor); display: inline-flex; align-items: center;" title="Incorrectas">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" style="width:12px; height:12px; margin-right:5px; flex-shrink:0;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ${det.incorrectas}
          </span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
          <span style="color: var(--text-sub); display: inline-flex; align-items: center;" title="En Blanco">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" style="width:12px; height:12px; margin-right:5px; flex-shrink:0;"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ${det.blancas}
          </span>
          <span style="color: var(--text-main); display: inline-flex; align-items: center;" title="Total desarrolladas">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="width:12px; height:12px; margin-right:5px; flex-shrink:0;"><path d="M12 20h9M3 20v-8a2 2 0 0 1 2-2h4l2 3h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            ${det.preguntas}
          </span>
        </div>
      </div>
    `;
    categoriesRow.appendChild(card);
  });
}

/**
 * Actualiza los títulos y descripciones del mapa de calor de acuerdo con el nivel de navegación.
 */
function actualizarTextosCabecera() {
  const panelTitle = document.getElementById('heatmap-panel-title');
  const panelSub = document.getElementById('heatmap-sub-info');
  if (!panelTitle || !panelSub) return;

  const modeText = isAccumulated ? 'Acumulado' : 'Semanal';
  
  let labelText = 'Avance';
  if (activeWeekType === 'feedback') labelText = 'Feedback';
  else if (activeWeekType === 'comparativa') labelText = 'Comparativa';

  if (currentLevel === 'cursos') {
    if (activeWeekType === 'comparativa') {
      panelTitle.textContent = 'Comparativa de Rendimiento (Avance vs. Feedback)';
      if (selectedCategory) {
        panelSub.textContent = `Comparando promedios de la categoría "${selectedCategory}" para todas las semanas del ciclo.`;
      } else {
        panelSub.textContent = `Comparativa de los 20 cursos: promedio de semanas de Avance vs. semanas de Feedback.`;
      }
    } else {
      panelTitle.textContent = 'Mapa de Calor Global';
      if (selectedCategory) {
        panelSub.textContent = `Mostrando únicamente cursos de la categoría "${selectedCategory}" (Modo ${modeText} · ${labelText}).`;
      } else {
        panelSub.textContent = `20 cursos analizados según prioridad académica (Modo ${modeText} · ${labelText}).`;
      }
    }
  } else if (currentLevel === 'temas') {
    panelTitle.textContent = `${selectedCourse} — Temas Evaluados`;
    panelSub.textContent = `Temas del curso en el periodo (Modo ${modeText} · ${labelText}). Selecciona uno para ver sus subtemas.`;
  } else if (currentLevel === 'subtemas') {
    panelTitle.textContent = `${selectedTheme} — Subtemas Granulares`;
    panelSub.textContent = `Subtemas del tema seleccionado. Nivel de detalle máximo de exámenes (4 a 10 preguntas).`;
  }
}

/**
 * Obtiene los datos correspondientes al nivel actual, aplicando búsquedas y filtros.
 */
function obtenerDatosNivelYFiltrar(semanas) {
  let items = [];

  if (currentLevel === 'cursos') {
    items = obtenerDatosCursos(semanas);
  } else if (currentLevel === 'temas') {
    items = obtenerDatosTemas(semanas);
  } else if (currentLevel === 'subtemas') {
    items = obtenerDatosSubtemas();
  }

  // Ordenar Worst-to-Best o Best-to-Worst según selección
  items.sort((a, b) => {
    return sortAscending ? a.precision - b.precision : b.precision - a.precision;
  });

  return items;
}

/**
 * Construye la información de rendimiento para el Nivel 0 (Cursos) aplicando filtro de categoría.
 * Calcula el texto de metadatos del curso en gris: "XX temas · XX subtemas".
 */
function obtenerDatosCursos(semanas) {
  console.log("[EduMetric] obtenerDatosCursos con categoría:", selectedCategory);
  let cursosParaRenderizar = ALL_CURSOS;
  if (selectedCategory) {
    cursosParaRenderizar = GRUPOS_CURSOS[selectedCategory] || [];
  }
  console.log("[EduMetric] Cursos resultantes a renderizar:", cursosParaRenderizar);

  if (activeWeekType === 'comparativa') {
    return cursosParaRenderizar.map(curso => {
      const rendAvance = calcularRendimientoCurso(curso, CICLO.semanasAvance);
      const rendFeedback = calcularRendimientoCurso(curso, CICLO.semanasFeedback);
      const grupo = getNombreGrupoCurso(curso);
      const delta = rendFeedback.precision - rendAvance.precision;
      
      return {
        id: curso,
        nombre: curso,
        etiqueta: grupo,
        isComparativa: true,
        colorCat: COLORES_CATEGORIA[grupo],
        iconoCat: ICONOS_CATEGORIA[grupo],
        precAvance: rendAvance.precision,
        precFeedback: rendFeedback.precision,
        delta: delta,
        precision: rendFeedback.precision, // Para que el ordenamiento de la grilla use la nota final de feedback
        onClick: null // Sin navegación en comparativa
      };
    });
  }

  const totalTemas = semanas.length;
  const totalSubtemas = totalTemas * 3;

  return cursosParaRenderizar.map(curso => {
    const rend = calcularRendimientoCurso(curso, semanas);
    const grupo = getNombreGrupoCurso(curso);
    return {
      id: curso,
      nombre: curso,
      etiqueta: grupo,
      metaText: `${totalTemas} temas · ${totalSubtemas} subtemas`,
      colorCat: COLORES_CATEGORIA[grupo],
      iconoCat: ICONOS_CATEGORIA[grupo],
      correctas: rend.correctas,
      blancas: rend.blancas,
      incorrectas: rend.incorrectas,
      preguntas: rend.preguntas,
      precision: rend.precision,
      onClick: () => navigateTo('temas', curso)
    };
  });
}

/**
 * Construye la información de rendimiento para el Nivel 1 (Temas).
 * Muestra el texto meta en gris: "3 subtemas".
 */
function obtenerDatosTemas(semanas) {
  const temas = calcularTemasCurso(selectedCourse, semanas);
  const grupoCurso = getNombreGrupoCurso(selectedCourse);
  return temas.map(t => ({
    id: t.nombre,
    nombre: t.nombre,
    etiqueta: `Semana ${t.semana}`,
    metaText: `3 subtemas`,
    colorCat: COLORES_CATEGORIA[grupoCurso],
    iconoCat: ICONOS_CATEGORIA[grupoCurso],
    correctas: t.correctas,
    blancas: t.blancas,
    incorrectas: t.incorrectas,
    preguntas: t.preguntas,
    precision: t.precision,
    onClick: () => navigateTo('subtemas', selectedCourse, t.nombre)
  }));
}

/**
 * Construye la información de rendimiento para el Nivel 2 (Subtemas).
 */
function obtenerDatosSubtemas() {
  const subtemas = calcularSubtemasTema(selectedCourse, selectedTheme);
  const grupoCurso = getNombreGrupoCurso(selectedCourse);
  return subtemas.map(st => ({
    id: st.nombre,
    nombre: st.nombre,
    etiqueta: 'SUBTEMA',
    metaText: `Detalle de Examen`,
    colorCat: COLORES_CATEGORIA[grupoCurso],
    iconoCat: ICONOS_CATEGORIA[grupoCurso],
    correctas: st.correctas,
    blancas: st.blancas,
    incorrectas: st.incorrectas,
    preguntas: st.preguntas,
    precision: st.precision,
    onClick: null
  }));
}

/**
 * Genera el maquetado físico de las tarjetas en el elemento Grid del DOM.
 */
function renderizarGrid(datos) {
  const coursesGrid = document.getElementById('courses-grid');
  if (!coursesGrid) return;
  coursesGrid.innerHTML = '';

  datos.forEach(item => {
    const card = crearTarjetaCursoElement(item);
    coursesGrid.appendChild(card);
  });
}

/**
 * Crea el elemento DOM de una tarjeta individual con sus interactividades.
 * Rediseñado de forma completamente horizontal: el icono y los títulos están juntos a la izquierda,
 * y el círculo de progreso a la derecha, optimizando la simetría y el espacio responsivo.
 */
function crearTarjetaCursoElement(item) {
  const itemColor = getColorDesempenio(item.precision);
  const card = document.createElement('div');
  card.className = 'course-card';
  card.style.setProperty('--c-accent', itemColor);
  
  if (item.onClick) {
    card.setAttribute('role', 'button');
    card.onclick = item.onClick;
  } else {
    card.style.cursor = 'default';
  }

  // Interacción de mouse para el Tooltip Premium (Didáctico)
  card.onmouseenter = (e) => {
    if (item.isComparativa) {
      showTooltipComparativa(e, item);
    } else {
      showTooltip(e, item.nombre, item.correctas, item.incorrectas, item.blancas, item.preguntas, item.precision, itemColor);
    }
  };
  card.onmousemove = (e) => {
    positionTooltip(e);
  };
  card.onmouseleave = () => {
    hideTooltip();
  };

  const iconSvg = item.iconoCat ? item.iconoCat : '';

  if (item.isComparativa) {
    const delta = item.delta;
    const diffText = delta >= 0 ? `+${delta.toFixed(0)}%` : `${delta.toFixed(0)}%`;
    const icon = delta >= 0 ? '▲' : '▼';
    const deltaColor = delta >= 0 ? 'var(--perf-excellent)' : 'var(--perf-poor)';
    const deltaBg = delta >= 0 ? 'color-mix(in srgb, var(--perf-excellent) 12%, transparent)' : 'color-mix(in srgb, var(--perf-poor) 12%, transparent)';
    const feedbackColor = getColorDesempenio(item.precFeedback);
    
    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; width: 100%; position: relative; z-index: 2; min-height: 48px;">
        <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">
          <div class="course-large-icon" style="color: ${item.colorCat}; background: color-mix(in srgb, ${item.colorCat} 12%, transparent); border-radius: var(--r-md); padding: 8px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
            ${iconSvg}
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1;">
            <span class="course-name" style="font-family: var(--font-title); font-weight: 800; font-size: 1.05rem; color: var(--text-main); line-height: 1.3; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.nombre}">${item.nombre}</span>
            <span class="course-meta" style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${item.etiqueta}
            </span>
          </div>
        </div>
        
        <div class="comp-card-right" style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
          <!-- Avance box -->
          <div class="comp-box" style="display: flex; flex-direction: column; align-items: center; background: var(--bg); padding: 4px 8px; border-radius: var(--r-sm); border: 1px solid var(--border); min-width: 65px;">
            <span style="font-size: 0.58rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Avance</span>
            <span style="font-family: var(--font-title); font-weight: 800; font-size: 0.95rem; color: var(--text-sub);">${item.precAvance.toFixed(0)}%</span>
          </div>
          
          <!-- Evolution arrow/delta -->
          <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
            <span style="font-size: 0.65rem; color: var(--text-muted); line-height: 1;">➔</span>
            <span style="font-size: 0.72rem; font-weight: 800; color: ${deltaColor}; background: ${deltaBg}; padding: 1px 6px; border-radius: var(--r-full); white-space: nowrap;">
              ${icon} ${diffText}
            </span>
          </div>

          <!-- Feedback box -->
          <div class="comp-box" style="display: flex; flex-direction: column; align-items: center; background: var(--bg); padding: 4px 8px; border-radius: var(--r-sm); border: 1px solid var(--border); min-width: 65px;">
            <span style="font-size: 0.58rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Feedback</span>
            <span style="font-family: var(--font-title); font-weight: 800; font-size: 0.95rem; color: ${feedbackColor};">${item.precFeedback.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    `;
  } else {
    const progressRingHtml = crearSvgCirculoProgreso(item.precision, itemColor, 44, 4);
    
    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; width: 100%; position: relative; z-index: 2; min-height: 48px;">
        <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">
          <div class="course-large-icon" style="color: ${item.colorCat}; background: color-mix(in srgb, ${item.colorCat} 12%, transparent); border-radius: var(--r-md); padding: 8px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
            ${iconSvg}
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1;">
            <span class="course-name" style="font-family: var(--font-title); font-weight: 800; font-size: 1.05rem; color: var(--text-main); line-height: 1.3; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.nombre}">${item.nombre}</span>
            <span class="course-meta" style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${currentLevel === 'cursos' ? item.metaText : `${item.etiqueta} · ${item.metaText || ''}`}
            </span>
          </div>
        </div>
        <div class="course-progress-container" style="position: relative; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
          ${progressRingHtml}
          <span class="course-pct" style="position: absolute; font-family: var(--font-title); font-weight: 800; font-size: 0.85rem; color: ${itemColor};">${item.precision.toFixed(0)}%</span>
        </div>
      </div>
    `;
  }
  
  return card;
}

function showTooltipComparativa(e, item) {
  if (!tooltipEl) return;
  tooltipEl.classList.add('show');
  
  const delta = item.delta;
  const diffText = delta >= 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`;
  const icon = delta >= 0 ? '▲' : '▼';
  const deltaColor = delta >= 0 ? 'var(--perf-excellent)' : 'var(--perf-poor)';
  
  tooltipEl.innerHTML = `
    <h4 style="border-left: 3px solid ${getColorDesempenio(item.precFeedback)}; padding-left: 8px;">Comparativa — ${item.nombre}</h4>
    <div class="tt-row">
      <span class="tt-label">Promedio Avance</span>
      <span class="tt-val" style="color: var(--text-sub)">${item.precAvance.toFixed(1)}%</span>
    </div>
    <div class="tt-row">
      <span class="tt-label">Promedio Feedback</span>
      <span class="tt-val" style="color: ${getColorDesempenio(item.precFeedback)}">${item.precFeedback.toFixed(1)}%</span>
    </div>
    <div class="tt-row" style="border-bottom: none;">
      <span class="tt-label">Evolución</span>
      <span class="tt-val" style="color: ${deltaColor}; font-size: 0.8rem;">${icon} ${diffText}</span>
    </div>
  `;
  positionTooltip(e);
}

// ══════════════════════════════════════════════════════════════════════════
// VISTA: PLAN DE REPASO PEDAGÓGICO (INTERACTIVO Y PERSONALIZADO)
// ──────────────────────────────────────────────────────────────────────────
// Responsabilidad: Dibuja y gestiona los temas y subtemas críticos (< 75%),
// permitiendo al alumno marcarlos como Pendiente, En Progreso o Completado
// con filtros locales y barra de avance integrada.
// ══════════════════════════════════════════════════════════════════════════

export function obtenerEstadoRepaso(key, precision = 0) {
  const statusMap = JSON.parse(localStorage.getItem('edumetric-repaso-status') || '{}');
  if (statusMap[key] !== undefined) {
    return statusMap[key];
  }
  // Si sacó 100% en sus exámenes, por defecto queda marcado como Estudiado (completado)
  if (precision === 100) {
    return 'completado';
  }
  return 'pendiente';
}

export function guardarEstadoRepaso(key, nuevoEstado) {
  const statusMap = JSON.parse(localStorage.getItem('edumetric-repaso-status') || '{}');
  statusMap[key] = nuevoEstado;
  
  // Si es un tema, propagar el estado a todos sus subtemas para conveniencia del alumno
  if (key.startsWith('tema_')) {
    for (let s = 1; s <= CICLO.semanas; s++) {
      const semData = DATABASE[s];
      if (!semData) continue;
      Object.entries(semData.cursos).forEach(([cursoNombre, cursoData]) => {
        const temaKey = `tema_${cursoNombre}_${cursoData.tema}`.replace(/\s+/g, '_');
        if (temaKey === key) {
          Object.keys(cursoData.subtemas).forEach(subNombre => {
            const subKey = `sub_${cursoNombre}_${cursoData.tema}_${subNombre}`.replace(/\s+/g, '_');
            statusMap[subKey] = nuevoEstado;
          });
        }
      });
    }
  }
  
  localStorage.setItem('edumetric-repaso-status', JSON.stringify(statusMap));
  render();
}

export function toggleTemaExpandido(key) {
  if (temasExpandidos.has(key)) {
    temasExpandidos.delete(key);
  } else {
    temasExpandidos.add(key);
  }
  render();
}

export function setRepasoViewType(type) {
  repasoViewType = type;
  render();
}

export function setRepasoFiltroEstado(estado) {
  repasoFiltroEstado = estado;
  render();
}

export function setRepasoFiltroSemana(semanaFiltro) {
  repasoFiltroSemana = semanaFiltro;
  render();
}

function renderRepasoView() {
  const repasoView = document.getElementById('repaso-view');
  if (!repasoView) return;

  const temasCriticos = [];
  const subtemasCriticos = [];

  // Obtenemos los temas y subtemas críticos de todas las semanas del ciclo
  for (let s = 1; s <= CICLO.semanas; s++) {
    const semData = DATABASE[s];
    if (!semData) continue;

    Object.entries(semData.cursos).forEach(([cursoNombre, cursoData]) => {
      const precisionTema = cursoData.precision;
      const grupo = getNombreGrupoCurso(cursoNombre);
      
      const temaKey = `tema_${cursoNombre}_${cursoData.tema}`.replace(/\s+/g, '_');
      const temaStatus = obtenerEstadoRepaso(temaKey, precisionTema);
      
      const listaSubtemas = Object.entries(cursoData.subtemas).map(([subNombre, subData]) => {
        const subKey = `sub_${cursoNombre}_${cursoData.tema}_${subNombre}`.replace(/\s+/g, '_');
        const subStatus = obtenerEstadoRepaso(subKey, subData.precision);
        
        return {
          key: subKey,
          nombre: subNombre,
          precision: subData.precision,
          correctas: subData.correctas,
          preguntas: subData.preguntas,
          status: subStatus
        };
      });

      // Lógica de Comparativa Pedagógica: Avance vs. Feedback
      let comparativaHtml = '';
      const esFeedback = CICLO.semanasFeedback.includes(s);
      
      if (!esFeedback) {
        // Avance -> Buscar Feedback asociado posterior
        let sf = null;
        if (s === 1 || s === 2) sf = 3;
        else if (s === 4 || s === 5) sf = 6;
        else if (s === 7) sf = 8;
        else if (s === 9 || s === 10 || s === 11) sf = 12;

        if (sf) {
          const cdFeedback = DATABASE[sf]?.cursos[cursoNombre];
          if (cdFeedback) {
            const precisionFeedback = cdFeedback.precision;
            const diff = precisionFeedback - precisionTema;
            const diffColor = diff >= 0 ? 'var(--perf-excellent)' : 'var(--perf-poor)';
            const icon = diff >= 0 ? '▲' : '▼';
            const diffText = diff >= 0 ? `+${diff.toFixed(0)}%` : `${diff.toFixed(0)}%`;
            const deltaBg = diff >= 0 ? 'color-mix(in srgb, var(--perf-excellent) 12%, transparent)' : 'color-mix(in srgb, var(--perf-poor) 12%, transparent)';
            
            comparativaHtml = `
              <div class="repaso-evo-node avance" title="Avance de la semana original">
                <span class="node-label">Avance</span>
                <span class="node-val">${precisionTema.toFixed(0)}%</span>
              </div>
              <div class="repaso-evo-connector">
                <div class="connector-line"></div>
                <span class="connector-badge" style="color: ${diffColor}; background: ${deltaBg};">${icon} ${diffText}</span>
              </div>
              <div class="repaso-evo-node feedback" title="Examen acumulativo Feedback">
                <span class="node-label">Feedback (S${sf})</span>
                <span class="node-val" style="color: var(--primary);">${precisionFeedback.toFixed(0)}%</span>
              </div>
            `;
          }
        }
      } else {
        // Feedback -> Buscar Avances previos asociados
        let prevSemanas = [];
        if (s === 3) prevSemanas = [1, 2];
        else if (s === 6) prevSemanas = [4, 5];
        else if (s === 8) prevSemanas = [7];
        else if (s === 12 || s === 13) prevSemanas = [9, 10, 11];

        let sumPrec = 0, count = 0;
        prevSemanas.forEach(ps => {
          const cdAvance = DATABASE[ps]?.cursos[cursoNombre];
          if (cdAvance) {
            sumPrec += cdAvance.precision;
            count++;
          }
        });

        if (count > 0) {
          const precisionAvanceProm = sumPrec / count;
          const diff = precisionTema - precisionAvanceProm;
          const diffColor = diff >= 0 ? 'var(--perf-excellent)' : 'var(--perf-poor)';
          const icon = diff >= 0 ? '▲' : '▼';
          const diffText = diff >= 0 ? `+${diff.toFixed(0)}%` : `${diff.toFixed(0)}%`;
          const deltaBg = diff >= 0 ? 'color-mix(in srgb, var(--perf-excellent) 12%, transparent)' : 'color-mix(in srgb, var(--perf-poor) 12%, transparent)';
          
          comparativaHtml = `
            <div class="repaso-evo-node avance" title="Promedio de Avances anteriores">
              <span class="node-label">Avance Prom</span>
              <span class="node-val">${precisionAvanceProm.toFixed(0)}%</span>
            </div>
            <div class="repaso-evo-connector">
              <div class="connector-line"></div>
              <span class="connector-badge" style="color: ${diffColor}; background: ${deltaBg};">${icon} ${diffText}</span>
            </div>
            <div class="repaso-evo-node feedback" title="Semana de Feedback actual">
              <span class="node-label">Feedback</span>
              <span class="node-val" style="color: var(--primary);">${precisionTema.toFixed(0)}%</span>
            </div>
          `;
        }
      }

      if (precisionTema < 75) {
        temasCriticos.push({
          key: temaKey,
          curso: cursoNombre,
          tema: cursoData.tema,
          semana: s,
          precision: precisionTema,
          correctas: cursoData.correctas,
          preguntas: cursoData.preguntas,
          colorCat: COLORES_CATEGORIA[grupo],
          iconoCat: ICONOS_CATEGORIA[grupo],
          status: temaStatus,
          subtemas: listaSubtemas,
          comparativaHtml: comparativaHtml
        });
      }

      listaSubtemas.forEach(sub => {
        if (sub.precision < 75) {
          subtemasCriticos.push({
            key: sub.key,
            nombre: sub.nombre,
            curso: cursoNombre,
            tema: cursoData.tema,
            semana: s,
            precision: sub.precision,
            correctas: sub.correctas,
            preguntas: sub.preguntas,
            colorCat: COLORES_CATEGORIA[grupo],
            iconoCat: ICONOS_CATEGORIA[grupo],
            status: sub.status
          });
        }
      });
    });
  }

  // Ordenar de peor a mejor rendimiento (Worst-to-Best) para enfocar el esfuerzo de repaso
  temasCriticos.sort((a, b) => a.precision - b.precision);
  subtemasCriticos.sort((a, b) => a.precision - b.precision);

  // 1. Filtrar primero por Tipo de Semana (Avance / Feedback)
  const temasFiltradosSemana = temasCriticos.filter(t => {
    const tipoSemana = CICLO.semanasFeedback.includes(t.semana) ? 'feedback' : 'avance';
    return repasoFiltroSemana === 'todos' || tipoSemana === repasoFiltroSemana;
  });

  const subtemasFiltradosSemana = subtemasCriticos.filter(s => {
    const tipoSemana = CICLO.semanasFeedback.includes(s.semana) ? 'feedback' : 'avance';
    return repasoFiltroSemana === 'todos' || tipoSemana === repasoFiltroSemana;
  });

  // 2. Calcular contadores sobre la lista filtrada por semana
  const totalSub = subtemasFiltradosSemana.length;
  const pendSub = subtemasFiltradosSemana.filter(s => s.status === 'pendiente').length;
  const progSub = subtemasFiltradosSemana.filter(s => s.status === 'en-progreso').length;
  const compSub = subtemasFiltradosSemana.filter(s => s.status === 'completado').length;
  const pctAvance = totalSub > 0 ? (compSub / totalSub) * 100 : 0;

  // 3. Filtrar por Estado local sobre la lista ya filtrada por semana
  let temasMostrados = temasFiltradosSemana;
  let subtemasMostrados = subtemasFiltradosSemana;

  if (repasoFiltroEstado !== 'todos') {
    temasMostrados = temasFiltradosSemana.filter(t => t.status === repasoFiltroEstado);
    subtemasMostrados = subtemasFiltradosSemana.filter(s => s.status === repasoFiltroEstado);
  }

  let contentHtml = `
    <!-- Cabecera Resumen de Progreso de Repaso -->
    <div class="repaso-header-card" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 20px; margin-bottom: 24px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap;">
        <div>
          <h3 style="font-family: var(--font-title); font-weight: 800; font-size: 1.35rem; color: var(--text-main);">Plan de Repaso de Temas Críticos</h3>
          <p style="font-size: 0.78rem; color: var(--text-sub); margin-top: 4px;">Enfoque del Alumno: Revisa los temas y subtemas donde obtuviste menos del 75% de precisión en tus exámenes. Organiza y marca tu avance.</p>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <div style="background: var(--bg); border: 1px solid var(--border); border-radius: var(--r-md); padding: 8px 14px; text-align: center; min-width: 80px;">
            <div style="font-size: 0.62rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Por Estudiar</div>
            <div style="font-family: var(--font-title); font-size: 1.3rem; font-weight: 850; color: var(--perf-poor); margin-top: 2px;">${pendSub}</div>
          </div>
          <div style="background: var(--bg); border: 1px solid var(--border); border-radius: var(--r-md); padding: 8px 14px; text-align: center; min-width: 80px;">
            <div style="font-size: 0.62rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">En Progreso</div>
            <div style="font-family: var(--font-title); font-size: 1.3rem; font-weight: 850; color: #d97706; margin-top: 2px;">${progSub}</div>
          </div>
          <div style="background: var(--bg); border: 1px solid var(--border); border-radius: var(--r-md); padding: 8px 14px; text-align: center; min-width: 80px;">
            <div style="font-size: 0.62rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Estudiados</div>
            <div style="font-family: var(--font-title); font-size: 1.3rem; font-weight: 850; color: var(--perf-excellent); margin-top: 2px;">${compSub}</div>
          </div>
        </div>
      </div>
      
      <!-- Barra de progreso de repaso -->
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; font-weight: 700; color: var(--text-sub);">
          <span>Progreso de estudio de subtemas críticos</span>
          <span style="font-family: var(--font-title); color: var(--primary); font-size: 0.9rem; font-weight:850;">${pctAvance.toFixed(0)}% Completado</span>
        </div>
        <div style="width: 100%; height: 8px; background: var(--bg); border-radius: var(--r-full); overflow: hidden; border: 1px solid var(--border);">
          <div style="width: ${pctAvance}%; height: 100%; background: linear-gradient(90deg, var(--primary), #10b981); border-radius: var(--r-full); transition: width var(--dur-med) ease;"></div>
        </div>
      </div>
    </div>

    <!-- Controles de Filtros Locales de Repaso -->
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;">
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <!-- Selector de Tipo de Semanas (Filtro Pedagógico - Sin Ciclo Completo) -->
        <div style="display: flex; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-full); padding: 4px; gap: 4px;">
          <button class="repaso-tab-btn ${repasoFiltroSemana === 'avance' ? 'active-todos' : ''}" onclick="setRepasoFiltroSemana('avance')">Semanas de Avance</button>
          <button class="repaso-tab-btn ${repasoFiltroSemana === 'feedback' ? 'active-todos' : ''}" onclick="setRepasoFiltroSemana('feedback')">Semanas de Feedback</button>
        </div>

        <!-- Pestañas de Estado de Repaso con colores semánticos -->
        <div style="display: flex; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-full); padding: 4px; gap: 4px;">
          <button class="repaso-tab-btn ${repasoFiltroEstado === 'todos' ? 'active-todos' : ''}" onclick="setRepasoFiltroEstado('todos')">Todos (${totalSub})</button>
          <button class="repaso-tab-btn ${repasoFiltroEstado === 'pendiente' ? 'active-pendiente' : ''}" onclick="setRepasoFiltroEstado('pendiente')">🔴 Por Estudiar (${pendSub})</button>
          <button class="repaso-tab-btn ${repasoFiltroEstado === 'en-progreso' ? 'active-progreso' : ''}" onclick="setRepasoFiltroEstado('en-progreso')">🟡 En Progreso (${progSub})</button>
          <button class="repaso-tab-btn ${repasoFiltroEstado === 'completado' ? 'active-completado' : ''}" onclick="setRepasoFiltroEstado('completado')">🟢 Estudiados (${compSub})</button>
        </div>
      </div>

      <!-- Selector de Tipo de Vista -->
      <div style="display: flex; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-full); padding: 4px; gap: 4px;">
        <button class="repaso-tab-btn ${repasoViewType === 'temas' ? 'active-todos' : ''}" onclick="setRepasoViewType('temas')">Ver por Temas</button>
        <button class="repaso-tab-btn ${repasoViewType === 'subtemas' ? 'active-todos' : ''}" onclick="setRepasoViewType('subtemas')">Ver todos los Subtemas</button>
      </div>
    </div>

    <!-- Lista de Contenido -->
    <div class="repaso-list-container" style="display: flex; flex-direction: column; gap: 14px;">
  `;

  if (repasoViewType === 'temas') {
    // RENDERIZAR VISTA POR TEMAS (ACORDEONES)
    if (temasMostrados.length === 0) {
      contentHtml += `
        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 40px; text-align: center; color: var(--text-muted); font-size: 0.85rem; font-weight:600;">
          No se encontraron temas con este filtro. ¡Buen trabajo!
        </div>
      `;
    } else {
      temasMostrados.forEach(t => {
        const isOpen = temasExpandidos.has(t.key);
        const subCount = t.subtemas.length;
        const color = getColorDesempenio(t.precision);
        const subCompCount = t.subtemas.filter(s => s.status === 'completado').length;
        
        contentHtml += `
          <div class="repaso-tema-card ${t.status === 'completado' ? 'repaso-completado' : ''}" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); overflow: hidden; transition: all var(--dur-fast) ease; ${t.status === 'completado' ? 'opacity: 0.78;' : ''}">
            <!-- Cabecera del Acordeón -->
            <div class="repaso-tema-header" onclick="toggleTemaExpandido('${t.key}')" style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; gap: 16px; background: ${isOpen ? 'var(--primary-light)' : 'transparent'};">
              <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1.2;">
                <div style="color: ${t.colorCat}; background: color-mix(in srgb, ${t.colorCat} 12%, transparent); border-radius: var(--r-md); padding: 8px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  ${t.iconoCat}
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
                  <span style="font-family: var(--font-title); font-weight: 800; font-size: 0.95rem; color: var(--text-main); line-height: 1.2; text-decoration: ${t.status === 'completado' ? 'line-through' : 'none'};">${t.tema}</span>
                  <span style="font-size: 0.72rem; font-weight: 600; color: var(--text-muted);">${t.curso} · Sem. ${t.semana} · <span style="color:var(--primary); font-weight:700;">${subCompCount}/${subCount} subtemas listos</span></span>
                </div>
              </div>
              
              <div class="repaso-evo-flow" style="display: ${t.comparativaHtml ? 'flex' : 'none'}; align-items: center; gap: 8px; justify-content: center; flex: 1.5; padding: 0 16px;">
                ${t.comparativaHtml || ''}
              </div>
              
              <div style="display: flex; align-items: center; gap: 18px; flex-shrink: 0;" onclick="event.stopPropagation();">
                <div style="text-align: right; display: flex; flex-direction: column; gap: 1px;">
                  <span style="font-family: var(--font-title); font-weight: 850; font-size: 1.1rem; color: ${color};">${t.precision.toFixed(0)}%</span>
                  <span style="font-size: 0.65rem; font-weight: 600; color: var(--text-muted);">${t.correctas}/${t.preguntas} buenas</span>
                </div>
                
                <!-- Selector de estado del Tema completo -->
                <select class="repaso-status-select ${t.status}" onchange="guardarEstadoRepaso('${t.key}', this.value)">
                  <option value="pendiente" ${t.status === 'pendiente' ? 'selected' : ''}>🔴 Por Estudiar</option>
                  <option value="en-progreso" ${t.status === 'en-progreso' ? 'selected' : ''}>🟡 En Progreso</option>
                  <option value="completado" ${t.status === 'completado' ? 'selected' : ''}>🟢 Estudiado</option>
                </select>

                <!-- Indicador de Acordeón Abierto/Cerrado -->
                <div style="color: var(--text-muted); display: flex; align-items: center;" onclick="toggleTemaExpandido('${t.key}')">
                  <svg style="width: 18px; height: 18px; transform: rotate(${isOpen ? '180deg' : '0deg'}); transition: transform var(--dur-fast) ease;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
            </div>
            
            <!-- Desglose de Subtemas (Acordeón) -->
            ${isOpen ? `
              <div class="repaso-subtemas-list" style="background: var(--bg); border-top: 1px solid var(--border); padding: 14px 20px; display: flex; flex-direction: column; gap: 10px;">
                <div style="font-size: 0.68rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
                  Subtemas Evaluados en este tema:
                </div>
                ${t.subtemas.map(sub => {
                  const subColor = getColorDesempenio(sub.precision);
                  return `
                    <div class="repaso-subtema-item" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-md); padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 14px; ${sub.status === 'completado' ? 'opacity: 0.72;' : ''}">
                      <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1;">
                        <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-decoration: ${sub.status === 'completado' ? 'line-through' : 'none'};">${sub.nombre}</span>
                        <span style="font-size: 0.68rem; font-weight: 700; color: ${subColor};">Precisión: <strong style="font-size: 0.78rem;">${sub.precision.toFixed(0)}%</strong> · (${sub.correctas}/${sub.preguntas} correctas)</span>
                      </div>
                      
                      <!-- Selector de estado del Subtema -->
                      <select class="repaso-status-select ${sub.status}" onchange="guardarEstadoRepaso('${sub.key}', this.value)">
                        <option value="pendiente" ${sub.status === 'pendiente' ? 'selected' : ''}>🔴 Por Estudiar</option>
                        <option value="en-progreso" ${sub.status === 'en-progreso' ? 'selected' : ''}>🟡 En Progreso</option>
                        <option value="completado" ${sub.status === 'completado' ? 'selected' : ''}>🟢 Estudiado</option>
                      </select>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}
          </div>
        `;
      });
    }
  } else {
    // RENDERIZAR VISTA PLANA DE TODOS LOS SUBTEMAS (VISTA EN GENERAL)
    if (subtemasMostrados.length === 0) {
      contentHtml += `
        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 40px; text-align: center; color: var(--text-muted); font-size: 0.85rem; font-weight:600;">
          No se encontraron subtemas con este filtro. ¡Buen avance!
        </div>
      `;
    } else {
      subtemasMostrados.forEach(sub => {
        const subColor = getColorDesempenio(sub.precision);
        
        contentHtml += `
          <div class="repaso-subtema-row-card" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; transition: all var(--dur-fast) ease; ${sub.status === 'completado' ? 'opacity: 0.72;' : ''}">
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">
              <div style="color: ${sub.colorCat}; background: color-mix(in srgb, ${sub.colorCat} 12%, transparent); border-radius: var(--r-md); padding: 6px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${sub.iconoCat}
              </div>
              <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
                <span style="font-size: 0.85rem; font-weight: 800; color: var(--text-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-decoration: ${sub.status === 'completado' ? 'line-through' : 'none'};" title="${sub.nombre}">${sub.nombre}</span>
                <span style="font-size: 0.68rem; font-weight: 600; color: var(--text-muted);">${sub.curso} · Tema: ${sub.tema} · Sem. ${sub.semana}</span>
              </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 18px; flex-shrink: 0;">
              <div style="text-align: right; display: flex; flex-direction: column; gap: 1px;">
                <span style="font-family: var(--font-title); font-weight: 850; font-size: 0.95rem; color: ${subColor};">${sub.precision.toFixed(0)}%</span>
                <span style="font-size: 0.62rem; font-weight: 600; color: var(--text-muted);">${sub.correctas}/${sub.preguntas} buenas</span>
              </div>
              
              <!-- Selector de estado del Subtema -->
              <select class="repaso-status-select ${sub.status}" onchange="guardarEstadoRepaso('${sub.key}', this.value)">
                <option value="pendiente" ${sub.status === 'pendiente' ? 'selected' : ''}>🔴 Por Estudiar</option>
                <option value="en-progreso" ${sub.status === 'en-progreso' ? 'selected' : ''}>🟡 En Progreso</option>
                <option value="completado" ${sub.status === 'completado' ? 'selected' : ''}>🟢 Estudiado</option>
              </select>
            </div>
          </div>
        `;
      });
    }
  }

  contentHtml += `
    </div>
  `;

  repasoView.innerHTML = contentHtml;
}

// ══════════════════════════════════════════════════════════════════════════
// INTERACTIVIDAD DE TOOLTIP FLOTANTE (REDISEÑADO PEDAGÓGICAMENTE)
// ──────────────────────────────────────────────────────────────────────────
// Responsabilidad: Muestra la información granular requerida por el usuario
// (Buenas, Malas, Blancas y Total desarrollado) eliminando elementos obsoletos.
// ══════════════════════════════════════════════════════════════════════════

function showTooltip(e, name, correctas, incorrectas, blancas, preguntas, precision, color) {
  if (!tooltipEl) return;
  tooltipEl.classList.add('show');
  
  tooltipEl.innerHTML = `
    <h4 style="border-left: 3px solid ${color}; padding-left: 8px;">${name}</h4>
    <div class="tt-row">
      <span class="tt-label">Precisión</span>
      <span class="tt-val" style="color: ${color}">${precision.toFixed(1)}%</span>
    </div>
    <div class="tt-row">
      <span class="tt-label">Preguntas Buenas</span>
      <span class="tt-val" style="color: var(--perf-excellent)">${correctas}</span>
    </div>
    <div class="tt-row">
      <span class="tt-label">Preguntas Malas</span>
      <span class="tt-val" style="color: var(--perf-poor)">${incorrectas}</span>
    </div>
    <div class="tt-row">
      <span class="tt-label">Preguntas en Blanco</span>
      <span class="tt-val" style="color: var(--text-muted)">${blancas}</span>
    </div>
    <div class="tt-row">
      <span class="tt-label">Total Preguntas</span>
      <span class="tt-val">${preguntas}</span>
    </div>
    <div class="tt-progress-bar">
      <div class="tt-progress-fill" style="background-color: ${color}; width: ${precision}%"></div>
    </div>
  `;
  positionTooltip(e);
}

function positionTooltip(e) {
  if (!tooltipEl) return;
  const margin = 16;
  const tWidth = tooltipEl.offsetWidth || 230;
  const tHeight = tooltipEl.offsetHeight || 190;
  
  let x = e.clientX + margin;
  let y = e.clientY + margin;

  if (x + tWidth > window.innerWidth - margin) {
    x = e.clientX - tWidth - margin;
  }
  if (y + tHeight > window.innerHeight - margin) {
    y = e.clientY - tHeight - margin;
  }

  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top = `${y}px`;
}

function hideTooltip() {
  if (tooltipEl) tooltipEl.classList.remove('show');
}

// ══════════════════════════════════════════════════════════════════════════
// MANEJO DE FILTROS Y CONTROLES DEL USUARIO
// ══════════════════════════════════════════════════════════════════════════

export function setWeekType(type) {
  activeWeekType = type;
  document.getElementById('tab-avance').classList.toggle('active', type === 'avance');
  document.getElementById('tab-feedback').classList.toggle('active', type === 'feedback');
  document.getElementById('tab-comparativa').classList.toggle('active', type === 'comparativa');
  
  const periodControls = document.getElementById('period-controls-group');
  if (periodControls) {
    if (type === 'comparativa') {
      periodControls.style.display = 'none';
    } else {
      periodControls.style.display = 'flex';
    }
  }

  if (type !== 'comparativa') {
    const semanasDisponibles = type === 'avance' ? CICLO.semanasAvance : CICLO.semanasFeedback;
    activeWeek = semanasDisponibles[0];
    rangeStartWeek = semanasDisponibles[0];
    rangeEndWeek = semanasDisponibles[semanasDisponibles.length - 1];
    poblarPeriodSelector();
  }
  
  render();
}

export function setAggregation(accumulated) {
  isAccumulated = accumulated;
  document.getElementById('btn-acumulado').classList.toggle('active', accumulated);
  document.getElementById('btn-semanal').classList.toggle('active', !accumulated);
  
  poblarPeriodSelector();
  render();
}

export function toggleSortOrder() {
  sortAscending = !sortAscending;
  const label = document.getElementById('sort-order-label');
  if (label) {
    label.textContent = sortAscending ? 'MENOR A MAYOR DESEMPEÑO' : 'MAYOR A MENOR DESEMPEÑO';
  }
  render();
}

export function togglePeriodDropdown() {
  const drop = document.getElementById('period-dropdown');
  const btn = document.getElementById('period-btn');
  if (drop && btn) {
    drop.classList.toggle('show');
    btn.classList.toggle('open');
  }
}

export function closePeriodDropdown() {
  const drop = document.getElementById('period-dropdown');
  const btn = document.getElementById('period-btn');
  if (drop && btn) {
    drop.classList.remove('show');
    btn.classList.remove('open');
  }
}

// ══════════════════════════════════════════════════════════════════════════
// GENERACIÓN DINÁMICA DEL SELECTOR DE PERIODOS (ACUMULADO / SEMANAL)
// ══════════════════════════════════════════════════════════════════════════

export function poblarPeriodSelector() {
  const drop = document.getElementById('period-dropdown');
  if (!drop) return;
  drop.innerHTML = '';
  
  const semanasDisponibles = activeWeekType === 'avance' ? CICLO.semanasAvance : CICLO.semanasFeedback;
  
  if (isAccumulated) {
    poblarSelectorAcumulado(drop, semanasDisponibles);
  } else {
    poblarSelectorSemanal(drop, semanasDisponibles);
  }
}

/**
 * Configura y renderiza el selector de rangos (Modo Acumulado)
 */
function poblarSelectorAcumulado(drop, semanasDisponibles) {
  drop.style.minWidth = '240px';
  drop.style.padding = '14px';
  
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '10px';
  
  container.appendChild(crearTituloRango());
  
  const selectsRow = document.createElement('div');
  selectsRow.style.display = 'flex';
  selectsRow.style.alignItems = 'center';
  selectsRow.style.gap = '8px';
  
  selectsRow.appendChild(crearSelectDesde(semanasDisponibles));
  selectsRow.appendChild(crearSelectHasta(semanasDisponibles));
  container.appendChild(selectsRow);
  
  container.appendChild(crearBotonAplicarRango());
  drop.appendChild(container);
  
  actualizarEtiquetaPeriodoAcumulado();
}

function crearTituloRango() {
  const title = document.createElement('span');
  title.style.fontSize = '0.72rem';
  title.style.fontWeight = '800';
  title.style.color = 'var(--text-muted)';
  title.style.textTransform = 'uppercase';
  title.style.letterSpacing = '0.5px';
  title.textContent = 'Rango de Semanas';
  return title;
}

function crearSelectDesde(semanasDisponibles) {
  const divDesde = document.createElement('div');
  divDesde.style.display = 'flex';
  divDesde.style.flexDirection = 'column';
  divDesde.style.gap = '4px';
  divDesde.style.flex = '1';
  
  const lblDesde = document.createElement('label');
  lblDesde.style.fontSize = '0.65rem';
  lblDesde.style.fontWeight = '700';
  lblDesde.style.color = 'var(--text-sub)';
  lblDesde.textContent = 'Desde:';
  
  const selectDesde = document.createElement('select');
  selectDesde.className = 'period-select-custom';
  
  semanasDisponibles.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = `Semana ${s}`;
    if (s === rangeStartWeek) opt.selected = true;
    if (s > rangeEndWeek) opt.disabled = true; // No permite iniciar después del fin seleccionado
    selectDesde.appendChild(opt);
  });
  
  selectDesde.onchange = (e) => {
    rangeStartWeek = parseInt(e.target.value);
    actualizarEtiquetaPeriodoAcumulado();
    poblarPeriodSelector();
    render();
  };
  
  divDesde.appendChild(lblDesde);
  divDesde.appendChild(selectDesde);
  return divDesde;
}

function crearSelectHasta(semanasDisponibles) {
  const divHasta = document.createElement('div');
  divHasta.style.display = 'flex';
  divHasta.style.flexDirection = 'column';
  divHasta.style.gap = '4px';
  divHasta.style.flex = '1';
  
  const lblHasta = document.createElement('label');
  lblHasta.style.fontSize = '0.65rem';
  lblHasta.style.fontWeight = '700';
  lblHasta.style.color = 'var(--text-sub)';
  lblHasta.textContent = 'Hasta:';
  
  const selectHasta = document.createElement('select');
  selectHasta.className = 'period-select-custom';
  
  semanasDisponibles.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = `Semana ${s}`;
    if (s === rangeEndWeek) opt.selected = true;
    if (s < rangeStartWeek) opt.disabled = true; // No permite finalizar antes del inicio seleccionado
    selectHasta.appendChild(opt);
  });
  
  selectHasta.onchange = (e) => {
    rangeEndWeek = parseInt(e.target.value);
    actualizarEtiquetaPeriodoAcumulado();
    poblarPeriodSelector();
    render();
  };
  
  divHasta.appendChild(lblHasta);
  divHasta.appendChild(selectHasta);
  return divHasta;
}

function crearBotonAplicarRango() {
  const btn = document.createElement('button');
  btn.style.marginTop = '4px';
  btn.style.width = '100%';
  btn.style.padding = '8px';
  btn.style.borderRadius = 'var(--r-md)';
  btn.style.border = 'none';
  btn.style.background = 'var(--primary)';
  btn.style.color = '#fff';
  btn.style.fontSize = '0.75rem';
  btn.style.fontWeight = '700';
  btn.style.cursor = 'pointer';
  btn.textContent = 'Aplicar Rango';
  btn.onclick = closePeriodDropdown;
  return btn;
}

function actualizarEtiquetaPeriodoAcumulado() {
  const label = document.getElementById('period-label');
  if (label) {
    label.textContent = `Semanas ${rangeStartWeek} a ${rangeEndWeek}`;
  }
}

/**
 * Configura y renderiza el selector por semana única (Modo Semanal)
 */
function poblarSelectorSemanal(drop, semanasDisponibles) {
  drop.style.minWidth = '160px';
  drop.style.padding = '6px';
  
  semanasDisponibles.forEach(s => {
    const opt = document.createElement('button');
    opt.className = `period-option ${s === activeWeek ? 'active' : ''}`;
    opt.textContent = `Semana ${s}`;
    opt.onclick = () => {
      activeWeek = s;
      const label = document.getElementById('period-label');
      if (label) label.textContent = `Semana ${s}`;
      closePeriodDropdown();
      render();
    };
    drop.appendChild(opt);
  });

  const label = document.getElementById('period-label');
  if (label) label.textContent = `Semana ${activeWeek}`;
}

// ══════════════════════════════════════════════════════════════════════════
// UTILIDADES COMUNES Y TEMA (DARK / LIGHT)
// ══════════════════════════════════════════════════════════════════════════

export function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('mobile-open');
}

export function toggleTheme() {
  const html = document.documentElement;
  const dark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', dark ? 'light' : 'dark');
  
  const moonIcon = document.getElementById('theme-moon');
  const sunIcon = document.getElementById('theme-sun');
  if (moonIcon && sunIcon) {
    moonIcon.style.display = dark ? 'block' : 'none';
    sunIcon.style.display = dark ? 'none' : 'block';
  }
  
  localStorage.setItem('edumetric-theme', dark ? 'light' : 'dark');
}

function initTheme() {
  const t = localStorage.getItem('edumetric-theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
  const isDark = t === 'dark';
  const moonIcon = document.getElementById('theme-moon');
  const sunIcon = document.getElementById('theme-sun');
  if (moonIcon && sunIcon) {
    moonIcon.style.display = isDark ? 'none' : 'block';
    sunIcon.style.display = isDark ? 'block' : 'none';
  }
}

// Vincular funciones al objeto global `window` para compatibilidad directa
// con los eventos inline declarados en index.html
window.setWeekType = setWeekType;
window.setAggregation = setAggregation;
window.toggleSortOrder = toggleSortOrder;
window.togglePeriodDropdown = togglePeriodDropdown;
window.closePeriodDropdown = closePeriodDropdown;
window.toggleMobileSidebar = toggleMobileSidebar;
window.toggleTheme = toggleTheme;
window.navigateTo = navigateTo;
window.selectCategory = selectCategory;
window.setViewMode = setViewMode;

// Funciones del Plan de Repaso
window.guardarEstadoRepaso = guardarEstadoRepaso;
window.toggleTemaExpandido = toggleTemaExpandido;
window.setRepasoViewType = setRepasoViewType;
window.setRepasoFiltroEstado = setRepasoFiltroEstado;
window.setRepasoFiltroSemana = setRepasoFiltroSemana;

// Inicialización de la aplicación al cargarse la ventana
function init() {
  initTheme();
  generarBaseDeDatos();
  
  activeWeekType = 'avance';
  activeWeek = CICLO.semanasAvance[0];
  rangeStartWeek = CICLO.semanasAvance[0];
  rangeEndWeek = CICLO.semanasAvance[CICLO.semanasAvance.length - 1];
  
  poblarPeriodSelector();
  render();
}

window.onload = init;
