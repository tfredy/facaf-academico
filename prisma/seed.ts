import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ═══════════════════════════════════════════════════════════════
  // LIMPIEZA
  // ═══════════════════════════════════════════════════════════════
  await prisma.actividadUsuario.deleteMany({});
  await prisma.sesionLogin.deleteMany({});
  await prisma.notificacion.deleteMany({});
  await prisma.horarioClase.deleteMany({});
  await prisma.registroEvaluacion.deleteMany({});
  await prisma.contenidoClase.deleteMany({});
  await prisma.calificacion.deleteMany({});
  await prisma.inscripcion.deleteMany({});
  await prisma.docenteAsignatura.deleteMany({});
  await prisma.asignatura.deleteMany({});
  await prisma.periodoExamen.deleteMany({});
  await prisma.estudiante.deleteMany({});
  await prisma.docente.deleteMany({});
  await prisma.mallaCurricular.deleteMany({});
  await prisma.sede.deleteMany({});
  await prisma.user.deleteMany({});

  // ═══════════════════════════════════════════════════════════════
  // SEDES
  // ═══════════════════════════════════════════════════════════════
  const sedeArtigas = await prisma.sede.create({
    data: { nombre: "General Artigas", codigo: "GAR", direccion: "Ruta VI km 35 - General Artigas, Itapúa", telefono: "+595 764 20300", activa: true },
  });
  const sedeNatalio = await prisma.sede.create({
    data: { nombre: "Natalio", codigo: "NAT", direccion: "Avda. San Blas c/ 14 de Mayo - Natalio, Itapúa", telefono: "+595 761 20100", activa: true },
  });
  const sedeSanPedro = await prisma.sede.create({
    data: { nombre: "San Pedro del Paraná", codigo: "SPP", direccion: "Centro Urbano - San Pedro del Paraná, Itapúa", telefono: "+595 762 20200", activa: true },
  });
  const sedeMayorOtano = await prisma.sede.create({
    data: { nombre: "Mayor Otaño", codigo: "MOT", direccion: "Barrio Centro - Mayor Otaño, Itapúa", telefono: "+595 763 20400", activa: true },
  });

  // ═══════════════════════════════════════════════════════════════
  // USUARIOS DEL SISTEMA
  // ═══════════════════════════════════════════════════════════════
  const adminUser = await prisma.user.create({
    data: { name: "Administrador FaCAF", email: "admin@facaf.uni.edu.py", rol: "ADMIN" },
  });
  const academicoUser = await prisma.user.create({
    data: { name: "Unidad Académica", email: "academico@facaf.uni.edu.py", rol: "ACADEMICO" },
  });

  // ─── Docentes (8 docentes para cubrir varias carreras) ───
  const docenteUsers = await Promise.all([
    prisma.user.create({ data: { name: "Ing. Agr. Carlos Ramírez", email: "c.ramirez@facaf.uni.edu.py", rol: "DOCENTE" } }),
    prisma.user.create({ data: { name: "Dr. Jorge Villalba", email: "j.villalba@facaf.uni.edu.py", rol: "DOCENTE" } }),
    prisma.user.create({ data: { name: "Ing. Agr. María Benítez", email: "m.benitez@facaf.uni.edu.py", rol: "DOCENTE" } }),
    prisma.user.create({ data: { name: "Lic. Ana Paredes", email: "a.paredes@facaf.uni.edu.py", rol: "DOCENTE" } }),
    prisma.user.create({ data: { name: "Ing. Agr. Roberto Acosta", email: "r.acosta@facaf.uni.edu.py", rol: "DOCENTE" } }),
    prisma.user.create({ data: { name: "Dr. Fernando Giménez", email: "f.gimenez@facaf.uni.edu.py", rol: "DOCENTE" } }),
    prisma.user.create({ data: { name: "Lic. Patricia Núñez", email: "p.nunez@facaf.uni.edu.py", rol: "DOCENTE" } }),
    prisma.user.create({ data: { name: "Ing. For. Miguel Cabrera", email: "m.cabrera@facaf.uni.edu.py", rol: "DOCENTE" } }),
  ]);

  const docentes = await Promise.all([
    prisma.docente.create({ data: { usuarioId: docenteUsers[0].id, especialidad: "Producción Agrícola", titulo: "Ingeniero Agrónomo - MSc. Ciencias Agrarias", telefono: "+595 981 100001" } }),
    prisma.docente.create({ data: { usuarioId: docenteUsers[1].id, especialidad: "Ciencias del Suelo", titulo: "Doctor en Edafología", telefono: "+595 981 100002" } }),
    prisma.docente.create({ data: { usuarioId: docenteUsers[2].id, especialidad: "Protección Vegetal", titulo: "Ingeniera Agrónoma - MSc. Entomología", telefono: "+595 981 100003" } }),
    prisma.docente.create({ data: { usuarioId: docenteUsers[3].id, especialidad: "Administración y Economía", titulo: "Licenciada en Administración de Empresas", telefono: "+595 981 100004" } }),
    prisma.docente.create({ data: { usuarioId: docenteUsers[4].id, especialidad: "Producción Animal", titulo: "Ingeniero Agrónomo - MSc. Zootecnia", telefono: "+595 981 100005" } }),
    prisma.docente.create({ data: { usuarioId: docenteUsers[5].id, especialidad: "Matemática y Estadística", titulo: "Doctor en Ciencias Exactas", telefono: "+595 981 100006" } }),
    prisma.docente.create({ data: { usuarioId: docenteUsers[6].id, especialidad: "Gestión Cooperativa", titulo: "Licenciada en Ciencias Sociales", telefono: "+595 981 100007" } }),
    prisma.docente.create({ data: { usuarioId: docenteUsers[7].id, especialidad: "Ciencias Forestales", titulo: "Ingeniero Forestal - MSc. Manejo de Bosques", telefono: "+595 981 100008" } }),
  ]);

  // ═══════════════════════════════════════════════════════════════
  // MALLAS CURRICULARES (Carreras por Sede)
  // ═══════════════════════════════════════════════════════════════

  // Ingeniería Agropecuaria — General Artigas
  const mallaIAgropGAR = await prisma.mallaCurricular.create({
    data: { nombre: "Ingeniería Agropecuaria", codigo: "IA-GAR-2026", descripcion: "Plan de estudios Ingeniería Agropecuaria - Sede General Artigas", totalSemestres: 10, activa: true, sedeId: sedeArtigas.id },
  });
  // Ingeniería Agropecuaria — Natalio
  const mallaIAgropNAT = await prisma.mallaCurricular.create({
    data: { nombre: "Ingeniería Agropecuaria", codigo: "IA-NAT-2026", descripcion: "Plan de estudios Ingeniería Agropecuaria - Sede Natalio", totalSemestres: 10, activa: true, sedeId: sedeNatalio.id },
  });
  // Ingeniería Agronómica — General Artigas
  const mallaIAgronomGAR = await prisma.mallaCurricular.create({
    data: { nombre: "Ingeniería Agronómica", codigo: "IAGR-GAR-2026", descripcion: "Plan de estudios Ingeniería Agronómica - Sede General Artigas", totalSemestres: 10, activa: true, sedeId: sedeArtigas.id },
  });
  // Ingeniería Agronómica — Natalio
  const mallaIAgronomNAT = await prisma.mallaCurricular.create({
    data: { nombre: "Ingeniería Agronómica", codigo: "IAGR-NAT-2026", descripcion: "Plan de estudios Ingeniería Agronómica - Sede Natalio", totalSemestres: 10, activa: true, sedeId: sedeNatalio.id },
  });
  // Lic. en Administración de Empresas Agropecuarias — San Pedro
  const mallaLAEA = await prisma.mallaCurricular.create({
    data: { nombre: "Lic. en Administración de Empresas Agropecuarias", codigo: "LAEA-SPP-2026", descripcion: "Plan de estudios Lic. en Adm. de Empresas Agropecuarias - Sede San Pedro del Paraná", totalSemestres: 8, activa: true, sedeId: sedeSanPedro.id },
  });
  // Lic. en Administración de Cooperativas — San Pedro
  const mallaLAC = await prisma.mallaCurricular.create({
    data: { nombre: "Lic. en Administración de Cooperativas", codigo: "LAC-SPP-2026", descripcion: "Plan de estudios Lic. en Adm. de Cooperativas - Sede San Pedro del Paraná", totalSemestres: 8, activa: true, sedeId: sedeSanPedro.id },
  });

  // ═══════════════════════════════════════════════════════════════
  // ASIGNATURAS POR CARRERA
  // ═══════════════════════════════════════════════════════════════

  // --- Ingeniería Agropecuaria (General Artigas) ---
  const asigIAgropGAR_data = [
    // Semestre 1
    { nombre: "Matemática I", codigo: "IA-GAR-101", semestre: 1, creditos: 6, horasTeoricas: 4, horasPracticas: 2 },
    { nombre: "Química General", codigo: "IA-GAR-102", semestre: 1, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Biología General", codigo: "IA-GAR-103", semestre: 1, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Introducción a las Ciencias Agropecuarias", codigo: "IA-GAR-104", semestre: 1, creditos: 4, horasTeoricas: 3, horasPracticas: 1 },
    { nombre: "Comunicación Oral y Escrita", codigo: "IA-GAR-105", semestre: 1, creditos: 3, horasTeoricas: 2, horasPracticas: 1 },
    // Semestre 2
    { nombre: "Matemática II", codigo: "IA-GAR-201", semestre: 2, creditos: 6, horasTeoricas: 4, horasPracticas: 2 },
    { nombre: "Química Orgánica", codigo: "IA-GAR-202", semestre: 2, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Botánica General", codigo: "IA-GAR-203", semestre: 2, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Física Aplicada", codigo: "IA-GAR-204", semestre: 2, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Informática Aplicada", codigo: "IA-GAR-205", semestre: 2, creditos: 4, horasTeoricas: 2, horasPracticas: 2 },
    // Semestre 3
    { nombre: "Estadística Aplicada", codigo: "IA-GAR-301", semestre: 3, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Edafología", codigo: "IA-GAR-302", semestre: 3, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Zoología Agrícola", codigo: "IA-GAR-303", semestre: 3, creditos: 4, horasTeoricas: 3, horasPracticas: 1 },
    { nombre: "Genética General", codigo: "IA-GAR-304", semestre: 3, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Economía Agrícola", codigo: "IA-GAR-305", semestre: 3, creditos: 4, horasTeoricas: 3, horasPracticas: 1 },
    // Semestre 4
    { nombre: "Fisiología Vegetal", codigo: "IA-GAR-401", semestre: 4, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Microbiología Agrícola", codigo: "IA-GAR-402", semestre: 4, creditos: 4, horasTeoricas: 2, horasPracticas: 2 },
    { nombre: "Topografía y Cartografía", codigo: "IA-GAR-403", semestre: 4, creditos: 5, horasTeoricas: 2, horasPracticas: 3 },
    { nombre: "Maquinaria Agrícola", codigo: "IA-GAR-404", semestre: 4, creditos: 5, horasTeoricas: 2, horasPracticas: 3 },
    { nombre: "Administración Rural", codigo: "IA-GAR-405", semestre: 4, creditos: 4, horasTeoricas: 3, horasPracticas: 1 },
  ];

  // --- Ingeniería Agronómica (General Artigas) ---
  const asigIAgronomGAR_data = [
    // Semestre 1
    { nombre: "Matemática I", codigo: "IAGR-GAR-101", semestre: 1, creditos: 6, horasTeoricas: 4, horasPracticas: 2 },
    { nombre: "Química General e Inorgánica", codigo: "IAGR-GAR-102", semestre: 1, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Biología Celular", codigo: "IAGR-GAR-103", semestre: 1, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Introducción a la Agronomía", codigo: "IAGR-GAR-104", semestre: 1, creditos: 4, horasTeoricas: 3, horasPracticas: 1 },
    { nombre: "Metodología de la Investigación", codigo: "IAGR-GAR-105", semestre: 1, creditos: 3, horasTeoricas: 2, horasPracticas: 1 },
    // Semestre 2
    { nombre: "Matemática II", codigo: "IAGR-GAR-201", semestre: 2, creditos: 6, horasTeoricas: 4, horasPracticas: 2 },
    { nombre: "Química Orgánica y Biológica", codigo: "IAGR-GAR-202", semestre: 2, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Botánica Sistemática", codigo: "IAGR-GAR-203", semestre: 2, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Física", codigo: "IAGR-GAR-204", semestre: 2, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Ecología General", codigo: "IAGR-GAR-205", semestre: 2, creditos: 4, horasTeoricas: 3, horasPracticas: 1 },
    // Semestre 3
    { nombre: "Bioestadística", codigo: "IAGR-GAR-301", semestre: 3, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Edafología y Conservación de Suelos", codigo: "IAGR-GAR-302", semestre: 3, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Entomología Agrícola", codigo: "IAGR-GAR-303", semestre: 3, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Fisiología Vegetal", codigo: "IAGR-GAR-304", semestre: 3, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Climatología y Meteorología", codigo: "IAGR-GAR-305", semestre: 3, creditos: 4, horasTeoricas: 3, horasPracticas: 1 },
  ];

  // --- Lic. en Adm. de Empresas Agropecuarias (San Pedro) ---
  const asigLAEA_data = [
    // Semestre 1
    { nombre: "Matemática Empresarial", codigo: "LAEA-SPP-101", semestre: 1, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Introducción a la Administración", codigo: "LAEA-SPP-102", semestre: 1, creditos: 4, horasTeoricas: 3, horasPracticas: 1 },
    { nombre: "Contabilidad Básica", codigo: "LAEA-SPP-103", semestre: 1, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Introducción al Sector Agropecuario", codigo: "LAEA-SPP-104", semestre: 1, creditos: 4, horasTeoricas: 3, horasPracticas: 1 },
    { nombre: "Comunicación Empresarial", codigo: "LAEA-SPP-105", semestre: 1, creditos: 3, horasTeoricas: 2, horasPracticas: 1 },
    // Semestre 2
    { nombre: "Estadística para Negocios", codigo: "LAEA-SPP-201", semestre: 2, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Microeconomía", codigo: "LAEA-SPP-202", semestre: 2, creditos: 4, horasTeoricas: 3, horasPracticas: 1 },
    { nombre: "Contabilidad de Costos", codigo: "LAEA-SPP-203", semestre: 2, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Derecho Agrario", codigo: "LAEA-SPP-204", semestre: 2, creditos: 4, horasTeoricas: 3, horasPracticas: 1 },
    { nombre: "Informática Aplicada a la Gestión", codigo: "LAEA-SPP-205", semestre: 2, creditos: 4, horasTeoricas: 2, horasPracticas: 2 },
  ];

  // --- Lic. en Adm. de Cooperativas (San Pedro) ---
  const asigLAC_data = [
    // Semestre 1
    { nombre: "Matemática I", codigo: "LAC-SPP-101", semestre: 1, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Introducción al Cooperativismo", codigo: "LAC-SPP-102", semestre: 1, creditos: 4, horasTeoricas: 3, horasPracticas: 1 },
    { nombre: "Contabilidad General", codigo: "LAC-SPP-103", semestre: 1, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Sociología Rural", codigo: "LAC-SPP-104", semestre: 1, creditos: 4, horasTeoricas: 3, horasPracticas: 1 },
    { nombre: "Comunicación y Expresión", codigo: "LAC-SPP-105", semestre: 1, creditos: 3, horasTeoricas: 2, horasPracticas: 1 },
    // Semestre 2
    { nombre: "Estadística Aplicada", codigo: "LAC-SPP-201", semestre: 2, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Legislación Cooperativa", codigo: "LAC-SPP-202", semestre: 2, creditos: 4, horasTeoricas: 3, horasPracticas: 1 },
    { nombre: "Contabilidad Cooperativa", codigo: "LAC-SPP-203", semestre: 2, creditos: 5, horasTeoricas: 3, horasPracticas: 2 },
    { nombre: "Economía Social y Solidaria", codigo: "LAC-SPP-204", semestre: 2, creditos: 4, horasTeoricas: 3, horasPracticas: 1 },
    { nombre: "Informática para Cooperativas", codigo: "LAC-SPP-205", semestre: 2, creditos: 4, horasTeoricas: 2, horasPracticas: 2 },
  ];

  // Crear asignaturas
  async function crearAsignaturas(datos: typeof asigIAgropGAR_data, mallaId: number) {
    const created = [];
    for (const a of datos) {
      created.push(await prisma.asignatura.create({ data: { ...a, mallaCurricularId: mallaId } }));
    }
    return created;
  }

  const asigIAgropGAR = await crearAsignaturas(asigIAgropGAR_data, mallaIAgropGAR.id);
  // Natalio usa mismos datos con códigos diferentes
  const asigIAgropNAT_data = asigIAgropGAR_data.map(a => ({ ...a, codigo: a.codigo.replace("GAR", "NAT") }));
  const asigIAgropNAT = await crearAsignaturas(asigIAgropNAT_data, mallaIAgropNAT.id);

  const asigIAgronomGAR = await crearAsignaturas(asigIAgronomGAR_data, mallaIAgronomGAR.id);
  const asigIAgronomNAT_data = asigIAgronomGAR_data.map(a => ({ ...a, codigo: a.codigo.replace("GAR", "NAT") }));
  const asigIAgronomNAT = await crearAsignaturas(asigIAgronomNAT_data, mallaIAgronomNAT.id);

  const asigLAEA = await crearAsignaturas(asigLAEA_data, mallaLAEA.id);
  const asigLAC = await crearAsignaturas(asigLAC_data, mallaLAC.id);

  // ═══════════════════════════════════════════════════════════════
  // ESTUDIANTES — 10 por semestre, organizados por carrera/sede
  // ═══════════════════════════════════════════════════════════════

  const nombresParaguayos = [
    // Ing. Agropecuaria GAR - Sem 1
    "Diego Arce", "Camila Benítez", "Marcos Céspedes", "Lucía Duarte", "Andrés Espínola",
    "Sofía Franco", "Matías González", "Valentina Herrera", "Ángel Ibarra", "Carolina Jara",
    // Ing. Agropecuaria GAR - Sem 2
    "Tomás Ledesma", "María José Meza", "Santiago Noguera", "Paula Ortiz", "Gustavo Paniagua",
    "Andrea Quintana", "Ramón Riveros", "Silvia Sanabria", "Eduardo Torres", "Liz Urdapilleta",
    // Ing. Agropecuaria NAT - Sem 1
    "Juan Carlos Villalba", "Ana Belén Acuña", "Pedro Báez", "Celeste Cabañas", "Hugo Domínguez",
    "Fátima Enciso", "Oscar Fleitas", "Gabriela Gauto", "Ricardo Haedo", "Milagros Insfrán",
    // Ing. Agropecuaria NAT - Sem 2
    "Jorge Jiménez", "Karen López", "Luis Martínez", "Natalia Núñez", "Pablo Ojeda",
    "Rocío Peralta", "Daniel Rolón", "Viviana Sosa", "Cristian Talavera", "Lorena Vega",
    // Ing. Agronómica GAR - Sem 1
    "Rodrigo Aquino", "Laura Bareiro", "Alberto Cáceres", "Diana Delvalle", "Emilio Escobar",
    "Florencia Ferreira", "Héctor Galeano", "Noemí Hermosa", "Ignacio Irala", "Johana Kaupen",
    // Ing. Agronómica GAR - Sem 2
    "Manuel Lovera", "Soledad Méndez", "Nelson Notario", "Olga Orué", "Raúl Portillo",
    "Tatiana Quinteros", "Sergio Romero", "Ursula Salinas", "Víctor Torreani", "Wendy Zárate",
    // Lic. Adm. Empresas Agropecuarias SPP - Sem 1
    "Bruno Agüero", "Cynthia Bernal", "Darío Cardozo", "Estela Dávalos", "Federico Echeverría",
    "Griselda Fernández", "Hernán Garay", "Ivana Halley", "José Krivoshein", "Leticia Ledezma",
    // Lic. Adm. Empresas Agropecuarias SPP - Sem 2
    "Marcelo Miranda", "Noelia Niz", "Óscar Ocampos", "Pilar Páez", "Quintín Ramírez",
    "Rosalba Samudio", "Tito Troche", "Úrsula Ullón", "Walter Vera", "Ximena Yegros",
    // Lic. Adm. Cooperativas SPP - Sem 1
    "Adrián Alvarenga", "Belén Bogado", "Cesar Candia", "Dolores Duré", "Ezequiel Estigarribia",
    "Flavia Figueredo", "Germán Gaona", "Hilda Humada", "Isaac Insaurralde", "Jessica Jacquet",
    // Lic. Adm. Cooperativas SPP - Sem 2
    "Kevin Larrea", "Macarena Maldonado", "Nicolás Ojeda", "Patricia Penayo", "Roberto Quiñónez",
    "Sandra Recalde", "Ulises Servín", "Vanessa Torales", "Wilfrido Urunaga", "Yolanda Zacarías",
  ];

  // Crear usuarios estudiantes
  const estUsers = [];
  for (let i = 0; i < nombresParaguayos.length; i++) {
    const u = await prisma.user.create({
      data: {
        name: nombresParaguayos[i],
        email: `est${String(i + 1).padStart(3, "0")}@facaf.uni.edu.py`,
        rol: "ESTUDIANTE",
      },
    });
    estUsers.push(u);
  }

  // Grupos: [sedeId, mallaId, semestreActual, estudiantesIdx desde, hasta (exclusivo)]
  const gruposEst: { sedeId: number; mallaId: number; semActual: number; from: number; to: number }[] = [
    { sedeId: sedeArtigas.id, mallaId: mallaIAgropGAR.id, semActual: 1, from: 0, to: 10 },
    { sedeId: sedeArtigas.id, mallaId: mallaIAgropGAR.id, semActual: 2, from: 10, to: 20 },
    { sedeId: sedeNatalio.id, mallaId: mallaIAgropNAT.id, semActual: 1, from: 20, to: 30 },
    { sedeId: sedeNatalio.id, mallaId: mallaIAgropNAT.id, semActual: 2, from: 30, to: 40 },
    { sedeId: sedeArtigas.id, mallaId: mallaIAgronomGAR.id, semActual: 1, from: 40, to: 50 },
    { sedeId: sedeArtigas.id, mallaId: mallaIAgronomGAR.id, semActual: 2, from: 50, to: 60 },
    { sedeId: sedeSanPedro.id, mallaId: mallaLAEA.id, semActual: 1, from: 60, to: 70 },
    { sedeId: sedeSanPedro.id, mallaId: mallaLAEA.id, semActual: 2, from: 70, to: 80 },
    { sedeId: sedeSanPedro.id, mallaId: mallaLAC.id, semActual: 1, from: 80, to: 90 },
    { sedeId: sedeSanPedro.id, mallaId: mallaLAC.id, semActual: 2, from: 90, to: 100 },
  ];

  const estudiantes: { id: number; grupo: typeof gruposEst[0] }[] = [];
  for (const g of gruposEst) {
    for (let i = g.from; i < g.to; i++) {
      const est = await prisma.estudiante.create({
        data: {
          usuarioId: estUsers[i].id,
          matricula: `FACAF-2026-${String(i + 1).padStart(4, "0")}`,
          mallaCurricularId: g.mallaId,
          sedeId: g.sedeId,
          semestreActual: g.semActual,
        },
      });
      estudiantes.push({ id: est.id, grupo: g });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ASIGNACIONES DOCENTES
  // ═══════════════════════════════════════════════════════════════
  const gestion = 2026;
  const periodo = "I";

  // Map: asignaturas de cada carrera -> qué semestres -> qué docente
  // docentes[0] = C. Ramírez (Producción Agrícola) -> Ing Agrop materias producción
  // docentes[1] = J. Villalba (Suelos) -> Edafología, etc
  // docentes[2] = M. Benítez (Protección Vegetal) -> Biología, Botánica, etc
  // docentes[3] = A. Paredes (Adm/Economía) -> materias de adm
  // docentes[4] = R. Acosta (Producción Animal) -> Zoología, etc
  // docentes[5] = F. Giménez (Matemática/Estadística) -> Mate, Estadística, Física
  // docentes[6] = P. Núñez (Gestión Cooperativa) -> Cooperativismo
  // docentes[7] = M. Cabrera (Forestal) -> Complementa

  interface DAEntry { docenteId: number; asigId: number; sedeId: number }
  const daEntries: DAEntry[] = [];

  // Helper to assign a docente to multiple asignaturas at a sede
  function assign(docIdx: number, asigs: { id: number }[], indices: number[], sedeId: number) {
    for (const idx of indices) {
      if (asigs[idx]) {
        daEntries.push({ docenteId: docentes[docIdx].id, asigId: asigs[idx].id, sedeId });
      }
    }
  }

  // Ing. Agropecuaria GAR
  assign(5, asigIAgropGAR, [0, 5], sedeArtigas.id);           // Mate I, Mate II
  assign(1, asigIAgropGAR, [1, 6, 11], sedeArtigas.id);       // Quím Gen, Quím Org, Edafología
  assign(2, asigIAgropGAR, [2, 7, 12, 15], sedeArtigas.id);   // Bio Gen, Botánica, Zoología, Fisio Veg
  assign(0, asigIAgropGAR, [3, 8, 13, 16, 18], sedeArtigas.id); // Intro, Física, Genética, Microbio, Maq
  assign(3, asigIAgropGAR, [4, 9, 14, 19], sedeArtigas.id);   // Comunic, Informática, Econ Agrícola, Adm Rural
  assign(4, asigIAgropGAR, [10, 17], sedeArtigas.id);          // Estadística, Topografía

  // Ing. Agropecuaria NAT (misma distribución docente)
  assign(5, asigIAgropNAT, [0, 5], sedeNatalio.id);
  assign(1, asigIAgropNAT, [1, 6, 11], sedeNatalio.id);
  assign(2, asigIAgropNAT, [2, 7, 12, 15], sedeNatalio.id);
  assign(0, asigIAgropNAT, [3, 8, 13, 16, 18], sedeNatalio.id);
  assign(3, asigIAgropNAT, [4, 9, 14, 19], sedeNatalio.id);
  assign(4, asigIAgropNAT, [10, 17], sedeNatalio.id);

  // Ing. Agronómica GAR
  assign(5, asigIAgronomGAR, [0, 5], sedeArtigas.id);
  assign(1, asigIAgronomGAR, [1, 6, 11], sedeArtigas.id);
  assign(2, asigIAgronomGAR, [2, 7, 12, 13], sedeArtigas.id);
  assign(0, asigIAgronomGAR, [3, 8, 14], sedeArtigas.id);
  assign(3, asigIAgronomGAR, [4, 9], sedeArtigas.id);
  assign(4, asigIAgronomGAR, [10], sedeArtigas.id);

  // Ing. Agronómica NAT
  assign(5, asigIAgronomNAT, [0, 5], sedeNatalio.id);
  assign(1, asigIAgronomNAT, [1, 6, 11], sedeNatalio.id);
  assign(2, asigIAgronomNAT, [2, 7, 12, 13], sedeNatalio.id);
  assign(0, asigIAgronomNAT, [3, 8, 14], sedeNatalio.id);
  assign(3, asigIAgronomNAT, [4, 9], sedeNatalio.id);
  assign(4, asigIAgronomNAT, [10], sedeNatalio.id);

  // Lic. Adm. Empresas Agropecuarias SPP
  assign(5, asigLAEA, [0, 5], sedeSanPedro.id);
  assign(3, asigLAEA, [1, 2, 4, 6, 7, 8, 9], sedeSanPedro.id);
  assign(0, asigLAEA, [3], sedeSanPedro.id);

  // Lic. Adm. Cooperativas SPP
  assign(5, asigLAC, [0, 5], sedeSanPedro.id);
  assign(6, asigLAC, [1, 6, 7, 8], sedeSanPedro.id);
  assign(3, asigLAC, [2, 4, 9], sedeSanPedro.id);
  assign(7, asigLAC, [3], sedeSanPedro.id);

  // Crear DocenteAsignaturas
  const daMap: Record<string, { id: number }> = {};
  for (const entry of daEntries) {
    const da = await prisma.docenteAsignatura.create({
      data: { docenteId: entry.docenteId, asignaturaId: entry.asigId, sedeId: entry.sedeId, gestion, periodo },
    });
    daMap[`${entry.docenteId}_${entry.asigId}_${entry.sedeId}`] = da;
  }

  // ═══════════════════════════════════════════════════════════════
  // INSCRIPCIONES
  // ═══════════════════════════════════════════════════════════════

  // All asignaturas mapped by malla for easy lookup
  const asigPorMalla: Record<number, { id: number; semestre: number }[]> = {
    [mallaIAgropGAR.id]: asigIAgropGAR,
    [mallaIAgropNAT.id]: asigIAgropNAT,
    [mallaIAgronomGAR.id]: asigIAgronomGAR,
    [mallaIAgronomNAT.id]: asigIAgronomNAT,
    [mallaLAEA.id]: asigLAEA,
    [mallaLAC.id]: asigLAC,
  };

  for (const est of estudiantes) {
    const asigs = asigPorMalla[est.grupo.mallaId] ?? [];
    const delSem = asigs.filter(a => a.semestre === est.grupo.semActual);
    for (const asig of delSem) {
      const daKey = Object.keys(daMap).find(k => k.includes(`_${asig.id}_${est.grupo.sedeId}`));
      if (!daKey) continue;
      const docenteId = parseInt(daKey.split("_")[0]);
      await prisma.inscripcion.create({
        data: { estudianteId: est.id, asignaturaId: asig.id, docenteId, semestre: est.grupo.semActual, gestion, periodo },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PERIODOS DE EXAMEN
  // ═══════════════════════════════════════════════════════════════
  for (const sede of [sedeArtigas, sedeNatalio, sedeSanPedro, sedeMayorOtano]) {
    await prisma.periodoExamen.create({
      data: { tipo: "NORMAL", sedeId: sede.id, gestion, periodo, fechaInicio: new Date("2026-06-15"), fechaFin: new Date("2026-06-30"), habilitado: sede.id !== sedeMayorOtano.id },
    });
    await prisma.periodoExamen.create({
      data: { tipo: "EXTRAORDINARIO", sedeId: sede.id, gestion, periodo, fechaInicio: new Date("2026-07-10"), fechaFin: new Date("2026-07-20"), habilitado: false },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // CALIFICACIONES DE EJEMPLO (algunos estudiantes de Sem 2)
  // ═══════════════════════════════════════════════════════════════
  const estSem2GAR = estudiantes.filter(e => e.grupo.mallaId === mallaIAgropGAR.id && e.grupo.semActual === 2).slice(0, 5);
  for (const est of estSem2GAR) {
    const inscs = await prisma.inscripcion.findMany({ where: { estudianteId: est.id } });
    for (const insc of inscs.slice(0, 3)) {
      const tp = Math.floor(Math.random() * 10) + 20;
      const ep = Math.floor(Math.random() * 10) + 15;
      const ef = Math.floor(Math.random() * 15) + 25;
      await prisma.calificacion.create({
        data: { inscripcionId: insc.id, trabajoPractico: tp, examenParcial: ep, examenFinal: ef, notaFinal: tp + ep + ef, tipoExamen: "NORMAL" },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CONTENIDOS DE CLASE Y EVALUACIONES (Docente Ramírez en GAR)
  // ═══════════════════════════════════════════════════════════════
  const daRamirezIntro = daMap[`${docentes[0].id}_${asigIAgropGAR[3].id}_${sedeArtigas.id}`];
  if (daRamirezIntro) {
    const clases = [
      { docenteAsignaturaId: daRamirezIntro.id, tipoClase: "Teórica", fecha: new Date("2026-02-10"), modalidad: "Presencial", contenido: "Presentación de la asignatura. Panorama del sector agropecuario en Paraguay.", metodologias: JSON.stringify(["Clase magistral", "Retroalimentación de contenidos"]), observaciones: null },
      { docenteAsignaturaId: daRamirezIntro.id, tipoClase: "Teórica", fecha: new Date("2026-02-17"), modalidad: "Presencial", contenido: "Sistemas de producción agropecuaria: extensivo e intensivo.", metodologias: JSON.stringify(["Clase magistral", "Discusión dirigida"]), observaciones: null },
      { docenteAsignaturaId: daRamirezIntro.id, tipoClase: "Teórica/Práctica", fecha: new Date("2026-02-24"), modalidad: "Presencial", contenido: "Rubros agrícolas principales de Itapúa: soja, trigo, maíz.", metodologias: JSON.stringify(["Exposición oral", "Estudio de casos"]), observaciones: "Se analizaron datos del MAG" },
      { docenteAsignaturaId: daRamirezIntro.id, tipoClase: "Práctica", fecha: new Date("2026-03-03"), modalidad: "Presencial", contenido: "Visita a campo: identificación de cultivos y sistemas productivos.", metodologias: JSON.stringify(["Clases prácticas", "Aprendizaje cooperativo"]), observaciones: "Salida a finca modelo" },
      { docenteAsignaturaId: daRamirezIntro.id, tipoClase: "Teórica", fecha: new Date("2026-03-10"), modalidad: "Presencial", contenido: "Producción pecuaria en Paraguay: ganadería bovina, porcina, avícola.", metodologias: JSON.stringify(["Clase magistral"]), observaciones: null },
    ];
    for (const c of clases) await prisma.contenidoClase.create({ data: c });

    const evals = [
      { docenteAsignaturaId: daRamirezIntro.id, fecha: new Date("2026-02-28"), puntosAsignados: 15, instrumentos: JSON.stringify(["Prueba escrita"]), descripcion: "Parcialito: Sistemas de producción" },
      { docenteAsignaturaId: daRamirezIntro.id, fecha: new Date("2026-03-14"), puntosAsignados: 20, instrumentos: JSON.stringify(["Prueba escrita", "Rúbrica"]), descripcion: "Primer Parcial: Rubros agrícolas y pecuarios" },
    ];
    for (const e of evals) await prisma.registroEvaluacion.create({ data: e });
  }

  // Docente Giménez (Mate) en GAR
  const daGimenezMate = daMap[`${docentes[5].id}_${asigIAgropGAR[0].id}_${sedeArtigas.id}`];
  if (daGimenezMate) {
    const clases = [
      { docenteAsignaturaId: daGimenezMate.id, tipoClase: "Teórica", fecha: new Date("2026-02-11"), modalidad: "Presencial", contenido: "Conjuntos numéricos. Intervalos. Valor absoluto.", metodologias: JSON.stringify(["Clase magistral"]), observaciones: null },
      { docenteAsignaturaId: daGimenezMate.id, tipoClase: "Teórica/Práctica", fecha: new Date("2026-02-18"), modalidad: "Presencial", contenido: "Funciones: dominio, rango, gráficas.", metodologias: JSON.stringify(["Clase magistral", "Resolución de ejercicios y problemas"]), observaciones: null },
      { docenteAsignaturaId: daGimenezMate.id, tipoClase: "Práctica", fecha: new Date("2026-02-25"), modalidad: "Presencial", contenido: "Taller de funciones: lineal, cuadrática, exponencial.", metodologias: JSON.stringify(["Taller", "Aprendizaje cooperativo"]), observaciones: "Trabajo grupal" },
    ];
    for (const c of clases) await prisma.contenidoClase.create({ data: c });

    const evals = [
      { docenteAsignaturaId: daGimenezMate.id, fecha: new Date("2026-03-04"), puntosAsignados: 15, instrumentos: JSON.stringify(["Prueba escrita"]), descripcion: "Parcialito: Funciones" },
    ];
    for (const e of evals) await prisma.registroEvaluacion.create({ data: e });
  }

  // ═══════════════════════════════════════════════════════════════
  // HORARIOS DE CLASE
  // ═══════════════════════════════════════════════════════════════
  const semFechas = { inicio: "2026-02-02", fin: "2026-06-20" };

  // Helper
  async function crearHorario(sedeId: number, docenteId: number, asigId: number, dia: number, hInicio: string, hFin: string, aula: string) {
    const daKey = `${docenteId}_${asigId}_${sedeId}`;
    const da = daMap[daKey];
    if (!da) return;
    await prisma.horarioClase.create({
      data: { sedeId, docenteAsignaturaId: da.id, diaSemana: dia, horaInicio: hInicio, horaFin: hFin, aula, fechaInicio: semFechas.inicio, fechaFin: semFechas.fin },
    });
  }

  // Ing. Agropecuaria GAR - Sem 1 (Lun-Vie)
  await crearHorario(sedeArtigas.id, docentes[5].id, asigIAgropGAR[0].id, 1, "07:00", "09:00", "Aula 101");  // Mate I - Lun
  await crearHorario(sedeArtigas.id, docentes[5].id, asigIAgropGAR[0].id, 3, "07:00", "09:00", "Aula 101");  // Mate I - Mié
  await crearHorario(sedeArtigas.id, docentes[1].id, asigIAgropGAR[1].id, 1, "09:00", "11:00", "Lab. Química"); // Quím Gen - Lun
  await crearHorario(sedeArtigas.id, docentes[1].id, asigIAgropGAR[1].id, 4, "07:00", "09:00", "Lab. Química"); // Quím Gen - Jue
  await crearHorario(sedeArtigas.id, docentes[2].id, asigIAgropGAR[2].id, 2, "07:00", "09:00", "Aula 102");  // Bio Gen - Mar
  await crearHorario(sedeArtigas.id, docentes[2].id, asigIAgropGAR[2].id, 5, "07:00", "09:00", "Lab. Biología"); // Bio Gen - Vie
  await crearHorario(sedeArtigas.id, docentes[0].id, asigIAgropGAR[3].id, 2, "09:00", "11:00", "Aula 103");  // Intro Agrop - Mar
  await crearHorario(sedeArtigas.id, docentes[3].id, asigIAgropGAR[4].id, 3, "09:00", "11:00", "Aula 104");  // Comunicación - Mié

  // Ing. Agropecuaria GAR - Sem 2 (Tarde)
  await crearHorario(sedeArtigas.id, docentes[5].id, asigIAgropGAR[5].id, 1, "14:00", "16:00", "Aula 201");  // Mate II
  await crearHorario(sedeArtigas.id, docentes[5].id, asigIAgropGAR[5].id, 3, "14:00", "16:00", "Aula 201");
  await crearHorario(sedeArtigas.id, docentes[1].id, asigIAgropGAR[6].id, 2, "14:00", "16:00", "Lab. Química"); // Quím Org
  await crearHorario(sedeArtigas.id, docentes[2].id, asigIAgropGAR[7].id, 4, "14:00", "16:00", "Lab. Biología"); // Botánica
  await crearHorario(sedeArtigas.id, docentes[0].id, asigIAgropGAR[8].id, 1, "16:00", "18:00", "Aula 202");  // Física
  await crearHorario(sedeArtigas.id, docentes[3].id, asigIAgropGAR[9].id, 5, "14:00", "16:00", "Lab. Informática"); // Informática

  // Ing. Agropecuaria NAT - Sem 1
  await crearHorario(sedeNatalio.id, docentes[5].id, asigIAgropNAT[0].id, 1, "07:00", "09:00", "Aula A1");
  await crearHorario(sedeNatalio.id, docentes[5].id, asigIAgropNAT[0].id, 4, "07:00", "09:00", "Aula A1");
  await crearHorario(sedeNatalio.id, docentes[1].id, asigIAgropNAT[1].id, 2, "07:00", "09:00", "Lab. Química");
  await crearHorario(sedeNatalio.id, docentes[2].id, asigIAgropNAT[2].id, 3, "07:00", "09:00", "Aula A2");
  await crearHorario(sedeNatalio.id, docentes[0].id, asigIAgropNAT[3].id, 5, "07:00", "09:00", "Aula A3");
  await crearHorario(sedeNatalio.id, docentes[3].id, asigIAgropNAT[4].id, 1, "09:00", "11:00", "Aula A1");

  // Ing. Agronómica GAR - Sem 1 (Tarde/noche)
  await crearHorario(sedeArtigas.id, docentes[5].id, asigIAgronomGAR[0].id, 1, "18:00", "20:00", "Aula 301"); // Mate I
  await crearHorario(sedeArtigas.id, docentes[1].id, asigIAgronomGAR[1].id, 2, "18:00", "20:00", "Lab. Química"); // Quím
  await crearHorario(sedeArtigas.id, docentes[2].id, asigIAgronomGAR[2].id, 3, "18:00", "20:00", "Lab. Biología"); // Bio Cel
  await crearHorario(sedeArtigas.id, docentes[0].id, asigIAgronomGAR[3].id, 4, "18:00", "20:00", "Aula 302"); // Intro Agro
  await crearHorario(sedeArtigas.id, docentes[3].id, asigIAgronomGAR[4].id, 5, "18:00", "20:00", "Aula 303"); // Metodología

  // Lic. Adm. Empresas SPP - Sem 1
  await crearHorario(sedeSanPedro.id, docentes[5].id, asigLAEA[0].id, 1, "08:00", "10:00", "Aula 1"); // Mate Empresarial
  await crearHorario(sedeSanPedro.id, docentes[3].id, asigLAEA[1].id, 2, "08:00", "10:00", "Aula 1"); // Intro Adm
  await crearHorario(sedeSanPedro.id, docentes[3].id, asigLAEA[2].id, 3, "08:00", "10:00", "Aula 2"); // Contabilidad
  await crearHorario(sedeSanPedro.id, docentes[0].id, asigLAEA[3].id, 4, "08:00", "10:00", "Aula 1"); // Intro Agrop
  await crearHorario(sedeSanPedro.id, docentes[3].id, asigLAEA[4].id, 5, "08:00", "10:00", "Aula 2"); // Comunic

  // Lic. Adm. Cooperativas SPP - Sem 1
  await crearHorario(sedeSanPedro.id, docentes[5].id, asigLAC[0].id, 1, "14:00", "16:00", "Aula 3"); // Mate I
  await crearHorario(sedeSanPedro.id, docentes[6].id, asigLAC[1].id, 2, "14:00", "16:00", "Aula 3"); // Intro Coop
  await crearHorario(sedeSanPedro.id, docentes[3].id, asigLAC[2].id, 3, "14:00", "16:00", "Aula 3"); // Contab Gen
  await crearHorario(sedeSanPedro.id, docentes[7].id, asigLAC[3].id, 4, "14:00", "16:00", "Aula 4"); // Socio Rural
  await crearHorario(sedeSanPedro.id, docentes[3].id, asigLAC[4].id, 5, "14:00", "16:00", "Aula 3"); // Comunic

  // ═══════════════════════════════════════════════════════════════
  // NOTIFICACIONES
  // ═══════════════════════════════════════════════════════════════
  const ahora = new Date();
  const hace = (min: number) => new Date(ahora.getTime() - min * 60000);

  const notifs = [
    { usuarioId: adminUser.id, tipo: "sistema", titulo: "Sistema actualizado", mensaje: "El sistema académico FaCAF ha sido actualizado a la versión 2.0.", enlace: null, leida: false, createdAt: hace(10) },
    { usuarioId: academicoUser.id, tipo: "periodo_examen", titulo: "Periodo de exámenes próximo", mensaje: "El periodo normal de exámenes inicia el 15 de junio en todas las sedes.", enlace: "/dashboard/academico/periodos-examen", leida: false, createdAt: hace(30) },
    { usuarioId: docenteUsers[0].id, tipo: "periodo_examen", titulo: "Exámenes habilitados", mensaje: "El periodo normal (2026-I) fue habilitado para la sede General Artigas.", enlace: "/dashboard/docente/calificaciones", leida: false, createdAt: hace(15) },
    { usuarioId: docenteUsers[0].id, tipo: "inscripcion", titulo: "Nuevos estudiantes inscritos", mensaje: "10 estudiantes se inscribieron en Introducción a las Ciencias Agropecuarias.", enlace: "/dashboard/docente/mis-materias", leida: false, createdAt: hace(60) },
    { usuarioId: docenteUsers[5].id, tipo: "periodo_examen", titulo: "Exámenes habilitados", mensaje: "El periodo normal (2026-I) fue habilitado.", enlace: "/dashboard/docente/calificaciones", leida: false, createdAt: hace(15) },
    { usuarioId: estUsers[0].id, tipo: "inscripcion", titulo: "Inscripción confirmada", mensaje: "Tu inscripción al semestre 1 de Ingeniería Agropecuaria ha sido confirmada.", enlace: "/dashboard/estudiante", leida: false, createdAt: hace(20) },
  ];
  for (const n of notifs) await prisma.notificacion.create({ data: n });

  // ═══════════════════════════════════════════════════════════════
  // SESIONES Y ACTIVIDADES
  // ═══════════════════════════════════════════════════════════════
  const sesiones = [
    { usuarioId: docenteUsers[0].id, navegador: "Chrome", dispositivo: "Escritorio", ip: "192.168.1.10", exitoso: true, createdAt: hace(5) },
    { usuarioId: docenteUsers[0].id, navegador: "Chrome", dispositivo: "Escritorio", ip: "192.168.1.10", exitoso: true, createdAt: hace(1440) },
    { usuarioId: docenteUsers[5].id, navegador: "Firefox", dispositivo: "Escritorio", ip: "192.168.1.15", exitoso: true, createdAt: hace(20) },
    { usuarioId: estUsers[0].id, navegador: "Chrome", dispositivo: "Móvil", ip: "192.168.1.20", exitoso: true, createdAt: hace(10) },
    { usuarioId: academicoUser.id, navegador: "Chrome", dispositivo: "Escritorio", ip: "192.168.1.5", exitoso: true, createdAt: hace(30) },
  ];
  for (const s of sesiones) await prisma.sesionLogin.create({ data: s });

  const actividades = [
    { usuarioId: docenteUsers[0].id, accion: "login", entidad: "sesion", detalle: "Inicio de sesión", createdAt: hace(5) },
    { usuarioId: docenteUsers[0].id, accion: "crear", entidad: "contenido_clase", entidadId: "1", detalle: "Clase teórica - Intro Ciencias Agropecuarias", createdAt: hace(15) },
    { usuarioId: academicoUser.id, accion: "login", entidad: "sesion", detalle: "Inicio de sesión", createdAt: hace(30) },
    { usuarioId: academicoUser.id, accion: "habilitar", entidad: "periodo_examen", detalle: "Habilitado periodo normal 2026-I", createdAt: hace(60) },
    { usuarioId: estUsers[0].id, accion: "login", entidad: "sesion", detalle: "Inicio de sesión", createdAt: hace(10) },
  ];
  for (const a of actividades) await prisma.actividadUsuario.create({ data: a });

  // ═══════════════════════════════════════════════════════════════
  // RESUMEN
  // ═══════════════════════════════════════════════════════════════
  const totalAsig = asigIAgropGAR.length + asigIAgropNAT.length + asigIAgronomGAR.length + asigIAgronomNAT.length + asigLAEA.length + asigLAC.length;

  console.log("Seed completado exitosamente");
  console.log({
    sedes: 4,
    carreras_mallas: 6,
    asignaturas: totalAsig,
    docentes: docentes.length,
    estudiantes: estudiantes.length,
    usuarios_total: 2 + docenteUsers.length + estUsers.length,
    docenteAsignaturas: Object.keys(daMap).length,
    inscripciones: "~" + (estudiantes.length * 5),
    horarios: "ver arriba",
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
