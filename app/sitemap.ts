import type {MetadataRoute} from 'next';
export default function sitemap():MetadataRoute.Sitemap{return ['/','/project','/trial/stability'].map(path=>({url:new URL(path,process.env.APP_ORIGIN||(process.env.VERCEL_PROJECT_PRODUCTION_URL?`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`:process.env.RENDER_EXTERNAL_URL||'https://realitylab.onrender.com')).href}))}
