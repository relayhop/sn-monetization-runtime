# PLC Basics in Industrial Automation

## What is a PLC?

A Programmable Logic Controller (PLC) is a ruggedized industrial computer used to automate electromechanical processes in manufacturing plants, machinery, and control systems.

## Basic Operation

### 1. Input Scanning
The PLC continuously reads the status of input devices:
- Sensors (temperature, pressure, proximity)
- Switches and buttons
- Encoders and analog signals

Inputs are stored in an input image table in memory.

### 2. Program Execution
The PLC executes the user program in a cyclic scan:
- Reads the input image table
- Executes logic instructions (ladder logic, function blocks, or structured text)
- Determines required outputs based on programmed conditions
- Updates the output image table

### 3. Output Updating
The PLC writes to output devices:
- Motors and actuators
- Valves and solenoids
- Indicator lights
- Variable frequency drives (VFDs)

### 4. Scan Cycle
This three-step process (input scan → program execution → output update) repeats continuously, typically in milliseconds, ensuring real-time control.

## Key Components

- **CPU**: Executes the control program
- **Memory**: Stores program and data
- **I/O Modules**: Interface with field devices
- **Power Supply**: Provides regulated power
- **Communication Ports**: Enable programming and networking

## Programming Languages (IEC 61131-3)

1. **Ladder Diagram (LD)**: Graphical, resembles relay logic
2. **Function Block Diagram (FBD)**: Graphical, shows data flow
3. **Structured Text (ST)**: High-level text language
4. **Instruction List (IL)**: Low-level assembly-like
5. **Sequential Function Chart (SFC)**: State-based control

## Advantages

- Reliable and rugged for harsh industrial environments
- Easy to program and troubleshoot
- Flexible and reconfigurable
- Real-time deterministic control
- Standardized programming languages

## Common Applications

- Assembly lines and conveyor systems
- Packaging and bottling machines
- HVAC control systems
- Water treatment plants
- Traffic light control
- Building automation
