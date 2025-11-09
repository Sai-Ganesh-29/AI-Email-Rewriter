"use client";

import { useState } from "react";
import { clsx } from "clsx";

export default function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className={clsx(
        "rounded-md border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-900",
        className
      )}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
