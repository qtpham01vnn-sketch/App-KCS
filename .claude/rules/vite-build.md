# Vite Build & Configuration Rules

## Project Setup
- Always use `npx -y create-vite@latest ./ --template react-ts` for new projects
- Never install global Vite — use project-local `devDependencies`
- Set `base: './'` in `vite.config.ts` for relative asset paths in production

## Configuration
- Keep `vite.config.ts` minimal — avoid unnecessary plugins
- Use `resolve.alias` for clean imports: `'@': path.resolve(__dirname, './src')`
- Configure `server.port` explicitly to avoid conflicts
- Enable `server.open: true` for auto-browser launch in dev

## Environment Variables
- Prefix all client-side env vars with `VITE_` — anything else is server-only
- Access via `import.meta.env.VITE_API_URL` — never `process.env`
- Use `.env.local` for secrets (gitignored), `.env` for defaults
- Type env vars in `src/vite-env.d.ts`:
  ```typescript
  interface ImportMetaEnv {
    readonly VITE_API_URL: string
  }
  ```

## Build Optimization
- Run `npm run build` before deploying — never deploy dev server
- Check bundle size with `npx vite-bundle-visualizer`
- Use dynamic imports for route-level code splitting:
  ```typescript
  const Dashboard = lazy(() => import('./pages/Dashboard'))
  ```
- Configure `build.rollupOptions.output.manualChunks` for vendor splitting
- Set `build.target: 'es2020'` minimum for modern browser support

## Asset Handling
- Place static assets in `public/` — they copy as-is to build output
- Import assets in components for hashing: `import logo from './logo.svg'`
- Use `?url` suffix for asset URL imports, `?raw` for raw string imports

## Dev Server
- Use `npm run dev` for development — never `npm run build && serve`
- HMR is automatic — no manual configuration needed
- If HMR breaks, check for circular dependencies or missing React Fast Refresh boundaries

## Common Pitfalls
- ❌ Never use `require()` — Vite is ESM-only
- ❌ Never reference `__dirname` in client code — it's Node.js only
- ❌ Never mix CommonJS and ESM in the same project
- ❌ Never hardcode `localhost:5173` — use relative paths
- ❌ Never skip `type-check` before production build
