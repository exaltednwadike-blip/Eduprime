import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function makeNoopClient() {
	const handler = {
		get() {
			return () => {
				throw new Error('Supabase client not initialized. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in the environment.');
			};
		},
	};
	return new Proxy({}, handler) as any;
}

// Only create a browser client at runtime in the browser. During server build/prerender
// we avoid constructing the client so builds do not fail when env vars are managed by Vercel.
let supabase: any = makeNoopClient();

try {
	if (typeof window !== 'undefined') {
		if (!supabaseUrl || !supabaseAnonKey) {
			// In browser runtime warn if not configured.
			// We still create a noop client so imports don't throw during SSR/build.
			// The real client will only be created when valid env vars are available.
			// This helps avoid build-time failures when env vars are injected by the hosting platform.
			// eslint-disable-next-line no-console
			console.warn('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY; Supabase client will not be initialized.');
		} else {
			supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
		}
	}
} catch (err) {
	// If creation fails for any reason, keep the noop client to avoid build-time crashes.
	// eslint-disable-next-line no-console
	console.warn('Failed to initialize Supabase client at runtime:', err);
	supabase = makeNoopClient();
}

export { supabase };

export function getSupabaseClient() {
	if (typeof window !== 'undefined' && (supabase === undefined || supabase === null)) {
		if (supabaseUrl && supabaseAnonKey) {
			try {
				// Attempt to initialize if it wasn't initialized earlier
				// (e.g., when this module was evaluated in a different runtime context).
				// eslint-disable-next-line @typescript-eslint/no-var-requires
				const { createBrowserClient: _create } = require('@supabase/ssr');
				supabase = _create(supabaseUrl, supabaseAnonKey);
			} catch (err) {
				// ignore
			}
		}
	}
	return supabase;
}
