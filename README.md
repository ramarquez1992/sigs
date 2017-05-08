![screenshot](https://github.com/richard92m/sigs/raw/master/assets/sigs_screenshot.png)


# sigs
Arduino sonar theremin and signal processing fun

## Requirements
- [Node.js](https://nodejs.org/en/)
- [Arduino IDE](https://www.arduino.cc/en/Main/Software)
- [Arduino](https://www.arduino.cc/en/Main/ArduinoBoardUno)
- [HC-SR04](https://www.sparkfun.com/products/13959)
- [JY-MCU](https://core-electronics.com.au/attachments/guides/Product-User-Guide-JY-MCU-Bluetooth-UART-R1-0.pdf)


## Installation
![hardware](https://github.com/richard92m/sigs/raw/master/assets/hw_schem.png)

1. Configure JY-MCU for 57600 baud (Johnny-five speed) with [this program](https://gist.github.com/garrows/f8f787dac6e85591737c#file-setupbluetooth-ino)
1. Set up Arduino as shown above
1. `npm install -g nodebots-interchange`
1. `interchange install hc-sr04 -a uno -p <port> --firmata`
1. Navigate to `sigs/` in terminal
1. `npm install`


## Usage
1. Connect  Arduino to power
1. Execute `node index.js -b <port>`
1. Navigate to [`http://localhost:8080`](http://localhost:8080) in web browser

