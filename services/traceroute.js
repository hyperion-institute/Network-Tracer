const { spawn } = require('child_process');

// Matches a traceroute output line, e.g.:
// " 3  203.0.113.1 (203.0.113.1)  12.345 ms  11.234 ms  10.987 ms"
const HOP_LINE = /^\s*(\d+)\s+(.*)$/;
const IP_REGEX = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;
const RTT_REGEX = /([\d.]+)\s*ms/g;

/**
 * Parse a single line of `traceroute` output into a structured hop object.
 */
function parseLine(line) {
  const match = line.match(HOP_LINE);
  if (!match) return null;

  const hopNumber = parseInt(match[1], 10);
  const rest = match[2].trim();

  // A hop that timed out looks like: "3  * * *"
  if (rest.startsWith('*')) {
    return { hop: hopNumber, ip: null, hostname: null, rtt: null, timeout: true };
  }

  const ipMatch = rest.match(IP_REGEX);
  const rttMatches = [...rest.matchAll(RTT_REGEX)].map((m) => parseFloat(m[1]));
  const avgRtt = rttMatches.length
    ? rttMatches.reduce((a, b) => a + b, 0) / rttMatches.length
    : null;

  const firstToken = rest.split(' ')[0];
  const hostname = firstToken && firstToken !== ipMatch?.[1] ? firstToken : null;

  return {
    hop: hopNumber,
    ip: ipMatch ? ipMatch[1] : null,
    hostname,
    rtt: avgRtt !== null ? Number(avgRtt.toFixed(2)) : null,
    timeout: !ipMatch,
  };
}

/**
 * Run the system `traceroute` command against a target and resolve with
 * an array of parsed hop objects.
 *
 * Requires the `traceroute` binary to be installed on the host machine
 * (available by default on most Linux distros and macOS).
 */
function runTraceroute(target, maxHops = 30) {
  return new Promise((resolve, reject) => {
    // -n : skip reverse DNS lookups (much faster)
    // -q1: send 1 probe per hop instead of the default 3 (faster)
    // -m : maximum number of hops before giving up
    const args = ['-n', '-q', '1', '-m', String(maxHops), target];
    const proc = spawn('traceroute', args);

    let output = '';
    let errorOutput = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    proc.on('error', (err) => {
      // Most common cause: the `traceroute` binary isn't installed
      reject(new Error(`Could not start traceroute: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0 && !output) {
        return reject(new Error(errorOutput || `traceroute exited with code ${code}`));
      }

      const lines = output.split('\n').slice(1); // first line is just a header
      const hops = lines.map(parseLine).filter(Boolean);
      resolve(hops);
    });

    // Safety net: kill the process if it somehow hangs
    const killTimer = setTimeout(() => proc.kill(), 30000);
    proc.on('close', () => clearTimeout(killTimer));
  });
}

module.exports = { runTraceroute };
