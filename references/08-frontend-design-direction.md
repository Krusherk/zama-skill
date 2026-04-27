# Frontend Design Direction

Use this file when the user wants a frontend, landing page, app shell, or polished demo UI and the repo does not already have a strong visual system to preserve.

Default to plain `html` + `css` + `js` for greenfield frontend work unless the user explicitly asks for React or the repository already uses React.

## Default visual concept

Default to a bold editorial look rather than a safe generic crypto dashboard.

- Highlight color: warm yellow `#FFE500`
- Ink color: dark brown-black `#1A1400`
- Soft surface: cream `#FFFDE0`
- Typography:
  - display: `Bebas Neue` or another condensed, high-impact face
  - body: `DM Sans` or another clean humanist sans
- Shape language:
  - rounded cards
  - thick borders
  - offset shadows
  - pill buttons and badges
- Motion:
  - subtle hero drift
  - staggered fade-up entrances
  - small button lift interactions
  - avoid noisy perpetual motion except on background accents or marquees

## Layout concept

The base composition should feel energetic and intentional.

- sticky or semi-sticky top navigation
- oversized hero headline
- faint background wordmark or shape
- one bright status pill near the hero
- one strong primary call to action and one secondary action
- card-based feature or workflow section
- stats band or credibility section
- testimonial or trust section if the page is product-marketing oriented
- a strong closing call to action

## How to adapt the concept to FHEVM apps

Do not stop at a marketing shell. Translate the design into actual confidential-app interaction surfaces.

For greenfield FHEVM frontends, include at least these product blocks when relevant:

- wallet connection state
- network badge showing `localhost` or `sepolia`
- contract address display or config status
- encrypted input composer
- user decryption action area
- public disclosure or finalization area if the app supports it
- transaction feedback states: idle, encrypting, signing, submitting, confirmed, failed

## Component rules

### Navigation

- Keep nav simple and bold.
- Include product name, 3-4 links max, and one strong CTA.
- If the frontend is app-first rather than marketing-first, the right-side CTA can be `Connect Wallet`, `Encrypt Vote`, or `Launch App`.

### Hero

- Use one large high-contrast idea statement.
- Use a short, low-weight subheading.
- Add one status pill such as `Live on Sepolia`, `Confidential by Default`, or `Public Beta`.
- If the app is demo-oriented, show the main encrypted action directly in the hero or immediately below it.

### Cards

- Use cream cards on light pages.
- Use an occasional dark inverted feature card for emphasis.
- Keep one main story per card.
- Use icons sparingly but clearly.

### Buttons

- Primary buttons should feel tactile: filled yellow or dark ink with an offset shadow.
- Secondary buttons should be outlined and become filled on hover.
- Avoid tiny text-only buttons for the main action path.

### Data and status

- Do not dump raw blockchain data without framing.
- Present status with compact chips:
  - `Mock Runtime`
  - `Sepolia`
  - `Wallet Connected`
  - `Awaiting Permit Signature`
  - `Result Finalized`

### Mobile behavior

- Collapse multi-column grids to one column under tablet widths.
- Hide nonessential nav links on smaller screens before shrinking content into unreadability.
- Keep buttons large and touch-friendly.
- Ensure the hero still reads clearly on small screens.

## Frontend behavior expectations

The generated frontend should do more than look good.

- It must clearly show where encrypted input is created.
- It must make the signer step obvious for user decryption flows.
- It must show which chain is expected.
- It must show success and failure states for contract interactions.
- It must keep contract address binding points easy to find.

## Use the shipped shell template

Start from `templates/frontend-fhevm-app-shell.html.tmpl` when:

- the repo is greenfield
- the user asks for a polished frontend
- the user asks for a landing page plus working app shell
- there is no design system already in the codebase

Use `templates/frontend-fhevm-app-shell.tsx.tmpl` only when React is explicitly requested or already established in the repository.

Do not use either template blindly when the repository already has its own design language. In that case, port the same structural ideas into the existing system instead of importing a foreign look.
