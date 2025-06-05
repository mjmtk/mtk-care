import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-options";

// Cascade: Adding diagnostic console logs
console.log("\n[NextAuth API Route Handler - Diagnostics]");
console.log("-------------------------------------------");
console.log("process.env.NODE_ENV:", process.env.NODE_ENV);
console.log("process.env.NEXTAUTH_URL (expected by NextAuth.js core):", process.env.NEXTAUTH_URL);
console.log("process.env.AZURE_AD_CLIENT_ID (used in authOptions):", process.env.AZURE_AD_CLIENT_ID);
console.log("process.env.AZURE_AD_TENANT_ID (used in authOptions):", process.env.AZURE_AD_TENANT_ID);
// Note: AZURE_AD_CLIENT_SECRET is sensitive and typically not logged, but ensure it's set.
console.log("Is AZURE_AD_CLIENT_SECRET set?", !!process.env.AZURE_AD_CLIENT_SECRET ? "Yes" : "No - THIS IS A PROBLEM!");
console.log("-------------------------------------------\n");

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
