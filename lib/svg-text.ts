/** Conservative Arial-compatible widths for bounded portable SVG text (no DOM required). */
export function svgTextWidth(value:string,size:number){let units=0;for(const char of value){if(/\p{Mark}/u.test(char)||char==='\u200d')continue;units+=/\s/u.test(char)?.35:/[MW@#%]/.test(char)?1.05:/[ilI.,:;'!|]/.test(char)?.32:/[A-Z]/.test(char)?.84:/[mw]/.test(char)?.98:/[a-z0-9]/.test(char)?.66:char.codePointAt(0)!>0x2e80?1.2:1}return units*size}
export function wrapSvgText(value:string,width:number,size:number,maxLines=Infinity){
 const lines:string[]=[];let line='',lineWidth=0;const space=svgTextWidth(' ',size);
 for(const word of value.trim().replace(/\s+/gu,' ').split(' ')){
  if(!word)continue;
  const wordWidth=svgTextWidth(word,size);if(line&&lineWidth+space+wordWidth<=width){line+=` ${word}`;lineWidth+=space+wordWidth;continue}
  if(line){lines.push(line);line='';lineWidth=0}
  for(const char of word){const advance=svgTextWidth(char,size);if(line&&lineWidth+advance>width){lines.push(line);line='';lineWidth=0}line+=char;lineWidth+=advance}
 }
 if(line)lines.push(line);if(!lines.length)return [''];
 if(lines.length>maxLines){const result=lines.slice(0,maxLines);let last=result.at(-1)||'';while(last&&svgTextWidth(`${last}…`,size)>width)last=Array.from(last).slice(0,-1).join('');result[result.length-1]=`${last.trimEnd()}…`;return result}return lines;
}
