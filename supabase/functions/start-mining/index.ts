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

    // Check if user has an active mining session
    const { data: activeSession } = await supabaseClient
      .from('mining_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .single()

    if (activeSession) {
      return new Response(JSON.stringify({ error: 'Already have an active mining session' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check last mining time (24h cooldown)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('last_mining_at')
      .eq('id', user.id)
      .single()

    if (profile?.last_mining_at) {
      const lastMining = new Date(profile.last_mining_at)
      const now = new Date()
      const hoursSinceLastMining = (now.getTime() - lastMining.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceLastMining < 24) {
        return new Response(JSON.stringify({ 
          error: 'Must wait 24 hours between mining sessions',
          hoursRemaining: Math.ceil(24 - hoursSinceLastMining)
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Check if mining is still allowed
    const { count: totalUsers } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (totalUsers && totalUsers >= 10000000) {
      return new Response(JSON.stringify({ 
        error: 'Mining has ended. Maximum users reached.',
        phase: 'completed'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create new mining session - 24 hours
    const now = new Date()
    const endsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours

    const { data: session, error: insertError } = await supabaseClient
      .from('mining_sessions')
      .insert({
        user_id: user.id,
        ends_at: endsAt.toISOString(),
        ad_watched: false
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Update profile
    await supabaseClient
      .from('profiles')
      .update({
        is_mining: true,
        last_mining_at: now.toISOString()
      })
      .eq('id', user.id)

    return new Response(JSON.stringify({ session }), {
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