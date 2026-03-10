import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  '/',
  '/support(.*)',
  '/pricing(.*)',
  '/services(.*)',
  '/policies(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/join(.*)',
  '/api/webhooks(.*)',
  '/exams/(.*)'
])

export default clerkMiddleware(async (auth, request) => {
  try {
    if (!isPublicRoute(request)) {
      await auth.protect()
    }
    return NextResponse.next();
  } catch (error) {
    console.error("Clerk Middleware Error:", error);
    throw error;
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
