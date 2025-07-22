# negocio
La aplicacion sera un proyecto para que los niños puedan aprender a leer, vamos a tener las siguientes features:

1. generador de palabras sencillas que podamos seleccionar la complejidad por medio de un selector de silabas, mostrando cards con las palabras con la consonante que hemos escogido.
Tambien vamos a llevar un contador de palabras y tendremos una lista de maximo de 15 palabras.



# estructura
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
    schema.ts             # Zod/prisma schema
    types.ts              # Tipos TypeScript

/components
  components.tsx          # Componente UI para editar reglas
/models
    agent.ts              # Modelo de agente

/prisma
  schema.prisma               # Modelos DB (si usas Prisma ORM)

.env

