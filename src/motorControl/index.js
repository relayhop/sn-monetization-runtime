const MotorControl = require('./motorControl');
const VoltageStabilizer = require('./voltageStabilizer');

class MotorControlSystem {
  constructor() {
    this.motorControl = new MotorControl();
    this.voltageStabilizer = new VoltageStabilizer(this.motorControl);
  }

  async startMotors(motors) {
    try {
      await this.voltageStabilizer.stabilizeVoltage(motors);
    } catch (error) {
      console.error('Motor control failed:', error);
      throw error;
    }
  }

  // Other existing methods...
}

module.exports = MotorControlSystem;