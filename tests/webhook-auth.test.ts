import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { isWebhookAuthorized, WEBHOOK_SECRET_HEADER } from "@/lib/webhook-auth";

function requestWithSecret(secret?: string) {
  return {
    headers: new Headers(secret ? { [WEBHOOK_SECRET_HEADER]: secret } : {})
  } as NextRequest;
}

describe("webhook auth", () => {
  it("rejects requests when no server secret is configured", () => {
    delete process.env.CAPTUREFLOW_WEBHOOK_SECRET;

    expect(isWebhookAuthorized(requestWithSecret("client-secret"))).toBe(false);
  });

  it("rejects requests without a provided secret", () => {
    process.env.CAPTUREFLOW_WEBHOOK_SECRET = "server-secret";

    expect(isWebhookAuthorized(requestWithSecret())).toBe(false);
  });

  it("rejects requests with an invalid secret", () => {
    process.env.CAPTUREFLOW_WEBHOOK_SECRET = "server-secret";

    expect(isWebhookAuthorized(requestWithSecret("wrong-secret"))).toBe(false);
  });

  it("accepts requests with the expected secret", () => {
    process.env.CAPTUREFLOW_WEBHOOK_SECRET = "server-secret";

    expect(isWebhookAuthorized(requestWithSecret("server-secret"))).toBe(true);
  });
});
