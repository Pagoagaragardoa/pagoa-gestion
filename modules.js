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
    await loadMateriales('ingrediente');
    
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
    
    // Convertir a singular para la consulta
    const tipoSingular = tab === 'ingredientes' ? 'ingrediente' : 'envase';
    loadMateriales(tipoSingular);
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
        const tipo = document.getElementById('material-tipo').value; // Ya está en singular
        
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
        
        // Recargar con el tipo en SINGULAR (como está en la BD)
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
    await loadProductoTerminado();
    await loadEstilosFilterProducto();
    await loadEnvasesFilterProducto();
}

async function loadProductoTerminado() {
    try {
        const { data: productos, error } = await supabase
            .from('producto_terminado')
            .select('*')
            .order('fecha_envasado', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('producto-terminado-table-container');
        
        if (!productos || productos.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-beer text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg mb-4">No hay producto terminado registrado</p>
                    <p class="text-gray-600 text-sm">El producto terminado se genera automáticamente al confirmar operaciones de envasado</p>
                </div>
            `;
            
            // Resetear KPIs
            document.getElementById('total-lotes').textContent = '0';
            document.getElementById('total-unidades').textContent = '0';
            document.getElementById('stock-disponible').textContent = '0';
            document.getElementById('total-vendidas').textContent = '0';
            
            return;
        }
        
        // Calcular stock actual para cada producto
        const productosConStock = await Promise.all(productos.map(async (p) => {
            const { data: ventas } = await supabase
                .from('ventas')
                .select('cantidad')
                .eq('numero_lote', p.numero_lote)
                .eq('presentacion', p.tipo_envase);
            
            const totalVendido = ventas?.reduce((sum, v) => sum + parseInt(v.cantidad || 0), 0) || 0;
            const stockActual = parseInt(p.unidades_producidas) - totalVendido;
            
            // Calcular días hasta caducidad
            const hoy = new Date();
            const fechaCaducidad = new Date(p.fecha_caducidad);
            const diasHastaCaducidad = Math.ceil((fechaCaducidad - hoy) / (1000 * 60 * 60 * 24));
            
            return {
                ...p,
                stock_actual: stockActual,
                total_vendido: totalVendido,
                dias_hasta_caducidad: diasHastaCaducidad
            };
        }));
        
        // Calcular KPIs
        const totalLotes = productosConStock.length;
        const totalUnidades = productosConStock.reduce((sum, p) => sum + parseInt(p.unidades_producidas), 0);
        const stockDisponible = productosConStock.reduce((sum, p) => sum + p.stock_actual, 0);
        const totalVendidas = productosConStock.reduce((sum, p) => sum + p.total_vendido, 0);
        
        document.getElementById('total-lotes').textContent = totalLotes;
        document.getElementById('total-unidades').textContent = totalUnidades.toLocaleString();
        document.getElementById('stock-disponible').textContent = stockDisponible.toLocaleString();
        document.getElementById('total-vendidas').textContent = totalVendidas.toLocaleString();
        
        // Generar tabla
        let html = `
            <table class="min-w-full" id="tabla-producto-terminado">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estilo</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Envase</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producido</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendido</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">F. Envasado</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">F. Caducidad</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;
        
        productosConStock.forEach(p => {
            const fechaEnvasado = new Date(p.fecha_envasado).toLocaleDateString('es-ES');
            const fechaCaducidad = new Date(p.fecha_caducidad).toLocaleDateString('es-ES');
            
            // Determinar estado
            let estadoBadge = '';
            let estadoTexto = '';
            
            if (p.stock_actual === 0) {
                estadoBadge = 'bg-gray-100 text-gray-800';
                estadoTexto = 'Agotado';
            } else if (p.dias_hasta_caducidad <= 0) {
                estadoBadge = 'bg-red-100 text-red-800';
                estadoTexto = 'Caducado';
            } else if (p.dias_hasta_caducidad <= 30) {
                estadoBadge = 'bg-orange-100 text-orange-800';
                estadoTexto = `Caduca en ${p.dias_hasta_caducidad}d`;
            } else if (p.dias_hasta_caducidad <= 60) {
                estadoBadge = 'bg-yellow-100 text-yellow-800';
                estadoTexto = `Caduca en ${p.dias_hasta_caducidad}d`;
            } else {
                estadoBadge = 'bg-green-100 text-green-800';
                estadoTexto = 'Disponible';
            }
            
            const stockColor = p.stock_actual > 0 ? 'text-green-600 font-bold' : 'text-gray-400';
            
            html += `
                <tr class="hover:bg-gray-50" 
                    data-estilo="${p.estilo}" 
                    data-envase="${p.tipo_envase}" 
                    data-estado="${p.stock_actual > 0 ? 'disponible' : 'agotado'}"
                    data-dias-caducidad="${p.dias_hasta_caducidad}">
                    <td class="px-4 py-3 text-sm font-semibold text-gray-900">${p.numero_lote}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${p.estilo}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${p.tipo_envase}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${parseInt(p.unidades_producidas).toLocaleString()}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${p.total_vendido.toLocaleString()}</td>
                    <td class="px-4 py-3 text-sm ${stockColor}">${p.stock_actual.toLocaleString()}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${fechaEnvasado}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${fechaCaducidad}</td>
                    <td class="px-4 py-3 text-sm">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${estadoBadge}">
                            ${estadoTexto}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700">${p.ubicacion || '-'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando producto terminado:', error);
        document.getElementById('producto-terminado-table-container').innerHTML = 
            '<p class="text-red-600 text-center py-4">Error al cargar el inventario</p>';
    }
}

async function loadEstilosFilterProducto() {
    try {
        const { data, error } = await supabase
            .from('producto_terminado')
            .select('estilo');
        
        if (error) throw error;
        
        const estilos = [...new Set(data.map(p => p.estilo))].sort();
        const select = document.getElementById('filter-estilo-producto');
        
        if (select) {
            select.innerHTML = '<option value="">Todos los estilos</option>';
            estilos.forEach(estilo => {
                const option = document.createElement('option');
                option.value = estilo;
                option.textContent = estilo;
                select.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error cargando estilos:', error);
    }
}

async function loadEnvasesFilterProducto() {
    try {
        const { data, error } = await supabase
            .from('producto_terminado')
            .select('tipo_envase');
        
        if (error) throw error;
        
        const envases = [...new Set(data.map(p => p.tipo_envase))].sort();
        const select = document.getElementById('filter-envase-producto');
        
        if (select) {
            select.innerHTML = '<option value="">Todos los envases</option>';
            envases.forEach(envase => {
                const option = document.createElement('option');
                option.value = envase;
                option.textContent = envase;
                select.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error cargando envases:', error);
    }
}

function filterProductoTerminado() {
    const estiloFiltro = document.getElementById('filter-estilo-producto').value;
    const envaseFiltro = document.getElementById('filter-envase-producto').value;
    const estadoFiltro = document.getElementById('filter-estado-producto').value;
    
    const filas = document.querySelectorAll('#tabla-producto-terminado tbody tr');
    
    filas.forEach(fila => {
        let mostrar = true;
        
        // Filtro por estilo
        if (estiloFiltro && fila.dataset.estilo !== estiloFiltro) {
            mostrar = false;
        }
        
        // Filtro por envase
        if (envaseFiltro && fila.dataset.envase !== envaseFiltro) {
            mostrar = false;
        }
        
        // Filtro por estado
        if (estadoFiltro) {
            if (estadoFiltro === 'disponible' && fila.dataset.estado !== 'disponible') {
                mostrar = false;
            } else if (estadoFiltro === 'agotado' && fila.dataset.estado !== 'agotado') {
                mostrar = false;
            } else if (estadoFiltro === 'proximo-caducar') {
                const diasCaducidad = parseInt(fila.dataset.diasCaducidad);
                if (diasCaducidad > 60 || diasCaducidad <= 0) {
                    mostrar = false;
                }
            }
        }
        
        if (mostrar) {
            fila.classList.remove('hidden');
        } else {
            fila.classList.add('hidden');
        }
    });
}

// ============================================
// MÓDULO: VENTAS
// ============================================

// ============================================
// MÓDULO: VENTAS
// ============================================

async function initVentas() {
    // Establecer fecha de hoy por defecto
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('venta-fecha');
    if (fechaInput) {
        fechaInput.value = hoy;
    }
    
    await loadVentas();
    await loadVentasCharts();
    await loadLotesForVentas();
    await loadClientesForVentas();
    await loadEstilosFilterVentas();
    await loadMesesFilterVentas();
    
    // Evento submit del formulario
    const form = document.getElementById('venta-form');
    if (form) {
        form.addEventListener('submit', handleSaveVenta);
    }
}

async function loadVentas() {
    try {
        const { data: ventas, error } = await supabase
            .from('ventas')
            .select('*')
            .order('fecha', { ascending: false });
        
        if (error) throw error;
        
        // Calcular KPIs del mes actual
        const mesActual = new Date().getMonth() + 1;
        const añoActual = new Date().getFullYear();
        const primerDiaMes = new Date(añoActual, mesActual - 1, 1).toISOString().split('T')[0];
        const ultimoDiaMes = new Date(añoActual, mesActual, 0).toISOString().split('T')[0];
        
        const ventasMes = ventas?.filter(v => v.fecha >= primerDiaMes && v.fecha <= ultimoDiaMes) || [];
        
        const totalVentasMes = ventasMes.reduce((sum, v) => 
            sum + (parseFloat(v.cantidad || 0) * parseFloat(v.precio_unitario || 0)), 0);
        const totalUnidadesMes = ventasMes.reduce((sum, v) => sum + parseInt(v.cantidad || 0), 0);
        const precioMedio = totalUnidadesMes > 0 ? totalVentasMes / totalUnidadesMes : 0;
        const clientesUnicos = [...new Set(ventas?.map(v => v.cliente) || [])].length;
        
        document.getElementById('ventas-mes').textContent = totalVentasMes.toFixed(2) + ' €';
        document.getElementById('unidades-vendidas-mes').textContent = totalUnidadesMes.toLocaleString();
        document.getElementById('precio-medio').textContent = precioMedio.toFixed(2) + ' €';
        document.getElementById('total-clientes').textContent = clientesUnicos;
        
        // Generar tabla
        const container = document.getElementById('ventas-table-container');
        
        if (!ventas || ventas.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-cash-register text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg mb-4">No hay ventas registradas</p>
                    <button onclick="openAddVentaModal()" class="bg-pagoa-green text-white px-6 py-3 rounded-lg hover:bg-green-800 transition-colors">
                        <i class="fas fa-plus mr-2"></i>Registrar Primera Venta
                    </button>
                </div>
            `;
            return;
        }
        
        let html = `
            <table class="min-w-full" id="tabla-ventas">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estilo</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Presentación</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Canal</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;
        
        ventas.forEach(v => {
            const fecha = new Date(v.fecha).toLocaleDateString('es-ES');
            const total = parseFloat(v.cantidad || 0) * parseFloat(v.precio_unitario || 0);
            
            html += `
                <tr class="hover:bg-gray-50" 
                    data-canal="${v.canal}" 
                    data-estilo="${v.estilo}"
                    data-fecha="${v.fecha}">
                    <td class="px-4 py-3 text-sm text-gray-900">${fecha}</td>
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">${v.cliente}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${v.numero_lote}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${v.estilo}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${v.presentacion}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-gray-900">${parseInt(v.cantidad).toLocaleString()}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${parseFloat(v.precio_unitario).toFixed(2)} €</td>
                    <td class="px-4 py-3 text-sm font-bold text-green-600">${total.toFixed(2)} €</td>
                    <td class="px-4 py-3 text-sm">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${getCanalColor(v.canal)}">
                            ${v.canal}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-sm">
                        <button onclick="deleteVenta(${v.id})" class="text-red-600 hover:text-red-800" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando ventas:', error);
        document.getElementById('ventas-table-container').innerHTML = 
            '<p class="text-red-600 text-center py-4">Error al cargar ventas</p>';
    }
}

function getCanalColor(canal) {
    const colores = {
        'Hostelería': 'bg-blue-100 text-blue-800',
        'Tienda Online': 'bg-green-100 text-green-800',
        'Distribuidores': 'bg-purple-100 text-purple-800',
        'Eventos': 'bg-orange-100 text-orange-800',
        'Otro': 'bg-gray-100 text-gray-800'
    };
    return colores[canal] || 'bg-gray-100 text-gray-800';
}

async function loadVentasCharts() {
    try {
        const { data: ventas, error } = await supabase
            .from('ventas')
            .select('*');
        
        if (error) throw error;
        if (!ventas || ventas.length === 0) return;
        
        // Gráfico por Canal
        const ventasPorCanal = ventas.reduce((acc, v) => {
            const canal = v.canal || 'Otro';
            const total = parseFloat(v.cantidad || 0) * parseFloat(v.precio_unitario || 0);
            acc[canal] = (acc[canal] || 0) + total;
            return acc;
        }, {});
        
        const ctxCanal = document.getElementById('chart-ventas-canal');
        if (ctxCanal) {
            new Chart(ctxCanal, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(ventasPorCanal),
                    datasets: [{
                        data: Object.values(ventasPorCanal),
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(139, 92, 246, 0.8)',
                            'rgba(249, 115, 22, 0.8)',
                            'rgba(107, 114, 128, 0.8)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
        
        // Gráfico por Estilo
        const ventasPorEstilo = ventas.reduce((acc, v) => {
            const estilo = v.estilo;
            const total = parseFloat(v.cantidad || 0) * parseFloat(v.precio_unitario || 0);
            acc[estilo] = (acc[estilo] || 0) + total;
            return acc;
        }, {});
        
        const ctxEstilo = document.getElementById('chart-ventas-estilo');
        if (ctxEstilo) {
            new Chart(ctxEstilo, {
                type: 'bar',
                data: {
                    labels: Object.keys(ventasPorEstilo),
                    datasets: [{
                        label: 'Ventas (€)',
                        data: Object.values(ventasPorEstilo),
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
        console.error('Error cargando gráficos de ventas:', error);
    }
}

async function loadLotesForVentas() {
    try {
        const { data, error } = await supabase
            .from('producto_terminado')
            .select('*')
            .order('numero_lote', { ascending: true });
        
        if (error) throw error;
        
        // Calcular stock disponible para cada lote
        const lotesConStock = await Promise.all(data.map(async (lote) => {
            const { data: ventas } = await supabase
                .from('ventas')
                .select('cantidad')
                .eq('numero_lote', lote.numero_lote)
                .eq('presentacion', lote.tipo_envase);
            
            const totalVendido = ventas?.reduce((sum, v) => sum + parseInt(v.cantidad || 0), 0) || 0;
            const stockActual = parseInt(lote.unidades_producidas) - totalVendido;
            
            return {
                ...lote,
                stock_actual: stockActual
            };
        }));
        
        // Filtrar solo lotes con stock disponible
        const lotesDisponibles = lotesConStock.filter(l => l.stock_actual > 0);
        
        const select = document.getElementById('venta-lote');
        if (select) {
            select.innerHTML = '<option value="">Seleccione un lote...</option>';
            lotesDisponibles.forEach(lote => {
                const option = document.createElement('option');
                option.value = lote.numero_lote;
                option.textContent = `${lote.numero_lote} - ${lote.estilo} (${lote.stock_actual} disponibles)`;
                option.dataset.estilo = lote.estilo;
                option.dataset.envase = lote.tipo_envase;
                option.dataset.stock = lote.stock_actual;
                select.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error cargando lotes:', error);
    }
}

async function loadClientesForVentas() {
    try {
        const { data, error } = await supabase
            .from('ventas')
            .select('cliente');
        
        if (error) throw error;
        
        const clientes = [...new Set(data.map(v => v.cliente))].sort();
        const datalist = document.getElementById('clientes-datalist');
        
        if (datalist) {
            datalist.innerHTML = '';
            clientes.forEach(cliente => {
                const option = document.createElement('option');
                option.value = cliente;
                datalist.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error cargando clientes:', error);
    }
}

async function loadEstilosFilterVentas() {
    try {
        const { data, error } = await supabase
            .from('ventas')
            .select('estilo');
        
        if (error) throw error;
        
        const estilos = [...new Set(data.map(v => v.estilo))].sort();
        const select = document.getElementById('filter-estilo-ventas');
        
        if (select) {
            select.innerHTML = '<option value="">Todos los estilos</option>';
            estilos.forEach(estilo => {
                const option = document.createElement('option');
                option.value = estilo;
                option.textContent = estilo;
                select.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error cargando estilos:', error);
    }
}

async function loadMesesFilterVentas() {
    const select = document.getElementById('filter-mes-ventas');
    if (!select) return;
    
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const añoActual = new Date().getFullYear();
    
    for (let i = 0; i < 12; i++) {
        const option = document.createElement('option');
        option.value = `${añoActual}-${String(i + 1).padStart(2, '0')}`;
        option.textContent = `${meses[i]} ${añoActual}`;
        select.appendChild(option);
    }
}

function updateVentaLoteInfo() {
    const select = document.getElementById('venta-lote');
    const selectedOption = select.options[select.selectedIndex];
    
    if (selectedOption.value) {
        const estilo = selectedOption.dataset.estilo;
        const envase = selectedOption.dataset.envase;
        const stock = selectedOption.dataset.stock;
        
        document.getElementById('info-estilo').textContent = estilo;
        document.getElementById('info-stock').textContent = stock;
        document.getElementById('info-lote').style.display = 'block';
        
        // Actualizar presentaciones disponibles
        const presentacionSelect = document.getElementById('venta-presentacion');
        presentacionSelect.innerHTML = <option value="${envase}">${envase}</option>;
        presentacionSelect.value = envase;
        
 // Actualizar campo oculto de estilo
        const cantidadInput = document.getElementById('venta-cantidad');
        cantidadInput.max = stock;
        cantidadInput.placeholder = `Máximo ${stock}`;
    } else {
        document.getElementById('info-lote').style.display = 'none';
        document.getElementById('venta-presentacion').innerHTML = '<option value="">Seleccione presentación...</option>';
    }
}
function updateStockDisponible() {
// Ya gestionado en updateVentaLoteInfo
}
function calculateTotalVenta() {
const cantidad = parseFloat(document.getElementById('venta-cantidad').value) || 0;
const precio = parseFloat(document.getElementById('venta-precio').value) || 0;
const total = cantidad * precio;
document.getElementById('total-venta').textContent = total.toFixed(2) + ' €';
}
function openAddVentaModal() {
document.getElementById('venta-modal-title').textContent = 'Registrar Venta';
document.getElementById('venta-form').reset();
document.getElementById('venta-id').value = '';
const hoy = new Date().toISOString().split('T')[0];
document.getElementById('venta-fecha').value = hoy;

document.getElementById('info-lote').style.display = 'none';
document.getElementById('total-venta').textContent = '0.00 €';

openModal('venta-modal');
}
async function handleSaveVenta(e) {
e.preventDefault();
try {
    const select = document.getElementById('venta-lote');
    const selectedOption = select.options[select.selectedIndex];
    const estilo = selectedOption.dataset.estilo;
    const stock = parseInt(selectedOption.dataset.stock);
    const cantidad = parseInt(document.getElementById('venta-cantidad').value);
    
    // Verificar stock suficiente
    if (cantidad > stock) {
        alert(`Stock insuficiente. Solo hay ${stock} unidades disponibles.`);
        return;
    }
    
    const ventaData = {
        fecha: document.getElementById('venta-fecha').value,
        numero_lote: document.getElementById('venta-lote').value,
        cliente: document.getElementById('venta-cliente').value,
        estilo: estilo,
        presentacion: document.getElementById('venta-presentacion').value,
        cantidad: cantidad,
        tipo_caja: document.getElementById('venta-tipo-caja').value || null,
        precio_unitario: parseFloat(document.getElementById('venta-precio').value),
        canal: document.getElementById('venta-canal').value,
        created_by: currentUser.id
    };
    
    const { error } = await supabase
        .from('ventas')
        .insert([ventaData]);
    
    if (error) throw error;
    
    alert('✅ Venta registrada correctamente');
    
    closeModal('venta-modal');
    await loadVentas();
    await loadVentasCharts();
    
    // Actualizar dashboard si está visible
    if (currentView === 'dashboard') {
        initDashboard();
    }
    
    // Actualizar producto terminado si está visible
    if (currentView === 'producto-terminado') {
        initProductoTerminado();
    }
    
} catch (error) {
    console.error('Error guardando venta:', error);
    alert('Error al registrar la venta: ' + error.message);
}
}
async function deleteVenta(id) {
if (!confirm('¿Está seguro de eliminar esta venta?')) {
return;
}
try {
    const { error } = await supabase
        .from('ventas')
        .delete()
        .eq('id', id);
    
    if (error) throw error;
    
    alert('Venta eliminada correctamente');
    await loadVentas();
    await loadVentasCharts();
    
} catch (error) {
    console.error('Error eliminando venta:', error);
    alert('Error al eliminar la venta');
}
}
function filterVentas() {
const canalFiltro = document.getElementById('filter-canal-ventas').value;
const estiloFiltro = document.getElementById('filter-estilo-ventas').value;
const mesFiltro = document.getElementById('filter-mes-ventas').value;
const filas = document.querySelectorAll('#tabla-ventas tbody tr');

filas.forEach(fila => {
    let mostrar = true;
    
    if (canalFiltro && fila.dataset.canal !== canalFiltro) {
        mostrar = false;
    }
    
    if (estiloFiltro && fila.dataset.estilo !== estiloFiltro) {
        mostrar = false;
    }
    
    if (mesFiltro) {
        const fechaFila = fila.dataset.fecha;
        if (!fechaFila.startsWith(mesFiltro)) {
            mostrar = false;
        }
    }
    
    if (mostrar) {
        fila.classList.remove('hidden');
    } else {
        fila.classList.add('hidden');
    }
});
// ============================================
// MÓDULO: COSTOS Y ANÁLISIS
// ============================================

async function initCostos() {
    // Establecer mes y año actual por defecto
    const mesActual = new Date().getMonth() + 1;
    const añoActual = new Date().getFullYear();
    
    const mesSelect = document.getElementById('costos-mes');
    const añoSelect = document.getElementById('costos-año');
    
    if (mesSelect) mesSelect.value = mesActual;
    if (añoSelect) añoSelect.value = añoActual;
    
    await loadCostos();
    await loadEvolucionFinanciera();
    
    // Evento para calcular total en formulario de costos fijos
    const inputs = ['costo-alquiler', 'costo-servicios', 'costo-salarios', 'costo-seguros', 'costo-mantenimiento'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', calculateTotalCostosFijos);
        }
    });
    
    // Evento submit del formulario
    const form = document.getElementById('costos-fijos-form');
    if (form) {
        form.addEventListener('submit', handleSaveCostosFijos);
    }
}

async function loadCostos() {
    try {
        const mes = parseInt(document.getElementById('costos-mes').value);
        const año = parseInt(document.getElementById('costos-año').value);
        const primerDia = new Date(año, mes - 1, 1).toISOString().split('T')[0];
        const ultimoDia = new Date(año, mes, 0).toISOString().split('T')[0];
        
        // Cargar ventas del período
        const { data: ventas, error: ventasError } = await supabase
            .from('ventas')
            .select('*')
            .gte('fecha', primerDia)
            .lte('fecha', ultimoDia);
        
        if (ventasError) throw ventasError;
        
        const totalIngresos = ventas?.reduce((sum, v) => 
            sum + (parseFloat(v.cantidad || 0) * parseFloat(v.precio_unitario || 0)), 0) || 0;
        
        // Cargar costos variables (producción)
        const { data: produccion, error: produccionError } = await supabase
            .from('produccion')
            .select('costo')
            .eq('confirmado', true)
            .gte('fecha', primerDia)
            .lte('fecha', ultimoDia);
        
        if (produccionError) throw produccionError;
        
        const totalCostosVariables = produccion?.reduce((sum, p) => 
            sum + parseFloat(p.costo || 0), 0) || 0;
        
        // Cargar costos fijos
        const { data: costosFijos, error: costosError } = await supabase
            .from('costos_fijos')
            .select('*')
            .eq('mes', mes)
            .eq('año', año);
        
        if (costosError) throw costosError;
        
        const totalCostosFijos = costosFijos?.reduce((sum, c) => 
            sum + parseFloat(c.monto || 0), 0) || 0;
        
        // Calcular márgenes
        const margenBruto = totalIngresos - totalCostosVariables;
        const margenNeto = margenBruto - totalCostosFijos;
        const porcentajeMargenBruto = totalIngresos > 0 ? (margenBruto / totalIngresos * 100) : 0;
        const porcentajeMargenNeto = totalIngresos > 0 ? (margenNeto / totalIngresos * 100) : 0;
        
        // Punto de equilibrio (costos fijos / margen de contribución %)
        const margenContribucion = totalIngresos > 0 ? (margenBruto / totalIngresos) : 0;
        const puntoEquilibrio = margenContribucion > 0 ? (totalCostosFijos / margenContribucion) : 0;
        
        // Actualizar KPIs principales
        document.getElementById('total-ingresos').textContent = totalIngresos.toFixed(2) + ' €';
        document.getElementById('total-costos-variables').textContent = totalCostosVariables.toFixed(2) + ' €';
        document.getElementById('total-costos-fijos').textContent = totalCostosFijos.toFixed(2) + ' €';
        
        const margenNetoEl = document.getElementById('margen-neto');
        margenNetoEl.textContent = margenNeto.toFixed(2) + ' €';
        margenNetoEl.className = `text-3xl font-bold ${margenNeto >= 0 ? 'text-green-600' : 'text-red-600'}`;
        
        // Actualizar desglose
        document.getElementById('desglose-ingresos').textContent = totalIngresos.toFixed(2) + ' €';
        document.getElementById('desglose-variables').textContent = totalCostosVariables.toFixed(2) + ' €';
        document.getElementById('desglose-fijos').textContent = totalCostosFijos.toFixed(2) + ' €';
        document.getElementById('desglose-margen-bruto').textContent = margenBruto.toFixed(2) + ' €';
        document.getElementById('desglose-margen-neto').textContent = margenNeto.toFixed(2) + ' €';
        document.getElementById('desglose-margen-bruto-pct').textContent = porcentajeMargenBruto.toFixed(1) + '%';
        document.getElementById('desglose-margen-neto-pct').textContent = porcentajeMargenNeto.toFixed(1) + '%';
        document.getElementById('punto-equilibrio').textContent = puntoEquilibrio.toFixed(2) + ' €';
        
        // Cargar tabla de costos fijos
        await loadCostosFijosTable(mes, año, costosFijos);
        
        // Cargar análisis por producto
        await loadAnalisisProductos(ventas, mes, año);
        
    } catch (error) {
        console.error('Error cargando costos:', error);
    }
}

async function loadCostosFijosTable(mes, año, costosFijos) {
    const container = document.getElementById('costos-fijos-table');
    
    const conceptos = [
        'Alquiler nave',
        'Servicios (luz, agua, gas)',
        'Salarios',
        'Seguros',
        'Mantenimiento'
    ];
    
    let html = '<div class="space-y-2">';
    let total = 0;
    
    conceptos.forEach(concepto => {
        const costo = costosFijos?.find(c => c.concepto === concepto);
        const monto = costo ? parseFloat(costo.monto) : 0;
        total += monto;
        
        html += `
            <div class="flex justify-between items-center py-2 border-b">
                <span class="text-sm text-gray-700">${concepto}</span>
                <span class="font-semibold text-gray-900">${monto.toFixed(2)} €</span>
            </div>
        `;
    });
    
    html += `
        <div class="flex justify-between items-center py-3 bg-red-50 px-3 rounded-lg mt-3">
            <span class="font-bold text-gray-800">TOTAL</span>
            <span class="text-xl font-bold text-red-600">${total.toFixed(2)} €</span>
        </div>
    `;
    
    html += '</div>';
    container.innerHTML = html;
}

async function loadAnalisisProductos(ventas, mes, año) {
    try {
        if (!ventas || ventas.length === 0) {
            document.getElementById('analisis-productos-table').innerHTML = 
                '<p class="text-gray-500 text-center py-4">No hay ventas en este período</p>';
            return;
        }
        
        const primerDia = new Date(año, mes - 1, 1).toISOString().split('T')[0];
        const ultimoDia = new Date(año, mes, 0).toISOString().split('T')[0];
        
        // Agrupar ventas por estilo
        const ventasPorEstilo = ventas.reduce((acc, v) => {
            const estilo = v.estilo;
            if (!acc[estilo]) {
                acc[estilo] = {
                    unidades: 0,
                    ingresos: 0
                };
            }
            acc[estilo].unidades += parseInt(v.cantidad || 0);
            acc[estilo].ingresos += parseFloat(v.cantidad || 0) * parseFloat(v.precio_unitario || 0);
            return acc;
        }, {});
        
        // Obtener costos de producción por estilo
        const { data: produccion } = await supabase
            .from('produccion')
            .select('*')
            .eq('confirmado', true)
            .gte('fecha', primerDia)
            .lte('fecha', ultimoDia);
        
        const costosPorEstilo = produccion?.reduce((acc, p) => {
            const estilo = p.estilo_cerveza;
            if (!acc[estilo]) {
                acc[estilo] = 0;
            }
            acc[estilo] += parseFloat(p.costo || 0);
            return acc;
        }, {}) || {};
        
        // Calcular total de ingresos
        const totalIngresos = Object.values(ventasPorEstilo).reduce((sum, v) => sum + v.ingresos, 0);
        
        // Generar tabla
        let html = `
            <table class="min-w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estilo</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidades</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costos Prod.</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margen</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Total</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
        `;
        
        Object.keys(ventasPorEstilo).sort().forEach(estilo => {
            const datos = ventasPorEstilo[estilo];
            const costos = costosPorEstilo[estilo] || 0;
            const margen = datos.ingresos - costos;
            const porcentaje = totalIngresos > 0 ? (datos.ingresos / totalIngresos * 100) : 0;
            const margenColor = margen >= 0 ? 'text-green-600' : 'text-red-600';
            
            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">${estilo}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${datos.unidades.toLocaleString()}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-gray-900">${datos.ingresos.toFixed(2)} €</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${costos.toFixed(2)} €</td>
                    <td class="px-4 py-3 text-sm font-bold ${margenColor}">${margen.toFixed(2)} €</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${porcentaje.toFixed(1)}%</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        document.getElementById('analisis-productos-table').innerHTML = html;
        
    } catch (error) {
        console.error('Error en análisis por producto:', error);
    }
}

async function loadEvolucionFinanciera() {
    try {
        const meses = [];
        const dataIngresos = [];
        const dataCostos = [];
        const dataMargen = [];
        
        const añoActual = new Date().getFullYear();
        
        for (let i = 5; i >= 0; i--) {
            const fecha = new Date();
            fecha.setMonth(fecha.getMonth() - i);
            const mes = fecha.getMonth() + 1;
            const año = fecha.getFullYear();
            const primerDia = new Date(año, mes - 1, 1).toISOString().split('T')[0];
            const ultimoDia = new Date(año, mes, 0).toISOString().split('T')[0];
            
            meses.push(fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }));
            
            // Ventas
            const { data: ventas } = await supabase
                .from('ventas')
                .select('cantidad, precio_unitario')
                .gte('fecha', primerDia)
                .lte('fecha', ultimoDia);
            
            const ingresos = ventas?.reduce((sum, v) => 
                sum + (parseFloat(v.cantidad || 0) * parseFloat(v.precio_unitario || 0)), 0) || 0;
            
            // Costos variables
            const { data: produccion } = await supabase
                .from('produccion')
                .select('costo')
                .eq('confirmado', true)
                .gte('fecha', primerDia)
                .lte('fecha', ultimoDia);
            
            const costosVar = produccion?.reduce((sum, p) => 
                sum + parseFloat(p.costo || 0), 0) || 0;
            
            // Costos fijos
            const { data: costosFijos } = await supabase
                .from('costos_fijos')
                .select('monto')
                .eq('mes', mes)
                .eq('año', año);
            
            const costosFij = costosFijos?.reduce((sum, c) => 
                sum + parseFloat(c.monto || 0), 0) || 0;
            
            const costosTotales = costosVar + costosFij;
            const margen = ingresos - costosTotales;
            
            dataIngresos.push(ingresos);
            dataCostos.push(costosTotales);
            dataMargen.push(margen);
}

    const ctx = document.getElementById('chart-evolucion-financiera');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: meses,
                datasets: [
                    {
                        label: 'Ingresos',
                        data: dataIngresos,
                        borderColor: 'rgba(16, 185, 129, 1)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Costos Totales',
                        data: dataCostos,
                        borderColor: 'rgba(239, 68, 68, 1)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Margen Neto',
                        data: dataMargen,
                        borderColor: 'rgba(139, 92, 246, 1)',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
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
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
} catch (error) {
    console.error('Error cargando evolución financiera:', error);
}
}

async function openEditCostosFijosModal() {
const mes = parseInt(document.getElementById('costos-mes').value);
const año = parseInt(document.getElementById('costos-año').value);

const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

document.getElementById('periodo-costos-fijos').textContent = `${mesesNombres[mes - 1]} ${año}`;

try {
    const { data: costosFijos } = await supabase
        .from('costos_fijos')
        .select('*')
        .eq('mes', mes)
        .eq('año', año);
    
    const getCosto = (concepto) => {
        const costo = costosFijos?.find(c => c.concepto === concepto);
        return costo ? parseFloat(costo.monto) : 0;
    };
    
    document.getElementById('costo-alquiler').value = getCosto('Alquiler nave');
    document.getElementById('costo-servicios').value = getCosto('Servicios (luz, agua, gas)');
    document.getElementById('costo-salarios').value = getCosto('Salarios');
    document.getElementById('costo-seguros').value = getCosto('Seguros');
    document.getElementById('costo-mantenimiento').value = getCosto('Mantenimiento');
    
    calculateTotalCostosFijos();
    
} catch (error) {
    console.error('Error cargando costos fijos:', error);
}

openModal('costos-fijos-modal');
}

function calculateTotalCostosFijos() {
const alquiler = parseFloat(document.getElementById('costo-alquiler').value) || 0;
const servicios = parseFloat(document.getElementById('costo-servicios').value) || 0;
const salarios = parseFloat(document.getElementById('costo-salarios').value) || 0;
const seguros = parseFloat(document.getElementById('costo-seguros').value) || 0;
const mantenimiento = parseFloat(document.getElementById('costo-mantenimiento').value) || 0;

const total = alquiler + servicios + salarios + seguros + mantenimiento;
document.getElementById('total-costos-fijos-form').textContent = total.toFixed(2) + ' €';
}

async function handleSaveCostosFijos(e) {
e.preventDefault();

try {
    const mes = parseInt(document.getElementById('costos-mes').value);
    const año = parseInt(document.getElementById('costos-año').value);
    
    const costosFijos = [
        { concepto: 'Alquiler nave', monto: parseFloat(document.getElementById('costo-alquiler').value) },
        { concepto: 'Servicios (luz, agua, gas)', monto: parseFloat(document.getElementById('costo-servicios').value) },
        { concepto: 'Salarios', monto: parseFloat(document.getElementById('costo-salarios').value) },
        { concepto: 'Seguros', monto: parseFloat(document.getElementById('costo-seguros').value) },
        { concepto: 'Mantenimiento', monto: parseFloat(document.getElementById('costo-mantenimiento').value) }
    ];
    
    // Eliminar registros existentes
    await supabase
        .from('costos_fijos')
        .delete()
        .eq('mes', mes)
        .eq('año', año);
    
    // Insertar nuevos
    const registros = costosFijos.map(c => ({
        concepto: c.concepto,
        monto: c.monto,
        mes: mes,
        año: año
    }));
    
    const { error } = await supabase
        .from('costos_fijos')
        .insert(registros);
    
    if (error) throw error;
    
    alert('✅ Costos fijos actualizados correctamente');
    
    closeModal('costos-fijos-modal');
    await loadCostos();
    await loadEvolucionFinanciera();
    
    // Actualizar dashboard si está visible
    if (currentView === 'dashboard') {
        initDashboard();
    }
    
} catch (error) {
    console.error('Error guardando costos fijos:', error);
    alert('Error al guardar los costos fijos: ' + error.message);
}
}

function exportarReporteMensual() {
alert('📄 Función de exportación a PDF:\n\nEsta característica requiere una librería adicional (jsPDF).\n\nPara implementarla, necesitarías:\n1. Añadir la librería jsPDF al index.html\n2. Generar el PDF con los datos del período seleccionado\n\nPor ahora, puedes:\n- Imprimir esta página (Ctrl+P)\n- Hacer capturas de pantalla\n- Copiar los datos manualmente');
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
