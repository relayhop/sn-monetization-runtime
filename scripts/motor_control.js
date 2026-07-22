const { GridMonitor } = require('../data/grid_monitor');

class MotorController {
  constructor(gridMonitor) {
    this.gridMonitor = gridMonitor;
    this.motors = [];
  }

  addMotor(motor) {
    this.motors.push(motor);
  }

  startMotorsSequentially() {
    const startNextMotor = (index) => {
      if (index >= this.motors.length) return;

      const motor = this.motors[index];
      const currentVoltage = this.gridMonitor.getCurrentVoltage();

      if (currentVoltage > motor.voltageThreshold) {
        motor.start();
        console.log(`Motor ${motor.id} started successfully`);

        // Start next motor after a delay
        setTimeout(() => startNextMotor(index + 1), motor.startDelay);
      } else {
        console.log(`Voltage too low to start Motor ${motor.id}. Waiting...`);
        setTimeout(() => startNextMotor(index), 1000); // Retry after 1 second
      }
    };

    startNextMotor(0);
  }
}

module.exports = { MotorController };