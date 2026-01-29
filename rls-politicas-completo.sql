-- ============================================
-- LIMPIAR Y RECREAR POLÍTICAS RLS - PAGOA GESTIÓN CERVECERÍA
-- ============================================
-- Ejecuta este script completo en el SQL Editor de Supabase
-- Elimina políticas viejas y crea nuevas sin restricciones por usuario

-- ============================================
-- TABLA: produccion
-- ============================================
DROP POLICY IF EXISTS "Usuarios autenticados - acceso produccion" ON public.produccion;
DROP POLICY IF EXISTS allow_select_authenticated ON public.produccion;
DROP POLICY IF EXISTS allow_insert_authenticated ON public.produccion;
DROP POLICY IF EXISTS allow_update_authenticated ON public.produccion;
DROP POLICY IF EXISTS allow_delete_authenticated ON public.produccion;

ALTER TABLE public.produccion ENABLE ROW LEVEL SECURITY;

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
DROP POLICY IF EXISTS "Usuarios autenticados - acceso producto_terminado" ON public.producto_terminado;
DROP POLICY IF EXISTS allow_select_authenticated ON public.producto_terminado;
DROP POLICY IF EXISTS allow_insert_authenticated ON public.producto_terminado;
DROP POLICY IF EXISTS allow_update_authenticated ON public.producto_terminado;
DROP POLICY IF EXISTS allow_delete_authenticated ON public.producto_terminado;

ALTER TABLE public.producto_terminado ENABLE ROW LEVEL SECURITY;

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
DROP POLICY IF EXISTS "Usuarios autenticados - acceso ventas" ON public.ventas;
DROP POLICY IF EXISTS allow_select_authenticated ON public.ventas;
DROP POLICY IF EXISTS allow_insert_authenticated ON public.ventas;
DROP POLICY IF EXISTS allow_update_authenticated ON public.ventas;
DROP POLICY IF EXISTS allow_delete_authenticated ON public.ventas;

ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

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
DROP POLICY IF EXISTS "Usuarios autenticados - acceso historial" ON public.historial;
DROP POLICY IF EXISTS allow_select_authenticated ON public.historial;
DROP POLICY IF EXISTS allow_insert_authenticated ON public.historial;
DROP POLICY IF EXISTS allow_update_authenticated ON public.historial;
DROP POLICY IF EXISTS allow_delete_authenticated ON public.historial;

ALTER TABLE public.historial ENABLE ROW LEVEL SECURITY;

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
DROP POLICY IF EXISTS "Usuarios autenticados - acceso configuracion" ON public.configuracion;
DROP POLICY IF EXISTS allow_select_authenticated ON public.configuracion;
DROP POLICY IF EXISTS allow_insert_authenticated ON public.configuracion;
DROP POLICY IF EXISTS allow_update_authenticated ON public.configuracion;
DROP POLICY IF EXISTS allow_delete_authenticated ON public.configuracion;

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

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
-- TABLA: recetas
-- ============================================
DROP POLICY IF EXISTS "Usuarios autenticados - acceso recetas" ON public.recetas;
DROP POLICY IF EXISTS allow_select_authenticated ON public.recetas;
DROP POLICY IF EXISTS allow_insert_authenticated ON public.recetas;
DROP POLICY IF EXISTS allow_update_authenticated ON public.recetas;
DROP POLICY IF EXISTS allow_delete_authenticated ON public.recetas;

ALTER TABLE public.recetas ENABLE ROW LEVEL SECURITY;

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
-- TABLA: profiles (perfiles de usuario - más restrictiva)
-- ============================================
DROP POLICY IF EXISTS allow_select_own_profile ON public.profiles;
DROP POLICY IF EXISTS allow_insert_own_profile ON public.profiles;
DROP POLICY IF EXISTS allow_update_own_profile ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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
-- FIN - Script completado
-- ============================================
-- Próximos pasos:
-- 1. Recarga la app en el navegador
-- 2. Prueba crear registros (ingredientes, producción, ventas)
-- 3. Abre otra sesión/navegador con otro usuario
-- 4. Verifica que ambos usuarios ven los mismos datos
