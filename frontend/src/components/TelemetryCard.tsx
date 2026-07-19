import { motion } from "framer-motion";
import { AeroTag } from "./AeroTag";

type AeroTagTone = "lilas" | "gold" | "white";

export function TelemetryCard({
  tag,
  tagTone = "lilas",
  value,
  unit,
  title,
  description,
  className = "",
}: {
  tag: string;
  tagTone?: AeroTagTone;
  value: string | number;
  unit?: string;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`aero-chamfer glass-strong p-6 relative transition-colors hover:border-aero-lilas border border-aero-border ${className}`}
    >
      <AeroTag tone={tagTone}>{tag}</AeroTag>
      <div className="font-display text-4xl sm:text-5xl my-2.5 text-white flex items-baseline gap-2">
        {value}
        {unit && (
          <span className="text-sm text-aero-gold font-data font-normal">{unit}</span>
        )}
      </div>
      {title && <div className="text-sm text-aero-muted mt-1">{title}</div>}
      {description && (
        <p className="text-[13px] text-aero-muted mt-3 leading-relaxed">{description}</p>
      )}
    </motion.div>
  );
}
