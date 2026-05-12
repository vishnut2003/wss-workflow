import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions/check";
import { findClientListItemForUser } from "@/lib/models/client";
import { findInvoiceById } from "@/lib/models/invoice";

import { InvoicePdfDocument } from "../../_components/invoice-pdf-document";

// PDF generation uses Node-only APIs from @react-pdf/renderer.
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ clientId: string; invoiceId: string }> }
) {
  const { clientId, invoiceId } = await context.params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/login", _request.url));
  }
  if (!(await can(session.user.role, "clients.invoices.view"))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const [invoice, client] = await Promise.all([
    findInvoiceById(invoiceId),
    findClientListItemForUser(clientId, session.user.id, session.user.role),
  ]);
  if (!invoice || !client || invoice.clientId !== clientId) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = await renderToBuffer(
    <InvoicePdfDocument invoice={invoice} client={client} />
  );

  const filename = `${invoice.number}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
