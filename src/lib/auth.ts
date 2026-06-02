// Allowed email addresses — the primary access control
export const ALLOWED_EMAILS = [
  'niranjangnair81@gmail.com',
  'anushree31suresh@gmail.com',
] as const;

export type AllowedEmail = (typeof ALLOWED_EMAILS)[number];

// Display name map
export const DISPLAY_NAMES: Record<AllowedEmail, string> = {
  'niranjangnair81@gmail.com': 'Niranjan',
  'anushree31suresh@gmail.com': 'Anushree',
};

/**
 * Check if an email is on the allowlist
 */
export function isAllowedEmail(email: string): boolean {
  return ALLOWED_EMAILS.includes(email.toLowerCase().trim() as AllowedEmail);
}

/**
 * Get the display name for an email
 */
export function getDisplayName(email: string): string {
  return DISPLAY_NAMES[email.toLowerCase().trim() as AllowedEmail] ?? 'Unknown';
}

// Password validation rules
export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
} as const;

export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a password against the strength rules
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`At least ${PASSWORD_RULES.minLength} characters`);
  }
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter');
  }
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter');
  }
  if (PASSWORD_RULES.requireNumber && !/[0-9]/.test(password)) {
    errors.push('At least one number');
  }
  if (PASSWORD_RULES.requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('At least one special character');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Client-side rate limiter using localStorage
 */
export function isRateLimited(
  key: string,
  maxAttempts: number,
  windowMs: number
): { limited: boolean; remainingMs: number; attempts: number } {
  const storageKey = `rate_limit_${key}`;
  const now = Date.now();

  try {
    const stored = localStorage.getItem(storageKey);
    const data: { attempts: number; windowStart: number } = stored
      ? JSON.parse(stored)
      : { attempts: 0, windowStart: now };

    // Reset window if expired
    if (now - data.windowStart > windowMs) {
      data.attempts = 0;
      data.windowStart = now;
    }

    const limited = data.attempts >= maxAttempts;
    const remainingMs = limited ? windowMs - (now - data.windowStart) : 0;

    return { limited, remainingMs, attempts: data.attempts };
  } catch {
    return { limited: false, remainingMs: 0, attempts: 0 };
  }
}

/**
 * Increment the rate limit counter
 */
export function incrementRateLimit(key: string, windowMs: number): void {
  const storageKey = `rate_limit_${key}`;
  const now = Date.now();

  try {
    const stored = localStorage.getItem(storageKey);
    const data: { attempts: number; windowStart: number } = stored
      ? JSON.parse(stored)
      : { attempts: 0, windowStart: now };

    if (now - data.windowStart > windowMs) {
      data.attempts = 1;
      data.windowStart = now;
    } else {
      data.attempts += 1;
    }

    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // Silently fail — rate limiting is defense-in-depth
  }
}
