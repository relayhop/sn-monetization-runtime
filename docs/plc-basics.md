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
- Determines required output states based on programmed conditions
- Updates the output image table

### 3. Output Updating
The PLC writes the output image table to physical outputs:
- Motor starters and drives
- Solenoid valves
- Indicator lights
- Analog control signals

### 4. Scan Cycle
This three-step process (input scan → program execution → output update) repeats continuously, typically in milliseconds. The scan time depends on program complexity and I/O count.

## Key Components

- **CPU**: Executes the control program
- **Memory**: Stores program and data
- **I/O Modules**: Interface with field devices
- **Power Supply**: Provides regulated power
- **Communication Ports**: Enable programming and networking

## Common Programming Languages

1. **Ladder Logic (LD)**: Graphical, resembles relay logic diagrams
2. **Function Block Diagram (FBD)**: Graphical blocks with data flow
3. **Structured Text (ST)**: High-level text-based language
4. **Sequential Function Chart (SFC)**: State-based control
5. **Instruction List (IL)**: Low-level assembly-like language

## Advantages

- Reliable operation in harsh industrial environments
- Easy to program and troubleshoot
- Flexible and reconfigurable
- Real-time deterministic control
- Standardized (IEC 61131-3)

## Typical Applications

- Assembly lines and conveyor systems
- Packaging and bottling machines
- HVAC control systems
- Water treatment plants
- Robotic work cells
