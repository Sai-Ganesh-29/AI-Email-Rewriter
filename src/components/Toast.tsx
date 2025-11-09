"use client";

import { useEffect, useState } from "react";

type ToastMsg = { id: string; type: "success" | "error" | "info"; message: string };

let pushToast: ((m: ToastMsg) => void) | null = null;

export const toast = {
  success(msg: string) {
    pushToast?.({ id: crypto.randomUUID(), type: "success", message: msg });
  },
  error(msg: string) {
    pushToast?.({ id: crypto.randomUUID(), type: "error", message: msg });
  },
  info(msg: string) {
    pushToast?.({ id: crypto.randomUUID(), type: "info", message: msg });
  }
};

export function Toaster() {
  const [items, setItems] = useState<ToastMsg[]>([]);

  useEffect(() => {
    pushToast = (m) => {
      setItems((prev) => [...prev, m]);
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== m.id));
      }, 2500);
    };
    return () => {
      pushToast = null;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] space-y-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto w-[280px] rounded-md border p-3 text-sm shadow ${
            t.type === "success"
              ? "border-green-300 bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-100"
              : t.type === "error"
              ? "border-red-300 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100"
              : "border-gray-300 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
