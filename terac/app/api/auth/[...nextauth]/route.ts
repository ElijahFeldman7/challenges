import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  // @ts-expect-error type mismatch with generated prisma client
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || process.env.REACT_APP_OAUTH_CLIENT_ID || "",
      clientSecret: 
        process.env.GOOGLE_CLIENT_SECRET || 
        process.env.REACT_APP_OAUTH_SECRET || 
        process.env.REACT_APP_OAUTH_CLIENT_SECRET || 
        "",
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session?.user && user) {
        (session.user as any).id = user.id;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_dev"
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }