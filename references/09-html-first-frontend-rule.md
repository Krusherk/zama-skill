# HTML-First Frontend Rule

Use this file when the user wants a frontend but does not explicitly ask for React and the repository does not already standardize on React.

## Default rule

For greenfield frontend work, default to plain `html` + `css` + `js` for easier local testing.

Use React only when:

- the user explicitly asks for React
- the repository already uses React
- the repository already uses a React-based app shell

## Why this default exists

- static frontends are easier to inspect locally
- they are simpler to serve with a tiny local server
- they avoid unnecessary framework setup when the real task is contract interaction
- they reduce the amount of generated project scaffolding

## Template selection

- default shell: `templates/frontend-fhevm-app-shell.html.tmpl`
- React shell: `templates/frontend-fhevm-app-shell.tsx.tmpl`
- JS helper: `templates/frontend-encrypt-decrypt.js.tmpl`
- TS helper: `templates/frontend-encrypt-decrypt.ts.tmpl`

## Build-tool exception

If browser-side SDK usage requires package bundling and there is no framework in the repo already:

- prefer a minimal vanilla toolchain first
- do not introduce React unless the user asked for it

## Local validation expectation

For a static `html` + `css` + `js` frontend:

- do not invent a framework build step
- do run a lightweight validation step such as:
  - HTML parse/format validation
  - JS syntax validation
  - or a simple local static server when practical

If a framework already exists in the repo, use that repo’s normal build path instead.
