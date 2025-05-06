const ESP_HOST = 'rover.home';
const CAMERA_STREAM_URL = 'http://'+ ESP_HOST + ':8080'
const API_BASE_URL = 'http://'+ ESP_HOST + ':80/';
const CAMERA_RELOAD_INTERVAL = 50000000;

// Simulate dynamic parameter updates
setInterval(() => {
    document.getElementById('status').textContent = 'Online';
    document.getElementById('uptime').textContent = `${Math.floor(performance.now() / 1000)}s`;
    document.getElementById('motor-left').textContent = Math.floor(Math.random() * 100);
    document.getElementById('motor-right').textContent = Math.floor(Math.random() * 100);
}, 1000);

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