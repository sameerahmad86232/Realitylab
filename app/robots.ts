import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{const base=process.env.APP_ORIGIN||(process.env.VERCEL_PROJECT_PRODUCTION_URL?`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`:process.env.RENDER_EXTERNAL_URL||'https://realitylab.onrender.com');return {rules:{userAgent:'*',allow:'/',disallow:'/api/'},sitemap:new URL('/sitemap.xml',base).href}}
