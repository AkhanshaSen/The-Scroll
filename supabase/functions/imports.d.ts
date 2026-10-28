/** Map Deno esm.sh URL imports for IDE type-checking (runtime loads from esm.sh on Supabase). */
declare module 'https://esm.sh/@supabase/supabase-js@2.49.1' {
  export function createClient(
    ...args: [url: string, key: string, options?: Record<string, unknown>]
  ): SupabaseClientLike
  export type SupabaseClientLike = {
    auth: {
      getUser(): Promise<{ data: { user: AuthUserLike | null }; error: Error | null }>
    }
    from(table: string): QueryBuilderLike
  }
  type AuthUserLike = { id: string; email?: string }
  type QueryBuilderLike = {
    select(cols: string): QueryBuilderLike
    eq(col: string, val: string): QueryBuilderLike
    maybeSingle(): Promise<{ data: unknown; error: Error | null }>
    insert(row: Record<string, unknown>): QueryBuilderLike
    update(row: Record<string, unknown>): QueryBuilderLike
    single(): Promise<{ data: Record<string, string>; error: Error | null }>
  }
}
