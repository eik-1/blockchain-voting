// app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {name,  aadhar, email, ethereum_address, address, id } = body


  const { error } = await supabase.from('voters').insert({
    name,
    id,
    aadhar,
    email,
    ethereum_address,
    address,
  })

  if (error) {
    console.error('Error inserting data into voters table:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
