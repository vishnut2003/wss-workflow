import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { ClientListItem } from "@/lib/clients/types";
import type {
  InvoiceDisplayStatus,
  InvoiceListItem,
} from "@/lib/clients/invoice-types";
import { findCountry } from "@/lib/clients/countries";

const COLORS = {
  primary: "#92c131",
  primaryDark: "#6d7f53",
  ink: "#1f2937",
  body: "#374151",
  muted: "#6b7280",
  mutedLight: "#9ca3af",
  surface: "#ffffff",
  surfaceAlt: "#f9fafb",
  border: "#e5e7eb",
  borderSoft: "#f3f4f6",
  draft: "#64748b",
  sent: "#0284c7",
  paid: "#059669",
  overdue: "#e11d48",
  partial: "#7c3aed",
  cancelled: "#d97706",
};

const STATUS_COLOR: Record<InvoiceDisplayStatus, string> = {
  draft: COLORS.draft,
  sent: COLORS.sent,
  paid: COLORS.paid,
  overdue: COLORS.overdue,
  partial: COLORS.partial,
  cancelled: COLORS.cancelled,
};

const STATUS_LABEL: Record<InvoiceDisplayStatus, string> = {
  draft: "DRAFT",
  sent: "SENT",
  paid: "PAID",
  overdue: "OVERDUE",
  partial: "PARTIAL",
  cancelled: "CANCELLED",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 36,
    paddingHorizontal: 0,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: COLORS.body,
    backgroundColor: COLORS.surface,
  },

  accentBar: {
    height: 6,
    backgroundColor: COLORS.primary,
  },

  topBand: {
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderBottomStyle: "solid",
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 700,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 12,
    textAlign: "center",
  },
  brandText: {
    flexDirection: "column",
  },
  brandName: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.ink,
  },
  brandTag: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 2,
  },
  invoiceTitleBlock: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: COLORS.ink,
    letterSpacing: 4,
  },
  invoiceNumber: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
  },
  statusPill: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    color: "#ffffff",
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 1,
  },

  metaRow: {
    flexDirection: "row",
    paddingHorizontal: 40,
    paddingTop: 22,
    paddingBottom: 18,
    gap: 24,
  },
  metaCol: {
    flexDirection: "column",
    flex: 1,
  },
  metaLabel: {
    fontSize: 7.5,
    color: COLORS.mutedLight,
    fontWeight: 700,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 10.5,
    color: COLORS.ink,
    fontWeight: 600,
  },
  metaSub: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 2,
  },

  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 40,
    paddingVertical: 9,
    backgroundColor: COLORS.surfaceAlt,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderTopStyle: "solid",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderBottomStyle: "solid",
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.muted,
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
    borderBottomStyle: "solid",
  },
  cellDescription: {
    flex: 3,
    paddingRight: 12,
    fontSize: 10,
    color: COLORS.ink,
  },
  cellQty: {
    flex: 0.7,
    fontSize: 10,
    color: COLORS.body,
    textAlign: "right",
  },
  cellRate: {
    flex: 1,
    fontSize: 10,
    color: COLORS.body,
    textAlign: "right",
  },
  cellAmount: {
    flex: 1.1,
    fontSize: 10,
    color: COLORS.ink,
    fontWeight: 600,
    textAlign: "right",
  },

  totalsWrap: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsBox: {
    width: 240,
    flexDirection: "column",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsRowEmphasis: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderTopStyle: "solid",
  },
  totalsLabel: {
    fontSize: 10,
    color: COLORS.muted,
  },
  totalsValue: {
    fontSize: 10,
    color: COLORS.body,
  },
  totalsLabelStrong: {
    fontSize: 11,
    color: COLORS.ink,
    fontWeight: 700,
  },
  totalsValueStrong: {
    fontSize: 13,
    color: COLORS.primaryDark,
    fontWeight: 700,
  },
  paidValue: {
    fontSize: 10,
    color: COLORS.paid,
  },

  notesBlock: {
    marginTop: 4,
    marginHorizontal: 40,
    padding: 14,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    borderLeftStyle: "solid",
  },
  notesLabel: {
    fontSize: 8,
    color: COLORS.muted,
    fontWeight: 700,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 10,
    color: COLORS.ink,
    lineHeight: 1.45,
  },

  footer: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: COLORS.mutedLight,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
    borderTopStyle: "solid",
  },
  pageNumber: {
    fontSize: 8,
    color: COLORS.mutedLight,
  },
});

function initialsOf(input: string): string {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return input.slice(0, 2).toUpperCase() || "WS";
}

function formatLong(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function money(amount: number, currencyCode: string): string {
  // Currency codes are used in place of symbols — the default PDF font
  // doesn't include glyphs for ₹, د.إ, etc., so a symbol like ₹ would render
  // as a literal "1" (the U+20B9 fallback). ISO codes are always renderable.
  return `${currencyCode} ${amount.toFixed(2)}`;
}

export function InvoicePdfDocument({
  invoice,
  client,
  workspaceName = "Web Spider Solutions",
  workspaceTag = "Workflow",
}: {
  invoice: InvoiceListItem;
  client: ClientListItem;
  workspaceName?: string;
  workspaceTag?: string;
}) {
  const currencyCode = invoice.currency;
  const country = findCountry(client.phoneCountry);
  const phoneDisplay = client.phone
    ? country
      ? `${country.dial} ${client.phone}`
      : client.phone
    : "";
  const location = [client.city, client.country].filter(Boolean).join(", ");
  const clientName = client.company || client.name || "Client";
  const clientAttn =
    client.company && client.name && client.name !== client.company
      ? client.name
      : "";

  return (
    <Document
      title={`Invoice ${invoice.number}`}
      author={workspaceName}
      subject={`Invoice for ${clientName}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.accentBar} fixed />

        <View style={styles.topBand}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandMark}>{initialsOf(workspaceName)}</Text>
            <View style={styles.brandText}>
              <Text style={styles.brandName}>{workspaceName}</Text>
              <Text style={styles.brandTag}>{workspaceTag}</Text>
            </View>
          </View>
          <View style={styles.invoiceTitleBlock}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.number}</Text>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: STATUS_COLOR[invoice.displayStatus] },
              ]}
            >
              <Text>{STATUS_LABEL[invoice.displayStatus]}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.metaCol, { flex: 2 }]}>
            <Text style={styles.metaLabel}>BILLED TO</Text>
            <Text style={styles.metaValue}>{clientName}</Text>
            {clientAttn ? (
              <Text style={styles.metaSub}>Attn: {clientAttn}</Text>
            ) : null}
            {client.email ? (
              <Text style={styles.metaSub}>{client.email}</Text>
            ) : null}
            {phoneDisplay ? (
              <Text style={styles.metaSub}>{phoneDisplay}</Text>
            ) : null}
            {client.address ? (
              <Text style={styles.metaSub}>{client.address}</Text>
            ) : null}
            {location ? (
              <Text style={styles.metaSub}>{location}</Text>
            ) : null}
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>ISSUE DATE</Text>
            <Text style={styles.metaValue}>{formatLong(invoice.issueDate)}</Text>
            <Text style={[styles.metaLabel, { marginTop: 14 }]}>DUE DATE</Text>
            <Text
              style={[
                styles.metaValue,
                invoice.displayStatus === "overdue"
                  ? { color: COLORS.overdue }
                  : {},
              ]}
            >
              {formatLong(invoice.dueDate)}
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>AMOUNT DUE</Text>
            <Text style={[styles.metaValue, { fontSize: 16 }]}>
              {money(
                invoice.outstanding > 0 ? invoice.outstanding : invoice.total,
                currencyCode
              )}
            </Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 3, paddingRight: 12 }]}>
            DESCRIPTION
          </Text>
          <Text
            style={[styles.tableHeaderText, { flex: 0.7, textAlign: "right" }]}
          >
            QTY
          </Text>
          <Text
            style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}
          >
            RATE
          </Text>
          <Text
            style={[styles.tableHeaderText, { flex: 1.1, textAlign: "right" }]}
          >
            AMOUNT
          </Text>
        </View>

        {invoice.items.map((item, index) => (
          <View key={index} style={styles.tableRow} wrap={false}>
            <Text style={styles.cellDescription}>{item.description}</Text>
            <Text style={styles.cellQty}>{item.quantity}</Text>
            <Text style={styles.cellRate}>{money(item.rate, currencyCode)}</Text>
            <Text style={styles.cellAmount}>{money(item.amount, currencyCode)}</Text>
          </View>
        ))}

        <View style={styles.totalsWrap}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {money(invoice.subtotal, currencyCode)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Tax ({invoice.taxPercent}%)
              </Text>
              <Text style={styles.totalsValue}>
                {money(invoice.taxAmount, currencyCode)}
              </Text>
            </View>
            <View style={styles.totalsRowEmphasis}>
              <Text style={styles.totalsLabelStrong}>Total</Text>
              <Text style={styles.totalsValueStrong}>
                {money(invoice.total, currencyCode)}
              </Text>
            </View>
            {invoice.paidAmount > 0 ? (
              <>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Paid</Text>
                  <Text style={styles.paidValue}>
                    −{money(invoice.paidAmount, currencyCode)}
                  </Text>
                </View>
                <View style={styles.totalsRowEmphasis}>
                  <Text style={styles.totalsLabelStrong}>Outstanding</Text>
                  <Text
                    style={[
                      styles.totalsValueStrong,
                      invoice.outstanding === 0
                        ? { color: COLORS.paid }
                        : {},
                    ]}
                  >
                    {money(invoice.outstanding, currencyCode)}
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        </View>

        {invoice.notes ? (
          <View style={styles.notesBlock} wrap={false}>
            <Text style={styles.notesLabel}>NOTES &amp; TERMS</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>
            {workspaceName} · Generated{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
