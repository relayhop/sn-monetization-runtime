const { MotorControl } = require('./motorControl');

class VoltageStabilizer {
  constructor(motorControl) {
    this.motorControl = motorControl;
    this.voltageThreshold = 0.9; // 90% of nominal voltage
    this.stabilizationDelay = 1000; // 1 second delay between motor starts
  }

  async stabilizeVoltage(motors) {
    try {
      // Check current voltage level
      const currentVoltage = await this.motorControl.getVoltage();

      if (currentVoltage < this.voltageThreshold) {
        // If voltage is too low, delay motor starts
        await this.delayMotorStarts(motors);
      } else {
        // Start motors normally if voltage is stable
        await this.motorControl.startMotors(motors);
      }
    } catch (error) {
      console.error('Voltage stabilization failed:', error);
      throw error;
    }
  }

  async delayMotorStarts(motors) {
    console.log('Voltage low - delaying motor starts to prevent voltage drop');

    // Start motors sequentially with delay
    for (const motor of motors) {
      await this.motorControl.startMotor(motor);
      await new Promise(resolve => setTimeout(resolve, this.stabilizationDelay));
    }
  }
}

module.exports = VoltageStabilizer;