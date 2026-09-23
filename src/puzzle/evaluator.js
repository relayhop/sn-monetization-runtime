// src/puzzle/evaluator.js
// Evaluator for Math Puzzle sequences with cycle detection.
// This module provides a safe evaluation that stops on termination,
// detects loops, and guards against excessive recursion depth.

/**
 * Apply the puzzle-specific transformation to a state.
 * Placeholder implementation – replace with the actual logic used by the
 * runtime. The function must accept a numeric state and return the next
 * state in the sequence.
 *
 * @param {number} state - Current state value.
 * @returns {number} - Next state value.
 */
function applyTransformation(state) {
  // TODO: Implement the real transformation logic.
  // For now we simply return the state unchanged to keep the module
  // functional in environments where the real logic is injected at runtime.
  return state;
}

/**
 * Evaluate a sequence of puzzle states.
 *
 * The function walks the sequence starting from the first element, applying
 * the puzzle transformation until one of the following conditions is met:
 *   • The sequence reaches a terminating state (0 or 1).
 *   • A previously visited state is encountered, indicating a loop.
 *   • The maximum allowed depth is exceeded, preventing runaway execution.
 *
 * @param {number[]} sequence - Initial sequence of numeric states.
 * @param {number} [maxDepth=10000] - Upper bound on iteration count.
 * @returns {{status: string, depth: number, final?: number, cycle?: number}}
 *   An object describing the outcome.
 *   • status: 'terminated', 'loop_detected', or 'depth_exceeded'.
 *   • depth: Number of iterations performed.
 *   • final: The terminating value (present when status is 'terminated').
 *   • cycle: The first repeated state (present when status is 'loop_detected').
 */
function evaluateSequence(sequence, maxDepth = 10000) {
  if (!Array.isArray(sequence) || sequence.length === 0) {
    throw new Error('Sequence must be a non‑empty array of numbers');
  }

  const visited = new Set();
  let current = sequence[0];
  let depth = 0;

  while (depth < maxDepth) {
    if (visited.has(current)) {
      return { status: 'loop_detected', depth, cycle: current };
    }
    visited.add(current);

    // Apply the puzzle-specific transformation.
    current = applyTransformation(current);

    // Check for termination conditions.
    if (current === 0 || current === 1) {
      return { status: 'terminated', depth, final: current };
    }

    depth++;
  }

  // If we exit the loop, the depth limit was hit.
  return { status: 'depth_exceeded', depth };
}

module.exports = {
  evaluateSequence,
  // Exporting applyTransformation for testing/mocking purposes.
  applyTransformation
};