import type {
  InvoiceCurrencyCode,
  InvoiceLineItem,
  InvoiceStatus,
} from "@/lib/clients/invoice-types";

export type InvoiceFormValues = {
  number: string;
  issueDate: string;
  dueDate: string;
  currency: InvoiceCurrencyCode;
  status: InvoiceStatus;
  taxPercent: number;
  notes: string;
  items: InvoiceLineItem[];
};

export function emptyInvoiceValues(
  number: string,
  currency: InvoiceCurrencyCode = "USD"
): InvoiceFormValues {
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + 14);
  return {
    number,
    issueDate: today.toISOString().slice(0, 10),
    dueDate: due.toISOString().slice(0, 10),
    currency,
    status: "draft",
    taxPercent: 0,
    notes: "",
    items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
  };
}
