import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black px-6 transition-colors duration-300">
      <div className="absolute top-6 right-6 z-10">
        <ThemeSwitcher />
      </div>

      <main className="flex w-full max-w-sm flex-col items-center gap-8 bg-white p-8 dark:bg-zinc-950 sm:p-12 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800 transition-colors duration-300">
        <Link href="/">
          <Image
            className="rounded-xl dark:invert"
            src="/logo.png"
            alt="homex logo"
            width={120}
            height={24}
            priority
          />
        </Link>

        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Welcome to HomeX
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Smart Build
          </p>
        </div>

        <form className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium ml-1 text-black dark:text-zinc-200">
              Username
            </label>
            <input
              type="text"
              placeholder="name@example.com"
              className="flex h-12 w-full rounded-full border border-zinc-200 bg-transparent px-5 text-sm transition-colors focus:border-black focus:outline-none dark:border-zinc-800 dark:focus:border-zinc-400 dark:text-white dark:placeholder-zinc-600"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-black dark:text-zinc-200">
                Password
              </label>
              <a
                href="#"
                className="text-xs text-zinc-500 hover:text-black dark:hover:text-zinc-300"
              >
                Forgot?
              </a>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="flex h-12 w-full rounded-full border border-zinc-200 bg-transparent px-5 text-sm transition-colors focus:border-black focus:outline-none dark:border-zinc-800 dark:focus:border-zinc-400 dark:text-white dark:placeholder-zinc-600"
            />
          </div>

          <button
            type="submit"
            className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-black text-white text-sm font-medium transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Sign In
          </button>
        </form>

        <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-black dark:text-white hover:underline"
          >
            Get Started
          </Link>
        </div>
      </main>
    </div>
  );
}
