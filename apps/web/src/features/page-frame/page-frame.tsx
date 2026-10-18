import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** The page frame: the wordmark, header controls, and a centered column of content. */
export function PageFrame({ controls, children }: { controls?: ReactNode; children: ReactNode }) {
  return (
    <>
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/" className="text-heading-6 font-semibold text-primary-foreground no-underline">
          nomi
        </Link>
        {controls}
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-16 sm:px-6">{children}</main>
    </>
  );
}
