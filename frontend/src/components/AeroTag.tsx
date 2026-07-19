import React from "react";

type AeroTagTone = "lilas" | "gold" | "white";

export function AeroTag({
  children,
  tone = "lilas",
}: {
  children: React.ReactNode;
  tone?: AeroTagTone;
}) {
  const toneClasses =
    tone === "lilas"
      ? "text-aero-lilas bg-aero-lilas/10 border border-aero-lilas/20"
      : tone === "gold"
      ? "text-aero-gold bg-aero-gold/10 border border-aero-gold/30"
      : "text-white bg-white/5 border border-white/20";

  return (
    <span
      className={`aero-tag-clip font-data px-2.5 py-1 text-[11px] uppercase tracking-wider ${toneClasses}`}
    >
      {children}
    </span>
  );
}
