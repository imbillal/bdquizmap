import { useRef, useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { DISTRICTS, MAP_HEIGHT, MAP_WIDTH, type District } from "@/data/districts";
import { cn } from "@/lib/utils";

export type DistrictState = "idle" | "target" | "selected" | "correct" | "incorrect" | "muted" | "division";

type Props = {
  states?: Record<string, DistrictState>;
  /** District that gets the pulsing outline */
  focusId?: string;
  /** Show a dashed halo around the focus district (easy mode assistance) */
  halo?: boolean;
  interactive?: boolean;
  showTooltip?: boolean;
  onSelect?: (d: District) => void;
  ariaLabel?: string;
  className?: string;
};

export function BangladeshMap({
  states = {},
  focusId,
  halo,
  interactive,
  showTooltip,
  onSelect,
  ariaLabel = "Map of Bangladesh districts",
  className,
}: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ name: string; x: number; y: number } | null>(null);
  const focus = DISTRICTS.find((d) => d.id === focusId);

  const move = (e: React.PointerEvent, d: District) => {
    if (!showTooltip || !wrap.current) return;
    const r = wrap.current.getBoundingClientRect();
    setTip({ name: d.name, x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const key = (e: KeyboardEvent, d: District) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(d);
    }
  };

  return (
    <div ref={wrap} className={cn("relative w-full select-none", className)}>
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="mx-auto h-full max-h-[70vh] w-full"
        role={interactive ? "group" : "img"}
        aria-label={ariaLabel}
        onPointerLeave={() => setTip(null)}
      >
        {DISTRICTS.map((d) => (
          <path
            key={d.id}
            d={d.path}
            className="district"
            data-state={states[d.id] ?? "idle"}
            data-interactive={interactive ? "true" : "false"}
            tabIndex={interactive ? 0 : -1}
            role={interactive ? "button" : undefined}
            aria-label={interactive ? (showTooltip ? d.name : "District") : undefined}
            onClick={interactive ? () => onSelect?.(d) : undefined}
            onKeyDown={interactive ? (e) => key(e, d) : undefined}
            onPointerMove={(e) => move(e, d)}
          />
        ))}
        {focus && (
          <motion.path
            key={focus.id}
            d={focus.path}
            className="district-outline"
            style={{ transformOrigin: `${focus.cx}px ${focus.cy}px`, filter: "drop-shadow(0 0 6px var(--map-target))" }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.04, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {focus && halo && (
          <circle className="map-halo" cx={focus.cx} cy={focus.cy} r={Math.max(22, Math.sqrt(focus.area) * 0.9)} />
        )}
        {DISTRICTS.map((d) => {
          const s = states[d.id];
          if (s !== "correct" && s !== "incorrect") return null;
          return (
            <g key={`m-${d.id}`} transform={`translate(${d.cx} ${d.cy})`} pointerEvents="none" aria-hidden>
              {s === "correct" ? (
                <path className="map-marker-correct" d="M-4 0l2.5 3 5.5-6 1.4 1.3-6.9 7.4-3.9-4.4z" />
              ) : (
                <path className="map-marker-incorrect" d="M-4-3l1-1 3 3 3-3 1 1-3 3 3 3-1 1-3-3-3 3-1-1 3-3z" />
              )}
            </g>
          );
        })}
      </svg>
      {tip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[130%] rounded-md border bg-popover px-2 py-1 text-xs font-semibold text-popover-foreground shadow-card"
          style={{ left: tip.x, top: tip.y }}
        >
          {tip.name}
        </div>
      )}
    </div>
  );
}
