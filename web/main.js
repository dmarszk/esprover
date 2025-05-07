// ESP_HOST = 'rover.home'; // Uncomment this line to set a static host
ESP_HOST = typeof ESP_HOST !== 'undefined' ? ESP_HOST : window.location.hostname;
const CAMERA_STREAM_URL = 'http://' + ESP_HOST + ':8080'
const API_BASE_URL = 'http://' + ESP_HOST + ':80/';
const CAMERA_RELOAD_INTERVAL = 5000;
const MOTOR_COMMAND_DEADTIME = 400;
const DEBUG = false; // Enable debug logging
const STICK_RADIUS = 100;
const FETCH_TIMEOUT = 400;

// Joystick handling
var joystick = new VirtualJoystick({
    container: document.getElementById('parent-container'),
    mouseSupport: true,
    strokeStyle: 'gray',
    limitStickTravel: true,
    stickRadius: STICK_RADIUS,
});

let lastMotorCommand = Date.now();
function calculateMotorCommand(deltaX, deltaY) {
    r = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / STICK_RADIUS;
    if (r > 1) {
        r = 1;
    }
    alpha = Math.atan2(deltaY, deltaX);

    alphaDeg = alpha * 180 / Math.PI;
    alphaDeg = (alphaDeg + 360) % 360; // Normalize to [0, 360)
    if (alphaDeg > 0 && alphaDeg <= 90) {
        // Bottom-right quadrant
        L = r * Math.cos(alpha * 2); // transition from 1 to -1
        R = -r; // Full back speed for right motor
    } else if (alphaDeg > 90 && alphaDeg <= 180) {
        // Bottom-left quadrant
        L = -r; // Full back speed for left motor
        R = r * Math.cos(alpha * 2); // transition from -1 to 1
    } else if (alphaDeg > 180 && alphaDeg <= 270) {
        // Top-left quadrant
        L = -r * Math.cos(alpha * 2); // transition from -1 to 1
        R = r; // Full forward speed for right motor
    } else if (alphaDeg > 270 && alphaDeg < 360) {
        // Top-right quadrant
        L = r; // Full forward speed for left motor
        R = -r * Math.cos(alpha * 2); // transition from 1 to -1
    } else {
        L = 0;
        R = 0;
    }
    return {
        L: (L * 100).toFixed(),
        R: (R * 100).toFixed(),
    };
}
function sendMotorCommand(motorCmd) {
    const now = Date.now();
    if (now - lastMotorCommand > MOTOR_COMMAND_DEADTIME) {
        lastMotorCommand = now;
        if (motorCmd.L > 0) {
            if (document.getElementById('motor-left-pwr').textContent !== (motorCmd.L).toString())
                configureFan('motor_left', 'turn_on', motorCmd.L, null, 'forward');
        }
        else if (motorCmd.L < 0) {
            if (document.getElementById('motor-left-pwr').textContent !== (-motorCmd.L).toString())
                configureFan('motor_left', 'turn_on', -motorCmd.L, null, 'reverse');
        }
        else if (document.getElementById('motor-left-pwr').textContent !== "0") {
            configureFan('motor_left', 'turn_off');
        }
        if (motorCmd.R > 0) {
            if (document.getElementById('motor-right-pwr').textContent !== (motorCmd.R).toString())
                configureFan('motor_right', 'turn_on', motorCmd.R, null, 'forward');
        }
        else if (motorCmd.R < 0) {
            if (document.getElementById('motor-right-pwr').textContent !== (-motorCmd.R).toString())
                configureFan('motor_right', 'turn_on', -motorCmd.R, null, 'reverse');
        }
        else if (document.getElementById('motor-right-pwr').textContent !== "0") {
            configureFan('motor_right', 'turn_off');
        }
    }
}
setInterval(function () {
    var outputEl = document.getElementById('joystick-status');
    motorCmd = calculateMotorCommand(joystick.deltaX(), joystick.deltaY());
    outputEl.innerHTML = ''
        + ' dx:' + joystick.deltaX().toFixed(2)
        + ' dy:' + joystick.deltaY().toFixed(2)
        + ' <br>'
        + ' L:' + motorCmd.L
        + ' R:' + motorCmd.R;
    sendMotorCommand(motorCmd);
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

function updatedServoSliderValue(servoId) {
    const slider = document.getElementById(servoId);
    const valueDisplay = document.getElementById(`${servoId}-value`);
    valueDisplay.textContent = slider.value;
}

function commandServo(servoId) {
    const slider = document.getElementById(servoId);
    const value = slider.value;
    servoNumberName = null;
    if (servoId === 'servo1') {
        servoNumberName = "servo_1_angle";
    } else if (servoId === 'servo2') {
        servoNumberName = "servo_2_angle";
    } else {
        console.error('Unknown servo ID:', servoId);
        return;
    }
    if (servoNumberName !== null) {
        configureNumber(servoNumberName, value);
    }
}

function forceServoValue(servoId, value) {
    const slider = document.getElementById(servoId);
    // Suppress the input event temporarily to avoid triggering it
    const inputEventListeners = slider.oninput;
    const changeEventListeners = slider.onchange;
    slider.oninput = null;
    slider.onchange = null;
    slider.value = value;
    slider.oninput = inputEventListeners;
    slider.onchange = changeEventListeners;
    const valueDisplay = document.getElementById(`${servoId}-value`);
    valueDisplay.textContent = value;
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
    slider.addEventListener('touchend', (event) => {
        event.stopPropagation();
    });
    slider.addEventListener('touchmove', (event) => {
        event.stopPropagation();
    });
    slider.addEventListener('input', (event) => {
        updatedServoSliderValue(sliderId);
    });
    slider.addEventListener('change', (event) => {
        commandServo(sliderId);
    });
}

registerSliderListeners('servo1');
registerSliderListeners('servo2');

// Only set the source now after all events are attached
cameraStream.src = CAMERA_STREAM_URL;

// EventSource for real-time updates

const eventSource = new EventSource(`${API_BASE_URL}events`);
eventSource.addEventListener('ping', (event) => {
    if (DEBUG) console.log('Ping');
    eventUpdateUptimeAndStatus(event);
});

eventSource.addEventListener('state', (event) => {
    eventUpdateUptimeAndStatus(event);
    lastEventTime = Date.now();
    const data = JSON.parse(event.data);
    if (DEBUG) console.log('State event:', data);
    handleStateEvent(data);
});

eventSource.addEventListener('log', (event) => {
    eventUpdateUptimeAndStatus(event);
    lastEventTime = Date.now();
    if (DEBUG) console.log('Log event:', event.data);
});

eventSource.onerror = () => {
    console.error('EventSource connection error.');
    document.getElementById('status').style.color = 'red';
    document.getElementById('status').textContent = 'OFFLINE - RECONNECTING...';
};

// Check for event timeout
let lastEventTime = Date.now();
setInterval(() => {
    if (Date.now() - lastEventTime > 35000) {
        document.getElementById('status').style.color = 'red';
        document.getElementById('status').textContent = 'OFFLINE - RECONNECTING...';
    }
}, 1000);

function eventUpdateUptimeAndStatus(event) {
    document.getElementById('status').style.color = 'green';
    document.getElementById('status').textContent = 'ONLINE';
    lastEventTime = Date.now();
    const uptimeSeconds = Math.round(event.lastEventId / 1000);
    document.getElementById('uptime').textContent = `${uptimeSeconds}s`;
}

function getMotorStateText(data) {
    text = "";
    if (data.state === "ON") {
        if (data.direction === "forward") {
            text = data.speed_level;
        } else {
            text = -data.speed_level;
        }
    } else {
        text = "0";
    }
    return text;
}
// Stub handlers for state events
function handleStateEvent(data) {
    switch (data.id) {
        case 'fan-motor_left':
            document.getElementById('motor-left-pwr').textContent = getMotorStateText(data);
            break;
        case 'fan-motor_right':
            document.getElementById('motor-right-pwr').textContent = getMotorStateText(data);
            break;
        case 'number-servo_1_angle':
            forceServoValue('servo1', data.state);
            break;
        case 'number-servo_2_angle':
            forceServoValue('servo2', data.state);
            break;
        default:
            console.log('Unhandled state event:', data);
    }

}

// Configure fan state
function configureFan(fanId, state, speedLevel = null, oscillation = null, direction = null) {
    let url = `${API_BASE_URL}fan/${fanId}/${state}`;
    const params = new URLSearchParams();
    if (speedLevel !== null) params.append('speed_level', speedLevel);
    if (oscillation !== null) params.append('oscillation', oscillation);
    if (direction !== null) params.append('direction', direction);

    if (params.toString()) {
        url += `?${params.toString()}`;
    }

    fetch(url, { method: 'POST', signal: AbortSignal.timeout(FETCH_TIMEOUT)})
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to configure fan: ${response.statusText}`);
            }
            if (DEBUG) console.log(`Fan ${fanId} configured: state=${state}, speedLevel=${speedLevel}, oscillation=${oscillation}`);
        })
        .catch(error => console.error(error));
}

// Configure number value
function configureNumber(numberId, value) {
    const url = `${API_BASE_URL}number/${numberId}/set?value=${value}`;

    fetch(url, { method: 'POST', signal: AbortSignal.timeout(FETCH_TIMEOUT) })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to configure number: ${response.statusText}`);
            }
            if (DEBUG) console.log(`Number ${numberId} configured: value=${value}`);
        })
        .catch(error => console.error(error));
}

// Example usage
// configureFan('living_room_fan', 'turn_on', 2, true);
// configureNumber('desired_delay', 24);