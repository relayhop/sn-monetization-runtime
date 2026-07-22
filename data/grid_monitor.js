// Existing code...

class GridMonitor {
  // Existing methods...

  getCurrentVoltage() {
    // Implementation to get current grid voltage
    // This would typically interface with hardware or API
    return this.currentVoltage;
  }

  // New method to communicate with motor controller
  setMotorController(motorController) {
    this.motorController = motorController;
  }

  // Existing code...
}

module.exports = { GridMonitor };