import { Injectable, inject } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection, CapacitorSQLitePlugin } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Storage } from '@ionic/storage-angular';
import { Curso, Evaluacion, EvaluacionesCurso, Estudiante } from '../models'; // Asegúrate que todos los modelos necesarios estén importados

/**
 * Servicio de Base de Datos híbrido para POLITrack
 * Prioriza SQLite en plataformas nativas, con fallback a Ionic Storage para web.
 */
@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private storage = inject(Storage); // Para Ionic Storage (fallback)
  private sqlitePlugin: CapacitorSQLitePlugin | null = null; // Plugin SQLite
  private sqlite: SQLiteConnection | null = null; // Conexión principal
  private db: SQLiteDBConnection | null = null; // Conexión a la BD específica
  private storageInstance: Storage | null = null; // Instancia de Ionic Storage
  private isInitialized = false;
  private usingSQLite = false;
  private readonly DB_NAME = 'politrack_db'; // Nombre de la BD SQLite
  private platform: string;

  // Claves para Ionic Storage (fallback)
  private readonly CURSOS_KEY = 'cursos';
  private readonly EVALUACIONES_KEY_PREFIX = 'evaluaciones_'; // Prefijo para separar evaluaciones por curso
  private readonly RUBRICAS_KEY = 'rubricas';
  private readonly UI_STATE_KEY = 'ui_state';
  private readonly COMENTARIOS_COMUNES_KEY = 'comentarios_comunes_globales';
  private readonly COMENTARIOS_CATEGORIA_KEY = 'comentarios_predefinidos_categoria';

  // Lista de comentarios por defecto
  private readonly DEFAULT_COMENTARIOS_COMUNES = [
    'Excelente trabajo, sigue así',
    'Buen desempeño, pero puede mejorar',
    'Necesita más participación en las actividades',
    'Cumplió con los objetivos planteados',
    'Faltó profundidad en el análisis',
    'Presenta avances significativos',
    'Requiere mayor compromiso con el equipo'
  ];

  constructor() {
    this.platform = Capacitor.getPlatform();
    if (this.platform !== 'web') {
      try {
        this.sqlitePlugin = CapacitorSQLite;
        this.sqlite = new SQLiteConnection(this.sqlitePlugin);
      } catch(e) {
        console.error("Error inicializando SQLite Connection:", e);
        this.sqlitePlugin = null;
        this.sqlite = null;
      }
    }
    console.log(`DatabaseService inicializado en plataforma: ${this.platform}`);
  }

  /**
   * Inicializa la base de datos (SQLite o Ionic Storage).
   */
  async init(): Promise<boolean> {
    if (this.isInitialized) {
      console.log('DatabaseService ya inicializado.');
      return true;
    }

    try {
      console.log(`Intentando inicializar base de datos en: ${this.platform}`);

      if (this.platform !== 'web' && this.sqlite && this.sqlitePlugin) {
        try {
          // Verificar si SQLite está disponible
          const sqliteAvailable = await this.sqlitePlugin.isAvailable();
          if (!sqliteAvailable) {
            throw new Error('Plugin SQLite no está disponible en esta plataforma.');
          }

          // Crear conexión y abrir BD
          this.db = await this.sqlite.createConnection(
            this.DB_NAME,
            false, // encrypted?
            'no-encryption', // mode
            1, // version
            false // readOnly?
          );
          await this.db.open();
          console.log('Conexión SQLite abierta.');

          // Crear tablas si no existen
          await this.createSQLiteTables();
          this.usingSQLite = true;
          console.log('Usando SQLite nativo.');

        } catch (sqliteError) {
          console.warn('Error inicializando SQLite, usando fallback a Ionic Storage:', sqliteError);
          // Fallback a Ionic Storage si SQLite falla
          await this.initStorage();
        }
      } else {
        // Usar Ionic Storage para web
        console.log('Plataforma web (o SQLite no disponible), usando Ionic Storage.');
        await this.initStorage();
      }

      this.isInitialized = true;
      console.log(`Base de datos inicializada correctamente usando ${this.usingSQLite ? 'SQLite' : 'Ionic Storage'}.`);
      return true;

    } catch (error) {
      console.error('Error FATAL al inicializar la base de datos:', error);
      this.isInitialized = false;
      // Considera mostrar un error al usuario aquí
      return false; // Indicar fallo en la inicialización
    }
  }

  /**
   * Inicializa Ionic Storage como fallback o para web.
   */
  private async initStorage(): Promise<void> {
    if (!this.storageInstance) {
        this.storageInstance = await this.storage.create();
        this.usingSQLite = false; // Asegurar que usemos Ionic Storage
        console.log('Instancia de Ionic Storage creada.');
    } else {
        console.log('Instancia de Ionic Storage ya existente.');
    }
  }

  /**
   * Crea las tablas necesarias en la base de datos SQLite.
   */
  private async createSQLiteTables(): Promise<void> {
    if (!this.db) return;

    // Habilitar claves foráneas (importante para ON DELETE CASCADE)
    await this.db.execute('PRAGMA foreign_keys = ON;');

    // Definiciones de tablas
    const tableQueries = `
      CREATE TABLE IF NOT EXISTS cursos (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        estudiantes TEXT DEFAULT '[]', -- JSON string array
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      CREATE TABLE IF NOT EXISTS evaluaciones (
        id TEXT PRIMARY KEY NOT NULL, -- Formato: cursoId-estudianteId-entrega
        curso_id TEXT NOT NULL,
        estudiante_id TEXT NOT NULL, -- correo del estudiante
        entrega TEXT NOT NULL, -- 'E1', 'E2', 'EF'
        evaluacion_data TEXT DEFAULT '{}', -- JSON string del objeto Evaluacion completo
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS rubricas (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        definicion TEXT DEFAULT '{}', -- JSON string
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      -- Tabla K/V simple para configuraciones globales (UI state, comentarios comunes)
      CREATE TABLE IF NOT EXISTS global_config (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT,
        updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      -- Trigger para actualizar updated_at en cursos
      CREATE TRIGGER IF NOT EXISTS trigger_cursos_updated_at
      AFTER UPDATE ON cursos FOR EACH ROW
      BEGIN
          UPDATE cursos SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
      END;

      -- Trigger para actualizar updated_at en evaluaciones
      CREATE TRIGGER IF NOT EXISTS trigger_evaluaciones_updated_at
      AFTER UPDATE ON evaluaciones FOR EACH ROW
      BEGIN
          UPDATE evaluaciones SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
      END;

       -- Trigger para actualizar updated_at en rubricas
      CREATE TRIGGER IF NOT EXISTS trigger_rubricas_updated_at
      AFTER UPDATE ON rubricas FOR EACH ROW
      BEGIN
          UPDATE rubricas SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
      END;

      -- Trigger para actualizar updated_at en global_config
      CREATE TRIGGER IF NOT EXISTS trigger_global_config_updated_at
      AFTER UPDATE ON global_config FOR EACH ROW
      BEGIN
          UPDATE global_config SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE key = OLD.key;
      END;

      -- Insertar valores iniciales/por defecto para global_config si no existen
      INSERT OR IGNORE INTO global_config (key, value) VALUES ('${this.UI_STATE_KEY}', '{}');
      INSERT OR IGNORE INTO global_config (key, value) VALUES ('${this.COMENTARIOS_COMUNES_KEY}', '[]');
      INSERT OR IGNORE INTO global_config (key, value) VALUES ('${this.COMENTARIOS_CATEGORIA_KEY}', '{}'); -- Si aún se usa
    `;

    try {
        const result = await this.db.execute(tableQueries);
        console.log('Tablas SQLite creadas/verificadas.', result);
    } catch (e: any) {
        console.error("Error creando tablas SQLite:", e.message);
        throw e; // Relanzar para que init() falle
    }
  }

  /**
   * Asegura que el servicio esté inicializado antes de operar.
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      console.log('DatabaseService no inicializado, llamando a init()...');
      await this.init();
    }
    // Después de init(), o db o storageInstance deben estar disponibles si init fue exitoso
    if (!(this.db || this.storageInstance)) {
       console.error('La inicialización falló, no hay instancia de DB o Storage disponible.');
       throw new Error('Base de datos no disponible después de la inicialización.');
    }
  }

  /**
   * Parseo Seguro de JSON
   */
  private safeParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
    if (!jsonString) return defaultValue;
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.warn("Error parseando JSON, retornando valor por defecto:", jsonString, e);
      return defaultValue;
    }
  }

  // ========================================
  // MÉTODOS PARA CURSOS
  // ========================================

  async saveCurso(cursoId: string, cursoData: Partial<Curso>): Promise<void> {
    await this.ensureInitialized();
    const nombre = cursoData.nombre || ''; // Asegurar que nombre no sea undefined
    const estudiantesJson = JSON.stringify(cursoData.estudiantes || []);

    if (this.usingSQLite && this.db) {
      const sql = `INSERT OR REPLACE INTO cursos (id, nombre, estudiantes) VALUES (?, ?, ?)`;
      await this.db.run(sql, [cursoId, nombre, estudiantesJson]);
    } else if (this.storageInstance) {
      const cursos = await this.getCursos();
      cursos[cursoId] = { ...(cursos[cursoId] || { id: cursoId, nombre: '', estudiantes: [], evaluaciones: {} }), ...cursoData, updatedAt: new Date().toISOString() } as Curso;
      await this.storageInstance.set(this.CURSOS_KEY, cursos);
    }
  }

  async getCursos(): Promise<{ [key: string]: Curso }> {
    await this.ensureInitialized();
    let cursos: { [key: string]: Curso } = {};

    if (this.usingSQLite && this.db) {
      const result = await this.db.query('SELECT * FROM cursos ORDER BY updated_at DESC');
      if (result.values) {
        for (const row of result.values) {
          cursos[row.id] = {
            id: row.id,
            nombre: row.nombre,
            estudiantes: this.safeParse<Estudiante[]>(row.estudiantes, []),
            evaluaciones: {}, // Las evaluaciones se cargan por separado
            createdAt: row.created_at,
            updatedAt: row.updated_at
          };
        }
      }
    } else if (this.storageInstance) {
      cursos = await this.storageInstance.get(this.CURSOS_KEY) || {};
    }
    return cursos;
  }

  async getCurso(cursoId: string): Promise<Curso | null> {
    await this.ensureInitialized();

    if (this.usingSQLite && this.db) {
      const result = await this.db.query('SELECT * FROM cursos WHERE id = ?', [cursoId]);
      if (result.values && result.values.length > 0) {
        const row = result.values[0];
        return {
          id: row.id,
          nombre: row.nombre,
          estudiantes: this.safeParse<Estudiante[]>(row.estudiantes, []),
          evaluaciones: {}, // Cargar por separado si es necesario aquí
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
      return null;
    } else if (this.storageInstance) {
      const cursos = await this.storageInstance.get(this.CURSOS_KEY) || {};
      return cursos[cursoId] || null;
    }
    return null;
  }

  async deleteCurso(cursoId: string): Promise<void> {
    await this.ensureInitialized();

    if (this.usingSQLite && this.db) {
      // ON DELETE CASCADE debería manejar las evaluaciones
      await this.db.run('DELETE FROM cursos WHERE id = ?', [cursoId]);
    } else if (this.storageInstance) {
      const cursos = await this.storageInstance.get(this.CURSOS_KEY) || {};
      delete cursos[cursoId];
      await this.storageInstance.set(this.CURSOS_KEY, cursos);
      // Eliminar evaluaciones manualmente
      await this.storageInstance.remove(`${this.EVALUACIONES_KEY_PREFIX}${cursoId}`);
    }
    console.log(`Curso ${cursoId} eliminado.`);
  }

  // ========================================
  // MÉTODOS PARA EVALUACIONES
  // ========================================

  async saveFullEvaluacionEstudiante(
    cursoId: string,
    estudianteId: string, // correo
    entrega: 'E1' | 'E2' | 'EF',
    evaluacionData: Evaluacion
  ): Promise<void> {
    await this.ensureInitialized();
    const evaluacionId = `${cursoId}-${estudianteId}-${entrega}`;
    const evaluacionJson = JSON.stringify(evaluacionData);

    if (this.usingSQLite && this.db) {
      const sql = `INSERT OR REPLACE INTO evaluaciones (id, curso_id, estudiante_id, entrega, evaluacion_data) VALUES (?, ?, ?, ?, ?)`;
      await this.db.run(sql, [evaluacionId, cursoId, estudianteId, entrega, evaluacionJson]);
    } else if (this.storageInstance) {
      let cursoEvaluaciones = await this.storageInstance.get(`${this.EVALUACIONES_KEY_PREFIX}${cursoId}`) || { E1: {}, E2: {}, EF: {} };
      if (!cursoEvaluaciones[entrega]) cursoEvaluaciones[entrega] = {};
      cursoEvaluaciones[entrega][estudianteId] = { ...evaluacionData, updatedAt: new Date().toISOString() };
      await this.storageInstance.set(`${this.EVALUACIONES_KEY_PREFIX}${cursoId}`, cursoEvaluaciones);
    }
  }

  async getEvaluacionesCurso(cursoId: string): Promise<EvaluacionesCurso> {
    await this.ensureInitialized();
    let evaluacionesCurso: EvaluacionesCurso = { E1: {}, E2: {}, EF: {} };

    if (this.usingSQLite && this.db) {
        const sql = 'SELECT estudiante_id, entrega, evaluacion_data FROM evaluaciones WHERE curso_id = ?';
        const result = await this.db.query(sql, [cursoId]);
        if (result.values) {
            result.values.forEach(row => {
                const entrega = row.entrega as 'E1' | 'E2' | 'EF';
                if (entrega && evaluacionesCurso[entrega]) {
                    evaluacionesCurso[entrega]![row.estudiante_id] = this.safeParse<Evaluacion>(row.evaluacion_data, { correo: row.estudiante_id });
                }
            });
        }
    } else if (this.storageInstance) {
        evaluacionesCurso = await this.storageInstance.get(`${this.EVALUACIONES_KEY_PREFIX}${cursoId}`) || { E1: {}, E2: {}, EF: {} };
    }
    return evaluacionesCurso;
  }

  /**
   * (NUEVO MÉTODO)
   * Elimina todas las evaluaciones (E1, E2, EF) de un estudiante específico en un curso.
   */
  async deleteEvaluacionesEstudiante(cursoId: string, estudianteId: string): Promise<void> {
    await this.ensureInitialized();

    if (this.usingSQLite && this.db) {
      // Eliminar basado en curso_id Y estudiante_id
      const sql = 'DELETE FROM evaluaciones WHERE curso_id = ? AND estudiante_id = ?';
      await this.db.run(sql, [cursoId, estudianteId]);
      console.log(`Evaluaciones SQLite eliminadas para ${estudianteId} en curso ${cursoId}`);

    } else if (this.storageInstance) {
      // Obtener el objeto de evaluaciones del curso
      const storageKey = `${this.EVALUACIONES_KEY_PREFIX}${cursoId}`;
      let cursoEvaluaciones = await this.storageInstance.get(storageKey) || { E1: {}, E2: {}, EF: {} };

      // Eliminar al estudiante de cada entrega
      if (cursoEvaluaciones.E1) delete cursoEvaluaciones.E1[estudianteId];
      if (cursoEvaluaciones.E2) delete cursoEvaluaciones.E2[estudianteId];
      if (cursoEvaluaciones.EF) delete cursoEvaluaciones.EF[estudianteId];

      // Guardar el objeto modificado
      await this.storageInstance.set(storageKey, cursoEvaluaciones);
      console.log(`Evaluaciones Ionic Storage eliminadas para ${estudianteId} en curso ${cursoId}`);
    }
  }

  // ========================================
  // MÉTODOS PARA COMENTARIOS COMUNES GLOBALES
  // ========================================

  async getComentariosComunes(): Promise<string[]> {
      await this.ensureInitialized();
      let comentarios: string[] = [];

      try {
          if (this.usingSQLite && this.db) {
              const result = await this.db.query('SELECT value FROM global_config WHERE key = ?', [this.COMENTARIOS_COMUNES_KEY]);
              if (result.values && result.values.length > 0) {
                  comentarios = this.safeParse<string[]>(result.values[0].value, []);
              }
          } else if (this.storageInstance) {
              comentarios = await this.storageInstance.get(this.COMENTARIOS_COMUNES_KEY) || [];
          }
      } catch (error) {
          console.error("Error al cargar comentarios comunes:", error);
      }
      // Combinar con defaults y asegurar unicidad
      const combined = Array.from(new Set([...this.DEFAULT_COMENTARIOS_COMUNES, ...comentarios]));

      // Si la lista cargada estaba vacía, guardar los defaults por primera vez
      if (comentarios.length === 0 && combined.length > 0) {
          await this.saveComentariosComunes(combined);
      }

      return combined;
  }

  async saveComentariosComunes(comentarios: string[]): Promise<void> {
      await this.ensureInitialized();
      // Eliminar duplicados antes de guardar
      const comentariosUnicos = Array.from(new Set(comentarios));
      const comentariosJson = JSON.stringify(comentariosUnicos);

      if (this.usingSQLite && this.db) {
          const sql = `UPDATE global_config SET value = ? WHERE key = ?`;
          // Usar INSERT OR REPLACE para asegurar que exista
          const sqlUpsert = `INSERT OR REPLACE INTO global_config (key, value) VALUES (?, ?)`;
          await this.db.run(sqlUpsert, [this.COMENTARIOS_COMUNES_KEY, comentariosJson]);
      } else if (this.storageInstance) {
          await this.storageInstance.set(this.COMENTARIOS_COMUNES_KEY, comentariosUnicos); // Guardar array directamente
      }
  }

  async addComentarioComun(comentario: string): Promise<void> {
      if (!comentario || comentario.trim().length === 0) return;
      const comentarioTrimmed = comentario.trim();

      const actuales = await this.getComentariosComunes();
      if (!actuales.includes(comentarioTrimmed)) {
          actuales.push(comentarioTrimmed);
          await this.saveComentariosComunes(actuales);
      }
  }

  // ========================================
  // MÉTODOS PARA RÚBRICAS
  // ========================================
  async saveRubrica(rubricaId: string, rubricaData: any): Promise<void> {
    await this.ensureInitialized();
    const nombre = rubricaData.nombre || 'Rúbrica sin nombre';
    const definicionJson = JSON.stringify(rubricaData);

    if (this.usingSQLite && this.db) {
        const sql = `INSERT OR REPLACE INTO rubricas (id, nombre, definicion) VALUES (?, ?, ?)`;
        await this.db.run(sql, [rubricaId, nombre, definicionJson]);
    } else if (this.storageInstance) {
        const rubricas = await this.getRubricas();
        rubricas[rubricaId] = { ...rubricaData, id: rubricaId, updatedAt: new Date().toISOString() };
        await this.storageInstance.set(this.RUBRICAS_KEY, rubricas);
    }
}

  async getRubricas(): Promise<{ [key: string]: any }> {
    await this.ensureInitialized();
    let rubricas: { [key: string]: any } = {};

    if (this.usingSQLite && this.db) {
        const result = await this.db.query('SELECT id, definicion FROM rubricas ORDER BY nombre');
        if (result.values) {
            result.values.forEach(row => {
                rubricas[row.id] = this.safeParse<any>(row.definicion, {});
            });
        }
    } else if (this.storageInstance) {
        rubricas = await this.storageInstance.get(this.RUBRICAS_KEY) || {};
    }
    return rubricas;
}


  // ========================================
  // MÉTODOS PARA ESTADO UI
  // ========================================
  async saveUIState(uiState: any): Promise<void> {
    await this.ensureInitialized();
    const stateJson = JSON.stringify(uiState);

    if (this.usingSQLite && this.db) {
        const sqlUpsert = `INSERT OR REPLACE INTO global_config (key, value) VALUES (?, ?)`;
        await this.db.run(sqlUpsert, [this.UI_STATE_KEY, stateJson]);
    } else if (this.storageInstance) {
        await this.storageInstance.set(this.UI_STATE_KEY, uiState); // Guardar objeto directamente
    }
}

  async getUIState(): Promise<any> {
    await this.ensureInitialized();
    const defaultState = { cursoActivo: null, courseStates: {} };

    if (this.usingSQLite && this.db) {
        const result = await this.db.query('SELECT value FROM global_config WHERE key = ?', [this.UI_STATE_KEY]);
        if (result.values && result.values.length > 0) {
            return this.safeParse<any>(result.values[0].value, defaultState);
        }
    } else if (this.storageInstance) {
        return await this.storageInstance.get(this.UI_STATE_KEY) || defaultState;
    }
    return defaultState;
}

  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================

  async clearDatabase(): Promise<void> {
    await this.ensureInitialized();

    if (this.usingSQLite && this.db) {
      // Eliminar datos de tablas principales
      await this.db.run('DELETE FROM cursos'); // Esto cascada a evaluaciones
      await this.db.run('DELETE FROM rubricas');

      // Resetear configuraciones globales
      await this.db.run(`UPDATE global_config SET value = '{}' WHERE key = ?`, [this.UI_STATE_KEY]);
      // Guardar defaults en lugar de array vacío para comentarios
      const defaultComentariosJson = JSON.stringify(this.DEFAULT_COMENTARIOS_COMUNES);
      await this.db.run(`UPDATE global_config SET value = ? WHERE key = ?`, [defaultComentariosJson, this.COMENTARIOS_COMUNES_KEY]);
      await this.db.run(`UPDATE global_config SET value = '{}' WHERE key = ?`, [this.COMENTARIOS_CATEGORIA_KEY]);

    } else if (this.storageInstance) {
      // Limpiar todas las claves conocidas
      await this.storageInstance.remove(this.CURSOS_KEY);
      await this.storageInstance.remove(this.RUBRICAS_KEY);
      await this.storageInstance.remove(this.UI_STATE_KEY);
      // await this.storageInstance.remove(this.COMENTARIOS_COMUNES_KEY); // No borrar, guardar defaults
      await this.storageInstance.set(this.COMENTARIOS_COMUNES_KEY, this.DEFAULT_COMENTARIOS_COMUNES);
      await this.storageInstance.remove(this.COMENTARIOS_CATEGORIA_KEY);

      // Eliminar claves de evaluaciones por curso
      const allKeys = await this.storageInstance.keys();
      const evalKeys = allKeys.filter(k => k.startsWith(this.EVALUACIONES_KEY_PREFIX));
      for (const key of evalKeys) {
        await this.storageInstance.remove(key);
      }
    }
    console.log('Base de datos limpiada completamente.');
  }

  async close(): Promise<void> {
    if (this.isInitialized) {
      if (this.usingSQLite && this.sqlite && this.db) {
         try {
            // Asegurarse de cerrar la conexión específica a la BD primero
            await this.db.close();
            console.log(`Conexión a BD ${this.DB_NAME} cerrada.`);
            this.db = null;
         } catch(e) {
            console.error("Error cerrando conexión SQLite:", e);
         }
      }
      // No necesitas cerrar Ionic Storage
      this.storageInstance = null;
      this.isInitialized = false;
      this.usingSQLite = false; // Resetear estado
      console.log('Servicio de Base de Datos cerrado/resetado.');
    }
  }
}

