import { createFileRoute } from "@tanstack/react-router";
import { PageFrame } from "#features/page-frame/page-frame";
import { ThemeToggle } from "#features/theme/theme-toggle";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <PageFrame controls={<ThemeToggle />}>
      <h1 className="text-heading-3 text-primary-foreground">Nomi</h1>
      <p className="text-body-lg text-secondary-foreground">A Grok bot for students.</p>
    </PageFrame>
  );
}
