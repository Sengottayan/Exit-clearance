"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Country data ──────────────────────────────────────────────────────────────
export const COUNTRIES: {
  code: string;
  iso2: string;
  name: string;
  flag: string;
  digits: number | [number, number];
}[] = [
  { code: "+91",  iso2: "IN", name: "India",           flag: "🇮🇳", digits: 10 },
  { code: "+1",   iso2: "US", name: "United States",   flag: "🇺🇸", digits: 10 },
  { code: "+1",   iso2: "CA", name: "Canada",          flag: "🇨🇦", digits: 10 },
  { code: "+44",  iso2: "GB", name: "United Kingdom",  flag: "🇬🇧", digits: 10 },
  { code: "+61",  iso2: "AU", name: "Australia",       flag: "🇦🇺", digits: 9  },
  { code: "+81",  iso2: "JP", name: "Japan",           flag: "🇯🇵", digits: 10 },
  { code: "+49",  iso2: "DE", name: "Germany",         flag: "🇩🇪", digits: [3, 12] },
  { code: "+33",  iso2: "FR", name: "France",          flag: "🇫🇷", digits: 9  },
  { code: "+39",  iso2: "IT", name: "Italy",           flag: "🇮🇹", digits: [6, 11] },
  { code: "+34",  iso2: "ES", name: "Spain",           flag: "🇪🇸", digits: 9  },
  { code: "+7",   iso2: "RU", name: "Russia",          flag: "🇷🇺", digits: 10 },
  { code: "+55",  iso2: "BR", name: "Brazil",          flag: "🇧🇷", digits: [8, 9] },
  { code: "+86",  iso2: "CN", name: "China",           flag: "🇨🇳", digits: 11 },
  { code: "+82",  iso2: "KR", name: "South Korea",     flag: "🇰🇷", digits: [7, 8] },
  { code: "+65",  iso2: "SG", name: "Singapore",       flag: "🇸🇬", digits: 8  },
  { code: "+971", iso2: "AE", name: "UAE",             flag: "🇦🇪", digits: 9  },
  { code: "+966", iso2: "SA", name: "Saudi Arabia",    flag: "🇸🇦", digits: 9  },
  { code: "+60",  iso2: "MY", name: "Malaysia",        flag: "🇲🇾", digits: [7, 9] },
  { code: "+66",  iso2: "TH", name: "Thailand",        flag: "🇹🇭", digits: 9  },
  { code: "+63",  iso2: "PH", name: "Philippines",     flag: "🇵🇭", digits: 10 },
  { code: "+62",  iso2: "ID", name: "Indonesia",       flag: "🇮🇩", digits: [5, 12] },
  { code: "+27",  iso2: "ZA", name: "South Africa",    flag: "🇿🇦", digits: 9  },
  { code: "+234", iso2: "NG", name: "Nigeria",         flag: "🇳🇬", digits: 8  },
  { code: "+20",  iso2: "EG", name: "Egypt",           flag: "🇪🇬", digits: 10 },
  { code: "+254", iso2: "KE", name: "Kenya",           flag: "🇰🇪", digits: 9  },
  { code: "+52",  iso2: "MX", name: "Mexico",          flag: "🇲🇽", digits: 10 },
  { code: "+54",  iso2: "AR", name: "Argentina",       flag: "🇦🇷", digits: 10 },
  { code: "+56",  iso2: "CL", name: "Chile",           flag: "🇨🇱", digits: 9  },
  { code: "+57",  iso2: "CO", name: "Colombia",        flag: "🇨🇴", digits: 10 },
  { code: "+31",  iso2: "NL", name: "Netherlands",     flag: "🇳🇱", digits: 9  },
  { code: "+46",  iso2: "SE", name: "Sweden",          flag: "🇸🇪", digits: [7, 9] },
  { code: "+41",  iso2: "CH", name: "Switzerland",     flag: "🇨🇭", digits: 9  },
  { code: "+47",  iso2: "NO", name: "Norway",          flag: "🇳🇴", digits: 8  },
  { code: "+45",  iso2: "DK", name: "Denmark",         flag: "🇩🇰", digits: 8  },
  { code: "+48",  iso2: "PL", name: "Poland",          flag: "🇵🇱", digits: 9  },
  { code: "+32",  iso2: "BE", name: "Belgium",         flag: "🇧🇪", digits: 9  },
  { code: "+64",  iso2: "NZ", name: "New Zealand",     flag: "🇳🇿", digits: [8, 9] },
  { code: "+94",  iso2: "LK", name: "Sri Lanka",       flag: "🇱🇰", digits: 9  },
  { code: "+880", iso2: "BD", name: "Bangladesh",      flag: "🇧🇩", digits: 10 },
  { code: "+92",  iso2: "PK", name: "Pakistan",        flag: "🇵🇰", digits: 10 },
  { code: "+90",  iso2: "TR", name: "Turkey",          flag: "🇹🇷", digits: 10 },
  { code: "+972", iso2: "IL", name: "Israel",          flag: "🇮🇱", digits: 9  },
  { code: "+886", iso2: "TW", name: "Taiwan",          flag: "🇹🇼", digits: 9  },
  { code: "+84",  iso2: "VN", name: "Vietnam",         flag: "🇻🇳", digits: 9  },
  { code: "+380", iso2: "UA", name: "Ukraine",         flag: "🇺🇦", digits: 9  },
  { code: "+43",  iso2: "AT", name: "Austria",         flag: "🇦🇹", digits: [4, 13] },
  { code: "+36",  iso2: "HU", name: "Hungary",         flag: "🇭🇺", digits: 9  },
  { code: "+40",  iso2: "RO", name: "Romania",         flag: "🇷🇴", digits: 9  },
  { code: "+30",  iso2: "GR", name: "Greece",          flag: "🇬🇷", digits: 10 },
  { code: "+351", iso2: "PT", name: "Portugal",        flag: "🇵🇹", digits: 9  },
  { code: "+358", iso2: "FI", name: "Finland",         flag: "🇫🇮", digits: [5, 12] },
];

// ── Exported helpers ──────────────────────────────────────────────────────────
export function getMaxDigits(digits: number | [number, number]): number {
  return Array.isArray(digits) ? digits[1] : digits;
}
export function getMinDigits(digits: number | [number, number]): number {
  return Array.isArray(digits) ? digits[0] : digits;
}

function getPlaceholder(country: (typeof COUNTRIES)[number]): string {
  const max = getMaxDigits(country.digits);
  return "0".repeat(max);
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PhoneInputValue {
  countryCode: string;
  number: string;
  full: string;
}

interface PhoneInputProps {
  value?: string;
  onChange?: (val: PhoneInputValue) => void;
  className?: string;
  disabled?: boolean;
  defaultCountry?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PhoneInput({
  value = "",
  onChange,
  className,
  disabled,
  defaultCountry = "IN",
}: PhoneInputProps) {
  const defaultCountryObj =
    COUNTRIES.find((c) => c.iso2 === defaultCountry) ?? COUNTRIES[0];

  function parseInitial(raw: string) {
    for (const c of COUNTRIES) {
      if (raw.startsWith(c.code + " ")) {
        return { country: c, num: raw.slice(c.code.length + 1) };
      }
    }
    return { country: defaultCountryObj, num: raw.replace(/\D/g, "") };
  }

  const { country: initialCountry, num: initialNum } = parseInitial(value);
  const [selected, setSelected] = useState(initialCountry);
  const [number, setNumber] = useState(initialNum);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  // Portal dropdown position
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  // SSR safety for portal
  useEffect(() => setMounted(true), []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (
        wrapperRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setOpen(false);
      setSearch("");
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 30);
  }, [open]);

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: 288,
        zIndex: 9999,
        // Radix Dialog (modal mode) sets pointer-events:none on document.body to
        // block background interaction. Our portal renders inside body and inherits
        // that, making options unclickable. Explicitly override it here.
        pointerEvents: "auto",
      });
    }
    setOpen((v) => !v);
    if (open) setSearch("");
  };

  const maxDigits = getMaxDigits(selected.digits);
  const minDigits = getMinDigits(selected.digits);

  const handleNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "").slice(0, maxDigits);
      setNumber(raw);
      onChange?.({ countryCode: selected.code, number: raw, full: `${selected.code} ${raw}` });
    },
    [selected, maxDigits, onChange],
  );

  const handleSelectCountry = (c: (typeof COUNTRIES)[number]) => {
    setSelected(c);
    setOpen(false);
    setSearch("");
    const newMax = getMaxDigits(c.digits);
    const trimmed = number.slice(0, newMax);
    setNumber(trimmed);
    onChange?.({ countryCode: c.code, number: trimmed, full: `${c.code} ${trimmed}` });
  };

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search) ||
      c.iso2.toLowerCase().includes(search.toLowerCase()),
  );

  const digitLabel =
    minDigits === maxDigits ? `${maxDigits} digits` : `${minDigits}–${maxDigits} digits`;

  // Portal dropdown rendered at document.body level → escapes overflow:hidden
  const dropdown =
    mounted && open
      ? createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="rounded-xl border border-white/10 bg-[#0f1117] shadow-2xl overflow-hidden"
          >
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 bg-[#0f1117]">
              <Search className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or dial code…"
                className="flex-1 bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none"
              />
            </div>

            {/* List */}
            <ul className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-xs text-white/40 text-center">
                  No results
                </li>
              )}
              {filtered.map((c, i) => {
                const isActive = c.iso2 === selected.iso2 && c.code === selected.code;
                const dl =
                  getMinDigits(c.digits) === getMaxDigits(c.digits)
                    ? `${getMaxDigits(c.digits)}d`
                    : `${getMinDigits(c.digits)}–${getMaxDigits(c.digits)}d`;
                return (
                  <li
                    key={`${c.iso2}-${c.code}-${i}`}
                    role="option"
                    aria-selected={isActive}
                    // onMouseDown fires before Radix event capturing — guarantees
                    // selection registers even when Dialog is in modal mode.
                    onMouseDown={(e) => {
                      e.preventDefault(); // prevent input blur
                      handleSelectCountry(c);
                    }}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors",
                      "hover:bg-white/5 text-sm",
                      isActive && "bg-primary/10",
                    )}
                  >
                    <span className="text-base shrink-0 leading-none">{c.flag}</span>
                    <span className="flex-1 text-white text-xs font-medium truncate">
                      {c.name}
                    </span>
                    <span className="font-mono text-xs text-white/50 shrink-0">{c.code}</span>
                    <span className="font-mono text-[10px] text-white/30 shrink-0 w-10 text-right">
                      {dl}
                    </span>
                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Footer */}
            <div className="px-3 py-1.5 border-t border-white/10 bg-[#0f1117] text-[10px] font-mono text-white/30 text-right">
              {selected.name} · {digitLabel}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div ref={wrapperRef} className={cn("relative flex w-full", className)}>
        {/* Country picker trigger */}
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={handleToggle}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex items-center gap-1.5 shrink-0 h-11 pl-3 pr-2.5 rounded-l-xl",
            "border border-r-0 border-white/10",
            "bg-white/[0.04] hover:bg-white/[0.08] transition-colors",
            "text-sm font-mono font-semibold text-white/90",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <span className="text-base leading-none select-none">{selected.flag}</span>
          <span className="tracking-tight">{selected.code}</span>
          <ChevronDown
            className={cn(
              "w-3 h-3 text-white/40 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>

        {/* Divider */}
        <div className="w-px bg-white/10 self-stretch shrink-0" />

        {/* Number input */}
        <div className="relative flex-1">
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            disabled={disabled}
            value={number}
            onChange={handleNumberChange}
            maxLength={maxDigits}
            placeholder={getPlaceholder(selected)}
            aria-label="Phone number"
            className={cn(
              "w-full h-11 pl-3 pr-14 rounded-r-xl border border-white/10",
              "bg-white/[0.04] text-sm font-mono tracking-widest text-white",
              "placeholder:text-white/20 placeholder:font-mono placeholder:tracking-widest",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          />
          {/* Digit counter */}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/25 pointer-events-none select-none tabular-nums">
            {number.length}/{maxDigits}
          </span>
        </div>
      </div>

      {/* Portal-rendered dropdown – renders in document.body, not inside dialog */}
      {dropdown}
    </>
  );
}
