# Trend Makers

Trend Makers is a personal digital wardrobe and outfit planner. The React/Vite client and Express API use MongoDB/Mongoose for account and saved-outfit data.

## Requirements

- Node.js 18 or newer
- MongoDB (local or hosted)
- Optional: OpenWeatherMap API key for live weather

## Run locally

1. Install dependencies from the project root:

   ```sh
   npm install
   ```

2. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` and a long random `JWT_SECRET`.
3. Start the API and Vite development server:

   ```sh
   npm run dev
   ```

4. Open `http://localhost:5173` and create an account. A ready-to-style starter wardrobe is included automatically; open **Style My Outfit**, choose a few pieces, and generate outfit ideas. The optional clothing catalog is there if you want to tailor your wardrobe further. The API listens on `http://localhost:4000`.

For a production client build, run `npm run build`. Start the API with `npm start` after setting its environment variables. Set `VITE_API_URL` at client build time if the API is hosted at a different origin.

## Features

- Account registration/login, bcrypt password hashing, signed JWT sessions, profile preferences, and user-scoped records.
- A ready-to-style starter wardrobe across tops, bottoms, dresses, traditional wear, outerwear, footwear, and accessories is added when an account is created. Browse the optional catalog by category or collection to tailor it; photos are visual guides and may not exactly match your clothes.
- “Style My Outfit” uses selected wardrobe pieces, occasion, preferred style, and season to generate three distinct combinations, adding layers for cold or rainy weather. College, casual outing, office, party, wedding, and travel occasions are supported alongside casual, elegant, streetwear, traditional, and minimalist styles. Each card includes photos, a color story, an explanation, styling advice, save, favorite, and try-another actions. Recommendations use only pieces belonging to the signed-in user.
- Saved/favorite outfits, calendar scheduling, duplicate-date protection with an explicit override, and marking planned looks as worn.
- Optional live current weather lookup. Manual weather selection remains available when the provider is not configured.

## API

All endpoints except register/login/health require an authenticated bearer token.

- `POST /api/auth/register`, `POST /api/auth/login`, `GET/PUT /api/auth/me`
- `GET /api/wardrobe/catalog`, `GET/POST /api/wardrobe`, `GET /api/wardrobe/:id`
- `GET/POST /api/outfits`, `PUT/DELETE /api/outfits/:id`, `POST /api/outfits/style`
- `GET/POST /api/calendar`, `PUT/DELETE /api/calendar/:id`
- `GET /api/weather?city=<city>`
- `GET /api/health`

Every wardrobe item, outfit, and calendar entry is associated with its owner; outfit and calendar writes validate ownership of referenced records.
