"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/configs/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Vote, Shield, Lock } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 min-h-[calc(100vh-4rem)]">
          {/* Branding */}
          <div className="flex flex-col justify-center space-y-8 lg:pr-8">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-6">
                <div className="bg-blue-600 p-3 rounded-full mr-4">
                  <Vote className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  BlockVote
                </h1>
              </div>
              <h2 className="text-2xl lg:text-3xl font-semibold text-gray-800 mb-4">
                Welcome Back
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Sign in to access your blockchain-secured voting account and
                participate in ongoing elections.
              </p>
            </div>
            {/* Features */}
            <div className="grid gap-6">
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Secure Voting</h3>
                  <p className="text-gray-600">
                    Your vote is protected by advanced blockchain technology and
                    encryption.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Lock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Private & Confidential
                  </h3>
                  <p className="text-gray-600">
                    Your identity is verified but your voting choices remain
                    confidential.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sign In Form */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
                <CardDescription>
                  Access your blockchain voting account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="remember"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm text-gray-600"
                      >
                        Remember me
                      </label>
                    </div>
                    <a
                      href="/forgot-password"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="space-y-4 pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={loading}
                    >
                      {loading ? "Signing In..." : "Sign In"}
                    </Button>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Don't have an account?{" "}
                        <Link
                          href="/register"
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Register here
                        </Link>
                      </p>
                    </div>
                  </div>
                </form>

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 text-center">
                    By signing in, you agree to our Terms of Service and Privacy
                    Policy.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
