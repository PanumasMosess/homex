"use server";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const userSignIn = async ({
  username,
  passwordHash,
}: {
  username: string;
  passwordHash: string;
}) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        username: username,
        isActive: true,
      },
    });

    if (!user || !user.passwordHash) {
      console.log("User not found or has no password.");
      return null;
    }

    const isPasswordMatch = await bcrypt.compare(passwordHash, user.passwordHash);

    if (isPasswordMatch) {
      console.log("� 5. Password Matched");
      const { passwordHash, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        id: user.id.toString(),
        email: user.email ?? "non@mail.co",
        image: user.avatarUrl ?? "/profile_temp.png",
      };
    }

    // console.log("Password does not match.");
    return null;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
};
