let html5QrCode;
let codigoEscaneadoActual = ""; 
let puntosActuales = 0;
let productoActual = "";
let tipoMaterial = ""; 
let pasoEscaneo = "producto"; 

function iniciarCamara() {
    document.getElementById('resultado-escaneo').classList.add('oculto');
    html5QrCode = new Html5Qrcode("lector-qr");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
        { facingMode: "environment" }, 
        config,
        alEscanearExitosamente 
    ).catch(err => {
        console.error("Error al acceder a la cámara: ", err);
        alert("No se pudo acceder a la cámara.");
    });
}

function detenerCamara() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error(err));
    }
}

function alEscanearExitosamente(textoDecodificado) {
    detenerCamara();
    
    // TRIM: Quita espacios invisibles que puedan arruinar la lectura
    let texto = textoDecodificado.trim().toLowerCase(); 
    
    // DEBUG: Esto te dirá en la consola exactamente qué leyó la cámara
    console.log("Cámara leyó el texto:", texto); 

    // ==========================================
    // PASO 2: ESCANEAR LA CANECA
    // ==========================================
    if (pasoEscaneo === "caneca") {
        document.getElementById('nombre-producto').textContent = "Validando Contenedor...";
        let canecaCorrecta = false;

        if (tipoMaterial === "plastico" && texto.includes("caneca_blanca")) canecaCorrecta = true;
        if (tipoMaterial === "papel" && texto.includes("caneca_azul")) canecaCorrecta = true;
        if (tipoMaterial === "carton" && texto.includes("caneca_gris")) canecaCorrecta = true;
        if (tipoMaterial === "vidrio" && texto.includes("caneca_verde")) canecaCorrecta = true;

        const botonConfirmar = document.querySelector('#resultado-escaneo button');

        if (canecaCorrecta) {
            document.getElementById('nombre-producto').textContent = "✅ ¡Caneca Correcta!";
            document.getElementById('instruccion-contenedor').textContent = "El sensor ha validado el depósito.";
            botonConfirmar.style.display = "block";
            botonConfirmar.textContent = "Confirmar y Ganar Puntos";
            botonConfirmar.onclick = function() { confirmarDeposito(); };
        } else {
            document.getElementById('nombre-producto').textContent = "❌ Caneca Incorrecta";
            document.getElementById('instruccion-contenedor').textContent = "El residuo no corresponde a esta caneca.";
            botonConfirmar.style.display = "none"; 
        }
        document.getElementById('resultado-escaneo').classList.remove('oculto');
        return; 
    }

    // ==========================================
    // PASO 1: ESCANEAR EL RESIDUO
    // ==========================================
    codigoEscaneadoActual = texto;

    if (usuario.codigosUsados.includes(texto)) {
        document.getElementById('nombre-producto').textContent = "❌ Código Duplicado";
        document.getElementById('instruccion-contenedor').textContent = "Este residuo ya fue registrado.";
        document.querySelector('#resultado-escaneo button').style.display = "none";
        document.getElementById('resultado-escaneo').classList.remove('oculto');
        return; 
    }

    // --- LÓGICA DINÁMICA (Base de datos de QRs creados) ---
    let configuraciones = JSON.parse(localStorage.getItem('configResiduos')) || {};
    let residuoEncontrado = configuraciones[texto];
    
    // DEBUG: Muestra qué está buscando y qué encontró
    console.log("Buscando en DB:", texto, "Resultado:", residuoEncontrado);

    if (residuoEncontrado) {
        productoActual = "Residuo Personalizado (" + texto + ")";
        tipoMaterial = residuoEncontrado.material;
        puntosActuales = parseInt(residuoEncontrado.puntos);
        
        let nombreCaneca = "";
        if (tipoMaterial === "plastico") nombreCaneca = "BLANCO";
        if (tipoMaterial === "papel") nombreCaneca = "AZUL";
        if (tipoMaterial === "carton") nombreCaneca = "GRIS";
        if (tipoMaterial === "vidrio") nombreCaneca = "VERDE";

        document.getElementById('instruccion-contenedor').textContent = `Por favor, dirígete al Contenedor ${nombreCaneca} y escanea su QR.`;
    
    } else {
        // --- LÓGICA ESTÁTICA (Fallback) ---
        if (texto.includes("coca") || texto.includes("plastico") || texto === "7702001") {
            productoActual = "Botella Plástica"; tipoMaterial = "plastico"; puntosActuales = 10;
            document.getElementById('instruccion-contenedor').textContent = "Ve al Contenedor BLANCO y escanea su QR.";
        } else if (texto.includes("cuaderno") || texto.includes("papel") || texto === "123456") {
            productoActual = "Papel"; tipoMaterial = "papel"; puntosActuales = 5;
            document.getElementById('instruccion-contenedor').textContent = "Ve al Contenedor AZUL y escanea su QR.";
        } else if (texto.includes("carton") || texto.includes("caja")) {
            productoActual = "Cartón"; tipoMaterial = "carton"; puntosActuales = 8;
            document.getElementById('instruccion-contenedor').textContent = "Ve al Contenedor GRIS y escanea su QR.";
        } else if (texto.includes("vidrio") || texto.includes("botella")) {
            productoActual = "Vidrio"; tipoMaterial = "vidrio"; puntosActuales = 15;
            document.getElementById('instruccion-contenedor').textContent = "Ve al Contenedor VERDE y escanea su QR.";
        } else {
            productoActual = "Producto Desconocido"; tipoMaterial = "desconocido"; puntosActuales = 0;
            document.getElementById('instruccion-contenedor').textContent = "No registrado.";
        }
    }

    document.getElementById('nombre-producto').textContent = productoActual;
    const botonConfirmar = document.querySelector('#resultado-escaneo button');
    
    if (puntosActuales > 0) {
        botonConfirmar.style.display = "block";
        botonConfirmar.textContent = "Escanear Caneca (Validar)";
        botonConfirmar.onclick = function() {
            pasoEscaneo = "caneca"; 
            document.getElementById('resultado-escaneo').classList.add('oculto');
            document.querySelector('.instruccion').textContent = "Apunta la cámara al QR del contenedor.";
            iniciarCamara(); 
        };
    } else {
        botonConfirmar.style.display = "none"; 
    }
    document.getElementById('resultado-escaneo').classList.remove('oculto');
}

function confirmarDeposito() {
    usuario.codigosUsados.push(codigoEscaneadoActual);
    localStorage.setItem('usuarioEco', JSON.stringify(usuario));
    agregarEcoPuntos(productoActual, puntosActuales);
    mostrarToast(`¡Ganaste ${puntosActuales} EcoPuntos!`);
    pasoEscaneo = "producto"; 
    document.querySelector('.instruccion').textContent = "Apunta la cámara al código de barras o QR del producto.";
    volverAlDashboard(); 
}