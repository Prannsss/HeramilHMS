"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import axios, { AxiosError } from "axios"
import { Eye, EyeOff } from "lucide-react"
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
import { useUserStore } from "@/hooks/use-user-store"
import { useToast } from "@/hooks/use-toast"

interface LoginResponse {
  status: string
  message?: string
  user?: {
    id: number
    role: string
    doctor_id?: number
    name?: string
    specialization?: string
    department?: string
  }
}

interface DatabaseResponse {
  status: string
  message?: string
}

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDbConnected, setIsDbConnected] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { setUser } = useUserStore()
  const { toast } = useToast()

  // Ensure we're mounted on the client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Test database connection only after mounting
  useEffect(() => {
    if (!mounted) return
    
    const testConnection = async () => {
      try {
        toast({
          title: "Connecting to database...",
          description: "Please wait while we establish connection.",
          duration: 2000,
        })

        const response = await axios.get<DatabaseResponse>(
          "http://localhost/HeramilHMS/public/backend/db_connect.php",
          {
            timeout: 5000,
          }
        )
        
        if (response.data && response.data.status === "success") {
          toast({
            title: "Database Connected",
            description: "Database connected successfully!",
            duration: 2000,
          })
          setIsDbConnected(true)
        } else {
          toast({
            variant: "destructive",
            title: "Connection Failed",
            description: "Failed to connect to the database.",
            duration: 2000,
          })
          setIsDbConnected(false)
        }
      } catch (error) {
        console.error("Database connection error:", error)
        
        let errorMessage = "Unexpected error occurred."
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNABORTED') {
            errorMessage = "Connection timeout. Please check your server."
          } else if (error.response) {
            errorMessage = `Server error: ${error.response.status}`
          } else if (error.request) {
            errorMessage = "No response from server. Please check if the backend is running."
          } else {
            errorMessage = "Error setting up the request."
          }
        }
        
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: errorMessage,
          duration: 2000,
        })
        setIsDbConnected(false)
      }
    }

    testConnection()
  }, [mounted, toast])

  // Handle login
  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter both email and password.",
        duration: 2000,
      })
      return
    }

    if (!email.includes('@')) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        duration: 2000,
      })
      return
    }

    setIsLoading(true)
    toast({
      title: "Logging in...",
      description: "Checking credentials...",
      duration: 2000,
    })

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
          timeout: 8000,
        }
      )

      const data = response.data

      if (data && data.status === "success" && data.user) {
        toast({
          title: "Login Successful",
          description: `Welcome ${data.user.name || data.user.role}!`,
          duration: 2000,
        })

        setUser(data.user)

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
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: data.message || "Invalid credentials",
          duration: 2000,
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      
      let errorMessage = "Unexpected error occurred."
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<LoginResponse>
        
        if (axiosError.code === 'ECONNABORTED') {
          errorMessage = "Request timeout. Please try again."
        } else if (axiosError.response) {
          const errorData = axiosError.response.data
          if (errorData && errorData.message) {
            errorMessage = errorData.message
          } else {
            errorMessage = `Server error: ${axiosError.response.status}`
          }
        } else if (axiosError.request) {
          errorMessage = "No response from server. Please check your connection."
        } else {
          errorMessage = "Error setting up the request."
        }
      }
      
      toast({
        variant: "destructive",
        title: "Login Error",
        description: errorMessage,
        duration: 2000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin()
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <header className="mb-8 flex flex-col items-center">
            <Logo />
            <p className="mt-2 text-muted-foreground">
              Loading...
            </p>
          </header>
        </div>
      </div>
    )
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
                  value={email || ""}
                  onChange={(e) => setEmail(e.target.value || "")}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password || ""}
                    onChange={(e) => setPassword(e.target.value || "")}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-100 hover:text-black"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
