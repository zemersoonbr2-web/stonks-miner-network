import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has admin role
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(r => r.role === 'admin');

    if (isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin accounts cannot be deleted' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Use service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Delete data in correct order to avoid foreign key issues
    // 1. Delete chat messages
    await supabaseAdmin
      .from('chat_messages')
      .delete()
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    // 2. Delete reminders
    await supabaseAdmin
      .from('reminders')
      .delete()
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    // 3. Delete mining sessions
    await supabaseAdmin
      .from('mining_sessions')
      .delete()
      .eq('user_id', user.id);

    // 4. Delete transactions
    await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('user_id', user.id);

    // 5. Update referrals to remove references (keep the referral records but nullify the deleted user)
    // Update referrals where this user was the referrer - set referrer_id to null or handle as needed
    // Since we want to preserve the referrals for the referred users, we'll just delete where this user is referred
    await supabaseAdmin
      .from('referrals')
      .delete()
      .eq('referred_id', user.id);

    // Keep referrals where this user was the referrer - those people keep their bonuses
    // No action needed for referrer_id matches

    // 6. Delete user roles
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);

    // 7. Delete profile
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id);

    // 8. Finally, delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      throw deleteError;
    }

    return new Response(
      JSON.stringify({ message: 'Account deleted successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting account:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

