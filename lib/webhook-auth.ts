import type { NextRequest } from "next/server";

const WEBHOOK_SECRET_HEADER = "x-captureflow-secret";

export function isWebhookAuthorized(request: NextRequest) {
  const expectedSecret = process.env.CAPTUREFLOW_WEBHOOK_SECRET;
  const providedSecret = request.headers.get(WEBHOOK_SECRET_HEADER);

  if (!expectedSecret || !providedSecret) {
    return false;
  }

  return providedSecret === expectedSecret;
}

export { WEBHOOK_SECRET_HEADER };
