-- ============================================
-- POLÍTICAS RLS - PAGOA GESTIÓN CERVECERÍA
-- ============================================
-- Permite lectura/escritura compartida para todos los usuarios autenticados
-- Ejecuta este script completo en el SQL Editor de Supabase

-- ============================================
-- TABLA: materias_primas
-- ============================================
ALTER TABLE public.materias_primas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_select_authenticated ON public.materias_primas;
DROP POLICY IF EXISTS allow_insert_authenticated ON public.materias_primas;
DROP POLICY IF EXISTS allow_update_authenticated ON public.materias_primas;
DROP POLICY IF EXISTS allow_delete_authenticated ON public.materias_primas;

CREATE POLICY allow_select_authenticated
  ON public.materias_primas
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY allow_insert_authenticated
  ON public.materias_primas
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY allow_update_authenticated
  ON public.materias_primas
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY allow_delete_authenticated
  ON public.materias_primas
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- TABLA: produccion
-- ============================================
ALTER TABLE public.produccion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_select_authenticated ON public.produccion;
DROP POLICY IF EXISTS allow_insert_authenticated ON public.produccion;
DROP POLICY IF EXISTS allow_update_authenticated ON public.produccion;
DROP POLICY IF EXISTS allow_delete_authenticated ON public.produccion;

CREATE POLICY allow_select_authenticated
  ON public.produccion
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY allow_insert_authenticated
  ON public.produccion
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY allow_update_authenticated
  ON public.produccion
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY allow_delete_authenticated
  ON public.produccion
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- TABLA: producto_terminado
-- ============================================
ALTER TABLE public.producto_terminado ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_select_authenticated ON public.producto_terminado;
DROP POLICY IF EXISTS allow_insert_authenticated ON public.producto_terminado;
DROP POLICY IF EXISTS allow_update_authenticated ON public.producto_terminado;
DROP POLICY IF EXISTS allow_delete_authenticated ON public.producto_terminado;

CREATE POLICY allow_select_authenticated
  ON public.producto_terminado
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY allow_insert_authenticated
  ON public.producto_terminado
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY allow_update_authenticated
  ON public.producto_terminado
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY allow_delete_authenticated
  ON public.producto_terminado
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- TABLA: ventas
-- ============================================
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_select_authenticated ON public.ventas;
DROP POLICY IF EXISTS allow_insert_authenticated ON public.ventas;
DROP POLICY IF EXISTS allow_update_authenticated ON public.ventas;
DROP POLICY IF EXISTS allow_delete_authenticated ON public.ventas;

CREATE POLICY allow_select_authenticated
  ON public.ventas
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY allow_insert_authenticated
  ON public.ventas
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY allow_update_authenticated
  ON public.ventas
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY allow_delete_authenticated
  ON public.ventas
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- TABLA: historial
-- ============================================
ALTER TABLE public.historial ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_select_authenticated ON public.historial;
DROP POLICY IF EXISTS allow_insert_authenticated ON public.historial;
DROP POLICY IF EXISTS allow_update_authenticated ON public.historial;
DROP POLICY IF EXISTS allow_delete_authenticated ON public.historial;

CREATE POLICY allow_select_authenticated
  ON public.historial
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY allow_insert_authenticated
  ON public.historial
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY allow_update_authenticated
  ON public.historial
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY allow_delete_authenticated
  ON public.historial
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- TABLA: configuracion
-- ============================================
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_select_authenticated ON public.configuracion;
DROP POLICY IF EXISTS allow_insert_authenticated ON public.configuracion;
DROP POLICY IF EXISTS allow_update_authenticated ON public.configuracion;
DROP POLICY IF EXISTS allow_delete_authenticated ON public.configuracion;

CREATE POLICY allow_select_authenticated
  ON public.configuracion
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY allow_insert_authenticated
  ON public.configuracion
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY allow_update_authenticated
  ON public.configuracion
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY allow_delete_authenticated
  ON public.configuracion
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- TABLA: recetas (lectura compartida)
-- ============================================
ALTER TABLE public.recetas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_select_authenticated ON public.recetas;
DROP POLICY IF EXISTS allow_insert_authenticated ON public.recetas;
DROP POLICY IF EXISTS allow_update_authenticated ON public.recetas;
DROP POLICY IF EXISTS allow_delete_authenticated ON public.recetas;

CREATE POLICY allow_select_authenticated
  ON public.recetas
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY allow_insert_authenticated
  ON public.recetas
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY allow_update_authenticated
  ON public.recetas
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY allow_delete_authenticated
  ON public.recetas
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- TABLA: profiles (perfiles de usuario)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_select_own_profile ON public.profiles;
DROP POLICY IF EXISTS allow_insert_own_profile ON public.profiles;
DROP POLICY IF EXISTS allow_update_own_profile ON public.profiles;

CREATE POLICY allow_select_own_profile
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY allow_insert_own_profile
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY allow_update_own_profile
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- FIN DE POLÍTICAS RLS
-- ============================================
-- Después de ejecutar este script:
-- 1. Recarga la app en el navegador
-- 2. Prueba que dos usuarios diferentes ven los mismos datos
-- 3. Verifica que ambos pueden crear/editar/borrar registros
