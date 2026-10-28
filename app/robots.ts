import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{const base=process.env.RENDER_EXTERNAL_URL||'https://realitylab.onrender.com';return {rules:{userAgent:'*',allow:'/',disallow:'/api/'},sitemap:new URL('/sitemap.xml',base).href}}
