import type {MetadataRoute} from 'next';
export default function sitemap():MetadataRoute.Sitemap{return [{url:new URL('/',process.env.RENDER_EXTERNAL_URL||'https://realitylab.onrender.com').href}]}
