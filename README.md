# Learn to Speak - Aplicación de Aprendizaje de Lectura para Niños

Una aplicación interactiva desarrollada con Next.js, Prisma y SQLite/PostgreSQL que ayuda a los niños a aprender a leer practicando palabras con diferentes consonantes.

## Características

- **Selección de Consonantes**: Los niños pueden elegir entre diferentes consonantes (B, C, D, F, G, L, M, N, P, R, S, T)
- **Generación de Palabras**: Sistema inteligente que genera hasta 15 palabras por consonante
- **Filtros por Sílabas**: Posibilidad de filtrar palabras por número de sílabas (1, 2, o 3)
- **Niveles de Dificultad**: Palabras clasificadas por dificultad del 1 al 5
- **Interfaz Amigable**: Diseño colorido y atractivo para niños
- **Progreso Visual**: Seguimiento del progreso con indicadores visuales

## Tecnologías Utilizadas

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: Prisma ORM con SQLite (desarrollo) / PostgreSQL (producción)
- **Validación**: Zod para validación de esquemas

## Instalación y Configuración

### Prerrequisitos
- Node.js 18 o superior
- npm o yarn

### Pasos de Instalación

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar la base de datos**
   
   **Para desarrollo local (SQLite - ya configurado):**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```
   
   **Para producción con Neon PostgreSQL:**
   - Crear una cuenta en [Neon](https://neon.tech/)
   - Crear una nueva base de datos
   - Actualizar el archivo `prisma/schema.prisma`:
     ```prisma
     datasource db {
       provider = "postgresql"
       url      = env("DATABASE_URL")
     }
     ```
   - Actualizar el archivo `.env`:
     ```env
     DATABASE_URL="postgresql://username:password@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require"
     ```
   - Ejecutar migraciones:
     ```bash
     npx prisma migrate deploy
     npx prisma generate
     ```

3. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir la aplicación**
   Navegar a [http://localhost:3000](http://localhost:3000)

## Uso de la Aplicación

1. **Seleccionar Consonante**: En la página principal, haz clic en cualquier consonante
2. **Filtrar por Sílabas**: (Opcional) Usa el filtro para mostrar solo palabras con un número específico de sílabas
3. **Practicar Palabras**: Haz clic en las tarjetas de palabras para marcarlas como completadas
4. **Progreso**: Observa el progreso en la parte superior de la página
5. **Volver**: Usa el botón "Volver" para seleccionar otra consonante

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter
- `npx prisma studio` - Abre Prisma Studio para ver la base de datos

## Estructura del Proyecto

```
/src
  /app
    /api
      /consonants     # API para manejar consonantes
      /words          # API para generar palabras
    page.tsx          # Página principal
  /components
    components.tsx    # Componentes UI reutilizables
  /lib
    /rules
      engine.ts       # Motor de generación de palabras
      schema.ts       # Esquemas de validación Zod
      types.ts        # Tipos TypeScript
    prisma.ts         # Cliente de Prisma
/prisma
  schema.prisma       # Esquema de base de datos
```
