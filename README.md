# Comic Vault

Comic Vault is a comic collection web app focused on simplifying the process of starting collections and keeping track of which comics you own and which ones you might want to get next. It's live at https://comic-vault-sigma.vercel.app/

The web app is available in both french and english.
Happy collecting!

## Features

- New Arrivals — a live feed of new issues from major publishers
- Runs — track a creative continuity (a writer's stretch on a title, guest issues included, or a whole volume like "New Avengers (2015)") as its own unit, not an event bundled with its tie-ins (you'd have to link those yourself); link runs together (concurrent, required-before, etc.) to build a structured reading plan
- Custom lists, wishlists, and favorites
- Barcode scanning to add comics you own
- Cover scanning to compare comics you might already own
- Search across ComicVine's full catalog

## Development

You need Node.js, npm, a supabase account with a project (refer to the supabase folder), and a comicvine api key. Follow the structure of the .env.example file but with your own keys.

```sh
# copy .env.example to .env.local and fill in your own keys first. The project will not work without keys.

supabase link --project-ref <your-ref>
supabase db push

git clone <this-repository-url>
cd comic-vault-pro
npm i
npm run dev
```

Other useful scripts: `npm test` (unit tests), `npm run build` (production
build), `npm run lint`, `npm run format`.

> **Note:** ComicVine's API enforces a shared rate limit. If imports or New
> Arrivals start failing with a rate-limit message, that's ComicVine, not a
> bug — wait a few minutes and retry.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- Supabase

Deployed on Vercel