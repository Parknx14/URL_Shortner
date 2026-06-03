
const CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * encode(num)
 * Converts a positive integer to a Base62 string.
 *
 * ALGORITHM (division-remainder):
 *   encode(1000):
 *     1000 ÷ 62 = 16 remainder 8  → CHARS[8] = '8'
 *     16   ÷ 62 = 0  remainder 16 → CHARS[16] = 'g'
 *     Result (built right-to-left): 'g8'
 *
 * @param {number} num - positive integer
 * @returns {string} Base62 encoded string
 */
function encode(num) {
  if (num === 0) return CHARS[0]; // edge case: 0 → '0'

  let result = '';

  // Keep dividing by 62 and collect remainders
  while (num > 0) {
    const remainder = num % 62;  // % = modulo (remainder after division)
    result = CHARS[remainder] + result; // prepend (builds right-to-left)
    num = Math.floor(num / 62);         // integer division
  }

  return result;
}

/**
 * decode(str)
 * Converts a Base62 string back to a number.
 * Reverse of encode().
 *
 * decode('g8'):
 *   'g' = index 16 → 16 * 62^1 = 992
 *   '8' = index 8  → 8  * 62^0 = 8
 *   Total: 1000 ✓
 *
 * @param {string} str - Base62 string
 * @returns {number}
 */
function decode(str) {
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    const charIndex = CHARS.indexOf(str[i]);
    // Math.pow(base, exponent): 62 to the power of position from right
    result = result * 62 + charIndex;
  }
  return result;
}

/**
 * generateCode(counter)
 * Creates a short code from an auto-incrementing counter.
 *
 * We start at 100000 so all codes are at least 3 chars long.
 * encode(100000) = "q0T"
 *
 * @param {number} counter - unique incrementing number
 * @returns {string} short code like "aB3x9K"
 */
function generateCode(counter) {
  return encode(counter);
}

module.exports = { encode, decode, generateCode };
