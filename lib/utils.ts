import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a version 4 compliant RFC4122 UUID.
 * Designed specifically for secure production environments (Cloud Run HTTPS & localhost).
 * Uses native cryptographically secure APIs (CSPRNG).
 */
export function generateUUID(): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  // Fallback for older Node.js/server environments without globalThis.crypto
  return require("crypto").randomUUID()
}
