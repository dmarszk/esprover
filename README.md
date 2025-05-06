# ESPRover

ESPRover is a project built on top of ESPHome, designed to control a rover using an ESP32 microcontroller. It includes a web-based interface for controlling motors, servos, and other components, as well as a camera streaming feature.

## Features
- Web-based control interface with a virtual joystick.
- Motor and servo control using ESPHome components.
- Camera streaming via ESP32 Camera Web Server.

## Webpage Build Process
The web interface is built using HTML, CSS, and JavaScript. The build process involves:
1. **Minifying Assets**: CSS and JavaScript files are minified using `cleancss` and `terser`.
2. **Inlining Assets**: Minified CSS and JavaScript are inlined into the HTML file.
3. **HTML Minification**: The final HTML file is minified using `html-minifier-terser`.
4. **Compression**: The minified HTML is compressed into a `.gz` file.
5. **Header Generation**: The compressed HTML is converted into a C++ header file using `make_header.sh`.

To build the webpage:
```bash
cd web
./minify.sh
```

## Configuration
Create `secrets.yaml` following this example structure:
```yaml
ap_ssid_1: "Rover 1"
ap_ssid_2: "Rover 2"
ap_password_1: "123456789"
ap_password_2: "987654321"
```

## Build and Flashing Process
1. **Build the Firmware**: Use ESPHome to compile the firmware.
   ```bash
   esphome compile rover.yaml
   ```
2. **Flash the Firmware**: Flash the firmware to the ESP32 device.
   ```bash
   esphome upload rover.yaml
   ```
3. **OTA Updates**: Once the firmware is flashed, future updates can be done over-the-air.

### Alternatively - build, flash and attach debug in one go over serial
```bash
esphome run rover.yaml --device /dev/ttyUSB0
```

## Credits
This project leverages the following open-source projects:
- [ESPHome](https://github.com/esphome/esphome): A system to control ESP32/ESP8266 devices with simple YAML configuration.
- [ESPHome Web Server](https://github.com/esphome/esphome-webserver): A web server component for ESPHome devices.
- [Virtual Joystick](https://github.com/jeromeetienne/virtualjoystick.js): A JavaScript library for creating virtual joystick controls.

## License
This project follow ESPHome license model, and is licensed under the MIT License, except for `components/rover_web_server` which is a derivative of GPLv3 licensed component and is redistributed as such. See the LICENSE file for details.
