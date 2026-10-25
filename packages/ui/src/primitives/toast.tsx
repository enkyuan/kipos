import { Toast as BaseToast } from "@base-ui/react/toast";
import type { ReactElement, ReactNode } from "react";
import { Button } from "./button";

/** `const toast = useToast(); toast.add({ title, description })` */
export const useToast = BaseToast.useToastManager;

function Toasts(): ReactElement {
  const { toasts } = useToast();
  return (
    <>
      {toasts.map((toast) => (
        <BaseToast.Root key={toast.id} toast={toast} className="nm-toast" data-slot="toast">
          <BaseToast.Title className="nm-toast-title" data-slot="toast-title" />
          <BaseToast.Description className="nm-toast-description" data-slot="toast-description" />
          <BaseToast.Close
            className="nm-toast-close"
            aria-label="Dismiss"
            render={<Button variant="transparent" size="xs" iconOnly />}
          >
            <svg
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path d="m3 3 6 6M9 3l-6 6" />
            </svg>
          </BaseToast.Close>
        </BaseToast.Root>
      ))}
    </>
  );
}

/** Mount once near the root; toasts render in a fixed viewport, bottom right. */
export function ToastProvider({ children }: { children: ReactNode }): ReactElement {
  return (
    <BaseToast.Provider>
      {children}
      <BaseToast.Portal>
        <BaseToast.Viewport className="nm-toast-viewport" data-slot="toast-viewport">
          <Toasts />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}
