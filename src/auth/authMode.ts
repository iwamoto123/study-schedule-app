export type AuthMode = 'line' | 'email' | 'dev';

const ALL_MODES: AuthMode[] = ['line', 'email', 'dev'];

const rawValue =
  process.env.NEXT_PUBLIC_AUTH_PROVIDERS ??
  process.env.NEXT_PUBLIC_AUTH_MODE ??
  'line';

const requestedModes = rawValue
  .split(',')
  .map((v) => v.trim().toLowerCase())
  .filter((v): v is AuthMode => (ALL_MODES as string[]).includes(v));

const uniqueModes = Array.from(new Set(requestedModes));

export const AUTH_MODES: AuthMode[] = uniqueModes.length > 0 ? uniqueModes : ['line'];

export const PRIMARY_AUTH_MODE: AuthMode = AUTH_MODES[0];

export const isModeEnabled = (mode: AuthMode): boolean => AUTH_MODES.includes(mode);
