import { createAuthClient } from "better-auth/client";

const baseURL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
});

export const {
  signIn,
  signUp,
  signOut,
  getSession,
  updateUser,
} = authClient;

export async function socialSignIn(provider: "github" | "google", redirectTo?: string) {
  return authClient.signIn.social({
    provider,
    callbackURL: redirectTo ?? `${baseURL}/dashboard`,
  });
}

export async function emailSignIn(email: string, password: string) {
  return authClient.signIn.email({
    email,
    password,
  });
}

export async function emailSignUp(email: string, password: string, name: string) {
  return authClient.signUp.email({
    email,
    password,
    name,
  });
}

export async function signOutUser() {
  return authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = "/login";
      },
    },
  });
}

export async function getCurrentSession() {
  return authClient.getSession();
}
