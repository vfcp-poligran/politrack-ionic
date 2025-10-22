# POLITrack - Sistema de Seguimiento Académico

POLITrack es una aplicación móvil/web desarrollada con Ionic y Angular para el seguimiento y evaluación académica de estudiantes.

## 🚀 Características Principales

### ✅ Gestión de Cursos
- Importación de estudiantes desde archivos CSV
- Visualización de listas de estudiantes organizadas por grupos
- Filtrado y búsqueda avanzada de estudiantes
- Exportación de datos a CSV

### ✅ Sistema de Evaluaciones
- Evaluaciones por entregas (E1, E2, EF)
- Puntuaciones PG (Pares-Grupal) y PI (Pares-Individual)
- Cálculo automático de sumatorias
- Sistema de comentarios y rúbricas

### ✅ Interfaz Intuitiva
- Diseño responsive para móvil y escritorio
- Tabla de calificaciones con scroll horizontal
- Columnas fijas para mejor navegación
- Modo oscuro automático según preferencias del sistema

### ✅ Persistencia de Datos
- Base de datos híbrida (SQLite nativo + Ionic Storage)
- Sincronización automática entre dispositivos
- Backup y restauración de datos

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Angular 20 + Ionic 8
- **Base de Datos**: SQLite (móvil) / Ionic Storage (web)
- **Lenguaje**: TypeScript
- **Estilos**: SCSS + Variables CSS de Ionic
- **Build Tool**: Angular CLI + Capacitor

## 📱 Plataformas Soportadas

- ✅ **Web** (Chrome, Firefox, Safari, Edge)
- ✅ **Android** (API 22+)
- ✅ **iOS** (iOS 13+)

## 🚀 Instalación y Desarrollo

### Prerrequisitos
```bash
node --version  # v18+ requerido
npm --version   # v9+ requerido
```

### Clonar e Instalar Dependencias
```bash
git clone [repository-url]
cd politrack-ionic
npm install
```

### Ejecutar en Desarrollo
```bash
# Servidor de desarrollo web
npm run start
# o
ionic serve

# Build para producción
npm run build

# Linting
npm run lint

# Tests
npm test
```

### Compilar para Móvil
```bash
# Android
ionic cap add android
ionic cap run android

# iOS
ionic cap add ios
ionic cap run ios
```

## 📄 Estructura del Proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── models/          # Interfaces y tipos
│   │   └── services/        # Servicios de datos y lógica
│   ├── home/               # Página principal
│   ├── pages/
│   │   └── curso-detail/   # Detalle de curso y evaluaciones
│   └── shared/            # Componentes compartidos
├── assets/                # Recursos estáticos
├── environments/          # Configuración de entornos
└── theme/                # Variables de tema
```

## 🔧 Configuración

### Variables de Entorno
Edita `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'tu-api-url',
  // otras configuraciones
};
```

### Personalización de Tema
Modifica `src/theme/variables.scss` para cambiar colores y estilos.

## 📋 Formato de CSV para Importación

El archivo CSV debe tener la siguiente estructura:
```csv
Apellidos;Nombres;Correo;Grupo;Subgrupo
Doe;John;john.doe@example.com;G1;G1A
Smith;Jane;jane.smith@example.com;G1;G1B
```

**Campos obligatorios:**
- Apellidos
- Nombres  
- Correo (usado como identificador único)
- Grupo
- Subgrupo

## 🐛 Resolución de Problemas

### Error "WebStore is not open yet"
Este error se produce en navegadores web. La aplicación ahora usa un sistema híbrido que automáticamente usa Ionic Storage como fallback.

### Problemas de Performance en Tablas Grandes
- La tabla usa virtualización para manejar listas grandes
- Las columnas sticky están optimizadas para scroll suave
- Se recomienda filtrar estudiantes para mejor rendimiento

### Problemas de Base de Datos
```bash
# Limpiar storage local (solo development)
localStorage.clear()
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Autores

- **Equipo POLI** - Desarrollo inicial

## 🙏 Agradecimientos

- [Ionic Framework](https://ionicframework.com/)
- [Angular](https://angular.io/)
- [Capacitor](https://capacitorjs.com/)

---

**¿Encontraste un bug o tienes una sugerencia?** 
Abre un [issue](../../issues) en el repositorio.
