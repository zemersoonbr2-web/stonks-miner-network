import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { sessionId } = await req.json()

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get mining session
    const { data: session, error: sessionError } = await supabaseClient
      .from('mining_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .eq('completed', false)
      .single()

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Invalid or completed session' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if session time has elapsed
    const now = new Date()
    const endsAt = new Date(session.ends_at)
    
    if (now < endsAt) {
      return new Response(JSON.stringify({ error: 'Mining session not yet complete' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Calculate reward (0.05 STK per session)
    const reward = 0.05

    // Get current profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('balance, total_mined')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const newBalance = Number(profile.balance) + reward
    const newTotalMined = Number(profile.total_mined) + reward

    // Update mining session
    await supabaseClient
      .from('mining_sessions')
      .update({ completed: true })
      .eq('id', sessionId)

    // Update profile
    await supabaseClient
      .from('profiles')
      .update({
        balance: newBalance,
        is_mining: false,
        total_mined: newTotalMined
      })
      .eq('id', user.id)

    // Create transaction record
    await supabaseClient
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'mining',
        amount: reward,
        description: 'Daily Mining Reward'
      })

    return new Response(JSON.stringify({ 
      success: true, 
      reward,
      newBalance,
      newTotalMined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})