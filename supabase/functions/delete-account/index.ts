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

    // Check if the request has a user_id in the body (admin deleting another user)
    const body = await req.json().catch(() => ({}));
    const targetUserId = body.user_id || user.id;

    // Check if the current user has admin role
    const { data: currentUserRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isCurrentUserAdmin = currentUserRoles?.some(r => r.role === 'admin');

    // If trying to delete another user, must be admin
    if (targetUserId !== user.id && !isCurrentUserAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only admins can delete other users' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if target user is an admin
    const { data: targetUserRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId);

    const isTargetUserAdmin = targetUserRoles?.some(r => r.role === 'admin');

    if (isTargetUserAdmin && targetUserId === user.id) {
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
      .or(`sender_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`);

    // 2. Delete reminders
    await supabaseAdmin
      .from('reminders')
      .delete()
      .or(`sender_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`);

    // 3. Delete mining sessions
    await supabaseAdmin
      .from('mining_sessions')
      .delete()
      .eq('user_id', targetUserId);

    // 4. Delete transactions
    await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('user_id', targetUserId);

    // 5. Update referrals to remove references (keep the referral records but nullify the deleted user)
    // Update referrals where this user was the referrer - set referrer_id to null or handle as needed
    // Since we want to preserve the referrals for the referred users, we'll just delete where this user is referred
    await supabaseAdmin
      .from('referrals')
      .delete()
      .eq('referred_id', targetUserId);

    // Keep referrals where this user was the referrer - those people keep their bonuses
    // No action needed for referrer_id matches

    // 6. Delete user roles
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', targetUserId);

    // 7. Delete profile
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', targetUserId);

    // 8. Finally, delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      targetUserId
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

