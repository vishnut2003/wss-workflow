import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export default async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await auth();

  if (pathname.startsWith("/dashboard")) {
    if (!session?.user) {
      const url = new URL("/auth/login", req.nextUrl);
      url.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname === "/auth/login" && session?.user) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/login"],
};
