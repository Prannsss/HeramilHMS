"use client"

import dynamic from 'next/dynamic'

// Configure axios defaults
import axios from 'axios'
axios.defaults.timeout = 10000
axios.defaults.headers.common['Content-Type'] = 'application/json'

// Dynamically import the login form to prevent hydration issues
const LoginForm = dynamic(() => import('@/components/login-form'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg animate-pulse" />
          <p className="mt-2 text-muted-foreground">
            Loading...
          </p>
        </div>
      </div>
    </div>
  )
})

export default function LoginPage() {
  return <LoginForm />
}