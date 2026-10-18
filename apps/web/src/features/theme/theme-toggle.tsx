import { Button } from "@nomi/ui/button";
import { useSyncExternalStore } from "react";

// System / Light / Dark. The choice is a class on <html> (`light` or `dark`;
// none means follow the system), which pins the scales and roles in
// @nomi/ui's styles. It is saved in localStorage and applied by THEME_SCRIPT
// before first paint, so a pinned theme never flashes the other.

const THEMES = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

type Theme = (typeof THEMES)[number]["value"];

const STORAGE_KEY = "nomi-theme";

/** Inline in `<head>`: pins a saved theme before the first paint. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.classList.add(t)}catch(e){}`;

function savedTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.remove("light", "dark");
  if (theme !== "system") document.documentElement.classList.add(theme);
  try {
    if (theme === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked; the theme still applies for this visit.
  }
  for (const listener of listeners) listener();
}

export function ThemeToggle() {
  // The server cannot know the saved theme, so it renders "System" and the
  // client corrects it after hydration.
  const theme = useSyncExternalStore(subscribe, savedTheme, () => "system" as Theme);

  return (
    <fieldset aria-label="Theme" className="m-0 inline-flex min-w-0 gap-0.5 border-0 p-0">
      {THEMES.map(({ value, label }) => (
        <Button
          key={value}
          size="sm"
          variant={theme === value ? "tertiary" : "transparent"}
          aria-pressed={theme === value}
          onClick={() => applyTheme(value)}
        >
          {label}
        </Button>
      ))}
    </fieldset>
  );
}
