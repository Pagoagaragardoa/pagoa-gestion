// ============================================
// MÓDULOS DE LA APLICACIÓN PAGOA
// ============================================

// ============================================
// MÓDULO: DASHBOARD
// ============================================

async function initDashboard() {
    // Validar que los elementos existen antes de cargar datos
    if (document.getElementById('kpi-produccion')) {
        await loadDashboardKPIs();
    }
    
    if (document.getElementById('chart-produccion')) {
        await loadDashboardCharts();
    }
    
    if (document.getElementById('stock-bajo-table')) {
        await loadStockBajo();
    }
    
    if (document.getElementById('producto-terminado-table')) {
        await loadProductoTerminadoResumen();
    }
}

async function refreshDashboard() {
    await initDashboard();
}

async function loadDashboardKPIs() {
    try {
        const mesActual = new Date().getMonth() + 1;
        const añoActual = new Date().getFullYear();
        const primerDiaMes = new Date(añoActual, mesActual - 1, 1).toISOString().split('T')[0];
        const ultimoDiaMes = new Date(añoActual, mesActual, 0).toISOString().split('T')[0];
        
        // Producción del mes
        const { data: produccion } = await supabase
            .from('produccion')
            .select('volumen_litros')
            .eq('tipo_operacion', 'Elaboración de mosto')
            .eq('confirmado', true)
            .gte('fecha', primerDiaMes)
            .lte('fecha', ultimoDiaMes);
        
        const totalProduccion = produccion?.reduce((sum, p) => sum + parseFloat(p.volumen_litros || 0), 0) || 0;
        document.getElementById('kpi-produccion').textContent = `${totalProduccion.toFixed(0)} L`;
        
        // Ventas del mes
        const { data: ventas } = await supabase
            .from('ventas')
            .select('cantidad, precio_unitario')
            .gte('fecha', primerDiaMes)
            .lte('fecha', ultimoDiaMes);
        
        const totalVentas = ventas?.reduce((sum, v) => sum + (parseFloat(v.cantidad || 0) * parseFloat(v.precio_unitario || 0)), 0) || 0;
        document.getElementById('kpi-ventas').textContent = `${totalVentas.toFixed(2)} €`;
        
        // Costos variables del mes
        const { data: costosProduccion } = await supabase
            .from('produccion')
            .select('costo')
            .eq('confirmado', true)
            .gte('fecha', primerDiaMes)
            .lte('fecha', ultimoDiaMes);
        
        const totalCostosVariables = costosProduccion?.reduce((sum, c) => sum + parseFloat(c.costo || 0), 0) || 0;
        
        // Costos fijos del mes
        const { data: costosFijos } = await supabase
            .from('costos_fijos')
            .select('monto')
            .eq('mes', mesActual)
            .eq('año', añoActual);
        
        const totalCostosFijos = costosFijos?.reduce((sum, c) => sum + parseFloat(c.monto || 0), 0) || 0;
        
        // Márgenes
        const margenBruto = totalVentas - totalCostosVariables;
        const margenNeto = margenBruto - totalCostosFijos;
        
        document.getElementById('kpi-margen-bruto').textContent = `${margenBruto.toFixed(2)} €`;
        document.getElementById('kpi-margen-neto').textContent = `${margenNeto.toFixed(2)} €`;
        
        // Color según si es positivo o negativo
        const margenNetoEl = document.getElementById('kpi-margen-neto');
        if (margenNeto < 0) {
            margenNetoEl.classList.remove('text-orange-600');
            margenNetoEl.classList.add('text-red-600');
        } else {
            margenNetoEl.classList.remove('text-red-600');
            margenNetoEl.classList.add('text-orange-600');
        }
        
    } catch (error) {
        console.error('Error cargando KPIs:', error);
    }
}

async function loadDashboardCharts() {
    try {
        const meses = [];
        const dataProduccion = [];
        const dataVentas = [];
        
        // Obtener últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            const fecha = new Date();
            fecha.setMonth(fecha.getMonth() - i);
            const mes = fecha.getMonth() + 1;
            const año = fecha.getFullYear();
            const primerDia = new Date(año, mes - 1, 1).toISOString().split('T')[0];
            const ultimoDia = new Date(año, mes, 0).toISOString().split('T')[0];
            
            meses.push(fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }));
            
            // Producción
            const { data: prod } = await supabase
                .from('produccion')
                .select('volumen_litros')
                .eq('tipo_operacion', 'Elaboración de mosto')
                .eq('confirmado', true)
                .gte('fecha', primerDia)
                .lte('fecha', ultimoDia);
            
            const totalProd = prod?.reduce((sum, p) => sum + parseFloat(p.volumen_litros || 0), 0) || 0;
            dataProduccion.push(totalProd);
            
            // Ventas
            const { data: vent } = await supabase
                .from('ventas')
                .select('cantidad, precio_unitario')
                .gte('fecha', primerDia)
                .lte('fecha', ultimoDia);
            
            const totalVent = vent?.reduce((sum, v) => sum + (parseFloat(v.cantidad || 0) * parseFloat(v.precio_unitario || 0)), 0) || 0;
            dataVentas.push(totalVent);
        }
        
        // Gráfico de Producción
        const ctxProduccion = document.getElementById('chart-produccion');
        if (ctxProduccion) {
            new Chart(ctxProduccion, {
                type: 'bar',
                data: {
                    labels: meses,
                    datasets: [{
                        label: 'Litros Producidos',
                        data: dataProduccion,
                        backgroundColor: 'rgba(26, 77, 46, 0.8)',
                        borderColor: 'rgba(26, 77, 46, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return value + ' L';
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
        
        // Gráfico de Ventas
        const ctxVentas = document.getElementById('chart-ventas');
        if (ctxVentas) {
            new Chart(ctxVentas, {
                type: 'line',
                data: {
                    labels: meses,
                    datasets: [{
                        label: 'Ventas (€)',
                        data: dataVentas,
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return value + ' €';
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
        
    } catch (error) {
        console.error('Error cargando gráficos:', error);
    }
}

async function loadStockBajo() {
    try {
        const { data, error } = await supabase
            .from('materias_primas')
            .select('*')
            .order('stock', { ascending: true });
        
        if (error) throw error;
        
        // Filtrar materiales con stock bajo o crítico
        const stockBajo = data.filter(m => parseFloat(m.stock) <= parseFloat(m.punto_reorden));
        
        const tableDiv = document.getElementById('stock-bajo-table');
        
        if (stockBajo.length === 0) {
            tableDiv.innerHTML = '<p class="text-green-600 text-center py-4"><i class="fas fa-check-circle mr-2"></i>Todos los materiales tienen stock adecuado</p>';
            return;
        }
        
        let html = `
            <table class="min-w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;
        
        stockBajo.forEach(material => {
            const stock = parseFloat(material.stock);
            const reorden = parseFloat(material.punto_reorden);
            const estado = stock === 0 ? 'CRÍTICO' : 'BAJO';
            const estadoColor = stock === 0 ? 'text-red-600' : 'text-yellow-600';
            
            html += `
                <tr>
                    <td class="px-4 py-3 text-sm text-gray-900">${material.material}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${stock.toFixed(2)} ${material.unidad}</td>
                    <td class="px-4 py-3 text-sm font-semibold ${estadoColor}">
                        <i class="fas fa-exclamation-triangle mr-1"></i>${estado}
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        tableDiv.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando stock bajo:', error);
        document.getElementById('stock-bajo-table').innerHTML = '<p class="text-red-600 text-center py-4">Error al cargar datos</p>';
    }
}

async function loadProductoTerminadoResumen() {
    try {
        const { data: productos, error } = await supabase
            .from('producto_terminado')
            .select('*')
            .order('fecha_envasado', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        const tableDiv = document.getElementById('producto-terminado-table');
        
        if (!productos || productos.length === 0) {
            tableDiv.innerHTML = '<p class="text-gray-500 text-center py-4">No hay producto terminado registrado</p>';
            return;
        }
        
        // Calcular stock actual (producido - vendido)
        const productosConStock = await Promise.all(productos.map(async (p) => {
            const { data: ventas } = await supabase
                .from('ventas')
                .select('cantidad')
                .eq('numero_lote', p.numero_lote);
            
            const totalVendido = ventas?.reduce((sum, v) => sum + parseInt(v.cantidad || 0), 0) || 0;
            const stockActual = parseInt(p.unidades_producidas) - totalVendido;
            
            return {
                ...p,
                stock_actual: stockActual
            };
        }));
        
        let html = `
            <table class="min-w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estilo</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Envase</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;
        
        productosConStock.forEach(p => {
            const stockColor = p.stock_actual > 0 ? 'text-green-600' : 'text-gray-400';
            html += `
                <tr>
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">${p.numero_lote}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${p.estilo}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${p.tipo_envase}</td>
                    <td class="px-4 py-3 text-sm font-semibold ${stockColor}">${p.stock_actual} uds</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        tableDiv.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando producto terminado:', error);
        document.getElementById('producto-terminado-table').innerHTML = '<p class="text-red-600 text-center py-4">Error al cargar datos</p>';
    }
}

// ============================================
// MÓDULO: MATERIAS PRIMAS
// ============================================

let currentMaterialTab = 'ingredientes';

async function initMateriasPrimas() {
    await loadMateriales('ingredientes');
    
    // Evento para mostrar/ocultar capacidad según tipo
    const tipoSelect = document.getElementById('material-tipo');
    if (tipoSelect) {
        tipoSelect.addEventListener('change', (e) => {
            const capacidadContainer = document.getElementById('capacidad-container');
            if (e.target.value === 'envase') {
                capacidadContainer.classList.remove('hidden');
            } else {
                capacidadContainer.classList.add('hidden');
            }
        });
    }
    
    // Evento submit del formulario
    const form = document.getElementById('material-form');
    if (form) {
        form.addEventListener('submit', handleSaveMaterial);
    }
}

function switchMaterialTab(tab) {
    currentMaterialTab = tab;
    
    // Actualizar UI de tabs
    document.getElementById('tab-ingredientes').className = 
        tab === 'ingredientes' 
        ? 'px-6 py-3 font-semibold text-pagoa-green border-b-2 border-pagoa-green'
        : 'px-6 py-3 font-semibold text-gray-600 hover:text-pagoa-green';
    
    document.getElementById('tab-envases').className = 
        tab === 'envases' 
        ? 'px-6 py-3 font-semibold text-pagoa-green border-b-2 border-pagoa-green'
        : 'px-6 py-3 font-semibold text-gray-600 hover:text-pagoa-green';
    
    loadMateriales(tab);
}

async function loadMateriales(tipo) {
    try {
        const { data, error } = await supabase
            .from('materias_primas')
            .select('*')
            .eq('tipo', tipo)
            .order('material', { ascending: true });
        
        if (error) throw error;
        
        const tableDiv = document.getElementById('materiales-table');
        
        if (!data || data.length === 0) {
            tableDiv.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">No hay ${tipo} registrados</p>
                    <button onclick="openAddMaterialModal()" class="mt-4 bg-pagoa-green text-white px-4 py-2 rounded-lg hover:bg-green-800">
                        <i class="fas fa-plus mr-2"></i>Añadir ${tipo === 'ingredientes' ? 'Ingrediente' : 'Envase'}
                    </button>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pto. Reorden</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo Unit.</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                            ${tipo === 'envase' ? '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacidad</th>' : ''}
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
        `;
        
        data.forEach(material => {
            const stock = parseFloat(material.stock);
            const reorden = parseFloat(material.punto_reorden);
            const costo = parseFloat(material.costo_unitario);
            const valorTotal = (stock * costo).toFixed(2);
            
            let estado = '✓ OK';
            let estadoColor = 'text-green-600';
            
            if (stock === 0) {
                estado = '⚠️ CRÍTICO';
                estadoColor = 'text-red-600 font-bold';
            } else if (stock <= reorden) {
                estado = '⚠️ BAJO';
                estadoColor = 'text-yellow-600 font-semibold';
            }
            
            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">${material.material}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${stock.toFixed(2)}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${material.unidad}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${reorden.toFixed(2)}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${costo.toFixed(2)} €</td>
                    <td class="px-4 py-3 text-sm font-semibold text-gray-900">${valorTotal} €</td>
                    ${tipo === 'envase' ? `<td class="px-4 py-3 text-sm text-gray-700">${material.capacidad_litros || '-'} L</td>` : ''}
                    <td class="px-4 py-3 text-sm ${estadoColor}">${estado}</td>
                    <td class="px-4 py-3 text-sm">
                        <button onclick="editMaterial(${material.id})" class="text-blue-600 hover:text-blue-800 mr-3">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="adjustStock(${material.id}, '${material.material}')" class="text-green-600 hover:text-green-800 mr-3">
                            <i class="fas fa-plus-circle"></i>
                        </button>
                        <button onclick="deleteMaterial(${material.id})" class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        tableDiv.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando materiales:', error);
        document.getElementById('materiales-table').innerHTML = '<p class="text-red-600 text-center py-4">Error al cargar materiales</p>';
    }
}

function openAddMaterialModal() {
    document.getElementById('material-modal-title').textContent = 'Añadir Material';
    document.getElementById('material-form').reset();
    document.getElementById('material-id').value = '';
    document.getElementById('material-tipo').value = currentMaterialTab.slice(0, -1); // Remove 's' from plural
    document.getElementById('capacidad-container').classList.add('hidden');
    openModal('material-modal');
}

async function editMaterial(id) {
    try {
        const { data, error } = await supabase
            .from('materias_primas')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('material-modal-title').textContent = 'Editar Material';
        document.getElementById('material-id').value = data.id;
        document.getElementById('material-tipo').value = data.tipo;
        document.getElementById('material-nombre').value = data.material;
        document.getElementById('material-stock').value = data.stock;
        document.getElementById('material-unidad').value = data.unidad;
        document.getElementById('material-reorden').value = data.punto_reorden;
        document.getElementById('material-costo').value = data.costo_unitario;
        
        if (data.tipo === 'envase') {
            document.getElementById('capacidad-container').classList.remove('hidden');
            document.getElementById('material-capacidad').value = data.capacidad_litros || '';
        }
        
        openModal('material-modal');
        
    } catch (error) {
        console.error('Error cargando material:', error);
        alert('Error al cargar el material');
    }
}
async function handleSaveMaterial(e) {
    e.preventDefault();
    
    try {
        const id = document.getElementById('material-id').value;
        const tipo = document.getElementById('material-tipo').value;
        
        const materialData = {
            tipo: tipo,
            material: document.getElementById('material-nombre').value,
            stock: parseFloat(document.getElementById('material-stock').value),
            unidad: document.getElementById('material-unidad').value,
            punto_reorden: parseFloat(document.getElementById('material-reorden').value),
            costo_unitario: parseFloat(document.getElementById('material-costo').value),
            fecha: new Date().toISOString().split('T')[0]
        };
        
        if (materialData.tipo === 'envase') {
            const capacidad = document.getElementById('material-capacidad').value;
            materialData.capacidad_litros = capacidad ? parseFloat(capacidad) : null;
        }
        
        if (id) {
            // Actualizar
            const { error } = await supabase
                .from('materias_primas')
                .update(materialData)
                .eq('id', id);
            
            if (error) throw error;
            alert('Material actualizado correctamente');
        } else {
            // Insertar
            const { error } = await supabase
                .from('materias_primas')
                .insert([materialData]);
            
            if (error) throw error;
            alert('Material añadido correctamente');
        }
        
        closeModal('material-modal');
        
        // IMPORTANTE: Recargar con el tipo correcto
        // Asegurarse de que currentMaterialTab esté sincronizado
        currentMaterialTab = tipo;
        await loadMateriales(tipo);
        
    } catch (error) {
        console.error('Error guardando material:', error);
        alert('Error al guardar el material: ' + error.message);
    }
}


async function deleteMaterial(id) {
    if (!confirm('¿Está seguro de eliminar este material? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('materias_primas')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        alert('Material eliminado correctamente');
        loadMateriales(currentMaterialTab);
        
    } catch (error) {
        console.error('Error eliminando material:', error);
        alert('Error al eliminar el material');
    }
}

// ============================================
// MÓDULO: PRODUCCIÓN
// ============================================

async function initProduccion() {
    // Funcionalidad a implementar en siguiente fase
    console.log('Módulo Producción inicializado');
}

// ============================================
// MÓDULO: PRODUCTO TERMINADO
// ============================================

async function initProductoTerminado() {
    // Funcionalidad a implementar en siguiente fase
    console.log('Módulo Producto Terminado inicializado');
}

// ============================================
// MÓDULO: VENTAS
// ============================================

async function initVentas() {
    // Funcionalidad a implementar en siguiente fase
    console.log('Módulo Ventas inicializado');
}

// ============================================
// MÓDULO: COSTOS
// ============================================

async function initCostos() {
    // Funcionalidad a implementar en siguiente fase
    console.log('Módulo Costos inicializado');
}

// ============================================
// MÓDULO: RECETAS
// ============================================

async function initRecetas() {
    // Funcionalidad a implementar en siguiente fase
    console.log('Módulo Recetas inicializado');
}

// ============================================
// MÓDULO: HISTORIAL
// ============================================

async function initHistorial() {
    // Funcionalidad a implementar en siguiente fase
    console.log('Módulo Historial inicializado');
}

// ============================================
// MÓDULO: CONFIGURACIÓN
// ============================================

async function initConfiguracion() {
    // Funcionalidad a implementar en siguiente fase
    console.log('Módulo Configuración inicializado');
}

// ============================================
// FUNCIONES AUXILIARES DE UI
// ============================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Cerrar modales al hacer clic fuera
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
        const modals = document.querySelectorAll('.fixed.inset-0');
        modals.forEach(modal => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
    }
});

console.log('✅ Modules.js cargado correctamente');
