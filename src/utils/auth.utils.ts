import { JwtToken, AuthHeaders } from "../types/dismissible.types";

/**
 * Resolves a JWT token from either a static string, sync function, or async function
 * @param jwt - The JWT token (string, sync function, or async function)
 * @returns Promise that resolves to the JWT token or undefined
 */
export const resolveJwt = async (
  jwt: JwtToken | undefined,
): Promise<string | undefined> => {
  if (typeof jwt === "function") {
    try {
      const result = jwt();
      return await Promise.resolve(result);
    } catch (error) {
      console.warn("Failed to resolve JWT from function:", error);
      return undefined;
    }
  }
  return jwt;
};

/**
 * Creates authentication headers from a JWT token
 * @param jwt - The JWT token (string, sync function, or async function)
 * @returns Promise that resolves to headers object with Authorization header if JWT is available
 */
export const getAuthHeaders = async (jwt?: JwtToken): Promise<AuthHeaders> => {
  const token = await resolveJwt(jwt);
  return token ? { Authorization: `Bearer ${token}` } : {};
};
