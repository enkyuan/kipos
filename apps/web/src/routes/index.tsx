import { createFileRoute } from "@tanstack/react-router";
import { FeatureGrid } from "#features/landing/feature-grid";
import { Hero } from "#features/landing/hero";
import { SiteFooter } from "#features/landing/site-footer";
import { SiteHeader } from "#features/landing/site-header";
import { WaitlistForm } from "#features/waitlist/waitlist-form";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ouro — Build in tight loops" },
      { name: "description", content: "Ouro is in early development. Join the waitlist." },
    ],
  }),
  component: Landing,
});

// The route composes features; features never import each other
// (apps/AGENTS.md), so the waitlist reaches the hero as its child.
function Landing() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero>
          <WaitlistForm />
        </Hero>
        <FeatureGrid />
      </main>
      <SiteFooter />
    </>
  );
}
