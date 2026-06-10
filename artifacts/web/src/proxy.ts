import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isValidClerkPublishableKey, isValidClerkSecretKey } from "@/lib/clerk-utils";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/api/healthz",
  "/api/webhooks(.*)",
]);

const clerkConfigured =
  isValidClerkPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
  isValidClerkSecretKey(process.env.CLERK_SECRET_KEY);

export default clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        await auth.protect();
      }
    })
  : function passThrough() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
