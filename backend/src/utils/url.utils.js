/**
 * URL validation utilities.
 * Uses the WHATWG URL API (built-in) for robust parsing —
 * never string.includes(), which is trivially bypassed by
 * URLs like `evil.com/github.com/` or `github.com.evil.com`.
 */

const ALLOWED_HOSTNAMES = Object.freeze({
  linkedin:   ['linkedin.com', 'www.linkedin.com'],
  github:     ['github.com', 'www.github.com'],
  leetcode:   ['leetcode.com', 'www.leetcode.com'],
  codeforces: ['codeforces.com', 'www.codeforces.com'],
  hackerrank: ['hackerrank.com', 'www.hackerrank.com'],
  portfolio:  null,  // any HTTPS URL is acceptable
});

/**
 * Validates a social/profile URL for a given platform.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
function validateProfileUrl(platform, rawUrl) {
  if (!rawUrl) return { valid: true };  // empty is fine (optional field)

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, reason: `${platform} URL is not a valid URL` };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, reason: `${platform} URL must use HTTPS` };
  }

  const allowedHosts = ALLOWED_HOSTNAMES[platform];
  if (allowedHosts && !allowedHosts.includes(parsed.hostname)) {
    return {
      valid: false,
      reason: `${platform} URL must be from ${allowedHosts.join(' or ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validates all social links in one call.
 * Returns an array of error strings (empty = all valid).
 */
function validateSocialLinks(links = {}) {
  const errors = [];
  for (const [platform, url] of Object.entries(links)) {
    if (!ALLOWED_HOSTNAMES.hasOwnProperty(platform)) continue;
    const result = validateProfileUrl(platform, url);
    if (!result.valid) errors.push(result.reason);
  }
  return errors;
}

module.exports = { validateProfileUrl, validateSocialLinks };
