import crypto from "crypto"

export interface DokuSignatureParams {
  clientId: string
  requestId: string
  timestamp: string
  targetPath: string
  requestBody?: any
  secretKey: string
}

/**
 * Generates the HMAC-SHA256 signature required for DOKU API requests (V2).
 * Follows the canonicalization process: Client-Id, Request-Id, Request-Timestamp, Request-Target, Digest.
 */
export function generateDokuSignature({
  clientId,
  requestId,
  timestamp,
  targetPath,
  requestBody,
  secretKey,
}: DokuSignatureParams): string {
  // 1. Generate Digest (SHA256 of body, base64 encoded)
  let digest = ""
  if (requestBody) {
    const bodyString = JSON.stringify(requestBody)
    digest = crypto
      .createHash("sha256")
      .update(bodyString, "utf8")
      .digest("base64")
  }

  // 2. Prepare Canonical String
  const components = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${timestamp}`,
    `Request-Target:${targetPath}`,
  ]

  if (digest) {
    components.push(`Digest:${digest}`)
  }

  const canonicalString = components.join("\n")

  // 3. Generate HMAC-SHA256
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(canonicalString)
    .digest("base64")

  return `HMACSHA256=${signature}`
}

/**
 * Verifies a DOKU webhook notification signature.
 */
export function verifyDokuWebhook(
  headers: Record<string, string | string[] | undefined>,
  rawBody: string | Buffer,
  secretKey: string,
  targetPath: string
): boolean {
  const clientId = headers["client-id"] as string
  const requestId = headers["request-id"] as string
  const timestamp = headers["request-timestamp"] as string
  const incomingSignature = headers["signature"] as string

  if (!clientId || !requestId || !timestamp || !incomingSignature) {
    return false
  }

  // 1. Calculate Digest
  const digest = crypto
    .createHash("sha256")
    .update(rawBody)
    .digest("base64")

  // 2. Build Canonical String
  const canonicalString = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${timestamp}`,
    `Request-Target:${targetPath}`,
    `Digest:${digest}`
  ].join("\n")

  // 3. Calculate Signature
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(canonicalString)
    .digest("base64")

  const calculatedSignature = `HMACSHA256=${signature}`

  return calculatedSignature === incomingSignature
}
