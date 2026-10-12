#!/usr/bin/env node
// Offline-only agent artwork composer. Zero external dependencies. Does not sign or send transactions.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const traitFile=path.join(root,'assets','hoodiepunks_traits.json');
const layers=['Punk','eyes','Mouth','TOP'];
const aliases={'bold':'bald','Crazy Hear':'Crazy Hair','smal mouth':'small mouth','once teeth out':'one tooth out'};
function parseArgs(argv){const o={};for(let i=0;i<argv.length;i++){if(!argv[i].startsWith('--'))throw Error('Unexpected argument '+argv[i]);const k=argv[i].slice(2);if(['help'].includes(k)){o[k]=true;continue;}if(i+1>=argv.length)throw Error('Missing value for '+argv[i]);o[k]=argv[++i];}return o;}
function seedHash(s){return parseInt(createHash('sha256').update(String(s)).digest('hex').slice(0,8),16)>>>0;}
function rngFor(seed){let s=seedHash(seed);return ()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function pick(arr,rnd){return arr[Math.floor(rnd()*arr.length)];}
function norm(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function pxValue(x){if(x==='#000000')return 1;if(x==='#ccff00')return 0;if(x==='transparent')return null;throw Error('Unknown pixel value '+x);}
function readBitmap(low,high){const lo=BigInt(low),hi=BigInt(high);if(lo<0n||lo>>256n||hi<0n||hi>>144n)throw Error('Invalid current bitmap range');return Array.from({length:400},(_,i)=>Number(((i<256?lo:hi)>>BigInt(i<256?i:i-256))&1n));}
function encode(grid){let lo=0n,hi=0n;for(let i=0;i<400;i++){if(!grid[i])continue;if(i<256)lo|=1n<<BigInt(i);else hi|=1n<<BigInt(i-256);}return {bitmapLow:lo.toString(),bitmapHigh:hi.toString()};}
function svg(grid){const rects=[];for(let i=0;i<400;i++)if(grid[i])rects.push(`<rect x="${i%20}" y="${Math.floor(i/20)}" width="1" height="1"/>`);return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 20 20" shape-rendering="crispEdges"><rect width="20" height="20" fill="#ccff00"/><g fill="#000000">${rects.join('')}</g></svg>\n`;}
function selectTrait(layer,q,rng){const ts=layer.traits;if(!q){const available=layer.name==='Punk'?ts.filter(t=>t.name.toLowerCase()!=='invisible'):ts;return pick(available.length?available:ts,rng);}const query=norm(q);let matches=ts.filter(t=>norm(t.name)===query||norm(aliases[t.name]||'')===query||t.id===q);if(matches.length!==1){matches=ts.filter(t=>norm(t.name).includes(query)||norm(aliases[t.name]||'').includes(query));}if(matches.length!==1)throw Error(`Ambiguous/unknown trait '${q}' in ${layer.name}; matches: ${matches.map(t=>t.name).join(', ')||'none'}`);return matches[0];}
async function main(){const a=parseArgs(process.argv.slice(2));if(a.help){console.log('node scripts/compose-hoodiepunk.mjs --mode safe|creative|wild --seed 123 --out ./preview [--punk round --eyes "small shades" --mouth smile --top Mohawk] [--edits edits.json] [--current current.json] [--canvas-id 5500 --custody-id 5500 --title "..." --artist "..."]');return;}
const mode=a.mode||'creative';if(!['safe','creative','wild'].includes(mode))throw Error('Invalid mode');const seed=a.seed??'hoodiepunks-v1';const rnd=rngFor(seed);const manifest=JSON.parse(await readFile(traitFile,'utf8'));if(manifest.gridSize!==20)throw Error('Expected 20x20');const grid=Array(400).fill(0);const background=manifest.layers.find(x=>x.name==='Background');if(!background||background.traits.length!==1)throw Error('Background requires one fixed trait');for(let i=0;i<400;i++){const v=pxValue(background.traits[0].pixels[i]);if(v!==null)grid[i]=v;}
const chosen=[];for(const [j,name] of layers.entries()){const layer=manifest.layers.find(x=>x.name===name);if(!layer)throw Error('Missing '+name);const t=selectTrait(layer,a[['punk','eyes','mouth','top'][j]],rnd);if(t.pixels.length!==400)throw Error('Trait length is not 400: '+t.name);chosen.push({layer:name,id:t.id,name:t.name,displayName:aliases[t.name]||t.name});for(let i=0;i<400;i++){const v=pxValue(t.pixels[i]);if(v!==null)grid[i]=v;}}
const base=grid.slice();let proposed=[];
// Novelty is deterministic, constrained to nearby existing black pixels; it never alters a published bitmap.
// Creative: 2-5 new black pixels; Wild: 6-14. An agent can replace these with authored edits.
const count=mode==='safe'?0:mode==='creative'?2+Math.floor(rnd()*4):6+Math.floor(rnd()*9);
for(let tries=0;proposed.length<count&&tries<2000;tries++){const existing=[];for(let i=0;i<400;i++)if(grid[i])existing.push(i);if(!existing.length)break;const anchor=pick(existing,rnd);const x=anchor%20,y=Math.floor(anchor/20);const candidates=[[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([xx,yy])=>xx>=1&&xx<19&&yy>=2&&yy<18).map(([xx,yy])=>yy*20+xx).filter(i=>!grid[i]);if(!candidates.length)continue;const p=pick(candidates,rnd);grid[p]=1;proposed.push(p);}
let requestedEdits=[];if(a.edits){const edits=JSON.parse(await readFile(a.edits,'utf8'));if(!Array.isArray(edits.add)||!Array.isArray(edits.remove))throw Error('edits.json requires add and remove arrays');for(const [name,points] of [['add',edits.add],['remove',edits.remove]])for(const p of points){if(!Number.isInteger(p)||p<0||p>399)throw Error(`Invalid ${name} pixel ${p}`);grid[p]=name==='add'?1:0;requestedEdits.push({action:name,index:p});}}
let current=Array(400).fill(0);if(a.current){const x=JSON.parse(await readFile(a.current,'utf8'));current=readBitmap(x.bitmapLow??x.currentBitmapLow??'0',x.bitmapHigh??x.currentBitmapHigh??'0');}
const final=grid.map((v,i)=>v||current[i]?1:0);const newPixels=final.flatMap((v,i)=>v&&!current[i]?[i]:[]);const preserved=current.filter(Boolean).length;
const encoded=encode(final);const out=path.resolve(a.out||'./hoodiepunk-preview');await mkdir(path.dirname(out),{recursive:true});
await writeFile(out+'.svg',svg(final));
const result={schemaVersion:'hoodiepunks-agent-v1',mode,seed,collection:manifest.name,gridSize:20,layerOrder:['Background',...layers],chosen,baseTraitPixels:base.filter(Boolean).length,novelPixels:proposed,requestedEdits,publishedPixelsPreserved:preserved,newPixels,addedPixels:newPixels.length,totalBlackPixels:final.filter(Boolean).length,...encoded,previewSvg:path.basename(out)+'.svg',previewJson:path.basename(out)+'.json',chainStatus:'OFFLINE ONLY; no live ownership, INK, OCH, approvals, or publication verified'};
if(a['canvas-id']!==undefined){const id=Number(a['canvas-id']),custody=Number(a['custody-id']??a['canvas-id']);if(!Number.isInteger(id)||id<0||id>5999||!Number.isInteger(custody)||custody<0||custody>5999)throw Error('Invalid canvas/custody ID');result.artworkDraft={canvasId:id,custodyHoodieId:custody,title:a.title||'HoodiePunk',artistName:a.artist||'HoodiePunks Agent',currentBitmapLow:a.current?encode(current).bitmapLow:'0',currentBitmapHigh:a.current?encode(current).bitmapHigh:'0',newPixels,allocations:[],note:'Fill verified Bottle allocations totaling addedPixels before using hoodiestudio-artwork.mjs. The exact live quotation and simulation are mandatory.'};}
await writeFile(out+'.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({output:out,mode,chosen:chosen.map(t=>t.name),addedPixels:result.addedPixels,preview:out+'.svg'},null,2));}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
