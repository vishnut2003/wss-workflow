"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  findCurrency,
  type InvoiceListItem,
} from "@/lib/clients/invoice-types";

import {
  recordInvoicePaymentAction,
  type InvoiceFormState,
} from "../actions";

export function RecordPaymentDialog({ invoice }: { invoice: InvoiceListItem }) {
  const [state, action, pending] = useActionState<
    InvoiceFormState | undefined,
    FormData
  >(recordInvoicePaymentAction, undefined);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>(() =>
    invoice.outstanding.toFixed(2)
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const lastOkRef = useRef<boolean>(false);

  const currency = findCurrency(invoice.currency);
  const symbol = currency?.symbol ?? "";

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setAmount(invoice.outstanding.toFixed(2));
      requestAnimationFrame(() => inputRef.current?.select());
    }
    setOpen(next);
  };

  // Close the dialog the first time the action returns ok. We only react when
  // the ok flag transitions true → so the close happens once per submission.
  useEffect(() => {
    if (state?.ok && !lastOkRef.current) {
      lastOkRef.current = true;
      setOpen(false);
      return;
    }
    if (!state?.ok && lastOkRef.current) {
      lastOkRef.current = false;
    }
  }, [state]);

  const numericAmount = Number(amount);
  const isValid =
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    numericAmount <= invoice.outstanding + 0.005;

  const fillFull = () => setAmount(invoice.outstanding.toFixed(2));
  const fillHalf = () =>
    setAmount((invoice.outstanding / 2).toFixed(2));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            className="gap-1.5 bg-linear-to-br from-emerald-500 to-emerald-600 text-white hover:brightness-105"
          >
            <CircleDollarSign className="size-3.5" />
            Record payment
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Log a payment received against invoice {invoice.number}.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="invoiceId" value={invoice.id} />

          <div className="grid grid-cols-3 gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                Total
              </span>
              <span className="font-medium tabular-nums">
                {symbol}
                {invoice.total.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                Paid so far
              </span>
              <span className="font-medium tabular-nums text-emerald-700 dark:text-emerald-300">
                {symbol}
                {invoice.paidAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                Outstanding
              </span>
              <span className="font-medium tabular-nums text-theme-3 dark:text-theme-1">
                {symbol}
                {invoice.outstanding.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="payment-amount"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Amount received
            </Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                {symbol ? (
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                    {symbol}
                  </span>
                ) : null}
                <Input
                  id="payment-amount"
                  name="amount"
                  ref={inputRef}
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  max={invoice.outstanding}
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={symbol ? "pl-7" : ""}
                  placeholder="0.00"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillHalf}
                disabled={invoice.outstanding <= 0}
              >
                Half
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillFull}
                disabled={invoice.outstanding <= 0}
              >
                Full
              </Button>
            </div>
            {!isValid && amount !== "" ? (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                {numericAmount > invoice.outstanding
                  ? "Cannot exceed the outstanding balance."
                  : "Enter an amount greater than 0."}
              </p>
            ) : null}
            {isValid && numericAmount >= invoice.outstanding ? (
              <p className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" />
                This will mark the invoice as fully paid.
              </p>
            ) : null}
          </div>

          {state?.error ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>{state.error}</span>
            </div>
          ) : null}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={pending || !isValid}
              className="gap-1.5 bg-linear-to-br from-emerald-500 to-emerald-600 text-white hover:brightness-105"
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <CircleDollarSign className="size-3.5" />
              )}
              Record payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
