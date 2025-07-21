"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import axios, { AxiosError } from "axios"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Logo from "@/components/logo"

// Configure axios defaults
axios.defaults.timeout = 10000 // 10 seconds timeout
axios.defaults.headers.common['Content-Type'] = 'application/json'

interface LoginResponse {
  status: string
  message?: string
  user?: {
    id: number
    email: string
    role: string
  }
}

interface DatabaseResponse {
  status: string
  message?: string
}

export default function LoginPage() {
  const [message, setMessage] = useState("Connecting...")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loginMessage, setLoginMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDbConnected, setIsDbConnected] = useState(false)

  // Test database connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await axios.get<DatabaseResponse>(
          "http://localhost/HeramilHMS/public/backend/db_connect.php",
          {
            timeout: 5000, // 5 seconds for connection test
          }
        )
        
        if (response.data && response.data.status === "success") {
          setMessage("✅ Database connected successfully!")
          setIsDbConnected(true)
        } else {
          setMessage("❌ Failed to connect to the database.")
          setIsDbConnected(false)
        }
      } catch (error) {
        console.error("Database connection error:", error)
        
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNABORTED') {
            setMessage("❌ Connection timeout. Please check your server.")
          } else if (error.response) {
            setMessage(`❌ Server error: ${error.response.status}`)
          } else if (error.request) {
            setMessage("❌ No response from server. Please check if the backend is running.")
          } else {
            setMessage("❌ Error setting up the request.")
          }
        } else {
          setMessage("❌ Unexpected error occurred.")
        }
        setIsDbConnected(false)
      }
    }

    testConnection()
  }, [])

  // Handle login
  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      setLoginMessage("❌ Please enter both email and password.")
      return
    }

    if (!email.includes('@')) {
      setLoginMessage("❌ Please enter a valid email address.")
      return
    }

    setIsLoading(true)
    setLoginMessage("Checking credentials...")

    try {
      const response = await axios.post<LoginResponse>(
        "http://localhost/HeramilHMS/public/backend/api/auth.php",
        {
          email: email.trim(),
          password: password
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 8000, // 8 seconds timeout for login
        }
      )

      const data = response.data

      if (data && data.status === "success" && data.user) {
        setLoginMessage(`✅ Welcome ${data.user.role}!`)

        // Store user data in localStorage (optional)
        localStorage.setItem('user', JSON.stringify(data.user))

        // Redirect based on role
        setTimeout(() => {
          if (data.user?.role === "Admin") {
            window.location.href = "/admin/dashboard"
          } else if (data.user?.role === "Doctor") {
            window.location.href = "/doctor/dashboard"
          } else {
            window.location.href = "/dashboard"
          }
        }, 1000)
      } else {
        setLoginMessage("❌ " + (data.message || "Invalid credentials"))
      }
    } catch (error) {
      console.error("Login error:", error)
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<LoginResponse>
        
        if (axiosError.code === 'ECONNABORTED') {
          setLoginMessage("❌ Request timeout. Please try again.")
        } else if (axiosError.response) {
          // Server responded with error status
          const errorData = axiosError.response.data
          if (errorData && errorData.message) {
            setLoginMessage("❌ " + errorData.message)
          } else {
            setLoginMessage(`❌ Server error: ${axiosError.response.status}`)
          }
        } else if (axiosError.request) {
          setLoginMessage("❌ No response from server. Please check your connection.")
        } else {
          setLoginMessage("❌ Error setting up the request.")
        }
      } else {
        setLoginMessage("❌ Unexpected error occurred.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin()
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <header className="mb-8 flex flex-col items-center">
          <Logo />
          <p className="mt-2 text-muted-foreground">
            Welcome back! Please enter your credentials.
          </p>
        </header>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  required
                />
                <div className="text-right">
                  <Link href="/forgot-password" className="inline-block text-sm underline">
                    Forgot your password?
                  </Link>
                </div>
              </div>
              <Button 
                type="button" 
                className="w-full" 
                onClick={handleLogin}
                disabled={isLoading || !isDbConnected}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>
              <Button variant="outline" asChild className="w-full">
                <Link href="/book-appointment">Book an Appointment</Link>
              </Button>
            </div>

            {/** Uncomment for testing and easy login without using login credentials */}
            {/* <div className="mt-4 text-center text-sm">
              <p className="text-muted-foreground">Or continue as a guest</p>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <Button variant="outline" asChild>
                  <Link href="/admin/dashboard">Admin Dashboard</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/doctor/dashboard">Doctor Dashboard</Link>
                </Button>
              </div>
            </div> */}
            
            <div className="p-4 text-sm font-medium text-center">
              <div className={isDbConnected ? "text-green-600" : "text-red-600"}>
                {message}
              </div>
              {loginMessage && (
                <div className="mt-2 text-blue-600">{loginMessage}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}