import { createFileRoute } from "@tanstack/react-router";
import { Kit } from "#features/kit/kit";

export const Route = createFileRoute("/")({
  component: Kit,
});
