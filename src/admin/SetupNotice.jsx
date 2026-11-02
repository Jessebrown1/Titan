import { Database } from 'lucide-react';
import AuthShell from './AuthShell';

export default function SetupNotice() {
  return (
    <AuthShell eyebrow="Setup required">
      <div className="login__card-head">
        <span className="login__badge"><Database aria-hidden="true" /> Backend not connected</span>
        <h2>Connect the backend</h2>
        <p>The dashboard needs Supabase for secure sign-in, the vehicle database and photo storage. Nothing can be saved until it&rsquo;s configured.</p>
      </div>
      <ol className="login__steps">
        <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a>.</li>
        <li>Run <code>supabase/schema.sql</code> in the SQL editor.</li>
        <li>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code>.</li>
        <li>Create an admin user and add it to <code>admins</code> (see README).</li>
        <li>Restart the dev server.</li>
      </ol>
    </AuthShell>
  );
}
