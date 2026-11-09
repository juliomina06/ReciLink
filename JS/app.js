// 1. ESTADO DE LA APLICACIÓN
let usuario = JSON.parse(localStorage.getItem('usuarioEco')) || {
    nombre: "Invitado",
    rol: "Ciudadano",
    puntos: 0,
    historial: [],
    codigosUsados: [],
    misionProgreso: 0 // NUEVO
};

if (!usuario.codigosUsados) usuario.codigosUsados = [];
if (usuario.misionProgreso === undefined) usuario.misionProgreso = 0;

// Variables de impacto global (Simuladas para el Pitch)
let impactoGlobal = JSON.parse(localStorage.getItem('impactoGlobal')) || { kg: 1250, co2: 450 };

// 2. NAVEGACIÓN
function mostrarPantalla(idPantalla) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
    document.getElementById(idPantalla).classList.add('activa');
}

function mostrarToast(mensaje) {
    const toast = document.getElementById('toast');
    toast.textContent = mensaje;
    toast.classList.remove('oculto');
    setTimeout(() => { toast.classList.add('oculto'); }, 3500);
}

// 3. LOGIN Y ROLES
function iniciarSesion() {
    const user = document.getElementById('usuario').value;
    const rol = document.getElementById('rol-usuario').value;
    const pass = document.getElementById('password').value;
    
    if (user !== "" && pass === "123") {
        usuario.nombre = user;
        usuario.rol = rol;
        localStorage.setItem('usuarioEco', JSON.stringify(usuario));
        
        document.getElementById('nombre-usuario').textContent = usuario.nombre;
        document.getElementById('rol-badge').textContent = usuario.rol;
        
        // Adaptar la vista según el ROL
        const btnEscanear = document.getElementById('btn-escanear');
        const btnAdmin = document.getElementById('btn-admin');
        const btnCanje = document.getElementById('btn-canje');
        const btnGuia = document.getElementById('btn-guia');
        const zonaContainer = document.getElementById('zona-container');
        const panelImpacto = document.getElementById('panel-impacto');
        const tarjetaMision = document.getElementById('tarjeta-mision');
        const tarjetaPuntos = document.getElementById('tarjeta-puntos-ciudadano');

        if (rol === 'Reciclador') {
            btnEscanear.style.display = 'none';
            btnCanje.style.display = 'none';
            btnGuia.style.display = 'none';
            zonaContainer.style.display = 'none';
            panelImpacto.style.display = 'none';
            tarjetaMision.style.display = 'none';
            tarjetaPuntos.style.display = 'none';
            btnAdmin.style.display = 'block'; 
        } else if (rol === 'Empresa') {
            btnEscanear.style.display = 'none';
            btnCanje.style.display = 'none';
            btnGuia.style.display = 'none';
            zonaContainer.style.display = 'none';
            tarjetaMision.style.display = 'none';
            tarjetaPuntos.style.display = 'none';
            panelImpacto.style.display = 'block'; // La empresa ve el impacto
            btnAdmin.style.display = 'block'; 
        } else {
            // Ciudadano
            btnEscanear.style.display = 'block';
            btnCanje.style.display = 'block';
            btnGuia.style.display = 'block';
            zonaContainer.style.display = 'block';
            panelImpacto.style.display = 'block'; // El ciudadano también ve el impacto
            tarjetaMision.style.display = 'block';
            tarjetaPuntos.style.display = 'block';
            btnAdmin.style.display = 'none'; 
        }
        
        actualizarInterfaz();
        mostrarPantalla('pantalla-dashboard');
    } else {
        alert("Ingresa un nombre y usa la contraseña: 123");
    }
}

function cerrarSesion() {
    mostrarPantalla('pantalla-login');
    document.getElementById('usuario').value = '';
    document.getElementById('password').value = '';
}

// 4. PUNTOS E HISTORIAL
function actualizarInterfaz() {
    document.getElementById('puntos-totales').textContent = usuario.puntos;
    document.getElementById('nombre-usuario').textContent = usuario.nombre;
    document.getElementById('rol-badge').textContent = usuario.rol;

    // Actualizar Impacto Global
    document.getElementById('impacto-kg').textContent = impactoGlobal.kg;
    document.getElementById('impacto-co2').textContent = impactoGlobal.co2;

    // Actualizar Misión
    let porcentajeMision = (usuario.misionProgreso / 5) * 100;
    if(porcentajeMision > 100) porcentajeMision = 100;
    document.getElementById('barra-mision').style.width = `${porcentajeMision}%`;
    document.getElementById('texto-mision').textContent = `${usuario.misionProgreso} / 5 completados`;
    if (usuario.misionProgreso >= 5) {
        document.getElementById('texto-mision').textContent = "¡Misión Cumplida! Reclama tu premio.";
        document.getElementById('texto-mision').style.color = "var(--verde-principal)";
        document.getElementById('texto-mision').style.fontWeight = "bold";
    }

    const lista = document.getElementById('lista-historial');
    lista.innerHTML = ''; 
    if (usuario.historial.length === 0) {
        lista.innerHTML = '<li>Aún no hay actividad registrada.</li>';
    } else {
        usuario.historial.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span><b>+${item.puntos} pts</b> - ${item.producto}</span> <small>📍 ${item.zona || 'N/A'}</small>`;
            lista.appendChild(li);
        });
    }
}

function agregarEcoPuntos(nombreProducto, puntosGanados) {
    usuario.puntos += puntosGanados;
    
    // NUEVO: Aumentar el impacto global simulado
    impactoGlobal.kg += 0.5; // Simulamos que cada escaneo es medio kilo
    impactoGlobal.co2 += 0.2;
    localStorage.setItem('impactoGlobal', JSON.stringify(impactoGlobal));

    // NUEVO: Avanzar misión
    if (usuario.misionProgreso < 5) {
        usuario.misionProgreso += 1;
    }

    const zonaSeleccionada = document.getElementById('zona-selector') ? document.getElementById('zona-selector').value : 'General';
    const fechaActual = new Date().toLocaleDateString();
    usuario.historial.unshift({ producto: nombreProducto, puntos: puntosGanados, fecha: fechaActual, zona: zonaSeleccionada });
    localStorage.setItem('usuarioEco', JSON.stringify(usuario));
    
    actualizarInterfaz();
}

// 5. ESCÁNER NAV
function irAEscanner() {
    pasoEscaneo = "producto"; 
    document.getElementById('resultado-escaneo').classList.add('oculto');
    document.querySelector('.instruccion').textContent = "Apunta la cámara al código de barras o QR del producto.";
    mostrarPantalla('pantalla-escaner');
    iniciarCamara(); 
}

function volverAlDashboard() {
    detenerCamara(); 
    document.getElementById('resultado-escaneo').classList.add('oculto');
    mostrarPantalla('pantalla-dashboard');
}

// 6. MODALES (CANJE Y GUÍA)
function abrirModalCanje() { document.getElementById('modal-canje').classList.remove('oculto'); }
function cerrarModalCanje() { document.getElementById('modal-canje').classList.add('oculto'); }

function abrirGuia() { document.getElementById('modal-guia').classList.remove('oculto'); }
function cerrarGuia() { document.getElementById('modal-guia').classList.add('oculto'); }

function canjearPuntos(costo, recompensa) {
    if (usuario.puntos >= costo) {
        usuario.puntos -= costo;
        localStorage.setItem('usuarioEco', JSON.stringify(usuario));
        actualizarInterfaz();
        mostrarToast(`¡Disfruta tu ${recompensa}! (-${costo} pts)`);
        cerrarModalCanje();
    } else {
        mostrarToast(`No tienes suficientes puntos. Necesitas ${costo} y tienes ${usuario.puntos}.`);
    }
}

// 7. LOGÍSTICA
let contenedores = { plastico: 20, papel: 45 };
function irAAdmin() { mostrarPantalla('pantalla-admin'); actualizarBarras(); }

function actualizarBarras() {
    document.getElementById('porcentaje-plastico').textContent = `${contenedores.plastico}%`;
    const barraPlastico = document.getElementById('barra-plastico');
    barraPlastico.style.width = `${contenedores.plastico}%`;
    
    document.getElementById('porcentaje-papel').textContent = `${contenedores.papel}%`;
    const barraPapel = document.getElementById('barra-papel');
    barraPapel.style.width = `${contenedores.papel}%`;

    [barraPlastico, barraPapel].forEach(barra => {
        let valor = parseInt(barra.style.width);
        if (valor >= 80) barra.style.backgroundColor = '#C1121F';
        else if (valor >= 50) barra.style.backgroundColor = 'var(--naranja-acento)';
        else barra.style.backgroundColor = 'var(--verde-principal)';
    });
}

function simularLlenado(tipo) {
    contenedores[tipo] += 15;
    if (contenedores[tipo] > 100) contenedores[tipo] = 100;
    actualizarBarras();
    if (contenedores[tipo] >= 80) mostrarToast(`⚠️ ¡ALERTA! Contenedor ${tipo.toUpperCase()} al ${contenedores[tipo]}%.`);
}

function vaciarContenedor(tipo) {
    contenedores[tipo] = 0;
    actualizarBarras();
    mostrarToast(`✅ Contenedor ${tipo} vaciado.`);
}

// 8. GENERADOR DE QR Y RESET
function resetearSistema() {
    if (confirm("¿Seguro que quieres borrar todos los datos?")) {
        localStorage.clear();
        location.reload();
    }
}

function generarQRAdmin() {
    const id = document.getElementById('admin-id').value.trim().toLowerCase();
    const tipo = document.getElementById('admin-tipo').value;
    const puntos = parseInt(document.getElementById('admin-puntos').value);

    if (!id || isNaN(puntos)) {
        alert("Por favor, llena todos los campos.");
        return;
    }

    let configuraciones = JSON.parse(localStorage.getItem('configResiduos')) || {};
    configuraciones[id] = { material: tipo, puntos: puntos };
    localStorage.setItem('configResiduos', JSON.stringify(configuraciones));
    
    const qrContainer = document.getElementById('qr-container');
    qrContainer.innerHTML = ''; 

    new QRCode(qrContainer, {
        text: id,
        width: 200, height: 200, 
        colorDark : "#1A365D", 
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    mostrarToast(`QR generado para: ${id}`);
    document.getElementById('admin-id').value = '';
    document.getElementById('admin-puntos').value = '';
}