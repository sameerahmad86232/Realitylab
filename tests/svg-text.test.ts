import {test} from 'node:test';
import assert from 'node:assert/strict';
import {svgTextWidth,wrapSvgText} from '../lib/svg-text.ts';
import {constructionSvg} from '../lib/construction.ts';
import {scanResultSchema} from '../lib/analysis.ts';
import {readFileSync} from 'node:fs';
test('wide and multilingual SVG labels fit their allotted widths',()=>{for(const text of ['W'.repeat(180),'Material properties and a very long part name '.repeat(15),'構造と部品'.repeat(50),'á'.repeat(180)])for(const size of [10,13,25]){const lines=wrapSvgText(text,212,size,2);assert.ok(lines.length<=2);assert.ok(lines.every(line=>svgTextWidth(line,size)<=212))}});
test('construction exports preserve the final component reference instead of silently slicing it',()=>{const fixture=scanResultSchema.parse(JSON.parse(readFileSync(new URL('./fixtures/analysis.json',import.meta.url),'utf8')));const analysis={...fixture.analysis,components:Array.from({length:8},(_,i)=>({...fixture.analysis.components[0],id:`id-${i}`,name:`Component number ${i} with a descriptive assembly role`}))};const svg=constructionSvg({overview:'A conceptual example.',stages:[{title:'First stage',description:'A description.',component_ids:analysis.components.map(p=>p.id)}],checks:['Check alignment.'],missing_information:['Dimensions are unknown.']},analysis);const text=[...svg.matchAll(/<text\b[^>]*>(.*?)<\/text>/g)].map(m=>m[1]).join(' ');assert.match(text,/Component number 7 with a descriptive assembly role/)});
