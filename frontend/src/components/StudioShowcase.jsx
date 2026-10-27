import {lazy,Suspense,useEffect,useRef,useState} from 'react';
const DimensionalStudio=lazy(()=>import('./DimensionalStudio'));
export default function StudioShowcase(){
  const target=useRef(null);const [visible,setVisible]=useState(false);
  useEffect(()=>{const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'180px'});observer.observe(target.current);return()=>observer.disconnect();},[]);
  return <section className="studio-showcase" id="design-studio" ref={target}><div className="section-heading"><div><span className="eyebrow">A DIFFERENT DIMENSION OF DISCOVERY</span><h2>Less flat.<br/><span>More fascinating.</span></h2></div><p>Turn it around. Catch the light.<br/>See a familiar idea from a new angle.</p></div><div className="cad-showcase-wrap">{visible?<Suspense fallback={<div className="cad-loading"><span className="live-dot"/> Preparing the design studio…</div>}><DimensionalStudio/></Suspense>:<div className="cad-loading"><span className="live-dot"/> A new perspective is just ahead.</div>}</div><p className="showcase-disclosure">An original illustrative 3D example, not a reconstruction of your uploaded photos.</p></section>;
}
