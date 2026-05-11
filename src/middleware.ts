export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!auth|api|_next/static|_next/image|favicon.ico).*)",
  ],
};
