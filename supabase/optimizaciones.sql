-- =====================================================================
-- Optimizaciones para inscripciones simultáneas
-- Correr en Supabase → SQL Editor. Es seguro correrlo más de una vez.
-- =====================================================================

-- ---------------------------------------------------------------------
-- PASO 1 — Revisar si ya hay documentos repetidos.
-- Si esta consulta devuelve filas, el índice único del paso 2 va a
-- fallar. Hay que borrar (desde el panel) las inscripciones duplicadas
-- que sobren y volver a correr el script.
-- ---------------------------------------------------------------------
select data->>'numeroDocumento' as documento,
       count(*)                 as cantidad,
       array_agg(id order by created_at) as ids
from public.inscripciones
group by data->>'numeroDocumento'
having count(*) > 1;

-- ---------------------------------------------------------------------
-- PASO 2 — Un documento, una inscripción.
-- La API ya chequea antes de guardar, pero dos envíos simultáneos (doble
-- clic, dos pestañas, reintento) pasaban los dos el chequeo. Con este
-- índice la base rechaza el segundo y la API responde "ya existe".
-- También acelera la búsqueda por documento que hace cada inscripción.
-- ---------------------------------------------------------------------
create unique index if not exists inscripciones_numero_documento_uniq
  on public.inscripciones ((data->>'numeroDocumento'));

-- ---------------------------------------------------------------------
-- PASO 3 — Conteo por carrera para el cupo de titulares.
-- Cada inscripción cuenta cuántas hay en su carrera hasta su fecha de
-- creación. Sin índice, eso recorre la tabla entera cada vez.
-- ---------------------------------------------------------------------
create index if not exists inscripciones_career_created_idx
  on public.inscripciones ((data->>'careerId'), created_at);

-- Listado del panel, ordenado por fecha.
create index if not exists inscripciones_created_idx
  on public.inscripciones (created_at desc);
