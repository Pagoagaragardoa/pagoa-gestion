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
            contentArea.innerHTML = getProduccionHTML();
            initProduccion();
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

function getMateriasPrimasHTML() {
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
