'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Vote, Shield, Lock, Users } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/configs/supabase' 

export default function RegistrationPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    aadhar: '',
    email: '',
    password: '',
    ethereum: '',
    address: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { email, password, name, aadhar, ethereum, address } = formData

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, aadhar, ethereum, address },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard') 
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 min-h-[calc(100vh-4rem)]">
          {/* Left Section (Branding & Features) */}
          <div className="flex flex-col justify-center space-y-8 lg:pr-8">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-6">
                <div className="bg-blue-600 p-3 rounded-full mr-4">
                  <Vote className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">BlockVote</h1>
              </div>
              <h2 className="text-2xl lg:text-3xl font-semibold text-gray-800 mb-4">Blockchain Based Voting System</h2>
              <p className="text-lg text-gray-600 mb-8">
                Secure, transparent, and tamper-proof voting powered by blockchain technology. Your vote matters, and
                now it's protected by cryptographic security.
              </p>
            </div>

            <div className="grid gap-6">
              {/* Feature 1 */}
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Secure & Transparent</h3>
                  <p className="text-gray-600">Every vote is recorded on the blockchain.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Lock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Tamper-Proof</h3>
                  <p className="text-gray-600">Immutable blockchain prevents unauthorized changes.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Verified Identity</h3>
                  <p className="text-gray-600">Aadhar-based verification ensures eligibility.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section (Form) */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Voter Registration</CardTitle>
                <CardDescription>Register to participate in blockchain-secured voting</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={formData.name} onChange={handleChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aadhar">Aadhar Number</Label>
                    <Input id="aadhar" value={formData.aadhar} onChange={handleChange} required maxLength={14} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={formData.password} onChange={handleChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ethereum">Ethereum Address</Label>
                    <Input
                      id="ethereum"
                      placeholder="0x..."
                      value={formData.ethereum}
                      onChange={handleChange}
                      pattern="^0x[a-fA-F0-9]{40}$"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Residential Address</Label>
                    <Textarea id="address" rows={3} value={formData.address} onChange={handleChange} required />
                  </div>

                  <div className="pt-4 space-y-4">
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                      {loading ? 'Registering...' : 'Register for Voting'}
                    </Button>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                    <p className="text-sm text-gray-600 text-center">
                      Already registered?{' '}
                      <Link href="/" className="text-blue-600 hover:underline font-medium">
                        Sign in here
                      </Link>
                    </p>
                  </div>
                </form>

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 text-center">
                    By registering, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
