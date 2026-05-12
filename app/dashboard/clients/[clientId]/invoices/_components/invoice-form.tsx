"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  FileText,
  Hash,
  Loader2,
  Plus,
  Save,
  StickyNote,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  INVOICE_CURRENCIES,
  INVOICE_STATUSES,
  findCurrency,
  type InvoiceCurrencyCode,
  type InvoiceLineItem,
  type InvoiceStatus,
} from "@/lib/clients/invoice-types";

import {
  createInvoiceAction,
  updateInvoiceAction,
  type InvoiceFormState,
} from "../actions";
import type { InvoiceFormValues } from "./invoice-form-defaults";

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  cancelled: "Cancelled",
};

type Mode =
  | { kind: "create"; clientId: string }
  | { kind: "edit"; invoiceId: string; clientId: string };

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function InvoiceForm({
  initial,
  mode,
  clientLabel,
}: {
  initial: InvoiceFormValues;
  mode: Mode;
  clientLabel: string;
}) {
  const action =
    mode.kind === "create" ? createInvoiceAction : updateInvoiceAction;
  const [state, formAction, pending] = useActionState<
    InvoiceFormState | undefined,
    FormData
  >(action, undefined);

  const [values, setValues] = useState<InvoiceFormValues>(initial);

  const totals = useMemo(() => {
    let subtotal = 0;
    for (const it of values.items) {
      const qty = Number.isFinite(it.quantity) ? Math.max(0, it.quantity) : 0;
      const rate = Number.isFinite(it.rate) ? it.rate : 0;
      subtotal += qty * rate;
    }
    subtotal = round2(subtotal);
    const taxAmount = round2(subtotal * (Math.max(0, values.taxPercent) / 100));
    const total = round2(subtotal + taxAmount);
    return { subtotal, taxAmount, total };
  }, [values.items, values.taxPercent]);

  const currencyMeta = findCurrency(values.currency);
  const currencySymbol = currencyMeta?.symbol ?? "";

  const setField = <K extends keyof InvoiceFormValues>(
    key: K,
    next: InvoiceFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: next }));
  };

  const updateItem = (
    index: number,
    patch: Partial<InvoiceLineItem>
  ) => {
    setValues((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], ...patch };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setValues((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { description: "", quantity: 1, rate: 0, amount: 0 },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setValues((prev) => {
      if (prev.items.length <= 1) {
        return {
          ...prev,
          items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
        };
      }
      const items = prev.items.filter((_, i) => i !== index);
      return { ...prev, items };
    });
  };

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="clientId" value={mode.clientId} />
      {mode.kind === "edit" ? (
        <input type="hidden" name="invoiceId" value={mode.invoiceId} />
      ) : null}

      {state?.error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <section className="grid gap-4 rounded-xl border border-border/60 bg-card p-5 ring-1 ring-foreground/5">
        <header className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-theme-1/30 to-theme-3/15 text-theme-3 ring-1 ring-theme-1/20 dark:text-theme-1">
            <FileText className="size-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-heading text-sm font-semibold">Invoice details</h2>
            <p className="text-xs text-muted-foreground">For {clientLabel}</p>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Hash className="inline size-3 opacity-70" /> Invoice number
            </Label>
            <div
              aria-readonly
              className="flex h-9 items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/40 px-3 font-mono text-sm text-muted-foreground"
              title={
                mode.kind === "create"
                  ? "Assigned automatically when you save."
                  : "Invoice numbers can't be changed."
              }
            >
              <span className="truncate">{values.number}</span>
              <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-muted-foreground/70">
                Auto
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground/80">
              {mode.kind === "create"
                ? "Auto-assigned at creation — may shift if another invoice is saved first."
                : "Numbers can't be changed once issued."}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </Label>
            <Select
              value={values.status}
              onValueChange={(v) => setField("status", v as InvoiceStatus)}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVOICE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="status" value={values.status} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="issueDate" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="inline size-3 opacity-70" /> Issue date
            </Label>
            <Input
              id="issueDate"
              name="issueDate"
              type="date"
              required
              value={values.issueDate}
              onChange={(e) => setField("issueDate", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dueDate" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="inline size-3 opacity-70" /> Due date
            </Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              required
              value={values.dueDate}
              onChange={(e) => setField("dueDate", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-5 ring-1 ring-foreground/5">
        <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-400/30 to-fuchsia-500/20 text-violet-700 ring-1 ring-violet-500/20 dark:text-violet-300">
              <FileText className="size-4" />
            </div>
            <div className="flex flex-col">
              <h2 className="font-heading text-sm font-semibold">Line items</h2>
              <p className="text-xs text-muted-foreground">
                What is being charged on this invoice
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-[11px] text-muted-foreground">Currency</Label>
            <Select
              value={values.currency}
              onValueChange={(v) =>
                setField("currency", v as InvoiceCurrencyCode)
              }
            >
              <SelectTrigger className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVOICE_CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="currency" value={values.currency} />
          </div>
        </header>

        <div className="overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 font-semibold">Description</th>
                <th className="w-24 px-3 py-2 text-right font-semibold">Qty</th>
                <th className="w-32 px-3 py-2 text-right font-semibold">Rate</th>
                <th className="w-32 px-3 py-2 text-right font-semibold">Amount</th>
                <th className="w-10 px-2 py-2" aria-label="Remove" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {values.items.map((item, index) => {
                const amount = round2(
                  (Number.isFinite(item.quantity) ? item.quantity : 0) *
                    (Number.isFinite(item.rate) ? item.rate : 0)
                );
                return (
                  <tr key={index} className="align-top">
                    <td className="px-3 py-2">
                      <Input
                        name="itemDescription"
                        required
                        placeholder="What was delivered"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, { description: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        name="itemQuantity"
                        type="number"
                        min="0"
                        step="0.01"
                        value={Number.isFinite(item.quantity) ? item.quantity : 0}
                        onChange={(e) =>
                          updateItem(index, {
                            quantity: e.target.value === "" ? 0 : Number(e.target.value),
                          })
                        }
                        className="text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        name="itemRate"
                        type="number"
                        min="0"
                        step="0.01"
                        value={Number.isFinite(item.rate) ? item.rate : 0}
                        onChange={(e) =>
                          updateItem(index, {
                            rate: e.target.value === "" ? 0 : Number(e.target.value),
                          })
                        }
                        className="text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium tabular-nums">
                      {currencySymbol}
                      {amount.toFixed(2)}
                    </td>
                    <td className="px-2 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove line"
                        onClick={() => removeItem(index)}
                        disabled={values.items.length === 1}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="gap-1.5"
          >
            <Plus className="size-3.5" />
            Add line
          </Button>

          <div className="flex w-full max-w-xs flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground tabular-nums">
                {currencySymbol}
                {totals.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-1.5">
                <span>Tax</span>
                <Input
                  name="taxPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={values.taxPercent}
                  onChange={(e) =>
                    setField(
                      "taxPercent",
                      e.target.value === "" ? 0 : Number(e.target.value)
                    )
                  }
                  className="h-7 w-16 text-right text-xs"
                />
                <span>%</span>
              </div>
              <span className="font-medium text-foreground tabular-nums">
                {currencySymbol}
                {totals.taxAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border/60 pt-2 text-sm">
              <span className="font-semibold">Total</span>
              <span className="font-heading text-base font-bold text-theme-3 tabular-nums dark:text-theme-1">
                {currencySymbol}
                {totals.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-5 ring-1 ring-foreground/5">
        <Label htmlFor="notes" className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <StickyNote className="size-3 opacity-70" />
          Notes / terms
        </Label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="Payment terms, bank details, thank-you note…"
          value={values.notes}
          onChange={(e) => setField("notes", e.target.value)}
        />
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={
            <Link
              href={
                mode.kind === "edit"
                  ? `/dashboard/clients/${mode.clientId}/invoices/${mode.invoiceId}`
                  : `/dashboard/clients/${mode.clientId}/invoices`
              }
            />
          }
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="gap-1.5 bg-linear-to-br from-theme-1 to-theme-3 text-white hover:brightness-105"
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          {mode.kind === "create" ? "Create invoice" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
