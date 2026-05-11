export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!auth|api/auth|api/health|_next/static|_next/image|favicon.ico).*)",
  ],
};
