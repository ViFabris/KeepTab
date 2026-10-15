export function sanitizePin(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6);
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}
