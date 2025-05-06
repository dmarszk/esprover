const ESP_HOST = 'rover.home';
const CAMERA_STREAM_URL = 'http://' + ESP_HOST + ':8080'
const API_BASE_URL = 'http://' + ESP_HOST + ':80/';
const CAMERA_RELOAD_INTERVAL = 5000;
const DEBUG = true; // Enable debug logging

// Joystick handling
var joystick = new VirtualJoystick({
    container: document.getElementById('parent-container'),
    mouseSupport: true,
    strokeStyle: 'gray',
    limitStickTravel: true,
});

setInterval(function () {
    var outputEl = document.getElementById('joystick-status');
    outputEl.innerHTML = ''
        + ' dx:' + joystick.deltaX().toFixed(2)
        + ' dy:' + joystick.deltaY().toFixed(2)
        + (joystick.right() ? ' right' : '')
        + (joystick.up() ? ' up' : '')
        + (joystick.left() ? ' left' : '')
        + (joystick.down() ? ' down' : '')
}, 1 / 30 * 1000);

// Set camera stream source dynamically
const cameraStream = document.getElementById('camera-stream');
let reloadInterval;

cameraStream.addEventListener('error', () => {
    console.error('Camera stream failed to load. Retrying...');
    if (!reloadInterval) {
        reloadInterval = setInterval(() => {
            cameraStream.src = CAMERA_STREAM_URL;
        }, CAMERA_RELOAD_INTERVAL);
    }
});

cameraStream.addEventListener('load', () => {
    console.log('Camera stream loaded successfully.');
    if (reloadInterval) {
        clearInterval(reloadInterval);
        reloadInterval = null;
    }
});



function updateServoValue(servoId) {
    const slider = document.getElementById(servoId);
    const valueDisplay = document.getElementById(`${servoId}-value`);
    valueDisplay.textContent = slider.value;
}
function registerSliderListeners(sliderId) {
    const slider = document.getElementById(sliderId);
    // Prevent mouse events on sliders from propagating to the parent container
    slider.addEventListener('mousedown', (event) => {
        event.stopPropagation();
    });
    slider.addEventListener('touchstart', (event) => {
        event.stopPropagation();
    });
    slider.addEventListener('touchdown', (event) => {
        event.stopPropagation();
    });
    slider.addEventListener('input', (event) => {
        updateServoValue(sliderId);
    });
}

registerSliderListeners('servo1');
registerSliderListeners('servo2');

// Only set the source now after all events are attached
cameraStream.src = CAMERA_STREAM_URL;

// EventSource for real-time updates
const eventSource = new EventSource(`${API_BASE_URL}events`);
eventSource.addEventListener('ping', (event) => {
    setOnlineStatus();
    lastEventTime = Date.now();
    const data = JSON.parse(event.data);
    if (DEBUG) console.log('Ping event:', data);
    const uptimeSeconds = Math.round(data.id / 1000);
    document.getElementById('uptime').textContent = `${uptimeSeconds}s`;
});

eventSource.addEventListener('state', (event) => {
    setOnlineStatus();
    lastEventTime = Date.now();
    const data = JSON.parse(event.data);
    if (DEBUG) console.log('State event:', data);
    handleStateEvent(data);
});

eventSource.addEventListener('log', (event) => {
    setOnlineStatus();
    lastEventTime = Date.now();
    if (DEBUG) console.log('Log event:', event.data);
});

eventSource.onerror = () => {
    console.error('EventSource connection error.');
    document.getElementById('status').style.color = 'red';
    document.getElementById('status').textContent = 'OFFLINE';
};

// Check for event timeout
setInterval(() => {
    if (Date.now() - lastEventTime > 35000) {
        document.getElementById('status').style.color = 'red';
        document.getElementById('status').textContent = 'OFFLINE';
    }
}, 1000);

function setOnlineStatus() {
    document.getElementById('status').style.color = 'green';
    document.getElementById('status').textContent = 'ONLINE';
}

// Stub handlers for state events
function handleStateEvent(data) {
    switch (data.id) {
        case 'fan-motor_left':
            document.getElementById('motor-left').textContent = data.state;
            break;
        case 'fan-motor_right':
            document.getElementById('motor-right').textContent = data.state;
            break;
        case 'servo_1':
            // Handle servo_1 state
            if (DEBUG) console.log('Servo 1 state:', data.state);
            break;
        case 'servo_2':
            // Handle servo_2 state
            if (DEBUG) console.log('Servo 2 state:', data.state);
            break;
        default:
            if (DEBUG) console.log('Unhandled state event:', data);
    }
}