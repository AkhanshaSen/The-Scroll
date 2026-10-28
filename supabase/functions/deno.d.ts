/**
 * Minimal Deno globals for Supabase Edge Functions.
 * Runtime is Deno on Supabase; this file is for editor / `tsc` checks only.
 */
declare namespace Deno {
  function serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): void

  namespace env {
    function get(key: string): string | undefined
  }
}
