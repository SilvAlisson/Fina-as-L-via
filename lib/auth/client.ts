import { createAuthClient } from "better-auth/react";

// Tenta pegar a URL pública (cliente) ou a URL padrão (servidor)
const baseURL = 
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 
  process.env.BETTER_AUTH_URL || 
  "https://fina-as-l-via.vercel.app"; // Fallback de segurança

export const authClient = createAuthClient({
  baseURL: baseURL.replace(/\/$/, ""),
});

export const googleSignInAvailable = true;