# Copilot Instructions - Pagoa Gestión Cervecería

## Project Overview

**Pagoa Gestión** is a browser-based brewery management system built with vanilla JavaScript, Supabase, and Tailwind CSS. It tracks production, inventory, sales, costs, and generates KPIs for a craft brewery operation.

**Stack:**
- Frontend: HTML + Vanilla JS (no frameworks)
- Database: Supabase PostgreSQL
- UI: Tailwind CSS + Chart.js
- Authentication: Supabase Auth

## Architecture

### Core Modules

1. **app.js** (3200+ lines) - Main application logic
   - Authentication system (Supabase session management)
   - Navigation between views (loadView switching)
   - Global state: `currentUser`, `currentView`
   - UI patterns for modals, messages, loading states

2. **modules.js** (1900+ lines) - Business logic modules
   - **Dashboard**: Monthly KPIs (production, sales, margins), 6-month charts
   - **Materias Primas**: Inventory management (ingredients/envasado)
   - **Producción**: Production operations with 2-type system (Elaboración de mosto / Envasado)
   - **Ventas/Recetas/Costos**: Revenue and cost tracking

3. **config.js** - Supabase credentials (⚠️ Contains public keys, not secrets)

4. **index.html** - Single-page layout with hidden screens (login, register, main-app)

### Key Data Flows

**Production → Inventory → Sales:**
```
1. Save production → calculate material costs from receta (recipe)
2. Confirm production → deduct materials from stock in materias_primas table
3. Register finished product → create producto_terminado record
4. Sales → reduce finished product stock (cantidad vendida - stock_actual)
```

**Dashboard KPI Calculation:**
- Production volume: Sum `produccion.volumen_litros` (only confirmed, tipo="Elaboración de mosto")
- Revenue: Sum `(ventas.cantidad × precio_unitario)`
- Variable costs: Sum confirmed `produccion.costo`
- Fixed costs: Sum monthly `costos_fijos.monto`
- Net margin: (Revenue - Variable Costs) - Fixed Costs

## Project Conventions

### Async Database Pattern
All Supabase queries use this pattern:
```javascript
const { data, error } = await supabase.from('table').select('*');
if (error) throw error;
```
Error handling is mandatory—never skip it.

### Modal System
- Show: `openModal('id')` → removes `hidden` class
- Close: `closeModal('id')` → adds `hidden` class
- Always include: hidden `<input type="hidden" id="record-id">` to track edit context

### View Loading Pattern
```javascript
function loadView(viewName) {
    // Get HTML from getXxxHTML() helper
    // Then call initXxx() to load data and attach event listeners
    // Examples: getDashboardHTML() → initDashboard()
}
```

### Supabase Table Structure Examples
- `materias_primas`: `material`, `tipo` (ingrediente|envase), `stock`, `punto_reorden`, `costo_unitario`, `capacidad_litros`
- `produccion`: `fecha`, `tipo_operacion`, `numero_lote`, `estilo`, `volumen_litros`, `costo`, `confirmado`, `ubicacion`
- `producto_terminado`: `numero_lote`, `estilo`, `tipo_envase`, `unidades_producidas`, `fecha_envasado`
- `ventas`: `numero_lote`, `cantidad`, `precio_unitario`, `fecha`

### Color Scheme (CSS Variables)
```css
--pagoa-green: #1a4d2e;   /* Primary action buttons, active states */
--pagoa-gold: #d4af37;    /* Accents, highlights */
--pagoa-dark: #0f1a14;    /* Navbar background */
--pagoa-light: #f8f9fa;   /* Page background */
```

## Critical Workflows

### Adding New Production Operation
1. User clicks "Nueva Operación" → `openAddProduccionModal()`
2. Form submits → `handleSaveProduccion()` saves to DB (no inventory deduction)
3. User confirms separately → `confirmarOperacion()` → deducts materials, marks `confirmado=true`
4. ⚠️ **Once confirmed, production cannot be edited** (safety constraint)

### Inventory Adjustments
Manual stock adjustments via `adjustStock(id, name)` create audit trail by direct stock updates (no separate log table yet).

### Refreshing Data
Dashboard: `refreshDashboard()` reloads KPIs and charts
Production: `loadProduccionOperaciones()` or `loadProduccionLotes()`
Use `filterProduccion()` to apply dropdown filters before refreshing.

## Common Patterns to Preserve

1. **Loading States** - Use `showLoading(type)` / `hideLoading(type)` for form submissions
2. **Error Messages** - Display via `showMessage(elementId, 'error', text)` with 5s auto-hide
3. **Form Reset** - Always `form.reset()` after successful submission
4. **Event Delegation** - Attach listeners in `initXxx()` functions, not inline `onclick` in HTML generators

## Key Files by Task

| Task | File | Key Functions |
|------|------|---|
| Add inventory item | modules.js | `handleSaveMaterial()`, `loadMateriales()` |
| Record production | app.js | `handleSaveProduccion()`, `confirmarOperacion()` |
| Generate dashboard | modules.js | `loadDashboardKPIs()`, `loadDashboardCharts()` |
| Filter/search data | app.js | `filterProduccion()`, switches via `switchXxxTab()` |
| Edit any record | modules.js | `editXxx()` functions load data into modal, form submit updates |

## Testing & Debugging

- **Console Logs**: Color-coded with emoji (🟢 success, ❌ error, ⚠️ warning)
- **No build step**: Changes require page reload; use browser DevTools for JS debugging
- **Supabase Auth**: Check `supabase.auth.getSession()` in console if session issues occur
- **Chart updates**: Charts must be recreated (not mutated) on data changes—destroy old chart before creating new

## When Adding Features

1. Follow existing async/await patterns—no promises without await
2. Add event listeners in `initXxx()`, not embedded in HTML strings
3. Update Supabase table documentation in comments if schema changes
4. Test with both confirmed/unconfirmed production states
5. Ensure stock calculations account for sold items (sales subtract from `producto_terminado`)
