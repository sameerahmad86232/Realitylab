import type {MetadataRoute} from 'next';
export default function sitemap():MetadataRoute.Sitemap{return ['/','/project','/trial/stability'].map(path=>({url:new URL(path,process.env.RENDER_EXTERNAL_URL||'https://realitylab.onrender.com').href}))}
