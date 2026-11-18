// absolute URLs: WhatsApp/X crawlers don't resolve relative og:image paths
export const SITE_URL = 'https://gifdrop.farirai.workers.dev'
// utm tags so fitmycv's own analytics shows exactly how many visits gifdrop sends
export const FITMYCV_URL = 'https://www.fitmycv.link/?utm_source=gifdrop&utm_medium=banner&utm_campaign=cross_promo'
// Cloudflare Web Analytics token (dash → Analytics & Logs → Web Analytics → Add a site). Public by design.
// ponytail: empty = no tracking script; paste the token here once the site is added
export const CF_BEACON_TOKEN = '' as string
