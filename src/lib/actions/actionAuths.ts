"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { SignInSchema } from "../formValidationSchemas";

export const verifyCredentials = async (finalData: SignInSchema) => {
  try {
    const username = finalData.username;
    const passwordHash = finalData.passwordHash;
    const result = await signIn("credentials", {
      username,
      passwordHash,
      //   redirectTo: "/dashboard",
      redirect: false,
    });

    return result;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            message: "Invalid credentials",
          };
        default:
          return {
            message: "Something went wrong.",
          };
      }
    }
    throw error;
  }
};

export const handleSignOut = async () => {
  await signOut({ redirectTo: "/" });
};

export const googleLogin = async () => {
  const result = await signIn("google", {
    redirectTo: "/dashboard",
  });
};
