import { Injectable, inject } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Storage } from '@ionic/storage-angular';
import { Curso, Evaluacion, EvaluacionesCurso } from '../models';

/**
 * Servicio de Base de Datos híbrido para POLITrack
 * Intenta usar SQLite nativo, pero con fallback a Ionic Storage
 */
@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private storage = inject(Storage);
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private storageInstance: Storage | null = null;
  private isInitialized = false;
  private usingSQLite = false;
  private readonly DB_NAME = 'politrack.db';
  private platform: string;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.platform = Capacitor.getPlatform();
  }

  /**
   * Inicializa la base de datos con fallback
   */
  async init(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      console.log('Inicializando base de datos en:', this.platform);

      // Intentar usar SQLite primero (solo en móvil)
      if (this.platform !== 'web') {
        try {
          await this.initSQLite();
          this.usingSQLite = true;
          console.log('Usando SQLite nativo');
        } catch (sqliteError) {
          console.warn('SQLite falló, usando fallback:', sqliteError);
          await this.initStorage();
        }
      } else {
        // En web, usar directamente Ionic Storage
        await this.initStorage();
      }

      this.isInitialized = true;
      console.log('Base de datos inicializada correctamente');
      return true;
    } catch (error) {
      console.error('Error al inicializar la base de datos:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Inicializa SQLite nativo
   */
  private async initSQLite(): Promise<void> {
    this.db = await this.sqlite.createConnection(
      this.DB_NAME,
      false,
      'no-encryption',
      1,
      false
    );

    await this.db.open();
    await this.createSQLiteTables();
  }

  /**
   * Inicializa Ionic Storage como fallback
   */
  private async initStorage(): Promise<void> {
    this.storageInstance = await this.storage.create();
    this.usingSQLite = false;
    console.log('Usando Ionic Storage');
  }

  /**
   * Crea las tablas SQLite
   */
  private async createSQLiteTables(): Promise<void> {
    if (!this.db) return;

    const tableQueries = `
      -- Tabla de cursos
      CREATE TABLE IF NOT EXISTS cursos (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        estudiantes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de evaluaciones
      CREATE TABLE IF NOT EXISTS evaluaciones (
        id TEXT PRIMARY KEY,
        curso_id TEXT NOT NULL,
        estudiante_id TEXT NOT NULL,
        evaluaciones TEXT,
        comentarios TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (curso_id) REFERENCES cursos(id)
      );

      -- Tabla de comentarios predefinidos
      CREATE TABLE IF NOT EXISTS comentarios_predefinidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        categoria TEXT NOT NULL,
        texto TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de definiciones de rúbricas
      CREATE TABLE IF NOT EXISTS rubricas (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        definicion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de estado de UI
      CREATE TABLE IF NOT EXISTS ui_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        curso_activo TEXT,
        estados_cursos TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Insertar estado UI por defecto
      INSERT OR IGNORE INTO ui_state (id, curso_activo, estados_cursos) 
      VALUES (1, NULL, '{}');
    `;

    await this.db.execute(tableQueries);
  }

  /**
   * Verifica inicialización
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    if (!this.isInitialized) {
      throw new Error('Base de datos no inicializada');
    }
  }

  // ========================================
  // MÉTODOS ESPECÍFICOS PARA CURSOS
  // ========================================

  /**
   * Guarda o actualiza un curso
   */
  async saveCurso(cursoId: string, cursoData: Partial<Curso>): Promise<void> {
    await this.ensureInitialized();

    if (this.usingSQLite && this.db) {
      const sql = `
        INSERT OR REPLACE INTO cursos (id, nombre, estudiantes, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `;

      await this.db.run(sql, [
        cursoId,
        cursoData.nombre || '',
        JSON.stringify(cursoData.estudiantes || [])
      ]);
    } else if (this.storageInstance) {
      const cursos = await this.getCursos();
      cursos[cursoId] = {
        ...cursos[cursoId],
        ...cursoData,
        id: cursoId,
        updatedAt: new Date().toISOString()
      } as Curso;

      await this.storageInstance.set('cursos', cursos);
    }
  }

  /**
   * Obtiene todos los cursos
   */
  async getCursos(): Promise<{ [key: string]: Curso }> {
    await this.ensureInitialized();

    if (this.usingSQLite && this.db) {
      const sql = 'SELECT * FROM cursos ORDER BY updated_at DESC';
      const result = await this.db.query(sql);

      const cursos: { [key: string]: Curso } = {};

      if (result && result.values) {
        result.values.forEach((row: any) => {
          cursos[row.id] = {
            id: row.id,
            nombre: row.nombre,
            estudiantes: JSON.parse(row.estudiantes || '[]'),
            evaluaciones: {},
            createdAt: row.created_at,
            updatedAt: row.updated_at
          };
        });
      }

      return cursos;
    } else if (this.storageInstance) {
      return (await this.storageInstance.get('cursos')) || {};
    }

    return {};
  }

  /**
   * Obtiene un curso por ID
   */
  async getCurso(cursoId: string): Promise<Curso | null> {
    await this.ensureInitialized();

    if (this.usingSQLite && this.db) {
      const sql = 'SELECT * FROM cursos WHERE id = ?';
      const result = await this.db.query(sql, [cursoId]);

      if (result && result.values && result.values.length > 0) {
        const row = result.values[0];
        return {
          id: row.id,
          nombre: row.nombre,
          estudiantes: JSON.parse(row.estudiantes || '[]'),
          evaluaciones: {},
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }

      return null;
    } else if (this.storageInstance) {
      const cursos = await this.getCursos();
      return cursos[cursoId] || null;
    }

    return null;
  }

  /**
   * Elimina un curso
   */
  async deleteCurso(cursoId: string): Promise<void> {
    await this.ensureInitialized();

    if (this.usingSQLite && this.db) {
      // Eliminar evaluaciones relacionadas primero
      await this.db.run('DELETE FROM evaluaciones WHERE curso_id = ?', [cursoId]);
      // Eliminar el curso
      await this.db.run('DELETE FROM cursos WHERE id = ?', [cursoId]);
    } else if (this.storageInstance) {
      const cursos = await this.getCursos();
      delete cursos[cursoId];
      await this.storageInstance.set('cursos', cursos);

      // Eliminar evaluaciones relacionadas
      const evaluaciones = await this.getEvaluaciones();
      const evaluacionesFiltradas: { [key: string]: any } = {};
      
      Object.keys(evaluaciones).forEach(key => {
        if (!key.startsWith(`${cursoId}-`)) {
          evaluacionesFiltradas[key] = evaluaciones[key];
        }
      });
      
      await this.storageInstance.set('evaluaciones', evaluacionesFiltradas);
    }
  }

  // ========================================
  // MÉTODOS ESPECÍFICOS PARA EVALUACIONES
  // ========================================

  /**
   * Guarda o actualiza una evaluación
   */
  async saveEvaluacion(
    evaluacionId: string,
    cursoId: string,
    estudianteId: string,
    evaluacionData: any
  ): Promise<void> {
    await this.ensureInitialized();

    if (this.usingSQLite && this.db) {
      const sql = `
        INSERT OR REPLACE INTO evaluaciones 
        (id, curso_id, estudiante_id, evaluaciones, comentarios, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      await this.db.run(sql, [
        evaluacionId,
        cursoId,
        estudianteId,
        JSON.stringify(evaluacionData.evaluaciones || {}),
        evaluacionData.comentarios || ''
      ]);
    } else if (this.storageInstance) {
      const evaluaciones = await this.getEvaluaciones();
      evaluaciones[evaluacionId] = {
        cursoId,
        estudianteId,
        evaluaciones: evaluacionData.evaluaciones || {},
        comentarios: evaluacionData.comentarios || '',
        updatedAt: new Date().toISOString()
      };

      await this.storageInstance.set('evaluaciones', evaluaciones);
    }
  }

  /**
   * Obtiene todas las evaluaciones
   */
  async getEvaluaciones(): Promise<{ [key: string]: any }> {
    await this.ensureInitialized();

    if (this.usingSQLite && this.db) {
      const sql = 'SELECT * FROM evaluaciones';
      const result = await this.db.query(sql);

      const evaluaciones: { [key: string]: any } = {};

      if (result && result.values) {
        result.values.forEach((row: any) => {
          evaluaciones[row.id] = {
            evaluaciones: JSON.parse(row.evaluaciones || '{}'),
            comentarios: row.comentarios || ''
          };
        });
      }

      return evaluaciones;
    } else if (this.storageInstance) {
      return (await this.storageInstance.get('evaluaciones')) || {};
    }

    return {};
  }

  /**
   * Obtiene las evaluaciones de un curso específico
   */
  async getEvaluacionesCurso(cursoId: string): Promise<EvaluacionesCurso> {
    await this.ensureInitialized();

    if (this.usingSQLite && this.db) {
      const sql = 'SELECT * FROM evaluaciones WHERE curso_id = ?';
      const result = await this.db.query(sql, [cursoId]);

      const evaluaciones: EvaluacionesCurso = {};

      if (result && result.values) {
        result.values.forEach((row: any) => {
          const data = JSON.parse(row.evaluaciones || '{}');
          Object.assign(evaluaciones, data);
        });
      }

      return evaluaciones;
    } else if (this.storageInstance) {
      const evaluaciones = await this.getEvaluaciones();
      const evaluacionesCurso: EvaluacionesCurso = {};

      Object.keys(evaluaciones).forEach(key => {
        const evaluacion = evaluaciones[key];
        if (evaluacion.cursoId === cursoId) {
          Object.assign(evaluacionesCurso, evaluacion.evaluaciones);
        }
      });

      return evaluacionesCurso;
    }

    return {};
  }

  // ========================================
  // MÉTODOS ESPECÍFICOS PARA COMENTARIOS
  // ========================================

  /**
   * Guarda comentarios predefinidos
   */
  async saveComentariosPredefinidos(comentarios: { [categoria: string]: string[] }): Promise<void> {
    await this.ensureInitialized();

    if (this.usingSQLite && this.db) {
      // Limpiar comentarios existentes
      await this.db.run('DELETE FROM comentarios_predefinidos');

      // Insertar nuevos comentarios
      for (const [categoria, textos] of Object.entries(comentarios)) {
        for (const texto of textos) {
          await this.db.run(
            'INSERT INTO comentarios_predefinidos (categoria, texto) VALUES (?, ?)',
            [categoria, texto]
          );
        }
      }
    } else if (this.storageInstance) {
      await this.storageInstance.set('comentarios_predefinidos', comentarios);
    }
  }

  /**
   * Obtiene los comentarios predefinidos
   */
  async getComentariosPredefinidos(): Promise<{ [categoria: string]: string[] }> {
    await this.ensureInitialized();

    if (this.usingSQLite && this.db) {
      const sql = 'SELECT * FROM comentarios_predefinidos ORDER BY categoria, texto';
      const result = await this.db.query(sql);

      const comentarios: { [categoria: string]: string[] } = {};

      if (result && result.values) {
        result.values.forEach((row: any) => {
          if (!comentarios[row.categoria]) {
            comentarios[row.categoria] = [];
          }
          comentarios[row.categoria].push(row.texto);
        });
      }

      return comentarios;
    } else if (this.storageInstance) {
      return (await this.storageInstance.get('comentarios_predefinidos')) || {};
    }

    return {};
  }

  // ========================================
  // MÉTODOS ESPECÍFICOS PARA RÚBRICAS
  // ========================================

  /**
   * Guarda o actualiza una rúbrica
   */
  async saveRubrica(rubricaId: string, rubricaData: any): Promise<void> {
    await this.ensureInitialized();

    if (this.usingSQLite && this.db) {
      const sql = `
        INSERT OR REPLACE INTO rubricas (id, nombre, definicion, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `;

      await this.db.run(sql, [
        rubricaId,
        rubricaData.nombre || '',
        JSON.stringify(rubricaData)
      ]);
    } else if (this.storageInstance) {
      const rubricas = await this.getRubricas();
      rubricas[rubricaId] = {
        ...rubricaData,
        id: rubricaId,
        updatedAt: new Date().toISOString()
      };

      await this.storageInstance.set('rubricas', rubricas);
    }
  }

  /**
   * Obtiene todas las rúbricas
   */
  async getRubricas(): Promise<{ [key: string]: any }> {
    await this.ensureInitialized();

    if (this.usingSQLite && this.db) {
      const sql = 'SELECT * FROM rubricas ORDER BY nombre';
      const result = await this.db.query(sql);

      const rubricas: { [key: string]: any } = {};

      if (result && result.values) {
        result.values.forEach((row: any) => {
          rubricas[row.id] = JSON.parse(row.definicion || '{}');
        });
      }

      return rubricas;
    } else if (this.storageInstance) {
      return (await this.storageInstance.get('rubricas')) || {};
    }

    return {};
  }

  // ========================================
  // MÉTODOS ESPECÍFICOS PARA ESTADO UI
  // ========================================

  /**
   * Guarda el estado de la UI
   */
  async saveUIState(uiState: any): Promise<void> {
    await this.ensureInitialized();

    if (this.usingSQLite && this.db) {
      const sql = `
        UPDATE ui_state 
        SET curso_activo = ?, estados_cursos = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `;

      await this.db.run(sql, [
        uiState.cursoActivo || null,
        JSON.stringify(uiState.courseStates || {})
      ]);
    } else if (this.storageInstance) {
      const currentState = {
        ...uiState,
        updatedAt: new Date().toISOString()
      };

      await this.storageInstance.set('ui_state', currentState);
    }
  }

  /**
   * Obtiene el estado de la UI
   */
  async getUIState(): Promise<any> {
    await this.ensureInitialized();

    const defaultState = {
      cursoActivo: null,
      courseStates: {}
    };

    if (this.usingSQLite && this.db) {
      const sql = 'SELECT * FROM ui_state WHERE id = 1';
      const result = await this.db.query(sql);

      if (result && result.values && result.values.length > 0) {
        const row = result.values[0];
        return {
          cursoActivo: row.curso_activo,
          courseStates: JSON.parse(row.estados_cursos || '{}')
        };
      }

      return defaultState;
    } else if (this.storageInstance) {
      return (await this.storageInstance.get('ui_state')) || defaultState;
    }

    return defaultState;
  }

  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================

  /**
   * Limpia toda la base de datos
   */
  async clearDatabase(): Promise<void> {
    await this.ensureInitialized();

    if (this.usingSQLite && this.db) {
      const tables = ['cursos', 'evaluaciones', 'comentarios_predefinidos', 'rubricas'];

      for (const table of tables) {
        await this.db.run(`DELETE FROM ${table}`);
      }

      await this.db.run(`UPDATE ui_state SET curso_activo = NULL, estados_cursos = '{}' WHERE id = 1`);
    } else if (this.storageInstance) {
      const keys = ['cursos', 'evaluaciones', 'comentarios_predefinidos', 'rubricas'];
      
      for (const key of keys) {
        await this.storageInstance.remove(key);
      }

      await this.saveUIState({
        cursoActivo: null,
        courseStates: {}
      });
    }

    console.log('Base de datos limpiada');
  }

  /**
   * Cierra la conexión a la base de datos
   */
  async close(): Promise<void> {
    if (this.isInitialized) {
      if (this.usingSQLite && this.db) {
        await this.db.close();
      }
      
      this.db = null;
      this.storageInstance = null;
      this.isInitialized = false;
      console.log('Base de datos cerrada');
    }
  }
}