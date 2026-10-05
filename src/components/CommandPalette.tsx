import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Compass, Gauge, MapPin, Play, Shapes } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DISTRICTS } from "@/data/districts";
import { DIFFICULTIES, MODES } from "@/lib/quiz";

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

export function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (o: boolean) => void }) {
  const navigate = useNavigate();
  const go = (fn: () => void) => {
    setOpen(false);
    fn();
  };
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search districts or actions..." />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go(() => navigate({ to: "/quiz" }))}>
            <Play /> Start quiz
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/explore" }))}>
            <Compass /> Explore districts
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Quiz mode">
          {MODES.map((m) => (
            <CommandItem key={m.id} onSelect={() => go(() => navigate({ to: "/quiz", search: { mode: m.id } }))}>
              <Shapes /> {m.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Difficulty">
          {DIFFICULTIES.map((d) => (
            <CommandItem
              key={d}
              value={`difficulty ${d}`}
              onSelect={() => go(() => navigate({ to: "/quiz", search: { difficulty: d } }))}
            >
              <Gauge /> <span className="capitalize">{d}</span> difficulty
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Districts">
          {DISTRICTS.map((d) => (
            <CommandItem
              key={d.id}
              value={`${d.name} ${d.division}`}
              onSelect={() => go(() => navigate({ to: "/explore", search: { district: d.slug } }))}
            >
              <MapPin /> {d.name}
              <span className="ml-auto text-xs text-muted-foreground">{d.division}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
