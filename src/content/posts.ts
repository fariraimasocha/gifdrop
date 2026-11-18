// Blog posts. Body is the small markdown dialect in #/lib/md (## ### - 1. **bold** [link](url)).
// Each post answers the search in its first paragraph, then explains, then FAQ (rendered as FAQPage schema).
export type Post = {
  slug: string
  title: string
  description: string
  date: string
  body: string
  faq: [string, string][]
}

export const POSTS: Post[] = [
  {
    slug: 'gif-to-whatsapp-sticker',
    title: 'How to Turn Any GIF Into a WhatsApp Sticker (iPhone & Android)',
    description:
      'Turn any GIF into an animated WhatsApp sticker in under a minute. No app, no sign-up: make it square and small, copy it, paste it in a chat.',
    date: '2026-11-18',
    body: `
**Short answer:** open [gifdrop](/), drop in the GIF (or paste its link), tap **Make a sticker**, then press and hold the result, tap **Copy image**, and paste it into a WhatsApp chat. WhatsApp shows a **Custom sticker** preview. Send it, tap it, and save it to Favorites so it lives in your sticker tray.

That's the whole thing. The rest of this post explains why most GIFs don't become stickers on their own, so you can fix it when one refuses.

## Why a normal GIF doesn't become a sticker

WhatsApp treats GIFs and stickers as two different things. A GIF is a message: it gets a grey box, a GIF badge and sits in a bubble. A sticker floats on its own with no background. When you paste an image, WhatsApp decides which one you get based on the file itself:

- **Shape.** Stickers are square. A wide or tall GIF looks wrong unless it's padded to a square.
- **Transparency.** Stickers have no background. The padding has to be see-through, not black or white.
- **Size.** Animated stickers have to stay small. Big files get sent as a regular GIF instead.

gifdrop handles all three on your phone: it fits the clip in a 512 × 512 square, pads the sides with transparent pixels, and shrinks the file until it's small enough.

## Step by step

1. **Get the GIF.** Save it from GIPHY or Tenor, or just copy the link. X (Twitter) GIFs work from the post link too.
2. **Open gifdrop** in Safari or Chrome on your phone. Paste the link, or tap the drop area and pick the file.
3. **Pick the moment.** Choose up to 4 seconds. Shorter clips are smaller and loop better.
4. **Choose framing.** *Fit entire clip* keeps everything with transparent edges. *Square crop* fills the square and trims the sides.
5. **Tap Make a sticker.** The conversion runs in your browser. Nothing is uploaded.
6. **Copy it.** Press and hold the animation and tap **Copy image**.
7. **Paste in WhatsApp.** Open any chat, hold the message box, tap **Paste**. You should see **Custom sticker** above the preview. Send.
8. **Keep it.** Tap the sticker you just sent and choose **Add to Favorites**.

## If it sends as a GIF instead

The file was too big for WhatsApp to treat as a sticker. Go back, choose **Compact (320 × 320)** or a shorter clip, make it again, copy and paste again. We wrote a full guide on [why WhatsApp sends stickers as GIFs](/blog/whatsapp-sticker-sent-as-gif).
`,
    faq: [
      ['Do I need an app to turn a GIF into a WhatsApp sticker?', 'No. gifdrop runs in your phone’s browser. You copy the finished sticker and paste it straight into a WhatsApp chat.'],
      ['Does this work on WhatsApp Web?', 'No. Pasting an image as a custom sticker only works in the WhatsApp mobile app on iPhone and Android.'],
      ['Will the sticker stay animated?', 'Yes, as long as you copy it by pressing and holding the animation and tapping Copy image. Screenshots and photo edits freeze it.'],
    ],
  },
  {
    slug: 'how-to-make-animated-whatsapp-stickers',
    title: 'How to Make Animated WhatsApp Stickers From Any Video',
    description:
      'Make animated WhatsApp stickers from videos, GIFs, TikToks or Reels. Free, in your browser, no sticker-maker app and no watermark.',
    date: '2026-11-18',
    body: `
**Short answer:** pick a video or GIF, cut it to 4 seconds or less, make it a small square with a transparent background, then copy and paste it into WhatsApp. [gifdrop](/) does the cutting, squaring and shrinking for you in the browser.

## What makes a sticker animated

An animated WhatsApp sticker is just a short, looping, square image with a transparent background and a small file size. You don't need a sticker pack, a developer account or a special app to send one. You need the file to look right to WhatsApp. (The exact limits are in our [sticker size guide](/blog/whatsapp-sticker-size-requirements).)

## The fastest way: from any clip

1. Open [gifdrop](/) on your phone.
2. Paste a link from X, TikTok, Instagram, GIPHY or Tenor, or pick a video from your camera roll.
3. Drag to the best moment. One to three seconds is the sweet spot: long enough to read, short enough to loop.
4. Pick **High** quality for most clips. Pick **Compact** for busy camera footage, which compresses badly.
5. Tap **Make a sticker**, then press and hold the result and tap **Copy image**.
6. Paste into any WhatsApp chat and send. Tap it and **Add to Favorites** to keep it.

## Picking a clip that works as a sticker

The best stickers are reactions. Something that reads in one glance, even at thumbnail size:

- **One subject, big in frame.** A face or an animal filling the square beats a wide crowd shot.
- **A clear action.** A nod, a shrug, a jump, a slow blink. Avoid clips where the joke is in the audio. Stickers are silent.
- **A natural loop.** Clips that end close to where they start loop smoothly. Start on the movement, not before it.
- **Little camera shake.** Shaky footage changes every pixel every frame, which makes the file huge.

## Making a full sticker pack instead

If you want a named pack of 3 to 30 stickers that friends can install, you need a sticker-maker app or WhatsApp's developer sample app, because packs have extra rules (a tray icon, a minimum count, a publisher name). For sending a reaction today, copy and paste is faster and needs nothing installed.
`,
    faq: [
      ['How long can an animated WhatsApp sticker be?', 'Keep it short. gifdrop caps clips at 4 seconds because longer clips rarely fit WhatsApp’s size limit for stickers.'],
      ['Can I make a sticker with sound?', 'No. WhatsApp stickers are silent. If the joke depends on audio, send the clip as a video instead.'],
      ['Is there a watermark?', 'No. gifdrop is free and adds no watermark.'],
    ],
  },
  {
    slug: 'tiktok-to-whatsapp-sticker',
    title: 'How to Turn a TikTok Into a WhatsApp Sticker',
    description:
      'Copy a TikTok link, paste it into gifdrop, keep the best 4 seconds and paste it into WhatsApp as an animated sticker. No downloads, no watermark.',
    date: '2026-11-18',
    body: `
**Short answer:** in TikTok tap **Share → Copy link**. Open [gifdrop's TikTok page](/tiktok), tap **Paste**, choose the best few seconds, tap **Make a sticker**, then press and hold the animation, **Copy image**, and paste it into a WhatsApp chat.

## Step by step

1. **Copy the link.** On the TikTok, tap the share arrow, then **Copy link**.
2. **Paste it into gifdrop.** Open [gifdrop.xyz/tiktok](/tiktok) and tap **Paste**. The clip loads in a few seconds.
3. **Trim it.** TikToks are long and stickers are short. Drag to the moment with the reaction and pick a length from 1 to 4 seconds.
4. **Frame it.** Most TikToks are tall. *Fit entire clip* keeps the whole frame with transparent sides. *Square crop* zooms in on the middle, which is usually where the face is.
5. **Make, copy, paste.** Tap **Make a sticker**, hold the result, tap **Copy image**, open WhatsApp and paste.

## Tips for TikTok clips

- **Square crop is usually better.** A tall clip shrunk into a square leaves a thin strip in the middle. Cropping keeps the subject big.
- **Skip the captions.** On-screen text gets tiny at sticker size. Pick a moment without it if you can.
- **Choose Compact for busy videos.** Fast cuts, filters and confetti make big files. Compact keeps it under WhatsApp's sticker limit.

## Private or removed TikToks

gifdrop can only fetch public videos. If a link doesn't load, the video is probably private, age-restricted or deleted. Save the video to your phone (if the creator allows downloads) and pick the file instead.
`,
    faq: [
      ['Do I need to download the TikTok first?', 'No. Paste the TikTok link and gifdrop fetches the public video for you.'],
      ['Why is my TikTok sticker so small in the middle?', 'TikToks are tall. Switch Framing to Square crop to fill the sticker.'],
      ['Is it legal to make stickers from TikToks?', 'Making a sticker for a private chat is personal use. Don’t sell or republish other people’s videos.'],
    ],
  },
  {
    slug: 'instagram-reel-to-whatsapp-sticker',
    title: 'How to Turn an Instagram Reel Into a WhatsApp Sticker',
    description:
      'Turn the best moment of an Instagram Reel into an animated WhatsApp sticker. Paste the link, trim, copy, paste. Free and no app.',
    date: '2026-11-18',
    body: `
**Short answer:** in Instagram tap **Share → Copy link** on the Reel. Paste it into [gifdrop's Instagram page](/instagram), pick up to 4 seconds, tap **Make a sticker**, then hold the animation, tap **Copy image** and paste it into WhatsApp.

## Step by step

1. **Copy the Reel link.** Tap the paper-plane icon under the Reel, then **Copy link**.
2. **Paste it into gifdrop.** Open [the Instagram page](/instagram) and tap **Paste**.
3. **Keep the best bit.** Drag to the reaction you want. Two seconds is plenty for most.
4. **Pick Square crop.** Reels are tall. Cropping keeps faces big.
5. **Make, copy, paste.** Tap **Make a sticker**, press and hold the result, **Copy image**, then paste into any WhatsApp chat.

## When the link won't load

Instagram limits what can be fetched from outside the app. Links from **private accounts** will never work, and some public Reels are blocked too. If a link fails:

1. Save the Reel to your phone, or use your phone's screen recorder while the Reel plays.
2. Open [gifdrop](/), tap the drop area and pick the video.
3. Trim off the start and end of the recording and carry on as normal.

## Getting a clean sticker from a Reel

- **Avoid the overlay.** Instagram puts the username, caption and buttons over the bottom of the video. Pick a moment where the subject is in the top two-thirds, then use Square crop.
- **Short loops win.** One gesture, looped, reads better than a whole scene.
`,
    faq: [
      ['Can I make a sticker from a private Instagram account?', 'Not from the link. Screen-record the Reel on your phone and upload the recording instead.'],
      ['Does gifdrop post anything to my Instagram?', 'No. It never asks you to log in to Instagram and only reads the public video.'],
    ],
  },
  {
    slug: 'twitter-gif-to-whatsapp-sticker',
    title: 'X (Twitter) GIF Not Working in WhatsApp? Here’s the Fix',
    description:
      'GIFs saved from X arrive as videos, so they never become WhatsApp stickers. Paste the post link into gifdrop to get a real sticker instead.',
    date: '2026-11-18',
    body: `
**Short answer:** GIFs on X aren't actually GIFs. They're short MP4 videos, so when you save or share one, WhatsApp gets a video, not a sticker. Copy the post link, paste it into [gifdrop](/), tap **Make a sticker**, and you get a real animated sticker you can copy into any chat.

## Why X GIFs break

When you upload a GIF to X, X converts it to an MP4 video to save bandwidth. It plays like a GIF on the site (silent, looping, autoplay), but the file underneath is a video. That's why:

- **Save** gives you a video in your camera roll, not a GIF.
- **Share to WhatsApp** sends a link or a video bubble.
- **WhatsApp's own sticker tools** don't see it as animated.

## The fix

1. On the post, tap **Share → Copy link**.
2. Open [gifdrop](/) and tap **Paste**.
3. Pick the bit you want (up to 4 seconds), then tap **Make a sticker**.
4. Press and hold the result, tap **Copy image**, and paste into a WhatsApp chat. Look for **Custom sticker** and send.

gifdrop turns the MP4 back into a small, square, transparent GIF, which is the format WhatsApp accepts as a sticker.

## Still sending as a GIF?

That means the file is still too big for a sticker. Remake it at **Compact** size or with a shorter clip. More in [why WhatsApp sends stickers as GIFs](/blog/whatsapp-sticker-sent-as-gif).
`,
    faq: [
      ['Why does a GIF from X save as a video?', 'X stores every GIF as an MP4 video. Saving it gives you the video, not a GIF file.'],
      ['Do I need an X account?', 'No. Paste the link of any public post.'],
    ],
  },
  {
    slug: 'whatsapp-sticker-sent-as-gif',
    title: 'Why Does WhatsApp Send My Sticker as a GIF? (And How to Fix It)',
    description:
      'WhatsApp sends your sticker as a GIF when the file is too big, not square, or has a solid background. Here’s how to fix each one.',
    date: '2026-11-18',
    body: `
**Short answer:** WhatsApp only treats a pasted image as a sticker when it's small enough. If it's too big, it sends a regular GIF. Make it again with a **shorter clip** or **Compact (320 × 320)** quality in [gifdrop](/), copy it again and paste again.

## How to tell which one you got

- **Sticker:** before you send, the preview says **Custom sticker**. Once sent, it floats with no bubble and no background.
- **GIF:** the preview has a GIF badge or an edit-as-GIF option, and once sent it sits in a grey message bubble.

## The causes, most common first

### 1. The file is too big

Animated stickers have a tight size limit, about 500 KB. Long clips, big dimensions and busy footage (camera shake, confetti, fast cuts) all make the file bigger.

**Fix:** pick 1 to 2 seconds instead of 4, choose **Compact**, and avoid shaky footage. gifdrop already shrinks automatically and shows the final size under the sticker, so you can see it.

### 2. You copied the wrong thing

Copying a link or sharing the file sends whatever the share sheet picks, often a GIF or video.

**Fix:** press and hold the **animation itself** and tap **Copy image**. Then paste in the message box.

### 3. You're on WhatsApp Web or desktop

Custom stickers from paste only work in the mobile app.

**Fix:** do it on your phone.

### 4. Your browser copies a still

Some in-app browsers (inside Instagram, TikTok or X) copy a flat image or nothing at all.

**Fix:** open the page in Safari or Chrome itself, then copy again.

## Quick checklist

- Clip is 2 seconds or less
- Compact quality
- Copied with press-and-hold → Copy image
- Pasted in the WhatsApp phone app
- Preview says **Custom sticker** before you send
`,
    faq: [
      ['What is the WhatsApp sticker size limit?', 'Animated stickers must be under roughly 500 KB and 512 × 512 pixels. Static stickers have a lower limit of about 100 KB.'],
      ['Why does my sticker have a black background?', 'The source had no transparency. Use Fit entire clip in gifdrop, which pads the sides with transparent pixels.'],
    ],
  },
  {
    slug: 'whatsapp-sticker-size-requirements',
    title: 'WhatsApp Sticker Size Requirements (Animated & Static)',
    description:
      'Exact WhatsApp sticker requirements: 512 × 512 px, under 100 KB static or 500 KB animated, transparent background, and the rules for sticker packs.',
    date: '2026-11-18',
    body: `
**Short answer:** a WhatsApp sticker is **512 × 512 pixels**, has a **transparent background**, and stays under **100 KB** if static or **500 KB** if animated. Animations loop and should be short. [gifdrop](/) outputs files that meet these limits automatically.

## The numbers

- **Dimensions:** exactly 512 × 512 pixels. Non-square images need transparent padding.
- **Static sticker:** under 100 KB.
- **Animated sticker:** under 500 KB, looping, and short (WhatsApp's own pack spec allows up to 10 seconds, but anything over a few seconds rarely fits the size limit).
- **Background:** transparent. Solid backgrounds work but look like a pasted photo.
- **Margin:** WhatsApp recommends a small transparent margin around the art so it doesn't touch the edges.

## Extra rules for sticker packs

These only matter if you're building an installable pack, not when you paste a single sticker into a chat:

- **3 to 30 stickers** per pack.
- A **tray icon** of 96 × 96 pixels, under 50 KB.
- Packs are either all static or all animated.
- Pack files use the WebP format.

## How to hit 500 KB with an animated sticker

Size depends on pixels × frames × how much changes between frames. To shrink it:

1. **Shorten it.** Half the seconds is roughly half the size.
2. **Lower the frame rate.** 10 to 12 frames per second looks smooth for reactions.
3. **Use fewer colours.** 64 to 128 colours is plenty for most clips.
4. **Reduce dimensions.** 320 × 320 is still sharp in a chat.
5. **Avoid noise.** Camera grain and shake change every pixel and balloon the file.

gifdrop tries 512 px first and steps down through smaller sizes and fewer colours until the sticker fits.
`,
    faq: [
      ['What size is a WhatsApp sticker in pixels?', '512 × 512 pixels.'],
      ['What is the maximum file size for an animated WhatsApp sticker?', 'About 500 KB. Static stickers are limited to about 100 KB.'],
      ['What format are WhatsApp stickers?', 'Sticker packs use WebP. When you paste a single sticker into a chat, an animated GIF that meets the size limits works too.'],
    ],
  },
  {
    slug: 'how-to-convert-video-to-gif',
    title: 'How to Convert a Video to a GIF on iPhone, Android or PC (Free)',
    description:
      'Convert any video to a GIF for free in your browser. Trim it, pick the size, and download. Nothing is uploaded, no watermark.',
    date: '2026-11-18',
    body: `
**Short answer:** open [gifdrop](/), pick your video, drag to the part you want (up to 4 seconds), tap **Make a sticker**, then tap **Download GIF**. It runs entirely in your browser, so the video never leaves your device.

## Step by step

1. **Open gifdrop** on any phone or computer.
2. **Add the video.** Tap the drop area and pick an MP4, or paste a link from X, TikTok or Instagram.
3. **Trim.** Drag to the start of the moment and pick a length.
4. **Pick size and framing.** High (512 px) for sharpness, Compact (320 px) for small files. *Fit* keeps the whole frame; *Square crop* fills the square.
5. **Make it.** Tap **Make a sticker**.
6. **Save it.** Tap **Download GIF**, or press and hold it and **Copy image** to paste it somewhere.

## Getting a good GIF from a video

- **Keep it short.** GIFs store every frame as an image, so a 10-second GIF can be 20 times the size of the same video. 2 to 4 seconds is the sweet spot.
- **Start on the motion.** Begin right as the action starts so the loop doesn't have a dead pause.
- **Steady footage compresses better.** Tripod or still-camera clips stay small and sharp.

## GIF or video?

Use a GIF when it needs to loop silently and play everywhere: chats, docs, emails, stickers. Use a video when it's longer than a few seconds or needs sound. GIFs are always silent.

## Is it private?

Yes. gifdrop converts on your device with WebAssembly. Uploaded files are never sent to a server. (Links you paste are fetched through gifdrop so your browser can read them, and aren't stored.)
`,
    faq: [
      ['Is there a free video to GIF converter without a watermark?', 'Yes. gifdrop is free and adds no watermark.'],
      ['Can I convert a video to a GIF on iPhone without an app?', 'Yes. Open gifdrop in Safari, pick the video from Photos, and tap Download GIF when it’s ready.'],
      ['How long can the GIF be?', 'Up to 4 seconds in gifdrop, which keeps files small enough to share and use as stickers.'],
    ],
  },
]

export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug)
