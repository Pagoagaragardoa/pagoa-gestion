// ============================================
// PAGOA CERVECERÍA - APLICACIÓN PRINCIPAL
// ============================================
// ============================================
// INICIALIZAR SUPABASE
// ============================================

// Inicializar cliente de Supabase (usar variable global única)
var supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
    console.log('🟢 Cliente Supabase inicializado correctamente');
} catch (error) {
    console.error('❌ Error inicializando Supabase:', error);
}

// ============================================
// Variables globales
let currentUser = null;
let currentView = 'dashboard';

// ============================================
// SISTEMA DE AUTENTICACIÓN
// ============================================

// Verificar sesión al cargar la página
async function checkSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            currentUser = session.user;
            await loadUserProfile();
            showMainApp();
        } else {
            showLoginScreen();
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
        showLoginScreen();
    }
}

// Cargar perfil del usuario
async function loadUserProfile() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (error && error.code === 'PGRST116') {
            // Perfil no existe, crear uno nuevo
            await createUserProfile();
        } else if (data) {
            // Actualizar UI con datos del usuario
            document.getElementById('user-email').textContent = data.email;
        }
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

// Crear perfil de usuario
async function createUserProfile() {
    try {
        const { error } = await supabase
            .from('profiles')
            .insert([
                {
                    id: currentUser.id,
                    email: currentUser.email,
                    nombre_completo: currentUser.user_metadata?.nombre_completo || ''
                }
            ]);
        
        if (error) throw error;
        console.log('✅ Perfil de usuario creado');
    } catch (error) {
        console.error('Error creando perfil:', error);
    }
}

// Login
async function handleLogin(email, password) {
    try {
        showLoading('login');
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        await loadUserProfile();
        showMainApp();
        showMessage('auth-message', 'success', '¡Bienvenido!');
        
    } catch (error) {
        console.error('Error en login:', error);
        let errorMsg = 'Error al iniciar sesión';
        
        if (error.message.includes('Invalid login credentials')) {
            errorMsg = 'Email o contraseña incorrectos';
        } else if (error.message.includes('Email not confirmed')) {
            errorMsg = 'Por favor confirma tu email antes de iniciar sesión';
        }
        
        showMessage('auth-message', 'error', errorMsg);
    } finally {
        hideLoading('login');
    }
}

// Registro
async function handleRegister(name, email, password) {
    try {
        showLoading('register');
        
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nombre_completo: name
                }
            }
        });
        
        if (error) throw error;
        
        // Supabase ahora inicia sesión automáticamente después del registro
        if (data.user) {
            showMessage('register-message', 'success', 
                '¡Cuenta creada exitosamente! Redirigiendo...');
            
            setTimeout(() => {
                currentUser = data.user;
                loadUserProfile();
                showMainApp();
            }, 1500);
        }
        
    } catch (error) {
        console.error('Error en registro:', error);
        let errorMsg = 'Error al crear la cuenta';
        
        if (error.message.includes('already registered')) {
            errorMsg = 'Este email ya está registrado';
        } else if (error.message.includes('Password should be')) {
            errorMsg = 'La contraseña debe tener al menos 6 caracteres';
        }
        
        showMessage('register-message', 'error', errorMsg);
    } finally {
        hideLoading('register');
    }
}

// Logout
async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        showLoginScreen();
        console.log('✅ Sesión cerrada');
        
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión');
    }
}

// ============================================
// FUNCIONES DE UI - PANTALLAS
// ============================================

function showLoginScreen() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('register-screen').classList.add('hidden');
    document.getElementById('main-app').classList.add('hidden');
}

function showRegisterScreen() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('register-screen').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('register-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    // Cargar vista por defecto
    loadView('dashboard');
}

// ============================================
// FUNCIONES DE UI - HELPERS
// ============================================

function showLoading(type) {
    document.getElementById(`${type}-btn-text`).classList.add('hidden');
    document.getElementById(`${type}-loading`).classList.remove('hidden');
}

function hideLoading(type) {
    document.getElementById(`${type}-btn-text`).classList.remove('hidden');
    document.getElementById(`${type}-loading`).classList.add('hidden');
}

function showMessage(elementId, type, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `mt-4 p-3 rounded-lg ${
        type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-300' 
            : 'bg-red-100 text-red-800 border border-red-300'
    }`;
    element.classList.remove('hidden');
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}

// ============================================
// SISTEMA DE NAVEGACIÓN Y VISTAS
// ============================================

function loadView(viewName) {
    currentView = viewName;
    const contentArea = document.getElementById('content-area');
    
    // Actualizar menú activo
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-green-100', 'text-pagoa-green', 'font-bold');
        if (link.dataset.view === viewName) {
            link.classList.add('bg-green-100', 'text-pagoa-green', 'font-bold');
        }
    });
    
    // Cargar contenido según la vista
    switch(viewName) {
        case 'dashboard':
            contentArea.innerHTML = getDashboardHTML();
            initDashboard();
            break;
        case 'materias-primas':
            contentArea.innerHTML = getMateriasPrimasHTML();
            initMateriasPrimas();
            break;
        case 'produccion':
            contentArea.innerHTML = function getProduccionHTML() {
    return `
        <div class="fade-in">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-gray-800">
                    <i class="fas fa-industry text-pagoa-green mr-3"></i>Producción
                </h1>
                <button onclick="openAddProduccionModal()" class="bg-pagoa-green text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors">
                    <i class="fas fa-plus mr-2"></i>Nueva Operación
                </button>
            </div>
            
            <!-- Tabs: Operaciones / Resumen de Lotes -->
            <div class="bg-white rounded-lg card-shadow mb-6">
                <div class="flex border-b">
                    <button onclick="switchProduccionTab('operaciones')" 
                            id="tab-operaciones"
                            class="px-6 py-3 font-semibold text-pagoa-green border-b-2 border-pagoa-green">
                        <i class="fas fa-list mr-2"></i>Operaciones
                    </button>
                    <button onclick="switchProduccionTab('lotes')" 
                            id="tab-lotes"
                            class="px-6 py-3 font-semibold text-gray-600 hover:text-pagoa-green">
                        <i class="fas fa-clipboard-list mr-2"></i>Resumen de Lotes
                    </button>
                </div>
                
                <div class="p-6">
                    <!-- Filtros -->
                    <div class="flex flex-wrap gap-4 mb-6">
                        <div>
                            <label class="block text-xs text-gray-600 mb-1">Tipo de Operación</label>
                            <select id="filter-tipo-operacion" onchange="filterProduccion()" class="px-3 py-2 border rounded-lg text-sm">
                                <option value="">Todas</option>
                                <option value="Elaboración de mosto">Elaboración de mosto</option>
                                <option value="Envasado">Envasado</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-xs text-gray-600 mb-1">Estado</label>
                            <select id="filter-estado" onchange="filterProduccion()" class="px-3 py-2 border rounded-lg text-sm">
                                <option value="">Todos</option>
                                <option value="true">Confirmados</option>
                                <option value="false">Pendientes</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-xs text-gray-600 mb-1">Mes</label>
                            <select id="filter-mes" onchange="filterProduccion()" class="px-3 py-2 border rounded-lg text-sm">
                                <option value="">Todos</option>
                            </select>
                        </div>
                        
                        <div class="flex items-end">
                            <button onclick="loadProduccionOperaciones()" class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-sm transition-colors">
                                <i class="fas fa-sync-alt mr-2"></i>Actualizar
                            </button>
                        </div>
                    </div>
                    
                    <!-- Contenido de tabs -->
                    <div id="produccion-operaciones-content">
                        <p class="text-gray-500 text-center py-8">Cargando operaciones...</p>
                    </div>
                    
                    <div id="produccion-lotes-content" class="hidden">
                        <p class="text-gray-500 text-center py-8">Cargando lotes...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal para nueva operación -->
        <div id="produccion-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
            <div class="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h3 class="text-2xl font-bold mb-4" id="produccion-modal-title">Nueva Operación de Producción</h3>
                
                <form id="produccion-form" class="space-y-4">
                    <input type="hidden" id="produccion-id">
                    
                    <!-- Fecha -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fecha *</label>
                        <input type="date" 
                               id="produccion-fecha" 
                               required 
                               class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                    </div>
                    
                    <!-- Tipo de Operación -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Operación *</label>
                        <select id="produccion-tipo" required onchange="updateProduccionForm()" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                            <option value="">Seleccione...</option>
                            <option value="Elaboración de mosto">Elaboración de mosto</option>
                            <option value="Envasado">Envasado</option>
                        </select>
                    </div>
                    
                    <!-- Número de Lote -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Número de Lote *</label>
                            <input type="text" 
                                   id="produccion-lote" 
                                   required 
                                   placeholder="Ej: L001"
                                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                        </div>
                        
                        <!-- Estilo -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Estilo de Cerveza *</label>
                            <input type="text" 
                                   id="produccion-estilo" 
                                   required 
                                   list="estilos-produccion-datalist"
                                   onchange="loadRecetaForEstilo()"
                                   placeholder="Ej: IPA"
                                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                            <datalist id="estilos-produccion-datalist"></datalist>
                        </div>
                    </div>
                    
                    <!-- Volumen -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Volumen (Litros) *</label>
                        <input type="number" 
                               step="0.01" 
                               id="produccion-volumen" 
                               required 
                               onchange="calculateCostoProduccion()"
                               placeholder="100.00"
                               class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                    </div>
                    
                    <!-- Campos específicos para Envasado -->
                    <div id="envasado-fields" class="hidden space-y-4">
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Envase</label>
                                <select id="produccion-envase" class="w-full px-4 py-2 border rounded-lg">
                                    <option value="">Seleccione...</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Chapa/Tapa</label>
                                <select id="produccion-chapa" class="w-full px-4 py-2 border rounded-lg">
                                    <option value="">Seleccione...</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Etiqueta/Vitola</label>
                                <select id="produccion-etiqueta" class="w-full px-4 py-2 border rounded-lg">
                                    <option value="">Seleccione...</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Ubicación -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
                        <input type="text" 
                               id="produccion-ubicacion" 
                               placeholder="Ej: Tanque 1, Cámara 2..."
                               class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    
                    <!-- Costo estimado -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-gray-600">Costo Estimado de Materiales</p>
                                <p class="text-xs text-gray-500 mt-1">Calculado según receta y volumen</p>
                            </div>
                            <p class="text-2xl font-bold text-blue-600" id="costo-estimado">0.00 €</p>
                        </div>
                    </div>
                    
                    <!-- Materiales que se descontarán -->
                    <div id="materiales-descuento" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hidden">
                        <h4 class="font-semibold text-gray-800 mb-2 flex items-center">
                            <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                            Materiales que se descontarán del inventario:
                        </h4>
                        <div id="lista-materiales-descuento" class="text-sm text-gray-700"></div>
                    </div>
                    
                    <div class="flex space-x-3 mt-6">
                        <button type="submit" class="flex-1 bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition-colors font-semibold">
                            <i class="fas fa-save mr-2"></i>Guardar (Sin Confirmar)
                        </button>
                        <button type="button" onclick="closeModal('produccion-modal')" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Modal de confirmación de operación -->
        <div id="confirmar-operacion-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
            <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <h3 class="text-2xl font-bold mb-4 text-red-600">
                    <i class="fas fa-exclamation-triangle mr-2"></i>Confirmar Operación
                </h3>
                
                <div class="mb-6">
                    <p class="text-gray-700 mb-4">¿Está seguro de confirmar esta operación?</p>
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p class="text-sm text-red-800 font-semibold mb-2">Esta acción:</p>
                        <ul class="text-sm text-red-700 list-disc list-inside space-y-1">
                            <li>Descontará materiales del inventario</li>
                            <li>Registrará la operación en el historial</li>
                            <li>NO podrá editarse después</li>
                        </ul>
                    </div>
                </div>
                
                <input type="hidden" id="confirmar-operacion-id">
                
                <div class="flex space-x-3">
                    <button onclick="confirmarOperacion()" class="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold">
                        <i class="fas fa-check mr-2"></i>Sí, Confirmar
                    </button>
                    <button onclick="closeModal('confirmar-operacion-modal')" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
};
            // ============================================
// MÓDULO: PRODUCCIÓN
// ============================================

let currentProduccionTab = 'operaciones';
let recetaActual = null;

async function initProduccion() {
    // Establecer fecha de hoy por defecto
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('produccion-fecha');
    if (fechaInput) {
        fechaInput.value = hoy;
    }
    
    await loadProduccionOperaciones();
    await loadMesesForFilter();
    await loadEstilosForProduccion();
    await loadEnvasesForProduccion();
    
    // Evento submit del formulario
    const form = document.getElementById('produccion-form');
    if (form) {
        form.addEventListener('submit', handleSaveProduccion);
    }
}

function switchProduccionTab(tab) {
    currentProduccionTab = tab;
    
    // Actualizar UI de tabs
    document.getElementById('tab-operaciones').className = 
        tab === 'operaciones' 
        ? 'px-6 py-3 font-semibold text-pagoa-green border-b-2 border-pagoa-green'
        : 'px-6 py-3 font-semibold text-gray-600 hover:text-pagoa-green';
    
    document.getElementById('tab-lotes').className = 
        tab === 'lotes' 
        ? 'px-6 py-3 font-semibold text-pagoa-green border-b-2 border-pagoa-green'
        : 'px-6 py-3 font-semibold text-gray-600 hover:text-pagoa-green';
    
    // Mostrar/ocultar contenido
    if (tab === 'operaciones') {
        document.getElementById('produccion-operaciones-content').classList.remove('hidden');
        document.getElementById('produccion-lotes-content').classList.add('hidden');
        loadProduccionOperaciones();
    } else {
        document.getElementById('produccion-operaciones-content').classList.add('hidden');
        document.getElementById('produccion-lotes-content').classList.remove('hidden');
        loadProduccionLotes();
    }
}

async function loadProduccionOperaciones() {
    try {
        const { data, error } = await supabase
            .from('produccion')
            .select('*')
            .order('fecha', { ascending: false })
            .order('id', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('produccion-operaciones-content');
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-industry text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg mb-4">No hay operaciones registradas</p>
                    <button onclick="openAddProduccionModal()" class="bg-pagoa-green text-white px-6 py-3 rounded-lg hover:bg-green-800 transition-colors">
                        <i class="fas fa-plus mr-2"></i>Registrar Primera Operación
                    </button>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="overflow-x-auto">
                <table class="min-w-full" id="tabla-produccion">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estilo</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volumen (L)</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo (€)</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
        `;
        
        data.forEach(op => {
            const fecha = new Date(op.fecha).toLocaleDateString('es-ES');
            const confirmado = op.confirmado;
            const estadoBadge = confirmado 
                ? '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"><i class="fas fa-check mr-1"></i>Confirmado</span>'
                : '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800"><i class="fas fa-clock mr-1"></i>Pendiente</span>';
            
            const tipoIcon = op.tipo_operacion === 'Elaboración de mosto' 
                ? '<i class="fas fa-flask text-green-600 mr-1"></i>' 
                : '<i class="fas fa-box text-blue-600 mr-1"></i>';
            
            html += `
                <tr class="hover:bg-gray-50" data-tipo="${op.tipo_operacion}" data-confirmado="${confirmado}" data-fecha="${op.fecha}">
                    <td class="px-4 py-3 text-sm text-gray-900">${fecha}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${tipoIcon}${op.tipo_operacion}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-gray-900">${op.numero_lote}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${op.estilo_cerveza}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-gray-900">${parseFloat(op.volumen_litros).toFixed(2)}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${parseFloat(op.costo || 0).toFixed(2)}</td>
                    <td class="px-4 py-3 text-sm">${estadoBadge}</td>
                    <td class="px-4 py-3 text-sm">
                        ${!confirmado ? `
                            <button onclick="openConfirmarOperacionModal(${op.id})" 
                                    class="text-green-600 hover:text-green-800 mr-3" 
                                    title="Confirmar operación">
                                <i class="fas fa-check-circle"></i>
                            </button>
                            <button onclick="deleteProduccion(${op.id})" 
                                    class="text-red-600 hover:text-red-800" 
                                    title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : `
                            <button onclick="viewProduccionDetails(${op.id})" 
                                    class="text-blue-600 hover:text-blue-800" 
                                    title="Ver detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                        `}
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando operaciones:', error);
        document.getElementById('produccion-operaciones-content').innerHTML = 
            '<p class="text-red-600 text-center py-4">Error al cargar operaciones</p>';
    }
}

async function loadProduccionLotes() {
    try {
        const { data, error } = await supabase
            .from('produccion')
            .select('*')
            .eq('confirmado', true)
            .order('numero_lote', { ascending: true });
        
        if (error) throw error;
        
        const container = document.getElementById('produccion-lotes-content');
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-clipboard-list text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">No hay lotes confirmados</p>
                </div>
            `;
            return;
        }
        
        // Agrupar por lote
        const lotes = data.reduce((acc, op) => {
            if (!acc[op.numero_lote]) {
                acc[op.numero_lote] = {
                    lote: op.numero_lote,
                    estilo: op.estilo_cerveza,
                    elaborado: 0,
                    envasado: 0,
                    operaciones: []
                };
            }
            
            acc[op.numero_lote].operaciones.push(op);
            
            if (op.tipo_operacion === 'Elaboración de mosto') {
                acc[op.numero_lote].elaborado += parseFloat(op.volumen_litros);
            } else if (op.tipo_operacion === 'Envasado') {
                acc[op.numero_lote].envasado += parseFloat(op.volumen_litros);
            }
            
            return acc;
        }, {});
        
        let html = `
            <div class="space-y-4">
        `;
        
        Object.values(lotes).forEach(lote => {
            const mermas = lote.elaborado - lote.envasado;
            const disponible = lote.elaborado - lote.envasado;
            const porcentajeMerma = lote.elaborado > 0 ? ((mermas / lote.elaborado) * 100).toFixed(1) : 0;
            
            let estadoLote = '';
            if (lote.envasado === 0) {
                estadoLote = '<span class="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">En Fermentación</span>';
            } else if (disponible > 0) {
                estadoLote = '<span class="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">Parcialmente Envasado</span>';
            } else {
                estadoLote = '<span class="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">Completamente Envasado</span>';
            }
            
            html += `
                <div class="bg-white rounded-lg card-shadow p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="text-xl font-bold text-gray-900">${lote.lote}</h3>
                            <p class="text-gray-600">${lote.estilo}</p>
                        </div>
                        ${estadoLote}
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <p class="text-xs text-gray-600 mb-1">Vol. Elaborado</p>
                            <p class="text-xl font-bold text-blue-600">${lote.elaborado.toFixed(2)} L</p>
                        </div>
                        
                        <div class="bg-green-50 p-4 rounded-lg">
                            <p class="text-xs text-gray-600 mb-1">Vol. Envasado</p>
                            <p class="text-xl font-bold text-green-600">${lote.envasado.toFixed(2)} L</p>
                        </div>
                        
                        <div class="bg-orange-50 p-4 rounded-lg">
                            <p class="text-xs text-gray-600 mb-1">Mermas</p>
                            <p class="text-xl font-bold text-orange-600">${mermas.toFixed(2)} L</p>
                            <p class="text-xs text-gray-500">(${porcentajeMerma}%)</p>
                        </div>
                        
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <p class="text-xs text-gray-600 mb-1">Disponible</p>
                            <p class="text-xl font-bold text-purple-600">${disponible.toFixed(2)} L</p>
                        </div>
                    </div>
                    
                    <details class="text-sm">
                        <summary class="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
                            Ver ${lote.operaciones.length} operación(es)
                        </summary>
                        <div class="mt-3 space-y-2">
                            ${lote.operaciones.map(op => `
                                <div class="bg-gray-50 p-3 rounded">
                                    <span class="font-medium">${new Date(op.fecha).toLocaleDateString('es-ES')}</span> - 
                                    ${op.tipo_operacion}: ${parseFloat(op.volumen_litros).toFixed(2)} L
                                    (${parseFloat(op.costo || 0).toFixed(2)} €)
                                </div>
                            `).join('')}
                        </div>
                    </details>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando lotes:', error);
        document.getElementById('produccion-lotes-content').innerHTML = 
            '<p class="text-red-600 text-center py-4">Error al cargar lotes</p>';
    }
}

async function loadMesesForFilter() {
    const select = document.getElementById('filter-mes');
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

async function loadEstilosForProduccion() {
    try {
        const { data, error } = await supabase
            .from('recetas')
            .select('estilo');
        
        if (error) throw error;
        
        const estilos = [...new Set(data.map(r => r.estilo))].sort();
        const datalist = document.getElementById('estilos-produccion-datalist');
        
        if (datalist) {
            datalist.innerHTML = '';
            estilos.forEach(estilo => {
                const option = document.createElement('option');
                option.value = estilo;
                datalist.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error cargando estilos:', error);
    }
}

async function loadEnvasesForProduccion() {
    try {
        const { data, error } = await supabase
            .from('materias_primas')
            .select('material')
            .eq('tipo', 'envase')
            .order('material', { ascending: true });
        
        if (error) throw error;
        
        const selects = ['produccion-envase', 'produccion-chapa', 'produccion-etiqueta'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Seleccione...</option>';
                data.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.material;
                    option.textContent = item.material;
                    select.appendChild(option);
                });
            }
        });
        
    } catch (error) {
        console.error('Error cargando envases:', error);
    }
}

function updateProduccionForm() {
    const tipo = document.getElementById('produccion-tipo').value;
    const envasadoFields = document.getElementById('envasado-fields');
    
    if (tipo === 'Envasado') {
        envasadoFields.classList.remove('hidden');
    } else {
        envasadoFields.classList.add('hidden');
    }
}

async function loadRecetaForEstilo() {
    const estilo = document.getElementById('produccion-estilo').value;
    const tipo = document.getElementById('produccion-tipo').value;
    
    if (!estilo || !tipo) return;
    
    try {
        const { data, error } = await supabase
            .from('recetas')
            .select('*')
            .eq('estilo', estilo)
            .eq('tipo_operacion', tipo);
        
        if (error) throw error;
        
        recetaActual = data;
        calculateCostoProduccion();
        
    } catch (error) {
        console.error('Error cargando receta:', error);
        recetaActual = null;
    }
}

async function calculateCostoProduccion() {
    const volumen = parseFloat(document.getElementById('produccion-volumen').value) || 0;
    const estilo = document.getElementById('produccion-estilo').value;
    const tipo = document.getElementById('produccion-tipo').value;
    
    if (volumen === 0 || !estilo || !tipo) {
        document.getElementById('costo-estimado').textContent = '0.00 €';
        document.getElementById('materiales-descuento').classList.add('hidden');
        return;
    }
    
    // Cargar receta si no está cargada
    if (!recetaActual) {
        await loadRecetaForEstilo();
    }
    
    if (!recetaActual || recetaActual.length === 0) {
        document.getElementById('costo-estimado').textContent = 'Sin receta';
        document.getElementById('materiales-descuento').classList.add('hidden');
        return;
    }
    
    // Calcular costo y materiales
    let costoTotal = 0;
    let materialesHtml = '<ul class="list-disc list-inside space-y-1">';
    let hayStockInsuficiente = false;
    
    for (const item of recetaActual) {
        const cantidadNecesaria = (parseFloat(item.cantidad_por_100l) * volumen) / 100;
        
        // Obtener información del material
        const { data: material } = await supabase
            .from('materias_primas')
            .select('*')
            .eq('material', item.ingrediente)
            .single();
        
        if (material) {
            const costoItem = cantidadNecesaria * parseFloat(material.costo_unitario);
            costoTotal += costoItem;
            
            const stockActual = parseFloat(material.stock);
            const stockSuficiente = stockActual >= cantidadNecesaria;
            
            if (!stockSuficiente) {
                hayStockInsuficiente = true;
            }
            
            const colorClass = stockSuficiente ? 'text-green-700' : 'text-red-700 font-bold';
            const icon = stockSuficiente ? '✓' : '⚠️';
            
            materialesHtml += `
                <li class="${colorClass}">
                    ${icon} ${item.ingrediente}: ${cantidadNecesaria.toFixed(2)} ${item.unidad}
                    (Stock actual: ${stockActual.toFixed(2)} ${item.unidad})
                    - ${costoItem.toFixed(2)} €
                </li>
            `;
        }
    }
    
    materialesHtml += '</ul>';
    
    if (hayStockInsuficiente) {
        materialesHtml += '<p class="text-red-700 font-bold mt-3"><i class="fas fa-exclamation-triangle mr-2"></i>ADVERTENCIA: Stock insuficiente para algunos materiales</p>';
    }
    
    document.getElementById('costo-estimado').textContent = costoTotal.toFixed(2) + ' €';
    document.getElementById('lista-materiales-descuento').innerHTML = materialesHtml;
    document.getElementById('materiales-descuento').classList.remove('hidden');
}

function openAddProduccionModal() {
    document.getElementById('produccion-modal-title').textContent = 'Nueva Operación de Producción';
    document.getElementById('produccion-form').reset();
    document.getElementById('produccion-id').value = '';
    
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('produccion-fecha').value = hoy;
    
    document.getElementById('envasado-fields').classList.add('hidden');
    document.getElementById('materiales-descuento').classList.add('hidden');
    document.getElementById('costo-estimado').textContent = '0.00 €';
    
    recetaActual = null;
    
    openModal('produccion-modal');
}

async function handleSaveProduccion(e) {
    e.preventDefault();
    
    try {
        const tipo = document.getElementById('produccion-tipo').value;
        const volumen = parseFloat(document.getElementById('produccion-volumen').value);
        const estilo = document.getElementById('produccion-estilo').value;
        
        // Verificar que hay receta
        if (!recetaActual || recetaActual.length === 0) {
            if (!confirm('No hay receta definida para este estilo y operación. ¿Desea continuar de todos modos? (No se descontará inventario)')) {
                return;
            }
        }
        
        // Verificar stock suficiente
        if (recetaActual && recetaActual.length > 0) {
            for (const item of recetaActual) {
                const cantidadNecesaria = (parseFloat(item.cantidad_por_100l) * volumen) / 100;
                
                const { data: material } = await supabase
                    .from('materias_primas')
                    .select('stock')
                    .eq('material', item.ingrediente)
                    .single();
                
                if (material && parseFloat(material.stock) < cantidadNecesaria) {
                    if (!confirm(`ADVERTENCIA: Stock insuficiente de "${item.ingrediente}". ¿Desea continuar de todos modos?`)) {
                        return;
                    }
                }
            }
        }
        
        const produccionData = {
            fecha: document.getElementById('produccion-fecha').value,
            tipo_operacion: tipo,
            numero_lote: document.getElementById('produccion-lote').value,
            estilo_cerveza: estilo,
            volumen_litros: volumen,
            ubicacion: document.getElementById('produccion-ubicacion').value || null,
            costo: parseFloat(document.getElementById('costo-estimado').textContent) || 0,
            confirmado: false,
            created_by: currentUser.id
        };
        
        // Campos específicos de envasado
        if (tipo === 'Envasado') {
            produccionData.tipo_envase = document.getElementById('produccion-envase').value || null;
            produccionData.tipo_chapa_tapa = document.getElementById('produccion-chapa').value || null;
            produccionData.tipo_etiqueta_vitola = document.getElementById('produccion-etiqueta').value || null;
        }
        
        const { data, error } = await supabase
            .from('produccion')
            .insert([produccionData])
            .select();
        
        if (error) throw error;
        
        alert('Operación guardada correctamente (sin confirmar). Recuerde confirmarla para descontar inventario.');
        
        closeModal('produccion-modal');
        loadProduccionOperaciones();
        
    } catch (error) {
        console.error('Error guardando producción:', error);
        alert('Error al guardar la operación: ' + error.message);
    }
}

function openConfirmarOperacionModal(id) {
    document.getElementById('confirmar-operacion-id').value = id;
    openModal('confirmar-operacion-modal');
}

async function confirmarOperacion() {
    const id = document.getElementById('confirmar-operacion-id').value;
    
    try {
        // Obtener datos de la operación
        const { data: operacion, error: fetchError } = await supabase
            .from('produccion')
            .select('*')
            .eq('id', id)
            .single();
        
        if (fetchError) throw fetchError;
        
        // Cargar receta
        const { data: receta, error: recetaError } = await supabase
            .from('recetas')
            .select('*')
            .eq('estilo', operacion.estilo_cerveza)
            .eq('tipo_operacion', operacion.tipo_operacion);
        
        if (recetaError) throw recetaError;
        
        // Descontar materiales del inventario
        if (receta && receta.length > 0) {
            for (const item of receta) {
                const cantidadNecesaria = (parseFloat(item.cantidad_por_100l) * parseFloat(operacion.volumen_litros)) / 100;
                
                // Obtener material actual
                const { data: material, error: materialError } = await supabase
                    .from('materias_primas')
                    .select('*')
                    .eq('material', item.ingrediente)
                    .single();
                
                if (materialError) {
                    console.error('Error obteniendo material:', materialError);
                    continue;
                }
                
                // Calcular nuevo stock
                const nuevoStock = parseFloat(material.stock) - cantidadNecesaria;
                
                // Actualizar stock
                const { error: updateError } = await supabase
                    .from('materias_primas')
                    .update({ stock: Math.max(0, nuevoStock) })
                    .eq('id', material.id);
                
                if (updateError) throw updateError;
                
                // Registrar en historial
                await supabase
                    .from('historial')
                    .insert([{
                        tipo_operacion: operacion.tipo_operacion,
                        numero_lote: operacion.numero_lote,
                        estilo: operacion.estilo_cerveza,
                        volumen_litros: operacion.volumen_litros,
                        material_afectado: item.ingrediente,
                        cantidad_descontada: cantidadNecesaria,
                        estado: 'ACTIVO',
                        detalles: {
                            produccion_id: operacion.id,
                            stock_anterior: parseFloat(material.stock),
                            stock_nuevo: nuevoStock
                        },
                        created_by: currentUser.id
                    }]);
            }
        }
        
        // Si es envasado, crear registro en producto_terminado
        if (operacion.tipo_operacion === 'Envasado' && operacion.tipo_envase) {
            // Calcular unidades según capacidad del envase
            const { data: envase } = await supabase
                .from('materias_primas')
                .select('capacidad_litros')
                .eq('material', operacion.tipo_envase)
                .single();
            
            let unidades = 0;
            if (envase && envase.capacidad_litros) {
                unidades = Math.floor(parseFloat(operacion.volumen_litros) / parseFloat(envase.capacidad_litros));
            }
            
            // Calcular fecha de caducidad (6 meses por defecto para cerveza artesanal)
            const fechaEnvasado = new Date(operacion.fecha);
            const fechaCaducidad = new Date(fechaEnvasado);
            fechaCaducidad.setMonth(fechaCaducidad.getMonth() + 6);
            
            await supabase
                .from('producto_terminado')
                .insert([{
                    numero_lote: operacion.numero_lote,
                    estilo: operacion.estilo_cerveza,
                    tipo_envase: operacion.tipo_envase,
                    unidades_producidas: unidades,
                    fecha_envasado: operacion.fecha,
                    fecha_caducidad: fechaCaducidad.toISOString().split('T')[0],
                    ubicacion: operacion.ubicacion
                }]);
        }
        
        // Marcar operación como confirmada
        const { error: confirmError } = await supabase
            .from('produccion')
            .update({ confirmado: true })
            .eq('id', id);
        
        if (confirmError) throw confirmError;
        
        alert('✅ Operación confirmada exitosamente. Inventario actualizado.');
        
        closeModal('confirmar-operacion-modal');
        loadProduccionOperaciones();
        
        // Actualizar dashboard si está visible
        if (currentView === 'dashboard') {
            initDashboard();
        }
        
    } catch (error) {
        console.error('Error confirmando operación:', error);
        alert('Error al confirmar la operación: ' + error.message);
    }
}

async function deleteProduccion(id) {
    if (!confirm('¿Está seguro de eliminar esta operación? Solo se pueden eliminar operaciones NO confirmadas.')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('produccion')
            .delete()
            .eq('id', id)
            .eq('confirmado', false);
        
        if (error) throw error;
        
        alert('Operación eliminada correctamente');
        loadProduccionOperaciones();
        
    } catch (error) {
        console.error('Error eliminando operación:', error);
        alert('Error al eliminar la operación. Solo se pueden eliminar operaciones NO confirmadas.');
    }
}

async function viewProduccionDetails(id) {
    try {
        const { data, error } = await supabase
            .from('produccion')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        let detalles = `
            <strong>Fecha:</strong> ${new Date(data.fecha).toLocaleDateString('es-ES')}<br>
            <strong>Tipo:</strong> ${data.tipo_operacion}<br>
            <strong>Lote:</strong> ${data.numero_lote}<br>
            <strong>Estilo:</strong> ${data.estilo_cerveza}<br>
            <strong>Volumen:</strong> ${parseFloat(data.volumen_litros).toFixed(2)} L<br>
            <strong>Costo:</strong> ${parseFloat(data.costo || 0).toFixed(2)} €<br>
            <strong>Ubicación:</strong> ${data.ubicacion || 'N/A'}<br>
        `;
        
        if (data.tipo_operacion === 'Envasado') {
            detalles += `
                <strong>Envase:</strong> ${data.tipo_envase || 'N/A'}<br>
                <strong>Chapa/Tapa:</strong> ${data.tipo_chapa_tapa || 'N/A'}<br>
                <strong>Etiqueta:</strong> ${data.tipo_etiqueta_vitola || 'N/A'}<br>
            `;
        }
        
        alert(detalles);
        
    } catch (error) {
        console.error('Error cargando detalles:', error);
        alert('Error al cargar los detalles');
    }
}

function filterProduccion() {
    const tipoFiltro = document.getElementById('filter-tipo-operacion').value;
    const estadoFiltro = document.getElementById('filter-estado').value;
    const mesFiltro = document.getElementById('filter-mes').value;
    
    const filas = document.querySelectorAll('#tabla-produccion tbody tr');
    
    filas.forEach(fila => {
        let mostrar = true;
        
        // Filtro por tipo
        if (tipoFiltro && fila.dataset.tipo !== tipoFiltro) {
            mostrar = false;
        }
        
        // Filtro por estado
        if (estadoFiltro && fila.dataset.confirmado !== estadoFiltro) {
            mostrar = false;
        }
        
        // Filtro por mes
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
}
            break;
        case 'producto-terminado':
            contentArea.innerHTML = getProductoTerminadoHTML();
            initProductoTerminado();
            break;
        case 'ventas':
            contentArea.innerHTML = getVentasHTML();
            initVentas();
            break;
        case 'costos':
            contentArea.innerHTML = getCostosHTML();
            initCostos();
            break;
        case 'recetas':
            contentArea.innerHTML = function getRecetasHTML() {
    return `
        <div class="fade-in">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-gray-800">
                    <i class="fas fa-book text-pagoa-green mr-3"></i>Recetas
                </h1>
                <button onclick="openAddRecetaModal()" class="bg-pagoa-green text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors">
                    <i class="fas fa-plus mr-2"></i>Nueva Receta
                </button>
            </div>
            
            <!-- Selector de Estilo -->
            <div class="bg-white p-6 rounded-lg card-shadow mb-6">
                <div class="flex items-center space-x-4">
                    <label class="text-sm font-medium text-gray-700">Filtrar por Estilo:</label>
                    <select id="filter-estilo-recetas" onchange="filterRecetasByEstilo()" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600">
                        <option value="">Todos los estilos</option>
                    </select>
                    <button onclick="loadRecetas()" class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition-colors">
                        <i class="fas fa-sync-alt mr-2"></i>Actualizar
                    </button>
                </div>
            </div>
            
            <!-- Lista de Recetas por Estilo -->
            <div id="recetas-container">
                <p class="text-gray-500 text-center py-8">Cargando recetas...</p>
            </div>
        </div>
        
        <!-- Modal para añadir/editar receta -->
        <div id="receta-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
            <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h3 class="text-2xl font-bold mb-4" id="receta-modal-title">Nueva Receta</h3>
                
                <form id="receta-form" class="space-y-4">
                    <input type="hidden" id="receta-id">
                    
                    <!-- Estilo de Cerveza -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Estilo de Cerveza *</label>
                        <input type="text" 
                               id="receta-estilo" 
                               required 
                               list="estilos-datalist"
                               placeholder="Ej: IPA, Stout, Lager..."
                               class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                        <datalist id="estilos-datalist">
                            <option value="IPA">
                            <option value="Pale Ale">
                            <option value="Stout">
                            <option value="Porter">
                            <option value="Lager">
                            <option value="Pilsner">
                            <option value="Wheat Beer">
                            <option value="Belgian Ale">
                            <option value="Amber Ale">
                            <option value="Brown Ale">
                        </datalist>
                    </div>
                    
                    <!-- Tipo de Operación -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Operación *</label>
                        <select id="receta-tipo-operacion" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                            <option value="Elaboración de mosto">Elaboración de mosto</option>
                            <option value="Envasado">Envasado</option>
                        </select>
                    </div>
                    
                    <!-- Ingrediente -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Ingrediente/Material *</label>
                        <select id="receta-ingrediente" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                            <option value="">Seleccione un material...</option>
                        </select>
                        <p class="text-xs text-gray-500 mt-1">Si no aparece, añádalo primero en Materias Primas</p>
                    </div>
                    
                    <!-- Cantidad por 100L -->
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Cantidad por 100L *</label>
                            <input type="number" 
                                   step="0.01" 
                                   id="receta-cantidad" 
                                   required 
                                   placeholder="0.00"
                                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Unidad *</label>
                            <input type="text" 
                                   id="receta-unidad" 
                                   required 
                                   readonly
                                   placeholder="kg"
                                   class="w-full px-4 py-2 border rounded-lg bg-gray-100">
                        </div>
                    </div>
                    
                    <div class="flex space-x-3 mt-6">
                        <button type="submit" class="flex-1 bg-pagoa-green text-white py-2 rounded-lg hover:bg-green-800 transition-colors">
                            <i class="fas fa-save mr-2"></i>Guardar
                        </button>
                        <button type="button" onclick="closeModal('receta-modal')" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
};
       // ============================================
// MÓDULO: RECETAS
// ============================================

async function initRecetas() {
    await loadRecetas();
    await loadEstilosForFilter();
    await loadIngredientesForReceta();
    
    // Evento para cambiar unidad según ingrediente seleccionado
    const ingredienteSelect = document.getElementById('receta-ingrediente');
    if (ingredienteSelect) {
        ingredienteSelect.addEventListener('change', async (e) => {
            const materialId = e.target.value;
            if (materialId) {
                const { data } = await supabase
                    .from('materias_primas')
                    .select('unidad')
                    .eq('id', materialId)
                    .single();
                
                if (data) {
                    document.getElementById('receta-unidad').value = data.unidad;
                }
            }
        });
    }
    
    // Evento submit del formulario
    const form = document.getElementById('receta-form');
    if (form) {
        form.addEventListener('submit', handleSaveReceta);
    }
}

async function loadRecetas() {
    try {
        const { data, error } = await supabase
            .from('recetas')
            .select('*')
            .order('estilo', { ascending: true })
            .order('tipo_operacion', { ascending: true });
        
        if (error) throw error;
        
        const container = document.getElementById('recetas-container');
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="bg-white p-8 rounded-lg card-shadow text-center">
                    <i class="fas fa-book-open text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg mb-4">No hay recetas registradas</p>
                    <button onclick="openAddRecetaModal()" class="bg-pagoa-green text-white px-6 py-3 rounded-lg hover:bg-green-800 transition-colors">
                        <i class="fas fa-plus mr-2"></i>Crear Primera Receta
                    </button>
                </div>
            `;
            return;
        }
        
        // Agrupar por estilo
        const recetasPorEstilo = data.reduce((acc, receta) => {
            if (!acc[receta.estilo]) {
                acc[receta.estilo] = {
                    'Elaboración de mosto': [],
                    'Envasado': []
                };
            }
            acc[receta.estilo][receta.tipo_operacion].push(receta);
            return acc;
        }, {});
        
        let html = '';
        
        Object.keys(recetasPorEstilo).sort().forEach(estilo => {
            html += `
                <div class="bg-white rounded-lg card-shadow mb-6 estilo-receta" data-estilo="${estilo}">
                    <div class="bg-pagoa-dark text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
                        <h2 class="text-xl font-bold">
                            <i class="fas fa-beer mr-2"></i>${estilo}
                        </h2>
                        <button onclick="deleteEstiloCompleto('${estilo}')" class="text-red-400 hover:text-red-300 transition-colors">
                            <i class="fas fa-trash mr-2"></i>Eliminar estilo completo
                        </button>
                    </div>
                    
                    <div class="p-6">
            `;
            
            // Elaboración de mosto
            if (recetasPorEstilo[estilo]['Elaboración de mosto'].length > 0) {
                html += `
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                            <i class="fas fa-flask text-green-600 mr-2"></i>
                            Elaboración de Mosto
                        </h3>
                        <div class="overflow-x-auto">
                            <table class="min-w-full">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ingrediente</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad por 100L</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                `;
                
                recetasPorEstilo[estilo]['Elaboración de mosto'].forEach(receta => {
                    html += `
                        <tr class="hover:bg-gray-50">
                            <td class="px-4 py-3 text-sm text-gray-900">${receta.ingrediente}</td>
                            <td class="px-4 py-3 text-sm font-semibold text-gray-900">${parseFloat(receta.cantidad_por_100l).toFixed(2)}</td>
                            <td class="px-4 py-3 text-sm text-gray-700">${receta.unidad}</td>
                            <td class="px-4 py-3 text-sm">
                                <button onclick="editReceta(${receta.id})" class="text-blue-600 hover:text-blue-800 mr-3">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteReceta(${receta.id})" class="text-red-600 hover:text-red-800">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
            
            // Envasado
            if (recetasPorEstilo[estilo]['Envasado'].length > 0) {
                html += `
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                            <i class="fas fa-box text-blue-600 mr-2"></i>
                            Envasado
                        </h3>
                        <div class="overflow-x-auto">
                            <table class="min-w-full">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad por 100L</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                `;
                
                recetasPorEstilo[estilo]['Envasado'].forEach(receta => {
                    html += `
                        <tr class="hover:bg-gray-50">
                            <td class="px-4 py-3 text-sm text-gray-900">${receta.ingrediente}</td>
                            <td class="px-4 py-3 text-sm font-semibold text-gray-900">${parseFloat(receta.cantidad_por_100l).toFixed(2)}</td>
                            <td class="px-4 py-3 text-sm text-gray-700">${receta.unidad}</td>
                            <td class="px-4 py-3 text-sm">
                                <button onclick="editReceta(${receta.id})" class="text-blue-600 hover:text-blue-800 mr-3">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteReceta(${receta.id})" class="text-red-600 hover:text-red-800">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando recetas:', error);
        document.getElementById('recetas-container').innerHTML = 
            '<p class="text-red-600 text-center py-4">Error al cargar recetas</p>';
    }
}

async function loadEstilosForFilter() {
    try {
        const { data, error } = await supabase
            .from('recetas')
            .select('estilo');
        
        if (error) throw error;
        
        const estilos = [...new Set(data.map(r => r.estilo))].sort();
        const select = document.getElementById('filter-estilo-recetas');
        
        if (select) {
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

async function loadIngredientesForReceta() {
    try {
        const { data, error } = await supabase
            .from('materias_primas')
            .select('id, material, tipo, unidad')
            .order('material', { ascending: true });
        
        if (error) throw error;
        
        const select = document.getElementById('receta-ingrediente');
        if (select) {
            // Limpiar opciones existentes excepto la primera
            select.innerHTML = '<option value="">Seleccione un material...</option>';
            
            // Agrupar por tipo
            const ingredientes = data.filter(m => m.tipo === 'ingrediente');
            const envases = data.filter(m => m.tipo === 'envase');
            
            if (ingredientes.length > 0) {
                const optgroupIng = document.createElement('optgroup');
                optgroupIng.label = '📦 Ingredientes';
                ingredientes.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.id;
                    option.textContent = `${item.material} (${item.unidad})`;
                    option.dataset.unidad = item.unidad;
                    optgroupIng.appendChild(option);
                });
                select.appendChild(optgroupIng);
            }
            
            if (envases.length > 0) {
                const optgroupEnv = document.createElement('optgroup');
                optgroupEnv.label = '🍾 Envases';
                envases.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.id;
                    option.textContent = `${item.material} (${item.unidad})`;
                    option.dataset.unidad = item.unidad;
                    optgroupEnv.appendChild(option);
                });
                select.appendChild(optgroupEnv);
            }
        }
        
    } catch (error) {
        console.error('Error cargando ingredientes:', error);
    }
}

function filterRecetasByEstilo() {
    const filtro = document.getElementById('filter-estilo-recetas').value;
    const estilos = document.querySelectorAll('.estilo-receta');
    
    estilos.forEach(estilo => {
        if (filtro === '' || estilo.dataset.estilo === filtro) {
            estilo.classList.remove('hidden');
        } else {
            estilo.classList.add('hidden');
        }
    });
}

function openAddRecetaModal() {
    document.getElementById('receta-modal-title').textContent = 'Nueva Receta';
    document.getElementById('receta-form').reset();
    document.getElementById('receta-id').value = '';
    openModal('receta-modal');
}

async function editReceta(id) {
    try {
        const { data, error } = await supabase
            .from('recetas')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Buscar el ID del material por su nombre
        const { data: material } = await supabase
            .from('materias_primas')
            .select('id')
            .eq('material', data.ingrediente)
            .single();
        
        document.getElementById('receta-modal-title').textContent = 'Editar Receta';
        document.getElementById('receta-id').value = data.id;
        document.getElementById('receta-estilo').value = data.estilo;
        document.getElementById('receta-tipo-operacion').value = data.tipo_operacion;
        document.getElementById('receta-ingrediente').value = material?.id || '';
        document.getElementById('receta-cantidad').value = data.cantidad_por_100l;
        document.getElementById('receta-unidad').value = data.unidad;
        
        openModal('receta-modal');
        
    } catch (error) {
        console.error('Error cargando receta:', error);
        alert('Error al cargar la receta');
    }
}

async function handleSaveReceta(e) {
    e.preventDefault();
    
    try {
        const id = document.getElementById('receta-id').value;
        const ingredienteId = document.getElementById('receta-ingrediente').value;
        
        // Obtener nombre del ingrediente
        const { data: material } = await supabase
            .from('materias_primas')
            .select('material')
            .eq('id', ingredienteId)
            .single();
        
        const recetaData = {
            estilo: document.getElementById('receta-estilo').value,
            tipo_operacion: document.getElementById('receta-tipo-operacion').value,
            ingrediente: material.material,
            cantidad_por_100l: parseFloat(document.getElementById('receta-cantidad').value),
            unidad: document.getElementById('receta-unidad').value
        };
        
        if (id) {
            // Actualizar
            const { error } = await supabase
                .from('recetas')
                .update(recetaData)
                .eq('id', id);
            
            if (error) throw error;
            alert('Receta actualizada correctamente');
        } else {
            // Insertar
            const { error } = await supabase
                .from('recetas')
                .insert([recetaData]);
            
            if (error) throw error;
            alert('Receta añadida correctamente');
        }
        
        closeModal('receta-modal');
        await loadRecetas();
        await loadEstilosForFilter();
        
    } catch (error) {
        console.error('Error guardando receta:', error);
        alert('Error al guardar la receta: ' + error.message);
    }
}

async function deleteReceta(id) {
    if (!confirm('¿Está seguro de eliminar esta receta?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('recetas')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        alert('Receta eliminada correctamente');
        await loadRecetas();
        await loadEstilosForFilter();
        
    } catch (error) {
        console.error('Error eliminando receta:', error);
        alert('Error al eliminar la receta');
    }
}

async function deleteEstiloCompleto(estilo) {
    if (!confirm(`¿Está seguro de eliminar TODAS las recetas del estilo "${estilo}"? Esta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('recetas')
            .delete()
            .eq('estilo', estilo);
        
        if (error) throw error;
        
        alert(`Todas las recetas de "${estilo}" han sido eliminadas`);
        await loadRecetas();
        await loadEstilosForFilter();
        
    } catch (error) {
        console.error('Error eliminando estilo:', error);
        alert('Error al eliminar el estilo');
    }
};
            break;
        case 'historial':
            contentArea.innerHTML = getHistorialHTML();
            initHistorial();
            break;
        case 'configuracion':
            contentArea.innerHTML = getConfiguracionHTML();
            initConfiguracion();
            break;
        default:
            contentArea.innerHTML = '<div class="text-center p-8"><h2 class="text-2xl text-gray-600">Vista no encontrada</h2></div>';
    }
}

// ============================================
// FUNCIONES HTML DE VISTAS (Placeholder)
// ============================================

function getDashboardHTML() {
    return `
        <div class="fade-in">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-gray-800">
                    <i class="fas fa-chart-line text-pagoa-green mr-3"></i>Dashboard
                </h1>
                <button onclick="refreshDashboard()" class="bg-pagoa-green text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors">
                    <i class="fas fa-sync-alt mr-2"></i>Actualizar
                </button>
            </div>
            
            <!-- KPIs del Mes -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white p-6 rounded-lg card-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">Producción del Mes</p>
                            <p class="text-2xl font-bold text-pagoa-green" id="kpi-produccion">0 L</p>
                        </div>
                        <i class="fas fa-industry text-4xl text-green-200"></i>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg card-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">Ventas Totales</p>
                            <p class="text-2xl font-bold text-blue-600" id="kpi-ventas">0 €</p>
                        </div>
                        <i class="fas fa-euro-sign text-4xl text-blue-200"></i>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg card-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">Margen Bruto</p>
                            <p class="text-2xl font-bold text-purple-600" id="kpi-margen-bruto">0 €</p>
                        </div>
                        <i class="fas fa-chart-pie text-4xl text-purple-200"></i>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg card-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">Margen Neto</p>
                            <p class="text-2xl font-bold text-orange-600" id="kpi-margen-neto">0 €</p>
                        </div>
                        <i class="fas fa-money-bill-wave text-4xl text-orange-200"></i>
                    </div>
                </div>
            </div>
            
            <!-- Gráficas y Tablas -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <!-- Producción Mensual -->
                <div class="bg-white p-6 rounded-lg card-shadow">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Producción Últimos 6 Meses</h3>
                    <canvas id="chart-produccion"></canvas>
                </div>
                
                <!-- Ventas Mensuales -->
                <div class="bg-white p-6 rounded-lg card-shadow">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Ventas Últimos 6 Meses</h3>
                    <canvas id="chart-ventas"></canvas>
                </div>
            </div>
            
            <!-- Inventarios -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Materias Primas Críticas -->
                <div class="bg-white p-6 rounded-lg card-shadow">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                        Materiales con Stock Bajo
                    </h3>
                    <div id="stock-bajo-table" class="overflow-x-auto">
                        <p class="text-gray-500 text-center py-4">Cargando...</p>
                    </div>
                </div>
                
                <!-- Producto Terminado -->
                <div class="bg-white p-6 rounded-lg card-shadow">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-beer text-pagoa-green mr-2"></i>
                        Stock de Producto Terminado
                    </h3>
                    <div id="producto-terminado-table" class="overflow-x-auto">
                        <p class="text-gray-500 text-center py-4">Cargando...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getProduccionHTML() {
    return `
        <div class="fade-in">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-gray-800">
                    <i class="fas fa-industry text-pagoa-green mr-3"></i>Producción
                </h1>
                <button onclick="openAddProduccionModal()" class="bg-pagoa-green text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors">
                    <i class="fas fa-plus mr-2"></i>Nueva Operación
                </button>
            </div>
            
            <div class="bg-white rounded-lg card-shadow mb-6">
                <div class="flex border-b">
                    <button onclick="switchProduccionTab('operaciones')" 
                            id="tab-operaciones"
                            class="px-6 py-3 font-semibold text-pagoa-green border-b-2 border-pagoa-green">
                        <i class="fas fa-list mr-2"></i>Operaciones
                    </button>
                    <button onclick="switchProduccionTab('lotes')" 
                            id="tab-lotes"
                            class="px-6 py-3 font-semibold text-gray-600 hover:text-pagoa-green">
                        <i class="fas fa-clipboard-list mr-2"></i>Resumen de Lotes
                    </button>
                </div>
                
                <div class="p-6">
                    <div class="flex flex-wrap gap-4 mb-6">
                        <div>
                            <label class="block text-xs text-gray-600 mb-1">Tipo de Operación</label>
                            <select id="filter-tipo-operacion" onchange="filterProduccion()" class="px-3 py-2 border rounded-lg text-sm">
                                <option value="">Todas</option>
                                <option value="Elaboración de mosto">Elaboración de mosto</option>
                                <option value="Envasado">Envasado</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-xs text-gray-600 mb-1">Estado</label>
                            <select id="filter-estado" onchange="filterProduccion()" class="px-3 py-2 border rounded-lg text-sm">
                                <option value="">Todos</option>
                                <option value="true">Confirmados</option>
                                <option value="false">Pendientes</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-xs text-gray-600 mb-1">Mes</label>
                            <select id="filter-mes" onchange="filterProduccion()" class="px-3 py-2 border rounded-lg text-sm">
                                <option value="">Todos</option>
                            </select>
                        </div>
                        
                        <div class="flex items-end">
                            <button onclick="loadProduccionOperaciones()" class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-sm transition-colors">
                                <i class="fas fa-sync-alt mr-2"></i>Actualizar
                            </button>
                        </div>
                    </div>
                    
                    <div id="produccion-operaciones-content">
                        <p class="text-gray-500 text-center py-8">Cargando operaciones...</p>
                    </div>
                    
                    <div id="produccion-lotes-content" class="hidden">
                        <p class="text-gray-500 text-center py-8">Cargando lotes...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="produccion-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
            <div class="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h3 class="text-2xl font-bold mb-4" id="produccion-modal-title">Nueva Operación de Producción</h3>
                
                <form id="produccion-form" class="space-y-4">
                    <input type="hidden" id="produccion-id">
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fecha *</label>
                        <input type="date" 
                               id="produccion-fecha" 
                               required 
                               class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Operación *</label>
                        <select id="produccion-tipo" required onchange="updateProduccionForm()" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                            <option value="">Seleccione...</option>
                            <option value="Elaboración de mosto">Elaboración de mosto</option>
                            <option value="Envasado">Envasado</option>
                        </select>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Número de Lote *</label>
                            <input type="text" 
                                   id="produccion-lote" 
                                   required 
                                   placeholder="Ej: L001"
                                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Estilo de Cerveza *</label>
                            <input type="text" 
                                   id="produccion-estilo" 
                                   required 
                                   list="estilos-produccion-datalist"
                                   onchange="loadRecetaForEstilo()"
                                   placeholder="Ej: IPA"
                                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                            <datalist id="estilos-produccion-datalist"></datalist>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Volumen (Litros) *</label>
                        <input type="number" 
                               step="0.01" 
                               id="produccion-volumen" 
                               required 
                               onchange="calculateCostoProduccion()"
                               placeholder="100.00"
                               class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                    </div>
                    
                    <div id="envasado-fields" class="hidden space-y-4">
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Envase</label>
                                <select id="produccion-envase" class="w-full px-4 py-2 border rounded-lg">
                                    <option value="">Seleccione...</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Chapa/Tapa</label>
                                <select id="produccion-chapa" class="w-full px-4 py-2 border rounded-lg">
                                    <option value="">Seleccione...</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Etiqueta/Vitola</label>
                                <select id="produccion-etiqueta" class="w-full px-4 py-2 border rounded-lg">
                                    <option value="">Seleccione...</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
                        <input type="text" 
                               id="produccion-ubicacion" 
                               placeholder="Ej: Tanque 1, Cámara 2..."
                               class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-gray-600">Costo Estimado de Materiales</p>
                                <p class="text-xs text-gray-500 mt-1">Calculado según receta y volumen</p>
                            </div>
                            <p class="text-2xl font-bold text-blue-600" id="costo-estimado">0.00 €</p>
                        </div>
                    </div>
                    
                    <div id="materiales-descuento" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hidden">
                        <h4 class="font-semibold text-gray-800 mb-2 flex items-center">
                            <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                            Materiales que se descontarán del inventario:
                        </h4>
                        <div id="lista-materiales-descuento" class="text-sm text-gray-700"></div>
                    </div>
                    
                    <div class="flex space-x-3 mt-6">
                        <button type="submit" class="flex-1 bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition-colors font-semibold">
                            <i class="fas fa-save mr-2"></i>Guardar (Sin Confirmar)
                        </button>
                        <button type="button" onclick="closeModal('produccion-modal')" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <div id="confirmar-operacion-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
            <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <h3 class="text-2xl font-bold mb-4 text-red-600">
                    <i class="fas fa-exclamation-triangle mr-2"></i>Confirmar Operación
                </h3>
                
                <div class="mb-6">
                    <p class="text-gray-700 mb-4">¿Está seguro de confirmar esta operación?</p>
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p class="text-sm text-red-800 font-semibold mb-2">Esta acción:</p>
                        <ul class="text-sm text-red-700 list-disc list-inside space-y-1">
                            <li>Descontará materiales del inventario</li>
                            <li>Registrará la operación en el historial</li>
                            <li>NO podrá editarse después</li>
                        </ul>
                    </div>
                </div>
                
                <input type="hidden" id="confirmar-operacion-id">
                
                <div class="flex space-x-3">
                    <button onclick="confirmarOperacion()" class="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold">
                        <i class="fas fa-check mr-2"></i>Sí, Confirmar
                    </button>
                    <button onclick="closeModal('confirmar-operacion-modal')" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    `;
}

function getProductoTerminadoHTML() {
    return '<div class="fade-in"><h1 class="text-3xl font-bold text-gray-800 mb-6"><i class="fas fa-beer text-pagoa-green mr-3"></i>Producto Terminado</h1><p class="text-gray-600">Módulo en construcción...</p></div>';
}

function getVentasHTML() {
    return '<div class="fade-in"><h1 class="text-3xl font-bold text-gray-800 mb-6"><i class="fas fa-cash-register text-pagoa-green mr-3"></i>Ventas</h1><p class="text-gray-600">Módulo en construcción...</p></div>';
}

function getCostosHTML() {
    return '<div class="fade-in"><h1 class="text-3xl font-bold text-gray-800 mb-6"><i class="fas fa-calculator text-pagoa-green mr-3"></i>Costos y Análisis</h1><p class="text-gray-600">Módulo en construcción...</p></div>';
}

function getRecetasHTML() {
    return `
        <div class="fade-in">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-gray-800">
                    <i class="fas fa-book text-pagoa-green mr-3"></i>Recetas
                </h1>
                <button onclick="openAddRecetaModal()" class="bg-pagoa-green text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors">
                    <i class="fas fa-plus mr-2"></i>Nueva Receta
                </button>
            </div>
            
            <div class="bg-white p-6 rounded-lg card-shadow mb-6">
                <div class="flex items-center space-x-4">
                    <label class="text-sm font-medium text-gray-700">Filtrar por Estilo:</label>
                    <select id="filter-estilo-recetas" onchange="filterRecetasByEstilo()" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600">
                        <option value="">Todos los estilos</option>
                    </select>
                    <button onclick="loadRecetas()" class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition-colors">
                        <i class="fas fa-sync-alt mr-2"></i>Actualizar
                    </button>
                </div>
            </div>
            
            <div id="recetas-container">
                <p class="text-gray-500 text-center py-8">Cargando recetas...</p>
            </div>
        </div>
        
        <div id="receta-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
            <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h3 class="text-2xl font-bold mb-4" id="receta-modal-title">Nueva Receta</h3>
                
                <form id="receta-form" class="space-y-4">
                    <input type="hidden" id="receta-id">
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Estilo de Cerveza *</label>
                        <input type="text" 
                               id="receta-estilo" 
                               required 
                               list="estilos-datalist"
                               placeholder="Ej: IPA, Stout, Lager..."
                               class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                        <datalist id="estilos-datalist">
                            <option value="IPA">
                            <option value="Pale Ale">
                            <option value="Stout">
                            <option value="Porter">
                            <option value="Lager">
                            <option value="Pilsner">
                            <option value="Wheat Beer">
                            <option value="Belgian Ale">
                            <option value="Amber Ale">
                            <option value="Brown Ale">
                        </datalist>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Operación *</label>
                        <select id="receta-tipo-operacion" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                            <option value="Elaboración de mosto">Elaboración de mosto</option>
                            <option value="Envasado">Envasado</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Ingrediente/Material *</label>
                        <select id="receta-ingrediente" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                            <option value="">Seleccione un material...</option>
                        </select>
                        <p class="text-xs text-gray-500 mt-1">Si no aparece, añádalo primero en Materias Primas</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Cantidad por 100L *</label>
                            <input type="number" 
                                   step="0.01" 
                                   id="receta-cantidad" 
                                   required 
                                   placeholder="0.00"
                                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Unidad *</label>
                            <input type="text" 
                                   id="receta-unidad" 
                                   required 
                                   readonly
                                   placeholder="kg"
                                   class="w-full px-4 py-2 border rounded-lg bg-gray-100">
                        </div>
                    </div>
                    
                    <div class="flex space-x-3 mt-6">
                        <button type="submit" class="flex-1 bg-pagoa-green text-white py-2 rounded-lg hover:bg-green-800 transition-colors">
                            <i class="fas fa-save mr-2"></i>Guardar
                        </button>
                        <button type="button" onclick="closeModal('receta-modal')" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function getHistorialHTML() {
    return '<div class="fade-in"><h1 class="text-3xl font-bold text-gray-800 mb-6"><i class="fas fa-history text-pagoa-green mr-3"></i>Historial</h1><p class="text-gray-600">Módulo en construcción...</p></div>';
}

function getConfiguracionHTML() {
    return '<div class="fade-in"><h1 class="text-3xl font-bold text-gray-800 mb-6"><i class="fas fa-cog text-pagoa-green mr-3"></i>Configuración</h1><p class="text-gray-600">Módulo en construcción...</p></div>';
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        await handleLogin(email, password);
    });
    
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        await handleRegister(name, email, password);
    });
    
    document.getElementById('show-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterScreen();
    });
    
    document.getElementById('show-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginScreen();
    });
    
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.currentTarget.dataset.view;
            loadView(view);
        });
    });
});

console.log('✅ App.js cargado correctamente'); {
    return `
        <div class="fade-in">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-gray-800">
                    <i class="fas fa-boxes text-pagoa-green mr-3"></i>Materias Primas
                </h1>
                <button onclick="openAddMaterialModal()" class="bg-pagoa-green text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors">
                    <i class="fas fa-plus mr-2"></i>Añadir Material
                </button>
            </div>
            
            <!-- Tabs: Ingredientes / Envases -->
            <div class="bg-white rounded-lg card-shadow mb-6">
                <div class="flex border-b">
                    <button onclick="switchMaterialTab('ingredientes')" 
                            id="tab-ingredientes"
                            class="px-6 py-3 font-semibold text-pagoa-green border-b-2 border-pagoa-green">
                        Ingredientes
                    </button>
                    <button onclick="switchMaterialTab('envases')" 
                            id="tab-envases"
                            class="px-6 py-3 font-semibold text-gray-600 hover:text-pagoa-green">
                        Envases
                    </button>
                </div>
                
                <div class="p-6">
                    <div id="materiales-table">
                        <p class="text-gray-500 text-center py-8">Cargando inventario...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal para añadir/editar material -->
        <div id="material-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
            <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <h3 class="text-2xl font-bold mb-4" id="material-modal-title">Añadir Material</h3>
                <form id="material-form" class="space-y-4">
                    <input type="hidden" id="material-id">
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                        <select id="material-tipo" required class="w-full px-4 py-2 border rounded-lg">
                            <option value="ingrediente">Ingrediente</option>
                            <option value="envase">Envase</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nombre del Material</label>
                        <input type="text" id="material-nombre" required class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Stock Inicial</label>
                            <input type="number" step="0.01" id="material-stock" required class="w-full px-4 py-2 border rounded-lg">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Unidad</label>
                            <select id="material-unidad" required class="w-full px-4 py-2 border rounded-lg">
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                                <option value="L">L</option>
                                <option value="mL">mL</option>
                                <option value="unidades">unidades</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Punto de Reorden</label>
                            <input type="number" step="0.01" id="material-reorden" required class="w-full px-4 py-2 border rounded-lg">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Costo Unitario (€)</label>
                            <input type="number" step="0.01" id="material-costo" required class="w-full px-4 py-2 border rounded-lg">
                        </div>
                    </div>
                    
                    <div id="capacidad-container" class="hidden">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Capacidad (L)</label>
                        <input type="number" step="0.01" id="material-capacidad" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    
                    <div class="flex space-x-3 mt-6">
                        <button type="submit" class="flex-1 bg-pagoa-green text-white py-2 rounded-lg hover:bg-green-800">
                            Guardar
                        </button>
                        <button type="button" onclick="closeModal('material-modal')" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function getProduccionHTML() {
    return '<div class="fade-in"><h1 class="text-3xl font-bold text-gray-800 mb-6"><i class="fas fa-industry text-pagoa-green mr-3"></i>Producción</h1><p class="text-gray-600">Módulo en construcción...</p></div>';
}

function getProductoTerminadoHTML() {
    return `
        <div class="fade-in">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-gray-800">
                    <i class="fas fa-beer text-pagoa-green mr-3"></i>Producto Terminado
                </h1>
                <button onclick="loadProductoTerminado()" class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition-colors">
                    <i class="fas fa-sync-alt mr-2"></i>Actualizar
                </button>
            </div>
            
            <!-- Filtros -->
            <div class="bg-white p-6 rounded-lg card-shadow mb-6">
                <div class="flex flex-wrap gap-4">
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Filtrar por Estilo</label>
                        <select id="filter-estilo-producto" onchange="filterProductoTerminado()" class="px-4 py-2 border rounded-lg">
                            <option value="">Todos los estilos</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Filtrar por Envase</label>
                        <select id="filter-envase-producto" onchange="filterProductoTerminado()" class="px-4 py-2 border rounded-lg">
                            <option value="">Todos los envases</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">Estado</label>
                        <select id="filter-estado-producto" onchange="filterProductoTerminado()" class="px-4 py-2 border rounded-lg">
                            <option value="">Todos</option>
                            <option value="disponible">Con Stock</option>
                            <option value="agotado">Agotado</option>
                            <option value="proximo-caducar">Próximo a Caducar</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Resumen de Stock -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white p-6 rounded-lg card-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">Lotes Activos</p>
                            <p class="text-3xl font-bold text-pagoa-green" id="total-lotes">0</p>
                        </div>
                        <i class="fas fa-clipboard-list text-4xl text-green-200"></i>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg card-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">Total Unidades</p>
                            <p class="text-3xl font-bold text-blue-600" id="total-unidades">0</p>
                        </div>
                        <i class="fas fa-box text-4xl text-blue-200"></i>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg card-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">Stock Disponible</p>
                            <p class="text-3xl font-bold text-green-600" id="stock-disponible">0</p>
                        </div>
                        <i class="fas fa-check-circle text-4xl text-green-200"></i>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg card-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">Unidades Vendidas</p>
                            <p class="text-3xl font-bold text-orange-600" id="total-vendidas">0</p>
                        </div>
                        <i class="fas fa-shopping-cart text-4xl text-orange-200"></i>
                    </div>
                </div>
            </div>
            
            <!-- Tabla de Producto Terminado -->
            <div class="bg-white rounded-lg card-shadow">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Inventario de Producto Terminado</h3>
                    <div id="producto-terminado-table-container" class="overflow-x-auto">
                        <p class="text-gray-500 text-center py-8">Cargando inventario...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getVentasHTML() {
    return '<div class="fade-in"><h1 class="text-3xl font-bold text-gray-800 mb-6"><i class="fas fa-cash-register text-pagoa-green mr-3"></i>Ventas</h1><p class="text-gray-600">Módulo en construcción...</p></div>';
}

function getCostosHTML() {
    return '<div class="fade-in"><h1 class="text-3xl font-bold text-gray-800 mb-6"><i class="fas fa-calculator text-pagoa-green mr-3"></i>Costos y Análisis</h1><p class="text-gray-600">Módulo en construcción...</p></div>';
}

function getRecetasHTML() {
    return `
        <div class="fade-in">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-gray-800">
                    <i class="fas fa-book text-pagoa-green mr-3"></i>Recetas
                </h1>
                <button onclick="openAddRecetaModal()" class="bg-pagoa-green text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors">
                    <i class="fas fa-plus mr-2"></i>Nueva Receta
                </button>
            </div>
            
            <!-- Selector de Estilo -->
            <div class="bg-white p-6 rounded-lg card-shadow mb-6">
                <div class="flex items-center space-x-4">
                    <label class="text-sm font-medium text-gray-700">Filtrar por Estilo:</label>
                    <select id="filter-estilo-recetas" onchange="filterRecetasByEstilo()" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600">
                        <option value="">Todos los estilos</option>
                    </select>
                    <button onclick="loadRecetas()" class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition-colors">
                        <i class="fas fa-sync-alt mr-2"></i>Actualizar
                    </button>
                </div>
            </div>
            
            <!-- Lista de Recetas por Estilo -->
            <div id="recetas-container">
                <p class="text-gray-500 text-center py-8">Cargando recetas...</p>
            </div>
        </div>
        
        <!-- Modal para añadir/editar receta -->
        <div id="receta-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
            <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h3 class="text-2xl font-bold mb-4" id="receta-modal-title">Nueva Receta</h3>
                
                <form id="receta-form" class="space-y-4">
                    <input type="hidden" id="receta-id">
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Estilo de Cerveza *</label>
                        <input type="text" 
                               id="receta-estilo" 
                               required 
                               list="estilos-datalist"
                               placeholder="Ej: IPA, Stout, Lager..."
                               class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                        <datalist id="estilos-datalist">
                            <option value="IPA">
                            <option value="Pale Ale">
                            <option value="Stout">
                            <option value="Porter">
                            <option value="Lager">
                            <option value="Pilsner">
                            <option value="Wheat Beer">
                            <option value="Belgian Ale">
                            <option value="Amber Ale">
                            <option value="Brown Ale">
                        </datalist>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Operación *</label>
                        <select id="receta-tipo-operacion" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                            <option value="Elaboración de mosto">Elaboración de mosto</option>
                            <option value="Envasado">Envasado</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Ingrediente/Material *</label>
                        <select id="receta-ingrediente" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                            <option value="">Seleccione un material...</option>
                        </select>
                        <p class="text-xs text-gray-500 mt-1">Si no aparece, añádalo primero en Materias Primas</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Cantidad por 100L *</label>
                            <input type="number" 
                                   step="0.01" 
                                   id="receta-cantidad" 
                                   required 
                                   placeholder="0.00"
                                   class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Unidad *</label>
                            <input type="text" 
                                   id="receta-unidad" 
                                   required 
                                   readonly
                                   placeholder="kg"
                                   class="w-full px-4 py-2 border rounded-lg bg-gray-100">
                        </div>
                    </div>
                    
                    <div class="flex space-x-3 mt-6">
                        <button type="submit" class="flex-1 bg-pagoa-green text-white py-2 rounded-lg hover:bg-green-800 transition-colors">
                            <i class="fas fa-save mr-2"></i>Guardar
                        </button>
                        <button type="button" onclick="closeModal('receta-modal')" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function getHistorialHTML() {
    return '<div class="fade-in"><h1 class="text-3xl font-bold text-gray-800 mb-6"><i class="fas fa-history text-pagoa-green mr-3"></i>Historial</h1><p class="text-gray-600">Módulo en construcción...</p></div>';
}

function getConfiguracionHTML() {
    return '<div class="fade-in"><h1 class="text-3xl font-bold text-gray-800 mb-6"><i class="fas fa-cog text-pagoa-green mr-3"></i>Configuración</h1><p class="text-gray-600">Módulo en construcción...</p></div>';
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Verificar sesión
    checkSession();
    
    // Login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        await handleLogin(email, password);
    });
    
    // Register form
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        await handleRegister(name, email, password);
    });
    
    // Toggle entre login y registro
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterScreen();
    });
    
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginScreen();
    });
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Navegación
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.currentTarget.dataset.view;
            loadView(view);
        });
    });
});

console.log('✅ App.js cargado correctamente');
