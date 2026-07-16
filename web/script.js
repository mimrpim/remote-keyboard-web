// --- REGISTRACE PWA SERVICE WORKERU ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('PWA Service Worker úspěšně registrován!', reg.scope))
            .catch(err => console.error('Registrace Service Workeru selhala:', err));
    });
}

// Pomocná funkce pro vyhledání elementu klávesy
function getKeyByEvent(data) {
    let selector = '';
    if (data.scan_code) {
        selector += `[data-key="${data.scan_code}"]`;
    }
    if (data.key && data.key.length === 1) {
        if (selector) selector += ', ';
        selector += `[data-char*="${data.key.toUpperCase()}"]`;
    }
    const specialKeys = {
        'space': '.key--space',
        'tab': '[data-key="9"]',
        'backspace': '[data-key="8"]',
        'enter': '[data-key="13"]',
        'shift': '[data-key="16"]',
        'ctrl': '[data-key="17"]',
        'alt': '[data-key="18"]',
        'left': '[data-key="37"]',
        'up': '[data-key="38"]',
        'right': '[data-key="39"]',
        'down': '[data-key="40"]',
        'esc': '[data-key="27"]',
        'caps lock': '[data-key="20"]',
        'delete': '[data-key="46"]'
    };
    if (data.key && specialKeys[data.key.toLowerCase()]) {
        if (selector) selector += ', ';
        selector += specialKeys[data.key.toLowerCase()];
    }
    return document.querySelector(selector);
}

// --- DYNAMICKÉ WEBSOCKET PŘIPOJENÍ ---
let socket = null;
const ipInput = document.getElementById('ws-ip');
const btnConnect = document.getElementById('btn-connect');
const btnDisconnect = document.getElementById('btn-disconnect');
const statusText = document.getElementById('connection-status');
const titleText = document.querySelector('h1');

// Načtení dříve uložené IP adresy
if (localStorage.getItem('ws-ip')) {
    ipInput.value = localStorage.getItem('ws-ip');
}

function updateUI(status, text) {
    statusText.innerText = text;
    statusText.className = 'status--' + status;
    if (status === 'connected') {
        titleText.innerText = "WebSocket Keyboard - Připojeno";
        btnConnect.disabled = true;
        btnDisconnect.disabled = false;
        ipInput.disabled = true;
    } else {
        titleText.innerText = "WebSocket Keyboard - Odpojeno";
        btnConnect.disabled = false;
        btnDisconnect.disabled = true;
        ipInput.disabled = false;
    }
}

function connect() {
    const ip = ipInput.value.trim();
    if (!ip) return;
    localStorage.setItem('ws-ip', ip);
    
    updateUI('connecting', 'Připojování...');
    
    // Přidání protokolu ws:// pokud chybí
    const wsUrl = ip.startsWith('ws://') || ip.startsWith('wss://') ? ip : `ws://${ip}`;
    
    try {
        socket = new WebSocket(wsUrl);
        
        socket.onopen = function() {
            updateUI('connected', 'Připojeno');
        };
        
        socket.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                const keyElement = getKeyByEvent(data);
                if (keyElement) {
                    if (data.event === "keydown") {
                        keyElement.setAttribute('data-pressed', 'on');
                    } else if (data.event === "keyup") {
                        keyElement.removeAttribute('data-pressed');
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        
        socket.onerror = function() {
            updateUI('disconnected', 'Chyba připojení');
        };
        
        socket.onclose = function() {
            updateUI('disconnected', 'Odpojeno');
            socket = null;
        };
    } catch (e) {
        console.error(e);
        updateUI('disconnected', 'Chyba');
    }
}

function disconnect() {
    if (socket) {
        socket.close();
    }
}

btnConnect.addEventListener('click', connect);
btnDisconnect.addEventListener('click', disconnect);


// --- LOGIKA PRO ODESÍLÁNÍ (STISK & UVOLNĚNÍ) ---

// Zjistí název klávesy podle elementu
// Zjistí název klávesy podle elementu
function getKeyName(element) {
    if (element.classList.contains('key--space')) return "space";
    if (element.classList.contains('key--arrow-half')) {
        return element.dataset.key === "38" ? "up" : "down";
    }
    
    // Explicitní mapování pro šipku vlevo a vpravo na základě scan_code
    if (element.dataset.key === "37") return "left";
    if (element.dataset.key === "39") return "right";

    if (element.dataset.char) return element.dataset.char[0].toLowerCase();
    
    const span = element.querySelector('span');
    if (span) {
        let name = span.innerText.trim().toLowerCase();
        if (name === "return") return "enter";
        if (name === "control") return "ctrl";
        if (name === "delete") return "delete";
        if (name === "backspace") return "backspace";
        return name;
    }
    return null;
}

// Odešle stav klávesy (keydown / keyup) na server
function sendKeyEvent(element, eventType) {
    if (!element || !socket || socket.readyState !== WebSocket.OPEN) return;
    
    const keyName = getKeyName(element);
    if (!keyName) return;

    const payload = {
        "event": eventType, // "keydown" nebo "keyup"
        "key": keyName,
        "scan_code": parseInt(element.dataset.key) || null
    };

    socket.send(JSON.stringify(payload));

    // Vizuální zpětná vazba na obrazovce klávesnice
    if (eventType === "keydown") {
        element.setAttribute('data-pressed', 'on');
    } else {
        element.removeAttribute('data-pressed');
    }
}

// Nastavení posluchačů pro dotyky
document.addEventListener('DOMContentLoaded', () => {
    // Upravený selektor tak, aby odchytil i rozdělené vertikální šipky
    const keys = document.querySelectorAll('.keyboard__row > div, .key--arrow-half');
    
    keys.forEach(key => {
        key.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (typeof key.releasePointerCapture === 'function') {
                key.releasePointerCapture(e.pointerId);
            }
            sendKeyEvent(key, "keydown");
        });

        key.addEventListener('pointerup', (e) => {
            e.preventDefault();
            sendKeyEvent(key, "keyup");
        });

        key.addEventListener('pointerleave', (e) => {
            e.preventDefault();
            if (key.hasAttribute('data-pressed')) {
                sendKeyEvent(key, "keyup");
            }
        });
    });
});

// --- RESPONSIVE VELIKOST KLÁVESNICE ---
var keyboardElement = document.querySelector('.keyboard');
function size() {
    var sizeVal = keyboardElement.parentNode.clientWidth / 60;
    keyboardElement.style.fontSize = sizeVal + 'px';
}
window.addEventListener('resize', size);
size();