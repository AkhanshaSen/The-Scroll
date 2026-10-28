#!/usr/bin/env node
/**
 * Reads supabase/.project-ref and syncs SUPABASE_PROJECT_REF + VITE_SUPABASE_URL in .env.local
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const refPath = join(root, 'supabase', '.project-ref')
const envLocal = join(root, '.env.local')
const envExample = join(root, '.env.example')

function readRef() {
  if (!existsSync(refPath)) {
    console.error(
      'Missing supabase/.project-ref\n' +
        '  1. Open your project in Supabase (npm run supabase:open-dashboard)\n' +
        '  2. Copy the id from the URL: .../project/<PROJECT_REF>\n' +
        '  3. echo YOUR_REF > supabase/.project-ref\n' +
        '  4. Run this script again',
    )
    process.exit(1)
  }
  const ref = readFileSync(refPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#'))
  if (!ref || ref.includes('your-project-ref')) {
    console.error('Edit supabase/.project-ref and paste your real project ref (one line).')
    process.exit(1)
  }
  if (!/^[a-z0-9]{15,30}$/i.test(ref)) {
    console.warn('Warning: project ref usually looks like 20 lowercase letters/digits; got:', ref)
  }
  return ref
}

const ref = readRef()

if (!existsSync(envLocal)) {
  if (!existsSync(envExample)) {
    console.error('Missing .env.example')
    process.exit(1)
  }
  copyFileSync(envExample, envLocal)
  console.log('Created .env.local from .env.example')
}

let env = readFileSync(envLocal, 'utf8')
const url = `https://${ref}.supabase.co`

env = env.replace(/^SUPABASE_PROJECT_REF=.*$/m, `SUPABASE_PROJECT_REF=${ref}`)
env = env.replace(/^VITE_SUPABASE_URL=.*$/m, `VITE_SUPABASE_URL=${url}`)

if (!/^SUPABASE_PROJECT_REF=/m.test(env)) {
  env += `\nSUPABASE_PROJECT_REF=${ref}\n`
}
if (!/^VITE_SUPABASE_URL=/m.test(env)) {
  env += `VITE_SUPABASE_URL=${url}\n`
}

writeFileSync(envLocal, env)

const configToml = join(root, 'supabase', 'config.toml')
if (existsSync(configToml)) {
  let toml = readFileSync(configToml, 'utf8')
  if (/^project_id\s*=/m.test(toml)) {
    toml = toml.replace(/^project_id\s*=.*$/m, `project_id = "${ref}"`)
  } else {
    toml += `\nproject_id = "${ref}"\n`
  }
  writeFileSync(configToml, toml)
  console.log('  supabase/config.toml project_id=', ref)
}

console.log('Updated .env.local:')
console.log('  SUPABASE_PROJECT_REF=', ref)
console.log('  VITE_SUPABASE_URL=', url)
console.log('')
console.log('Next: paste VITE_SUPABASE_ANON_KEY from Dashboard → Connect → API keys (anon public).')
console.log('Then: npm run dev')
