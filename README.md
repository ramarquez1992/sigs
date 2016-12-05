![screenshot](https://s16.postimg.org/yuk4uiqad/sigs_screenshot.png)


# sigs
### Arduino signal processing fun
_Evan Kvidera, Richard Marquez, Nick Meyer_


## Requirements
- [Arduino](https://www.arduino.cc/en/Main/ArduinoBoardUno) + [HC-SR04](https://www.sparkfun.com/products/13959)
- [Arduino IDE](https://www.arduino.cc/en/Main/Software)
- [Node.js](https://nodejs.org/en/)


## Installation
![hardware](https://s17.postimg.org/t7xc3bgzj/hw_schem.png)

1. Set up Arduino as shown above
1. `npm install -g nodebots-interchange`
1. `interchange install hc-sr04 -a uno -p <port> --firmata`
1. Navigate to `sigs/` in terminal
1. `npm install`


## Usage
1. Connect  Arduino via USB
1. Execute `node index.js`
1. Navigate to [`http://localhost:8080`](http://localhost:8080) in web browser


