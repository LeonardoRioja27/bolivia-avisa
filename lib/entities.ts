/**
 * Entidades a las que se reenvían las quejas. Claude elige una por aviso
 * (lib/classify.ts). Aquí no hay correos: viven solo en envios/contactos.csv,
 * que no se sube a GitHub; el script envios/enviar.mjs une ambos por «id».
 *
 * Generado a partir de envios/contactos.csv. Si cambias una entidad allí,
 * cambia también su fila aquí (el script avisa si falta alguna).
 */
export type Entity = { id: string; sigla: string; nombre: string; atiende: string; zona: string };

export const ENTITIES = [
  {"id": "ABC", "sigla": "ABC", "nombre": "Administradora Boliviana de Carreteras", "atiende": "carreteras nacionales y peajes", "zona": "Bolivia"},
  {"id": "ASFI", "sigla": "ASFI", "nombre": "Autoridad de Supervisión del Sistema Financiero", "atiende": "bancos, cooperativas y entidades financieras: cobros indebidos, mala atención, derechos del consumidor financiero", "zona": "Bolivia"},
  {"id": "ATT-TEL", "sigla": "ATT", "nombre": "Autoridad de Regulación y Fiscalización de Telecomunicaciones y Transportes", "atiende": "telecomunicaciones: telefonía móvil y fija, internet y TV por cable (cortes, mala señal, cobros indebidos, mala atención de las operadoras)", "zona": "Bolivia"},
  {"id": "ATT-TRANS", "sigla": "ATT", "nombre": "Autoridad de Regulación y Fiscalización de Telecomunicaciones y Transportes (transportes)", "atiende": "transporte interdepartamental en bus y vuelos de aerolíneas: retrasos, cancelaciones, cobros indebidos, equipaje, maltrato a pasajeros", "zona": "Bolivia"},
  {"id": "ENDE", "sigla": "ENDE", "nombre": "Empresa Nacional de Electricidad", "atiende": "energía eléctrica: cortes de luz, variaciones de voltaje, cobros y facturas de luz, medidores, cables o postes eléctricos caídos, alumbrado público (faroles de la calle apagados o dañados)", "zona": "Bolivia"},
  {"id": "INE", "sigla": "INE", "nombre": "Instituto Nacional de Estadística", "atiende": "información estadística oficial: censos, encuestas, datos de población, precios e inflación; problemas con los encuestadores o al responder el censo o encuestas", "zona": "Bolivia"},
  {"id": "INE-TRANSP", "sigla": "INE", "nombre": "Instituto Nacional de Estadística (transparencia)", "atiende": "transparencia y lucha contra la corrupción dentro del INE: denuncias de corrupción, cobros irregulares o mal uso de recursos por funcionarios o encuestadores del INE", "zona": "Bolivia"},
  {"id": "MT", "sigla": "MT", "nombre": "Empresa Estatal de Transporte por Cable \"Mi Teleférico\"", "atiende": "teleférico: líneas y estaciones, cabinas detenidas o averiadas, filas y demoras, tarjetas y pasajes, mala atención del personal, objetos olvidados en cabinas o estaciones", "zona": "La Paz y El Alto"},
  {"id": "MIN-EDU", "sigla": "MIN-EDU", "nombre": "Ministerio de Educación", "atiende": "educación: escuelas y colegios fiscales y de convenio, maestros (conducta, ausencia, paros), inscripciones, cobros indebidos en colegios, infraestructura escolar, desayuno escolar, bono Juancito Pinto", "zona": "Bolivia"},
  {"id": "INRA", "sigla": "INRA", "nombre": "Instituto Nacional de Reforma Agraria", "atiende": "tierras rurales y urbanas (terrenos y lotes en la ciudad incluidos): saneamiento y titulación de tierras, conflictos de límites, avasallamientos y tomas de tierras, trámites de títulos agrarios", "zona": "Bolivia"},
  {"id": "SENASAG", "sigla": "SENASAG", "nombre": "Servicio Nacional de Sanidad Agropecuaria e Inocuidad Alimentaria", "atiende": "inocuidad de alimentos y sanidad agropecuaria: alimentos vencidos, adulterados o en mal estado en mercados, tiendas o restaurantes; carne o productos sin control sanitario; mataderos clandestinos; plagas y enfermedades de cultivos o animales", "zona": "Bolivia"},
  {"id": "SIN-INFO", "sigla": "SIN", "nombre": "Servicio de Impuestos Nacionales (información tributaria)", "atiende": "consultas y trámites tributarios: NIT, declaraciones, problemas con la facturación electrónica o el sistema del SIN", "zona": "Bolivia"},
  {"id": "SIN-GEN", "sigla": "SIN", "nombre": "Servicio de Impuestos Nacionales (general)", "atiende": "quejas y denuncias generales sobre impuestos: negocios que no entregan factura, facturas falsas o mal emitidas, mala atención en oficinas del SIN, cualquier otro tema del SIN", "zona": "Bolivia"},
  {"id": "ANB", "sigla": "ANB", "nombre": "Aduana Nacional de Bolivia", "atiende": "aduanas: trámites de importación y exportación, retención de mercadería o encomiendas del exterior, problemas con el sistema SUMA de la Aduana, mala atención en oficinas o fronteras", "zona": "Bolivia"},
  {"id": "YPFB-TRANSP", "sigla": "YPFB", "nombre": "Yacimientos Petrolíferos Fiscales Bolivianos (transparencia)", "atiende": "transparencia y lucha contra la corrupción dentro de YPFB: denuncias de corrupción, cobros irregulares, sobreprecios o mal uso de recursos por funcionarios de YPFB", "zona": "Bolivia"},
  {"id": "CNS-SC", "sigla": "CNSSC", "nombre": "Caja Nacional de Salud Santa Cruz", "atiende": "seguro de salud de la CNS: atención en hospitales y policlínicos de la Caja, fichas y demoras, falta de medicamentos, maltrato del personal, afiliación y bajas de asegurados", "zona": "Santa Cruz"},
  {"id": "SEGIP", "sigla": "SEGIP", "nombre": "Servicio General de Identificación Personal", "atiende": "carnet de identidad y licencias de conducir: trámites, citas, demoras, filas, errores en datos, mala atención en oficinas del SEGIP", "zona": "Bolivia"},
  {"id": "SERECI-SC", "sigla": "SERECI", "nombre": "Servicio de Registro Cívico Santa Cruz (Órgano Electoral Plurinacional)", "atiende": "registro civil: certificados de nacimiento, matrimonio y defunción, correcciones de partidas, oficialías de registro civil, empadronamiento electoral", "zona": "Santa Cruz"},
  {"id": "POLICIA", "sigla": "CGP", "nombre": "Policía Boliviana (Comando General de la Policía)", "atiende": "policía: delitos (robos, asaltos, violencia), personas desaparecidas, inseguridad en barrios, contrabando y venta de mercadería de contrabando, todos los objetos perdidos y encontrados, mala conducta o cobros irregulares de policías", "zona": "Bolivia"},
  {"id": "GESTORA", "sigla": "GESTORA", "nombre": "Gestora Pública de la Seguridad Social de Largo Plazo", "atiende": "jubilación y pensiones: aportes a la AFP o la Gestora, trámites y pagos de jubilación, renta de vejez, invalidez o viudez, retiro de aportes, devolución de aportes, mala atención en oficinas de la Gestora", "zona": "Bolivia"},
  {"id": "AAPS", "sigla": "AAPS", "nombre": "Autoridad de Fiscalización y Control Social de Agua Potable y Saneamiento Básico", "atiende": "agua potable y alcantarillado: cortes o falta de agua, agua sucia o de mala calidad, baja presión, cobros y facturas de agua, medidores, alcantarillas tapadas o rebalsadas, fugas de agua o de aguas servidas, mala atención de las empresas de agua (EPSAS, SAGUAPAC, SEMAPA, etc.)", "zona": "Bolivia"},
  {"id": "ANH", "sigla": "ANH", "nombre": "Agencia Nacional de Hidrocarburos", "atiende": "combustibles e hidrocarburos: falta de gasolina o diésel, filas en surtidores, combustible adulterado o mal medido en surtidores, garrafas de gas (falta, precio, peso), gas domiciliario (cortes, fugas, cobros, instalación), especulación con combustibles", "zona": "Bolivia"},
] as const satisfies readonly Entity[];

export type EntityId = (typeof ENTITIES)[number]["id"];
export const ENTITY_IDS = ENTITIES.map((e) => e.id) as [EntityId, ...EntityId[]];

/** Todos los objetos perdidos y encontrados van a la policía. */
export const LOST_AND_FOUND_ENTITY: EntityId = "POLICIA";

export const entityById = (id: string | null | undefined) => ENTITIES.find((e) => e.id === id);
