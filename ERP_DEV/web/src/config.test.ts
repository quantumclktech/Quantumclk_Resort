import { describe, expect, it } from "vitest";
import { baseUrl } from "./config";

describe("baseUrl", () => {
  it("uses the page's own origin when nothing is set (works on localhost, ngrok and the VPS alike)", () => {
    expect(baseUrl(undefined, "https://erp.example.test")).toBe("https://erp.example.test");
    expect(baseUrl("", "https://erp.example.test")).toBe("https://erp.example.test");
    expect(baseUrl("   ", "https://erp.example.test")).toBe("https://erp.example.test");
  });

  it("keeps an explicit value, without a trailing slash", () => {
    expect(baseUrl("http://localhost:8082/", "https://erp.example.test")).toBe("http://localhost:8082");
  });
});
