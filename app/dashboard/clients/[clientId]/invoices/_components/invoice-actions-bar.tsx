"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  FileText,
  Loader2,
  Pencil,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type {
  InvoiceListItem,
  InvoiceStatus,
} from "@/lib/clients/invoice-types";

import {
  deleteInvoiceAction,
  setInvoiceStatusAction,
  type InvoiceFormState,
} from "../actions";
import { RecordPaymentDialog } from "./record-payment-dialog";

const NEXT_STATUS_FOR: Partial<
  Record<
    InvoiceStatus,
    {
      target: InvoiceStatus;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      tone: "default" | "success" | "warn";
    }[]
  >
> = {
  draft: [
    { target: "sent", label: "Mark as sent", icon: Send, tone: "default" },
    { target: "cancelled", label: "Cancel", icon: XCircle, tone: "warn" },
  ],
  sent: [
    { target: "draft", label: "Move to draft", icon: Pencil, tone: "default" },
    { target: "cancelled", label: "Cancel", icon: XCircle, tone: "warn" },
  ],
  paid: [
    { target: "sent", label: "Reopen", icon: Send, tone: "default" },
  ],
  cancelled: [
    { target: "draft", label: "Reopen as draft", icon: Pencil, tone: "default" },
  ],
};

export function InvoiceActionsBar({
  invoice,
  canManage,
  canDelete,
}: {
  invoice: InvoiceListItem;
  canManage: boolean;
  canDelete: boolean;
}) {
  const [statusState, statusAction, statusPending] = useActionState<
    InvoiceFormState | undefined,
    FormData
  >(setInvoiceStatusAction, undefined);
  const [, deleteAction, deletePending] = useActionState<
    InvoiceFormState | undefined,
    FormData
  >(deleteInvoiceAction, undefined);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const options = NEXT_STATUS_FOR[invoice.status] ?? [];

  return (
    <div className="flex flex-col gap-2">
      {statusState?.error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <span>{statusState.error}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {canManage && invoice.status === "sent" ? (
          <RecordPaymentDialog invoice={invoice} />
        ) : null}

        {canManage
          ? options.map((opt) => {
              const Icon = opt.icon;
              return (
                <form key={opt.target} action={statusAction}>
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <input type="hidden" name="status" value={opt.target} />
                  <Button
                    type="submit"
                    size="sm"
                    variant={
                      opt.tone === "warn"
                        ? "outline"
                        : opt.tone === "success"
                          ? "default"
                          : "outline"
                    }
                    disabled={statusPending}
                    className={
                      opt.tone === "success"
                        ? "gap-1.5 bg-linear-to-br from-emerald-500 to-emerald-600 text-white hover:brightness-105"
                        : opt.tone === "warn"
                          ? "gap-1.5 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
                          : "gap-1.5"
                    }
                  >
                    {statusPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Icon className="size-3.5" />
                    )}
                    {opt.label}
                  </Button>
                </form>
              );
            })
          : null}

        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          className="gap-1.5"
          render={
            <a
              href={`/dashboard/clients/${invoice.clientId}/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          <FileText className="size-3.5" />
          View PDF
        </Button>

        {canManage ? (
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            className="gap-1.5"
            render={
              <Link
                href={`/dashboard/clients/${invoice.clientId}/invoices/${invoice.id}/edit`}
              />
            }
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
        ) : null}

        {canDelete ? (
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger
              render={
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete invoice {invoice.number}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the invoice and all of its line items.
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <form action={deleteAction}>
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <AlertDialogAction
                    render={
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={deletePending}
                        className="gap-1.5"
                      >
                        {deletePending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                        Delete invoice
                      </Button>
                    }
                  />
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
    </div>
  );
}
