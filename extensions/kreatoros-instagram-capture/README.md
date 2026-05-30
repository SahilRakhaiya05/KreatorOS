# KreatorOS Instagram Capture

Chrome Manifest V3 extension for saving the current Instagram post, reel, TV item, or story into KreatorOS.

## Setup

1. Run KreatorOS locally or deploy it.
2. Open `config.js`.
3. Set `API_ORIGIN` to your app origin, for example `http://localhost:3000` or `https://your-app.vercel.app`.
4. Sign in to KreatorOS in the same browser.
5. Open `chrome://extensions`, enable Developer mode, click **Load unpacked**, and choose this folder.

The extension posts to:

```txt
API_ORIGIN + /api/import/instagram
```

Saved captures appear at:

```txt
/creator/instagram
```

## What It Saves

- Instagram URL and canonical URL
- Post/reel/story type
- Shortcode, username, caption, title, thumbnail
- Visible media URLs when available
- A raw visible text sample
- Gemini analysis when `GOOGLE_GENERATIVE_AI_API_KEY` is configured

The API requires a signed-in KreatorOS session and stores captures under the active creator workspace.
