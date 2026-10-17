// src/lib/auth.ts
import { NextAuthOptions, getServerSession as _getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const validEmail    = credentials.email    === process.env.ADMIN_EMAIL
        const validPassword = credentials.password === process.env.ADMIN_PASSWORD_PLAIN

        if (validEmail && validPassword) {
          return { id: '1', email: credentials.email, name: 'Pradeep' }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
    error:  '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.isAdmin = true
      return token
    },
    async session({ session, token }) {
      if (token.isAdmin) (session as any).isAdmin = true
      return session
    },
  },
  // Explicit cookie config for production
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}

// Re-export for convenience — call this in server components
export const getSession = () => _getServerSession(authOptions)
