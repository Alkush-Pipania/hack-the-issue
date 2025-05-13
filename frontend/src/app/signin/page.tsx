"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, BookOpen, Library, BookText, BookCopy, Lock, Mail } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data || "Failed to sign in");
      }

      // Store token with Bearer prefix and userId in localStorage
      localStorage.setItem("token", `Bearer ${data.token}`);
      localStorage.setItem("userId", data.userId || data.email);

      // Redirect to dashboard after successful login
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col md:flex-row overflow-hidden">
      {/* Left side - decorative library image and branding */}
      <div className="relative hidden md:flex md:w-1/2 bg-gradient-to-br from-[#004366] to-[#003152] justify-center items-center overflow-hidden p-12">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/bookshelf-pattern.svg')] bg-repeat opacity-5"></div>
        </div>
        
        <div className="relative z-10 max-w-lg text-center">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-white/10 rounded-full">
              <Library className="h-20 w-20 text-[#FF9800]" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4"> Library <span className="text-[#FF9800]">Management</span></h1>
          <p className="text-white/80 text-lg mb-8">Your complete solution for modern library operations</p>
          
          <div className="grid grid-cols-2 gap-6 mt-12">
            <div className="bg-white/10 p-6 rounded-xl">
              <BookOpen className="h-10 w-10 text-[#FF9800] mb-4" />
              <h3 className="text-white font-semibold mb-2">Comprehensive Catalog</h3>
              <p className="text-white/70 text-sm">Manage thousands of books with our powerful search engine</p>
            </div>
            <div className="bg-white/10 p-6 rounded-xl">
              <BookCopy className="h-10 w-10 text-[#FF9800] mb-4" />
              <h3 className="text-white font-semibold mb-2">Circulation Management</h3>
              <p className="text-white/70 text-sm">Track borrowings and returns with ease</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - login form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md border-[#FF9800]/20 shadow-xl bg-white overflow-hidden">
          <div className="h-3 w-full bg-gradient-to-r from-[#FF9800] to-[#FF5722]"></div>
          <CardHeader className="space-y-2 mt-4">
            <div className="flex justify-center mb-4 md:hidden">
              <div className="p-4 bg-gradient-to-br from-[#004366] to-[#003152] rounded-full">
                <Library className="h-10 w-10 text-[#FF9800]" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-[#004366] to-[#003152] bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              Sign in to access your library dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-600">Authentication Error</AlertTitle>
                <AlertDescription className="text-red-600/90">{error}</AlertDescription>
              </Alert>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[#004366] font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[#FF9800]" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="librarian@example.lib" 
                            {...field} 
                            className="pl-3 py-6 bg-gray-50 border-[#004366]/20 focus:border-[#FF9800] focus:ring-[#FF9800]/20 rounded-md" 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[#004366] font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4 text-[#FF9800]" />
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="password" 
                            placeholder="••••••" 
                            {...field} 
                            className="pl-3 py-6 bg-gray-50 border-[#004366]/20 focus:border-[#FF9800] focus:ring-[#FF9800]/20 rounded-md" 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-[#FF9800] to-[#FF5722] hover:from-[#FF5722] hover:to-[#FF9800] text-white font-medium py-6 rounded-md transition-all duration-300 ease-in-out shadow-md hover:shadow-lg border border-[#FF9800]/20 mt-4" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <span>Sign In to Dashboard</span>
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-gray-500 text-sm">
                Athena Library Management System <span className="text-[#FF9800]">v2.0</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}