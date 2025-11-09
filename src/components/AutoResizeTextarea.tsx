"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  minRows?: number;
};

const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ value, onChange, className, placeholder, minRows = 6 }, ref) => {
    const innerRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, []);

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = "0px";
      const base = parseFloat(getComputedStyle(el).lineHeight || "20");
      const min = base * minRows + 16; // padding fudge
      el.style.height = Math.max(el.scrollHeight, min) + "px";
    }, [value, minRows]);

    return (
      <textarea
        ref={innerRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    );
  }
);

AutoResizeTextarea.displayName = "AutoResizeTextarea";
export default AutoResizeTextarea;
