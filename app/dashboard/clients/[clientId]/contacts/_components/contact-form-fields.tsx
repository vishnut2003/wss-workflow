"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  Check,
  ChevronDown,
  Mail,
  Phone,
  Search,
  Star,
  StickyNote,
  User as UserIcon,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COUNTRIES, findCountry, type Country } from "@/lib/clients/countries";

export type ContactFormValues = {
  name: string;
  title: string;
  email: string;
  phone: string;
  phoneCountry: string;
  isPrimary: boolean;
  notes: string;
};

export const EMPTY_CONTACT_VALUES: ContactFormValues = {
  name: "",
  title: "",
  email: "",
  phone: "",
  phoneCountry: "IN",
  isPrimary: false,
  notes: "",
};

export function ContactFormFields({
  values,
  onChange,
  disabled,
  idPrefix,
  primaryLocked,
}: {
  values: ContactFormValues;
  onChange: <K extends keyof ContactFormValues>(
    key: K,
    value: ContactFormValues[K]
  ) => void;
  disabled?: boolean;
  idPrefix: string;
  primaryLocked?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="phoneCountry" value={values.phoneCountry} />
      <input
        type="hidden"
        name="isPrimary"
        value={values.isPrimary ? "true" : "false"}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`${idPrefix}-name`}
            className="text-xs font-medium text-muted-foreground"
          >
            Name <span className="text-destructive">*</span>
          </Label>
          <InputGroup className="h-10 rounded-lg">
            <InputGroupAddon>
              <UserIcon className="text-theme-3" />
            </InputGroupAddon>
            <InputGroupInput
              id={`${idPrefix}-name`}
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              required
              disabled={disabled}
              value={values.name}
              onChange={(e) => onChange("name", e.target.value)}
            />
          </InputGroup>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`${idPrefix}-title`}
            className="text-xs font-medium text-muted-foreground"
          >
            Title / role
          </Label>
          <InputGroup className="h-10 rounded-lg">
            <InputGroupAddon>
              <Briefcase className="text-theme-3" />
            </InputGroupAddon>
            <InputGroupInput
              id={`${idPrefix}-title`}
              name="title"
              type="text"
              placeholder="Finance, CTO, Designer..."
              disabled={disabled}
              value={values.title}
              onChange={(e) => onChange("title", e.target.value)}
            />
          </InputGroup>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`${idPrefix}-email`}
            className="text-xs font-medium text-muted-foreground"
          >
            Email
          </Label>
          <InputGroup className="h-10 rounded-lg">
            <InputGroupAddon>
              <Mail className="text-theme-3" />
            </InputGroupAddon>
            <InputGroupInput
              id={`${idPrefix}-email`}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="jane@acme.com"
              disabled={disabled}
              value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
            />
          </InputGroup>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`${idPrefix}-phone`}
            className="text-xs font-medium text-muted-foreground"
          >
            Phone
          </Label>
          <div className="flex gap-1.5">
            <PhoneCountrySelect
              value={values.phoneCountry}
              onChange={(code) => onChange("phoneCountry", code)}
              disabled={disabled}
            />
            <InputGroup className="h-10 flex-1 rounded-lg">
              <InputGroupAddon>
                <Phone className="text-theme-3" />
              </InputGroupAddon>
              <InputGroupInput
                id={`${idPrefix}-phone`}
                name="phone"
                type="tel"
                autoComplete="tel-national"
                placeholder="555 123 4567"
                disabled={disabled}
                value={values.phone}
                onChange={(e) => onChange("phone", e.target.value)}
              />
            </InputGroup>
          </div>
        </div>
      </div>

      <label
        className={`flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm ${
          primaryLocked
            ? "cursor-not-allowed opacity-70"
            : "cursor-pointer hover:bg-muted/50"
        }`}
      >
        <input
          type="checkbox"
          checked={values.isPrimary}
          disabled={disabled || primaryLocked}
          onChange={(e) => onChange("isPrimary", e.target.checked)}
          className="mt-0.5 size-4 cursor-pointer accent-theme-3 disabled:cursor-not-allowed"
        />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Star className="size-3.5 text-amber-500" />
            Primary contact
          </span>
          <span className="text-xs text-muted-foreground">
            {primaryLocked
              ? "This is the primary contact. Promote another contact to change it."
              : "When set, this contact's name, email, and phone replace the client's headline details."}
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor={`${idPrefix}-notes`}
          className="text-xs font-medium text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1.5">
            <StickyNote className="size-3.5 text-theme-3" />
            Notes
          </span>
        </Label>
        <Textarea
          id={`${idPrefix}-notes`}
          name="notes"
          placeholder="Best time to reach, language preferences, decision power..."
          rows={3}
          disabled={disabled}
          value={values.notes}
          onChange={(e) => onChange("notes", e.target.value)}
        />
      </div>
    </div>
  );
}

function matchCountry(item: Country, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.name.toLowerCase().includes(q) ||
    item.code.toLowerCase().includes(q) ||
    item.dial.replace(/\+/g, "").includes(q.replace(/\+/g, ""))
  );
}

function PhoneCountrySelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selected = findCountry(value);

  const filtered = useMemo(
    () => COUNTRIES.filter((c) => matchCountry(c, query)),
    [query]
  );

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (next) setQuery("");
    setOpen(next);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Phone country"
            disabled={disabled}
            className="flex h-10 w-27.5 shrink-0 items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30"
          />
        }
      >
        {selected ? (
          <>
            <span aria-hidden className="text-base leading-none">
              {selected.flag}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {selected.dial}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">Country</span>
        )}
        <ChevronDown className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="flex w-72 flex-col gap-0 p-0"
      >
        <div className="flex items-center gap-2 border-b border-border/60 px-2.5 py-2">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search countries..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <ul className="flex h-64 flex-col overflow-y-auto overscroll-contain p-1">
          {filtered.length === 0 ? (
            <li className="flex flex-1 items-center justify-center px-2 py-6 text-center text-sm text-muted-foreground">
              No countries match
            </li>
          ) : (
            filtered.map((country) => {
              const isSelected = country.code === value;
              return (
                <li key={country.code}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(country.code);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                      isSelected ? "bg-accent/60 text-accent-foreground" : ""
                    }`}
                  >
                    <span aria-hidden className="text-base leading-none">
                      {country.flag}
                    </span>
                    <span className="truncate">{country.name}</span>
                    <span className="ml-auto pl-2 tabular-nums text-muted-foreground">
                      {country.dial}
                    </span>
                    {isSelected ? (
                      <Check className="size-3.5 shrink-0 text-theme-3" />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
