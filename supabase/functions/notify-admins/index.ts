// Sends web push notifications to every admin device.
// Called by the enquiries database trigger, and by admins for a test message.
// Deploy with "Verify JWT" turned off: it checks its own secret and tokens below.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL')!;
const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// The key pair is created here on first use, so the private key never leaves the server.
async function loadConfig() {
  const { data, error } = await db.from('push_config').select('*').single();
  if (error) throw error;
  if (data.public_key) return data;
  const keys = webpush.generateVAPIDKeys();
  const { data: saved, error: saveError } = await db.from('push_config')
    .update({ public_key: keys.publicKey, private_key: keys.privateKey })
    .eq('id', true).select().single();
  if (saveError) throw saveError;
  return saved;
}

function describe(row: Record<string, string>) {
  const who = [row.full_name, row.vehicle_interest].filter(Boolean).join(' · ');
  if (row.type === 'rental') return { title: 'New rental request', body: who, url: '/admin/rentals?status=new' };
  if (row.type === 'test_drive') return { title: 'New test drive request', body: who, url: '/admin/rentals?kind=test_drive&status=new' };
  return { title: 'New enquiry', body: who, url: '/admin/enquiries?status=new' };
}

async function send(config: Record<string, string>, payload: Record<string, string>, userId?: string) {
  webpush.setVapidDetails(url, config.public_key, config.private_key);
  let query = db.from('admin_push_subscriptions').select('endpoint, subscription');
  if (userId) query = query.eq('user_id', userId);
  const { data: rows, error } = await query;
  if (error) throw error;

  let sent = 0;
  const failed: string[] = [];
  await Promise.all((rows ?? []).map(async (row) => {
    try {
      await webpush.sendNotification(row.subscription, JSON.stringify(payload), { TTL: 3600, urgency: 'high' });
      sent += 1;
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.from('admin_push_subscriptions').delete().eq('endpoint', row.endpoint);
      else failed.push(String(code ?? err));
    }
  }));
  return { devices: rows?.length ?? 0, sent, failed };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const config = await loadConfig();
    if (req.method === 'GET') return json({ publicKey: config.public_key });

    const body = await req.json();

    if (body.test) {
      const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '');
      const { data: { user } } = await db.auth.getUser(token);
      if (!user) return json({ error: 'Unauthorised' }, 401);
      const { data: admin } = await db.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
      if (!admin) return json({ error: 'Unauthorised' }, 403);
      return json(await send(config, { title: 'TITAN Admin', body: 'Notifications are working.', url: '/admin', tag: 'test' }, user.id));
    }

    if (req.headers.get('x-webhook-secret') !== config.webhook_secret) return json({ error: 'Unauthorised' }, 401);
    const { data: row, error } = await db.from('enquiries').select('*').eq('id', body.id).single();
    if (error) throw error;
    return json(await send(config, { ...describe(row), tag: row.id }));
  } catch (err) {
    console.error(err);
    return json({ error: String(err) }, 500);
  }
});
