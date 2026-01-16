import { describe, it, expect } from "vitest";
import { checkUrlSecurity } from "./url.utils";

describe("checkUrlSecurity", () => {
  describe("secure URLs", () => {
    it("should return isSecure true for https URLs", () => {
      const result = checkUrlSecurity("https://api.example.com");

      expect(result.isSecure).toBe(true);
      expect(result.isHttps).toBe(true);
      expect(result.isLocalhost).toBe(false);
    });

    it("should return isSecure true for https URLs with paths", () => {
      const result = checkUrlSecurity("https://api.example.com/v1/users");

      expect(result.isSecure).toBe(true);
      expect(result.isHttps).toBe(true);
      expect(result.isLocalhost).toBe(false);
    });

    it("should return isSecure true for localhost with http", () => {
      const result = checkUrlSecurity("http://localhost:3000");

      expect(result.isSecure).toBe(true);
      expect(result.isHttps).toBe(false);
      expect(result.isLocalhost).toBe(true);
    });

    it("should return isSecure true for localhost without port", () => {
      const result = checkUrlSecurity("http://localhost");

      expect(result.isSecure).toBe(true);
      expect(result.isHttps).toBe(false);
      expect(result.isLocalhost).toBe(true);
    });

    it("should return isSecure true for 127.0.0.1", () => {
      const result = checkUrlSecurity("http://127.0.0.1:8080");

      expect(result.isSecure).toBe(true);
      expect(result.isHttps).toBe(false);
      expect(result.isLocalhost).toBe(true);
    });

    it("should return isSecure true for IPv6 localhost [::1]", () => {
      const result = checkUrlSecurity("http://[::1]:3000");

      expect(result.isSecure).toBe(true);
      expect(result.isHttps).toBe(false);
      expect(result.isLocalhost).toBe(true);
    });

    it("should return isSecure true for localhost with https", () => {
      const result = checkUrlSecurity("https://localhost:3000");

      expect(result.isSecure).toBe(true);
      expect(result.isHttps).toBe(true);
      expect(result.isLocalhost).toBe(true);
    });
  });

  describe("insecure URLs", () => {
    it("should return isSecure false for http URLs", () => {
      const result = checkUrlSecurity("http://api.example.com");

      expect(result.isSecure).toBe(false);
      expect(result.isHttps).toBe(false);
      expect(result.isLocalhost).toBe(false);
    });

    it("should return isSecure false for http URLs with paths", () => {
      const result = checkUrlSecurity("http://api.example.com/v1/users");

      expect(result.isSecure).toBe(false);
      expect(result.isHttps).toBe(false);
      expect(result.isLocalhost).toBe(false);
    });
  });

  describe("invalid URLs", () => {
    it("should return isSecure false for invalid URLs", () => {
      const result = checkUrlSecurity("not-a-valid-url");

      expect(result.isSecure).toBe(false);
      expect(result.isHttps).toBe(false);
      expect(result.isLocalhost).toBe(false);
    });

    it("should return isSecure false for empty string", () => {
      const result = checkUrlSecurity("");

      expect(result.isSecure).toBe(false);
      expect(result.isHttps).toBe(false);
      expect(result.isLocalhost).toBe(false);
    });

    it("should return isSecure false for relative paths", () => {
      const result = checkUrlSecurity("/api/v1/users");

      expect(result.isSecure).toBe(false);
      expect(result.isHttps).toBe(false);
      expect(result.isLocalhost).toBe(false);
    });
  });
});
