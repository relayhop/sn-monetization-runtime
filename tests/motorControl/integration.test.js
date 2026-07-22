const MotorControlSystem = require('../../src/motorControl/index');

describe('MotorControlSystem Integration', () => {
  let motorControlSystem;

  beforeEach(() => {
    motorControlSystem = new MotorControlSystem();
  });

  test('should stabilize voltage when starting multiple motors', async () => {
    const motors = ['motor1', 'motor2', 'motor3'];

    // Mock the voltage stabilizer to verify it's being used
    jest.spyOn(motorControlSystem.voltageStabilizer, 'stabilizeVoltage');

    await motorControlSystem.startMotors(motors);

    expect(motorControlSystem.voltageStabilizer.stabilizeVoltage).toHaveBeenCalledWith(motors);
  });

  test('should handle errors during motor control', async () => {
    const motors = ['motor1', 'motor2'];

    // Mock the voltage stabilizer to throw an error
    jest.spyOn(motorControlSystem.voltageStabilizer, 'stabilizeVoltage')
      .mockRejectedValue(new Error('Stabilization failed'));

    await expect(motorControlSystem.startMotors(motors)).rejects.toThrow('Stabilization failed');
  });
});