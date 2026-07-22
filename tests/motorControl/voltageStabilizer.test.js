const VoltageStabilizer = require('../../src/motorControl/voltageStabilizer');
const MotorControl = require('../../src/motorControl/motorControl');

describe('VoltageStabilizer', () => {
  let voltageStabilizer;
  let mockMotorControl;

  beforeEach(() => {
    mockMotorControl = {
      getVoltage: jest.fn(),
      startMotors: jest.fn(),
      startMotor: jest.fn()
    };
    voltageStabilizer = new VoltageStabilizer(mockMotorControl);
  });

  test('should start motors normally when voltage is stable', async () => {
    mockMotorControl.getVoltage.mockResolvedValue(1.0); // Nominal voltage
    const motors = ['motor1', 'motor2'];

    await voltageStabilizer.stabilizeVoltage(motors);

    expect(mockMotorControl.startMotors).toHaveBeenCalledWith(motors);
    expect(mockMotorControl.startMotor).not.toHaveBeenCalled();
  });

  test('should delay motor starts when voltage is low', async () => {
    mockMotorControl.getVoltage.mockResolvedValue(0.8); // Low voltage
    const motors = ['motor1', 'motor2'];

    await voltageStabilizer.stabilizeVoltage(motors);

    expect(mockMotorControl.startMotors).not.toHaveBeenCalled();
    expect(mockMotorControl.startMotor).toHaveBeenCalledTimes(motors.length);
  });

  test('should handle errors during voltage check', async () => {
    mockMotorControl.getVoltage.mockRejectedValue(new Error('Voltage sensor error'));
    const motors = ['motor1', 'motor2'];

    await expect(voltageStabilizer.stabilizeVoltage(motors)).rejects.toThrow('Voltage sensor error');
  });
});