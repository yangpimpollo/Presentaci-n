// ══════════════════════════════════════════════════════════════════════════
// CAPA DE DOMINIO (DOMAIN LAYER)
// ──────────────────────────────────────────────────────────────────────────
// Responsabilidad: Contiene las entidades, reglas de negocio puras y modelos 
// de datos elementales. Es el núcleo de la aplicación, completamente aislado 
// y agnóstico de frameworks, bases de datos o de la interfaz de usuario.
// En este caso, representa los metadatos del ciclo y el syllabus de San Marcos.
// ══════════════════════════════════════════════════════════════════════════

export const CICLO = {
  alumno: 'Julio Ventura',
  initials: 'JV',
  semanas: 13,
  preguntasPorExamen: { min: 4, max: 10 },
  semanasAvance: [1, 2, 4, 5, 7, 9, 10, 11],
  semanasFeedback: [3, 6, 8, 12, 13]
};

// 20 Cursos del Syllabus de San Marcos
export const GRUPOS_CURSOS = {
  'Números': [
    'Álgebra', 'Aritmética', 'Geometría', 'Trigonometría', 'Razonamiento Matemático'
  ],
  'Ciencias': [
    'Física', 'Química', 'Biología', 'Anatomía', 'Ecología'
  ],
  'Letras': [
    'Lenguaje', 'Literatura', 'Razonamiento Verbal'
  ],
  'Humanidades': [
    'Historia del Perú', 'Historia Universal', 'Geografía', 'Economía', 'Filosofía', 'Psicología', 'Cívica'
  ]
};

export const COLORES_CATEGORIA = {
  'Números': '#f59e0b',     // Ámbar/Naranja
  'Ciencias': '#06b6d4',    // Celeste/Cyan
  'Letras': '#8b5cf6',      // Púrpura
  'Humanidades': '#ec4899'  // Rosa
};

export const ICONOS_CATEGORIA = {
  'Números': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;stroke-width:2.2;"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>',
  'Ciencias': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;stroke-width:2.2;"><path d="M10 2v7.31L4.75 17h14.5L14 9.3V2z"/><line x1="8.5" y1="2" x2="15.5" y2="2"/><line x1="7" y1="14" x2="17" y2="14"/></svg>',
  'Letras': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;stroke-width:2.2;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  'Humanidades': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;stroke-width:2.2;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
};

export const ALL_CURSOS = Object.values(GRUPOS_CURSOS).flat();

// Perfiles base con dispersión realista
export const PERFILES = {
  'Álgebra':                { base: 0.52, sigma: 0.08 },
  'Aritmética':             { base: 0.61, sigma: 0.08 },
  'Geometría':              { base: 0.58, sigma: 0.09 },
  'Trigonometría':          { base: 0.55, sigma: 0.10 },
  'Razonamiento Matemático':{ base: 0.63, sigma: 0.07 },
  'Física':                 { base: 0.56, sigma: 0.11 },
  'Química':                { base: 0.59, sigma: 0.10 },
  'Biología':               { base: 0.76, sigma: 0.07 },
  'Anatomía':               { base: 0.72, sigma: 0.08 },
  'Ecología':               { base: 0.81, sigma: 0.07 },
  'Lenguaje':               { base: 0.85, sigma: 0.06 },
  'Literatura':             { base: 0.83, sigma: 0.07 },
  'Razonamiento Verbal':    { base: 0.88, sigma: 0.05 },
  'Historia del Perú':      { base: 0.77, sigma: 0.08 },
  'Historia Universal':     { base: 0.74, sigma: 0.08 },
  'Geografía':              { base: 0.78, sigma: 0.07 },
  'Economía':               { base: 0.68, sigma: 0.10 },
  'Filosofía':              { base: 0.71, sigma: 0.09 },
  'Psicología':             { base: 0.79, sigma: 0.07 },
  'Cívica':                 { base: 0.82, sigma: 0.07 }
};

// Temas del syllabus de San Marcos para las 13 semanas
export const SYLLABUS_SAN_MARCOS = {
  'Aritmética': [
    'Teoría de Conjuntos y Relaciones', 'Propiedades de Conjuntos y cardinalidad', 'Sistemas de Numeración Decimal', 
    'Cuatro Operaciones en Enteros', 'Teoría de la Divisibilidad y Criterios', 'Números Primos y Compuestos', 
    'MCD y MCM con propiedades', 'Fracciones y Operaciones', 'Razones y Proporciones aritméticas', 
    'Magnitudes Proporcionales directas e inversas', 'Regla de Tres Simple y Compuesta', 
    'Tanto por Ciento y Aplicaciones Comerciales', 'Interés Simple y Compuesto'
  ],
  'Álgebra': [
    'Leyes de Exponentes y Radicales', 'Polinomios y Grados de expresión', 'Productos Notables fundamentales', 
    'División Polinomial y Teorema del Resto', 'Factorización de Polinomios por aspa', 'Números Complejos e imaginarios', 
    'Ecuaciones de Primer y Segundo Grado', 'Ecuaciones de Grado Superior y Bicuadradas', 
    'Sistemas de Ecuaciones Lineales', 'Desigualdades e Inecuaciones cuadráticas', 'Funciones Reales y Dominio Rango', 
    'Logaritmos y sus identidades', 'Sucesiones y Progresiones numéricas'
  ],
  'Geometría': [
    'Segmentos y Ángulos del plano', 'Triángulos: Propiedades Fundamentales', 'Congruencia de Triángulos y criterios', 
    'Polígonos y Cuadriláteros propiedades', 'Circunferencia y ángulos inscritos', 'Puntos Notables: Baricentro e Incentro', 
    'Proporcionalidad y Semejanza de Tales', 'Relaciones Métricas en Triángulos Rectángulos', 'Áreas de Regiones Poligonales planas', 
    'Áreas de Regiones Circulares y sectores', 'Geometría del Espacio: Prismas y Cilindros', 
    'Pirámide, Cono y Esfera sólidos', 'Geometría Analítica: La Recta y distancia'
  ],
  'Trigonometría': [
    'Sistemas de Medición Angular sexagesimal', 'Sector Circular y Ruedas que giran', 'Razones Trigonométricas de Ángulos Agudos', 
    'Ángulos Verticales de elevación y depresión', 'Razones de Ángulos en Posición Normal', 
    'Reducción al Primer Cuadrante de ángulos', 'Circunferencia Trigonométrica (C.T.) líneas', 'Identidades Trigonométricas Fundamentales', 
    'Identidades de Ángulos Compuestos suma', 'Identidades de Ángulo Doble y Mitad', 
    'Transformaciones Trigonométricas a producto', 'Ecuaciones Trigonométricas soluciones', 'Resolución de Triángulos Oblicuángulos'
  ],
  'Física': [
    'Análisis Dimensional y vectores suma', 'Cinemática: MRU y MRUV descripción', 'Movimiento Vertical de Caída Libre', 
    'Movimiento Parabólico y MCU', 'Leyes de Newton y Fuerzas en Equilibrio', 'Dinámica Lineal y fuerza centrípeta', 
    'Trabajo Mecánico y Potencia útil', 'Energía Mecánica y Conservación física', 'Cantidad de Movimiento y Choques', 
    'Gravitación Universal y Oscilaciones MAS', 'Hidrostática: Presión y Empuje', 'Termodinámica y calor absorbido', 
    'Electrostática y Campo Eléctrico'
  ],
  'Química': [
    'Materia: Clasificación y Fenómenos', 'Estructura Atómica y Partículas', 'Configuración Electrónica cuántica', 
    'Tabla Periódica y Grupos', 'Enlace Químico iónico y covalente', 'Nomenclatura Inorgánica óxidos hidróxidos', 
    'Reacciones Químicas: Tipos y Balance', 'Estequiometría y Reactivo Limitante', 'Sistemas Dispersos y Soluciones químicas', 
    'Cinética Química y Equilibrio reversible', 'Química Orgánica: Hidrocarburos alcanos', 'Funciones Oxigenadas y Nitrogenadas', 
    'Química Ambiental y Efecto Invernadero'
  ],
  'Biología': [
    'Introducción a la Biología y Bioquímica', 'Citología: Célula Procariota y Eucariota', 'Membrana y Transporte pasivo activo', 
    'Dogma de la Biología Molecular ADN ARN', 'Ciclo Celular: Fases e Interfase', 'Meiosis y variabilidad genética', 
    'Genética Mendeliana: Cruzamientos', 'Evolución y teorías del origen', 'Taxonomía: Los 5 Reinos Biológicos', 
    'Reino Plantae y Fotosíntesis', 'Reino Animalia: Invertebrados y Vertebrados', 'Ecología: Cadenas tróficas', 
    'Salud y Enfermedades Infecciosas virus'
  ],
  'Anatomía': [
    'Histología Humana: Epitelial y Conectivo', 'Sistema Óseo: Huesos del esqueleto', 'Sistema Muscular contracción', 
    'Aparato Digestivo y digestión mecánica', 'Aparato Respiratorio y ventilación', 'Aparato Cardiovascular: Corazón y Ciclo', 
    'Sistema Excretor: Nefrón y Orina', 'Sistema Endocrino: Glándulas y Hormonas', 'Sistema Nervioso: Sinapsis y Neuronas', 
    'Sistema Nervioso Central y encéfalo', 'Aparato Reproductor Masculino Femenino', 
    'Inmunología y Defensas del organismo', 'Embriología Humana: Fecundación fases'
  ],
  'Lenguaje': [
    'La Comunicación y Factores del Lenguaje', 'Fonología y Fonética del Castellano', 'Sílaba y Reglas de Acentuación', 
    'Morfología: Raíz y Afijos', 'El Sustantivo: Género y Número', 'El Pronombre y determinantes', 
    'El Verbo: Regular e Irregular tiempo', 'Adverbio, Preposición y Conjunción nexos', 'La Oración Bimembre y el Sujeto', 
    'El Predicado: Objeto Directo e Indirecto', 'Oración Compuesta Coordinada yuxtapuesta', 'Oración Compuesta Subordinada sustantiva', 
    'Uso de Mayúsculas y Signos gramaticales'
  ],
  'Literatura': [
    'Teoría Literaria: Géneros y Figuras', 'Literatura Griega: La Ilíada y Odisea', 'Teatro Griego: Tragedias de Sófocles', 
    'Literatura Medieval: Cantar de Mio Cid', 'Siglo de Oro Español: Renacimiento', 'Literatura del Realismo Español y Generación 98', 
    'Generación del 27: Poesía de Lorca', 'Romanticismo y Realismo en el Perú', 'Modernismo y Postmodernismo en el Perú', 
    'Indigenismo y Poesía de Vallejo', 'Narrativa del Boom Latinoamericano Vargas Llosa', 
    'Poesía Peruana Contemporánea', 'Literatura Hispanoamericana del modernismo'
  ],
  'Historia del Perú': [
    'Poblamiento Americano y Lítico Peruano', 'Formativo Andino: Chavín y Paracas', 'Primer Desarrollo Regional: Moche Nazca', 
    'Imperio Wari y Estados Regionales Chimú', 'El Tahuantinsuyo: Expansión y Leyendas', 
    'Invasión Española y Socios de Conquista', 'Resistencia de Vilcabamba e Incas', 'El Virreinato: Mita y Minería colonial', 
    'Reformas Borbónicas del siglo XVIII', 'Corrientes Libertadoras de San Martín y Bolívar', 
    'Primer Militarismo peruano y caudillos', 'La Era del Guano y Contrato Dreyfus', 'Guerra con Chile y Campaña de la Breña'
  ],
  'Historia Universal': [
    'Hominización y Edades de Prehistoria', 'Egipto y Mesopotamia culturas', 'Grecia Antigua: Atenas y Esparta polis', 
    'Roma: República y Crisis del Imperio', 'Edad Media: Feudalismo y Cruzadas', 
    'Humanismo y Renacimiento científico', 'Absolutismo Europeo y Revolución Inglesa', 'La Ilustración y Revolución Francesa', 
    'Revolución Industrial y Movimiento Obrero', 'Imperialismo colonial y Primera Guerra Mundial', 'Revolución Rusa y Fascismo italiano', 
    'Segunda Guerra Mundial y Bloques de Guerra Fría', 'Mundo Contemporáneo y Globalización'
  ],
  'Geografía': [
    'Geodesia: Coordenadas y Husos horarios', 'Cartografía: Mapas y Proyecciones', 'Litosfera y Tectónica de Placas', 
    'Geodinámica Exógena: Erosión y Meteorización', 'Atmósfera y Factores del Clima peruano', 'El Mar Peruano y Corriente de El Niño', 
    'Vertientes Hidrográficas del Pacífico Amazonas', 'Las 8 Regiones Naturales de Pulgar Vidal', 'Las 11 Ecorregiones de Antonio Brack', 
    'Parques Nacionales y Reservas del Estado', 'Sectores Económicos: Minería y Agricultura', 'Población Peruana: Censo y Migraciones', 
    'Fronteras del Perú y Tratados limítrofes'
  ],
  'Economía': [
    'Introducción a la Economía y Escasez', 'Bienes Económicos y Fases del Proceso', 'Factores Productivos: Tierra y Trabajo', 
    'El Capital y Tipos de Empresas', 'Circulación: Flujo Circular y Mercados', 'Teoría de la Demanda y de la Oferta', 
    'Elasticidad Precio de la Demanda', 'Dinero: Funciones e Inflación en el Perú', 'Sistema Financiero y Bancos reguladores', 
    'Presupuesto General y Tributos SUNAT', 'Comercio Exterior: Importación Balanza', 'Integración Latinoamericana TLC', 
    'Desarrollo Económico e Índices de Pobreza'
  ],
  'Filosofía': [
    'Origen de la Filosofía y Actitud Filosófica', 'Periodo Cosmológico: Arjé presocrático', 'Periodo Antropológico: Sócrates dialéctica', 
    'Sistemáticos: Idealismo Platón y Realismo Aristóteles', 'Patrística y Escolástica medieval Tomás', 'Racionalismo Descartes y Empirismo Locke', 
    'Criticismo Ilustrado de Immanuel Kant', 'Marxismo y Positivismo decimonónico', 
    'Existencialismo Sartre e Historicismo Dilthey', 'Gnoseología: Posibilidad del Conocimiento', 'Epistemología: Método Científico e Hipótesis', 
    'Axiología: Juicios de Valor y Ética', 'Antropología Filosófica: Origen del Hombre'
  ],
  'Psicología': [
    'Introducción a la Psicología y Escuelas', 'Bases Biológicas: Cerebro y Neuronas', 'Socialización y Entorno Familiar cultural', 
    'Sensación y Percepción de Estímulos', 'Memoria: Almacenamiento y Olvido', 'Aprendizaje: Condicionamiento Clásico Operante', 
    'Inteligencia: Medida y Teorías múltiples', 'Motivación y Emociones humanas', 'Desarrollo Humano: Niñez y Adolescencia', 
    'Personalidad: Teorías de Freud y Jung', 'Trastornos de Personalidad y Neurosis', 'Orientación Vocacional y Metas personales', 
    'Actitudes, Prejuicios y Estereotipos sociales'
  ],
  'Cívica': [
    'Derechos Humanos e Historia Declaración', 'Derechos Constitucionales de la Persona', 'Garantías Constitucionales: Habeas Corpus', 
    'La Familia y el Matrimonio legal', 'El Estado Peruano: Estructura soberanía', 'Poder Legislativo: Congreso y leyes', 
    'Poder Ejecutivo: Presidente y Ministros', 'Poder Judicial: Jueces e Instancias', 'Órganos Autónomos: BCR, TC, Defensoría', 
    'El Sistema Electoral: JNE, ONPE, RENIEC', 'Democracia y Mecanismos de Participación', 'Defensa Nacional y Sinadeci', 
    'Organizaciones Mundiales: ONU y OEA'
  ],
  'Razonamiento Matemático': [
    'Juegos de Ingenio y palitos de fósforo', 'Orden de Información horizontal y circular', 'Parentesco y Relación de Tiempo días', 
    'Inducción y Deducción Matemática razonada', 'Planteo de Ecuaciones lineales simples', 'Edades y relaciones temporales', 
    'Móviles: Tiempo de encuentro y alcance', 'Sucesiones Aritméticas y Geométricas', 'Distribuciones Gráficas y Numéricas', 
    'Criptoaritmética: Reconstrucción de operaciones', 'Operadores Matemáticos con tablas fórmulas', 'Conteo de Figuras y Trazos de un trazo', 
    'Áreas de Regiones Sombreadas geometría'
  ],
  'Razonamiento Verbal': [
    'Comprensión de Lectura: Temas e Ideas principales', 'Tipos de Textos según contenido estructura', 'Sinónimos y Antónimos contextuales', 
    'Analogías y Parejas Conceptuales lógicas', 'Oraciones Incompletas y Cohesión léxica', 'Conectores Lógicos y Marcadores del discurso', 
    'Información Eliminada por contradicción', 'Plan de Redacción por orden cronológico', 'Inferencia y Conclusiones del texto', 
    'Sentido Denotativo y Connotativo palabras', 'Compatibilidad textual y verificación enunciados', 'Textos Dialécticos: Tesis y Antítesis', 
    'Término Excluido y Vocabulario en contexto'
  ],
  'Ecología': [
    'Ecología y Niveles de Organización biosfera', 'Ecosistemas: Factores Biotopo Biocenosis', 'Cadenas y Redes Alimenticias energía', 
    'Ciclos del Carbono, Nitrógeno y Agua', 'Relaciones Simbióticas e Interespecíficas', 'Biomas Mundiales y Especies asociadas', 
    'Recursos Naturales y Clasificación básica', 'Contaminación Ambiental y Agentes químicos', 
    'Calentamiento Global y Capa de Ozono', 'Desarrollo Sostenible y Huella Ecológica', 
    'Áreas Naturales Protegidas Parques del Perú', 'Especies Amenazadas del Perú en Peligro', 
    'Tratados Ambientales: Protocolo de Kioto París'
  ]
};
