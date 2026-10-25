import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Behavior tests drive Base UI in a DOM. Registered once for the package's
// tests; the CSS and export tests do not touch it.
GlobalRegistrator.register({ url: "http://localhost/" });
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
