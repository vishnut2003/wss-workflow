"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  Globe,
  Mail,
  MapPin,
  Phone,
  Search,
  StickyNote,
  Tag,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CLIENT_STATUSES, type ClientStatus } from "@/lib/clients/types";
import { COUNTRIES, findCountry, type Country } from "@/lib/clients/countries";

export const STATUS_LABEL: Record<ClientStatus, string> = {
  active: "Active",
  lead: "Lead",
  on_hold: "On hold",
  archived: "Archived",
};

export type ClientFormValues = {
  name: string;
  company: string;
  email: string;
  phone: string;
  phoneCountry: string;
  website: string;
  industry: string;
  status: ClientStatus;
  address: string;
  city: string;
  country: string;
  notes: string;
};

export const EMPTY_CLIENT_VALUES: ClientFormValues = {
  name: "",
  company: "",
  email: "",
  phone: "",
  phoneCountry: "IN",
  website: "",
  industry: "",
  status: "active",
  address: "",
  city: "",
  country: "",
  notes: "",
};

export function ClientFormFields({
  values,
  onChange,
  disabled,
  idPrefix,
}: {
  values: ClientFormValues;
  onChange: <K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) => void;
  disabled?: boolean;
  idPrefix: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="status" value={values.status} />
      <input type="hidden" name="phoneCountry" value={values.phoneCountry} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`${idPrefix}-name`}
            className="text-xs font-medium text-muted-foreground"
          >
            Contact name <span className="text-destructive">*</span>
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
            htmlFor={`${idPrefix}-company`}
            className="text-xs font-medium text-muted-foreground"
          >
            Company
          </Label>
          <InputGroup className="h-10 rounded-lg">
            <InputGroupAddon>
              <Building2 className="text-theme-3" />
            </InputGroupAddon>
            <InputGroupInput
              id={`${idPrefix}-company`}
              name="company"
              type="text"
              autoComplete="organization"
              placeholder="Acme Inc."
              disabled={disabled}
              value={values.company}
              onChange={(e) => onChange("company", e.target.value)}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`${idPrefix}-website`}
            className="text-xs font-medium text-muted-foreground"
          >
            Website
          </Label>
          <InputGroup className="h-10 rounded-lg">
            <InputGroupAddon>
              <Globe className="text-theme-3" />
            </InputGroupAddon>
            <InputGroupInput
              id={`${idPrefix}-website`}
              name="website"
              type="text"
              autoComplete="url"
              placeholder="acme.com"
              disabled={disabled}
              value={values.website}
              onChange={(e) => onChange("website", e.target.value)}
            />
          </InputGroup>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`${idPrefix}-industry`}
            className="text-xs font-medium text-muted-foreground"
          >
            Industry
          </Label>
          <InputGroup className="h-10 rounded-lg">
            <InputGroupAddon>
              <Briefcase className="text-theme-3" />
            </InputGroupAddon>
            <InputGroupInput
              id={`${idPrefix}-industry`}
              name="industry"
              type="text"
              placeholder="SaaS, Retail, Healthcare..."
              disabled={disabled}
              value={values.industry}
              onChange={(e) => onChange("industry", e.target.value)}
            />
          </InputGroup>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label
            htmlFor={`${idPrefix}-address`}
            className="text-xs font-medium text-muted-foreground"
          >
            Address
          </Label>
          <InputGroup className="h-10 rounded-lg">
            <InputGroupAddon>
              <MapPin className="text-theme-3" />
            </InputGroupAddon>
            <InputGroupInput
              id={`${idPrefix}-address`}
              name="address"
              type="text"
              autoComplete="street-address"
              placeholder="123 Main St"
              disabled={disabled}
              value={values.address}
              onChange={(e) => onChange("address", e.target.value)}
            />
          </InputGroup>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Status</Label>
          <Select
            value={values.status}
            onValueChange={(v) => onChange("status", String(v) as ClientStatus)}
            disabled={disabled}
          >
            <SelectTrigger className="h-10 w-full rounded-lg">
              <SelectValue placeholder="Select status">
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="size-3.5 text-muted-foreground" />
                  {STATUS_LABEL[values.status]}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CLIENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`${idPrefix}-city`}
            className="text-xs font-medium text-muted-foreground"
          >
            City
          </Label>
          <InputGroup className="h-10 rounded-lg">
            <InputGroupInput
              id={`${idPrefix}-city`}
              name="city"
              type="text"
              autoComplete="address-level2"
              placeholder="San Francisco"
              disabled={disabled}
              value={values.city}
              onChange={(e) => onChange("city", e.target.value)}
            />
          </InputGroup>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`${idPrefix}-country`}
            className="text-xs font-medium text-muted-foreground"
          >
            Country
          </Label>
          <InputGroup className="h-10 rounded-lg">
            <InputGroupInput
              id={`${idPrefix}-country`}
              name="country"
              type="text"
              autoComplete="country-name"
              placeholder="United States"
              disabled={disabled}
              value={values.country}
              onChange={(e) => onChange("country", e.target.value)}
            />
          </InputGroup>
        </div>
      </div>

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
          placeholder="Anything worth remembering about this client..."
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
    setQuery("");
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
