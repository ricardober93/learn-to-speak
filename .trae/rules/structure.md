Modelar la estrcutura del proyecto gobiernen del proyecto Next.js (ideal para panel de administración o interfaz de edición).


/app
  /agents
    /[id]
      page.tsx            # Vista del agente y sus reglas
  /api
    /rules
      route.ts            # CRUD para reglas

/lib
  /rules
    engine.ts             # Evaluador de reglas
    schema.ts             # Zod/Drizzle schema
    types.ts              # Tipos TypeScript

/components
  components.tsx          # Componente UI para editar reglas
/models
    agent.ts              # Modelo de agente

/drizzle
  schema.ts               # Modelos DB (si usas Drizzle ORM)

.env
drizzle.config.ts
