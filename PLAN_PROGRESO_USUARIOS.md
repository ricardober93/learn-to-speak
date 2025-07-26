# Plan para Sistema de Progreso de Usuarios y Rutas Protegidas

## 📋 Estado Actual

### ✅ Ya Implementado
- ✅ Modelos de base de datos (User, UserProgress, Session)
- ✅ Sistema de autenticación con Better Auth
- ✅ Middleware de protección de rutas básico
- ✅ Migración de progreso anónimo a usuario autenticado
- ✅ API para guardar y obtener progreso
- ✅ Roles de usuario (USER, ADMIN, TEACHER)

## 🎯 Objetivos del Plan

1. **Proteger rutas de actividades** - Solo usuarios autenticados pueden acceder
2. **Mejorar sistema de progreso** - Tracking detallado por actividad
3. **Dashboard de progreso** - Visualización para usuarios y profesores
4. **Sistema de logros** - Gamificación para motivar el aprendizaje

## 🏗️ Arquitectura Propuesta

### 1. Rutas de Actividades Protegidas
```
/activities/[consonantId]     # Actividad de consonante específica
/activities/progress          # Dashboard de progreso del usuario
/teacher/students            # Vista de progreso de estudiantes
/admin/analytics             # Análisis completo del sistema
```

### 2. Nuevos Modelos de Base de Datos
```prisma
model Activity {
  id          String @id @default(cuid())
  type        ActivityType // CONSONANT_PRACTICE, SYLLABLE_GAME, etc.
  consonantId String?
  difficulty  Int
  metadata    Json // Configuración específica de la actividad
  createdAt   DateTime @default(now())
  
  sessions    ActivitySession[]
}

model ActivitySession {
  id           String @id @default(cuid())
  userId       String?
  sessionId    String
  activityId   String
  startedAt    DateTime @default(now())
  completedAt  DateTime?
  score        Int?
  timeSpent    Int // en segundos
  wordsCorrect Int @default(0)
  wordsTotal   Int @default(0)
  
  user         User? @relation(fields: [userId], references: [id])
  activity     Activity @relation(fields: [activityId], references: [id])
}

model Achievement {
  id          String @id @default(cuid())
  name        String
  description String
  icon        String
  condition   Json // Condiciones para desbloquear
  points      Int @default(0)
  
  userAchievements UserAchievement[]
}

model UserAchievement {
  id            String @id @default(cuid())
  userId        String
  achievementId String
  unlockedAt    DateTime @default(now())
  
  user          User @relation(fields: [userId], references: [id])
  achievement   Achievement @relation(fields: [achievementId], references: [id])
}
```

## 🔧 Implementación por Fases

### Fase 1: Protección de Rutas de Actividades

#### 1.1 Actualizar Middleware
```typescript
// Agregar rutas de actividades a protectedRoutes
const protectedRoutes = [
  "/admin",
  "/teacher", 
  "/profile",
  "/activities", // Nueva ruta protegida
  "/progress"    // Nueva ruta protegida
];
```

#### 1.2 Crear Páginas de Actividades
- `/src/app/activities/[consonantId]/page.tsx` - Actividad específica
- `/src/app/activities/progress/page.tsx` - Dashboard personal
- `/src/app/teacher/students/page.tsx` - Vista de profesor

### Fase 2: Sistema de Progreso Mejorado

#### 2.1 Nuevas APIs
- `POST /api/activities/start` - Iniciar sesión de actividad
- `PUT /api/activities/[sessionId]/progress` - Actualizar progreso
- `POST /api/activities/[sessionId]/complete` - Completar actividad
- `GET /api/progress/user/[userId]` - Obtener progreso completo
- `GET /api/progress/summary` - Resumen de progreso

#### 2.2 Componentes de Progreso
- `ProgressCard` - Tarjeta de progreso individual
- `ProgressChart` - Gráfico de progreso temporal
- `AchievementBadge` - Insignias de logros
- `ActivityTimer` - Temporizador de actividad

### Fase 3: Dashboard y Analytics

#### 3.1 Dashboard de Usuario
- Progreso por consonante
- Tiempo total de práctica
- Logros desbloqueados
- Racha de días consecutivos

#### 3.2 Dashboard de Profesor
- Lista de estudiantes
- Progreso grupal
- Identificar estudiantes que necesitan ayuda
- Asignar actividades específicas

#### 3.3 Dashboard de Admin
- Métricas globales del sistema
- Actividades más populares
- Análisis de retención de usuarios

### Fase 4: Sistema de Logros

#### 4.1 Logros Básicos
- "Primera Palabra" - Completar primera actividad
- "Explorador" - Practicar 5 consonantes diferentes
- "Persistente" - 7 días consecutivos de práctica
- "Maestro" - 100% en una consonante

#### 4.2 Sistema de Puntos
- Puntos por palabra completada
- Bonificación por velocidad
- Bonificación por precisión
- Multiplicadores por racha

## 📁 Estructura de Archivos a Crear

```
/src
  /app
    /activities
      /[consonantId]
        page.tsx              # Actividad de consonante
        loading.tsx           # Loading state
      /progress
        page.tsx              # Dashboard personal
    /teacher
      /students
        page.tsx              # Vista de estudiantes
    /api
      /activities
        /start
          route.ts            # Iniciar actividad
        /[sessionId]
          /progress
            route.ts          # Actualizar progreso
          /complete
            route.ts          # Completar actividad
      /progress
        /user
          /[userId]
            route.ts          # Progreso de usuario
        /summary
          route.ts            # Resumen de progreso
      /achievements
        route.ts              # CRUD de logros
  /components
    /progress
      ProgressCard.tsx        # Tarjeta de progreso
      ProgressChart.tsx       # Gráfico de progreso
      ActivityTimer.tsx       # Temporizador
    /achievements
      AchievementBadge.tsx    # Insignia de logro
      AchievementList.tsx     # Lista de logros
    /activities
      ActivityLayout.tsx      # Layout de actividades
      WordPractice.tsx        # Componente de práctica
  /lib
    /progress
      analytics.ts            # Funciones de análisis
      achievements.ts         # Lógica de logros
      tracking.ts             # Tracking de actividades
```

## 🔒 Consideraciones de Seguridad

1. **Validación de Sesiones**: Verificar que el usuario solo pueda acceder a su propio progreso
2. **Rate Limiting**: Limitar frecuencia de actualizaciones de progreso
3. **Validación de Datos**: Validar que los puntajes sean realistas
4. **Roles y Permisos**: Profesores solo ven sus estudiantes asignados

## 📊 Métricas a Trackear

1. **Engagement**
   - Tiempo promedio por sesión
   - Frecuencia de uso
   - Retención de usuarios

2. **Progreso Académico**
   - Precisión por consonante
   - Velocidad de lectura
   - Mejora temporal

3. **Gamificación**
   - Logros desbloqueados
   - Puntos acumulados
   - Rachas mantenidas

## 🚀 Próximos Pasos

1. **Inmediato**: Actualizar middleware y crear rutas básicas
2. **Corto plazo**: Implementar tracking de actividades
3. **Mediano plazo**: Dashboard de progreso
4. **Largo plazo**: Sistema completo de logros y analytics

## 💡 Funcionalidades Adicionales (Futuro)

- **Modo Offline**: Sincronización cuando vuelva la conexión
- **Reportes PDF**: Exportar progreso para padres/profesores
- **Notificaciones**: Recordatorios de práctica
- **Competencias**: Desafíos entre estudiantes
- **Personalización**: Adaptar dificultad según progreso