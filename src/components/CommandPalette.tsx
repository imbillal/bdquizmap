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
import { districtSearchText, divisionSearchText, useLang } from "@/lib/i18n";
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
  const { t, district, division } = useLang();
  const go = (fn: () => void) => {
    setOpen(false);
    fn();
  };
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t.searchCommands} />
      <CommandList>
        <CommandEmpty>{t.noResults}</CommandEmpty>
        <CommandGroup heading={t.actions}>
          <CommandItem onSelect={() => go(() => navigate({ to: "/quiz" }))}>
            <Play /> {t.startQuizCmd}
          </CommandItem>
          <CommandItem onSelect={() => go(() => navigate({ to: "/explore" }))}>
            <Compass /> {t.exploreDistrictsLink}
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading={t.quizMode}>
          {MODES.map((m) => (
            <CommandItem key={m.id} onSelect={() => go(() => navigate({ to: "/quiz", search: { mode: m.id } }))}>
              <Shapes /> {t.modes[m.id].label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading={t.difficulty}>
          {DIFFICULTIES.map((d) => (
            <CommandItem
              key={d}
              value={`difficulty ${d} ${t.difficulties[d]}`}
              onSelect={() => go(() => navigate({ to: "/quiz", search: { difficulty: d } }))}
            >
              <Gauge /> {t.difficultyCmd(t.difficulties[d])}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading={t.districts}>
          {DISTRICTS.map((d) => (
            <CommandItem
              key={d.id}
              value={`${districtSearchText(d.name)} ${divisionSearchText(d.division)}`}
              onSelect={() => go(() => navigate({ to: "/explore", search: { district: d.slug } }))}
            >
              <MapPin /> {district(d.name)}
              <span className="ml-auto text-xs text-muted-foreground">{division(d.division)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
