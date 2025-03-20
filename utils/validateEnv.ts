/**
 * Validates required environment variables are set
 * This should be called at startup
 */
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const requiredEnvVars = ['NEWS_API_KEY', 'UPSTASH_REDIS_URL', 'UPSTASH_REDIS_TOKEN'];
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Logs warnings for missing environment variables
 * @returns true if all required variables are set, false otherwise
 */
export function checkEnvironment(): boolean {
  const { valid, missing } = validateEnvironment();

  if (!valid) {
    console.warn(
      `WARNING: Missing required environment variables: ${missing.join(', ')}. ` +
      'Some features may be limited or unavailable.'
    );
  }

  return valid;
}