import { describe, it, expect, vi } from "vitest";
import { resolveJwt, getAuthHeaders } from "./auth.utils";

describe("auth.utils", () => {
  describe("resolveJwt", () => {
    it("should return string JWT token as-is", async () => {
      const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      expect(await resolveJwt(token)).toBe(token);
    });

    it("should call function and return result", async () => {
      const token = "dynamic-token";
      const jwtFunction = vi.fn().mockReturnValue(token);
      expect(await resolveJwt(jwtFunction)).toBe(token);
      expect(jwtFunction).toHaveBeenCalledOnce();
    });

    it("should call async function and return result", async () => {
      const token = "async-token";
      const asyncJwtFunction = vi.fn().mockResolvedValue(token);
      expect(await resolveJwt(asyncJwtFunction)).toBe(token);
      expect(asyncJwtFunction).toHaveBeenCalledOnce();
    });

    it("should return undefined for undefined input", async () => {
      expect(await resolveJwt(undefined)).toBeUndefined();
    });

    it("should handle function errors gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const errorFunction = vi.fn().mockImplementation(() => {
        throw new Error("Token fetch failed");
      });

      expect(await resolveJwt(errorFunction)).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to resolve JWT from function:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("getAuthHeaders", () => {
    it("should return Authorization header for string token", async () => {
      const token = "valid-token";
      expect(await getAuthHeaders(token)).toEqual({
        Authorization: "Bearer valid-token",
      });
    });

    it("should return Authorization header for function token", async () => {
      const token = "function-token";
      const jwtFunction = vi.fn().mockReturnValue(token);
      expect(await getAuthHeaders(jwtFunction)).toEqual({
        Authorization: "Bearer function-token",
      });
    });

    it("should return Authorization header for async function token", async () => {
      const token = "async-function-token";
      const asyncJwtFunction = vi.fn().mockResolvedValue(token);
      expect(await getAuthHeaders(asyncJwtFunction)).toEqual({
        Authorization: "Bearer async-function-token",
      });
    });

    it("should return empty object for undefined token", async () => {
      expect(await getAuthHeaders(undefined)).toEqual({});
    });

    it("should return empty object when function throws error", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const errorFunction = vi.fn().mockImplementation(() => {
        throw new Error("Token fetch failed");
      });

      expect(await getAuthHeaders(errorFunction)).toEqual({});
      consoleSpy.mockRestore();
    });
  });
});
