import { describe, expect, it, vi } from "vitest";
import { createApi, ForbiddenError, SessionEndedError } from "./api";
import { config } from "./config";
import type { Session } from "./auth";

function fakeSession(overrides: Partial<Session> = {}): Session {
  return {
    token: vi.fn().mockResolvedValue("t1"),
    refresh: vi.fn().mockResolvedValue("t2"),
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
const json = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("api request", () => {
  it("sends the access token to the gateway", async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(200, { ok: true }));
    await createApi(fakeSession(), fetchFn)("/api/v1/me");
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${config.apiUrl}/api/v1/me`); // configured base + path, not a hard-coded host
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer t1");
  });

  it("refreshes once after a 401 and retries with the new token", async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(json(401)).mockResolvedValueOnce(json(200, { ok: 1 }));
    const s = fakeSession();
    await expect(createApi(s, fetchFn)("/x")).resolves.toEqual({ ok: 1 });
    expect(s.refresh).toHaveBeenCalledTimes(1);
    expect(new Headers(fetchFn.mock.calls[1][1].headers).get("Authorization")).toBe("Bearer t2");
  });

  it("sends the user to sign-in after a second 401", async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(401));
    const s = fakeSession();
    await expect(createApi(s, fetchFn)("/x")).rejects.toBeInstanceOf(SessionEndedError);
    expect(s.login).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("sends the user to sign-in when the token cannot be refreshed", async () => {
    const s = fakeSession({ token: vi.fn().mockRejectedValue(new Error("expired")) });
    const fetchFn = vi.fn();
    await expect(createApi(s, fetchFn)("/x")).rejects.toBeInstanceOf(SessionEndedError);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(s.login).toHaveBeenCalled();
  });

  it("turns 403 into ForbiddenError without retrying", async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(403));
    await expect(createApi(fakeSession(), fetchFn)("/x")).rejects.toBeInstanceOf(ForbiddenError);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("surfaces the server's error message", async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(409, { code: "CONFLICT", message: "Email already exists." }));
    await expect(createApi(fakeSession(), fetchFn)("/x")).rejects.toThrow("Email already exists.");
  });

  it("leaves the multipart Content-Type of a FormData upload to the browser", async () => {
    const fetchFn = vi.fn().mockResolvedValue(json(201, { ok: true }));
    const body = new FormData();
    body.append("firstName", "Rohan");
    await createApi(fakeSession(), fetchFn)("/upload", { method: "POST", body });
    expect(new Headers(fetchFn.mock.calls[0][1].headers).has("Content-Type")).toBe(false);
  });

  it("returns images as a Blob", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "Content-Type": "image/png" } }));
    const blob = await createApi(fakeSession(), fetchFn)<Blob>("/proof");
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBe(3);
  });
});
