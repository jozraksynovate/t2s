import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a version 4 compliant RFC4122 UUID.
 * Leverages native modern cryptographically secure APIs (CSPRNG).
 */
export function generateUUID(): string {
  return crypto.randomUUID()
}
