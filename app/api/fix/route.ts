import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 120;

type Step = { title: string; detail: string; tools: string[]; minutes: number };
type Diagnosis = {
  object: string; issue: string; cause: string; evidence: string;
  target: string; urgency: "low" | "medium" | "high";
  dangerous: boolean; safety: string; confidence: number;
  steps: Step[]; estimate: string;
};
const safeStep = (x: unknown): Step => {
  const v = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  return {
    title: String(v.title || "Inspect carefully").slice(0, 100),
    detail: String(v.detail || "Seek professional help if uncertain.").slice(0, 500),
    tools: Array.isArray(v.tools) ? v.tools.filter((t): t is string => typeof t === "string").slice(0, 5) : [],
    minutes: Math.max(0, Math.min(180, Number(v.minutes) || 5)),
  };
};
function clean(text: string): Diagnosis {
  const block = text.match(/\{[\s\S]*\}/)?.[0];
  if (!block) throw new Error("The model did not return a structured diagnosis.");
  const x = JSON.parse(block) as Record<string, unknown>;
  const dangerous = Boolean(x.dangerous);
  const steps = Array.isArray(x.steps) ? x.steps.slice(0, 3).map(safeStep) : [];
  if (steps.length !== 3) throw new Error("The repair plan was incomplete. Please try a clearer photo.");
  return {
    object: String(x.object || "Object").slice(0, 90),
    issue: String(x.issue || "Issue not confirmed").slice(0, 180),
    cause: String(x.cause || "Cannot determine the cause from the photo alone.").slice(0, 450),
    evidence: String(x.evidence || "No reliable visual evidence provided.").slice(0, 350),
    target: String(x.target || x.object || "object").slice(0, 80).replace(/[^\p{L}\p{N}\s-]/gu, ""),
    urgency: x.urgency === "high" ? "high" : x.urgency === "medium" ? "medium" : "low",
    dangerous,
    safety: String(x.safety || "Stop if you encounter electricity, gas, heat or unstable objects.").slice(0, 350),
    confidence: Math.max(0, Math.min(100, Number(x.confidence) || 0)),
    steps,
    estimate: String(x.estimate || "Varies by the actual problem.").slice(0, 140),
  };
}
function extractText(json: unknown): string {
  const a = json as { output_text?: string; output?: Array<{content?: Array<{text?: string}>}> };
  return a.output_text || a.output?.flatMap(x => x.content || []).map(x => x.text || "").join("") || "";
}
const host = "https://api.meta.ai/v1";
async function postJson(path: string, key: string, body: unknown, timeout = 38000) {
  const r = await fetch(host + path, {
    method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(timeout),
  });
  if (!r.ok) {
    const bodyText = (await r.text()).slice(0, 350);
    throw new Error("Meta " + path + " returned " + r.status + ": " + bodyText.replace(/Bearer\s+\S+/gi,"[redacted]"));
  }
  return r.json();
}
function input(image: string, prompt: string) {
  return [{ type: "message", role: "user", content: [{ type: "input_text", text: prompt }, { type: "input_image", image_url: image }] }];
}
async function segment(image: string, target: string, key: string) {
  const r = await fetch(host + "/responses", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({model: "sam-3.1", input: input(image, target), stream: true, metadata: { mask_encoding: "one_bit" } }),
    cache: "no-store", signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error("SAM segmentation request failed (" + r.status + ").");
  const raw = await r.text();
  let output = "";
  for (const line of raw.split(/\r?\n/)) {
    if (!line.startsWith("data: ")) continue;
    try {
      const event = JSON.parse(line.slice(6));
      if (event.type === "response.output_text.delta" && typeof event.delta === "string") output += event.delta;
    } catch { /* SSE control events */ }
  }
  // SAM returns source-pixel boxes embedded in its special-token output grammar.
  const m = output.match(/<\|box;x1=(\d+);y1=(\d+);x2=(\d+);y2=(\d+);w=(\d+);h=(\d+)(?:;[^|]*)?\|>/);
  if (!m) return { found: false, target, box: null };
  const [x1,y1,x2,y2,w,h] = m.slice(1,7).map(Number);
  return { found: true, target, box: {
    left: x1 / w * 100, top: y1 / h * 100,
    width: (x2-x1) / w * 100, height: (y2-y1) / h * 100,
  }};
}
async function createAfter(image: string, diagnosis: Diagnosis, key: string) {
  // Edit the actual input photo; a text-only generation cannot guarantee same-scene continuity.
  const prompt = "Create a plausible photorealistic AFTER concept from this exact provided image. Retain the same camera viewpoint, composition, object positions, lighting and surroundings. Only visually repair: "
    + diagnosis.issue + ". Possible cause: " + diagnosis.cause
    + ". Do not add labels, text, arrows, people or new objects. This is an illustrative visualization, not proof of a completed real-world repair.";
  const result = await postJson("/images/edits", key, {
    model: "muse-image-1.0", prompt, images: [{image_url: image}], n: 1, output_format: "png",
  }, 50000) as {data?: Array<{b64_json?: string; url?: string}>};
  const first = result.data?.[0];
  if (!first) throw new Error("Meta returned no after-image.");
  return first.b64_json ? "data:image/png;base64," + first.b64_json : first.url || null;
}
const recent = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now(); const live = (recent.get(ip) || []).filter(t => now-t < 60000);
  if (live.length >= 4) { recent.set(ip, live); return true; }
  live.push(now); recent.set(ip, live);
  if (recent.size > 1000) recent.clear();
  return false; // Best-effort, in-memory only. Configure shared rate limits before public scale.
}
export async function POST(req: NextRequest) {
  const key = process.env.MODEL_API_KEY || process.env.META_API_KEY;
  if (!key) return NextResponse.json({ error: "Live Meta Model API is not configured. Set MODEL_API_KEY on the server." }, {status: 503});
  if (rateLimited(req.headers.get("x-forwarded-for")?.split(",")[0] || "local")) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, {status: 429});
  }
  let data: {image?: string; detail?: string; language?: string};
  try { data = await req.json(); } catch { return NextResponse.json({error:"Invalid JSON."},{status:400}); }
  let image = data.image || "";
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > 7_500_000) {
    return NextResponse.json({error:"Provide one JPEG, PNG or WebP image under approximately 5MB."},{status:400});
  }
  try {
    const binary = Buffer.from(image.slice(image.indexOf(",") + 1), "base64");
    if (binary.byteLength > 5_000_000) throw new Error("Image exceeds 5 MB.");
    const normalized = await sharp(binary,{limitInputPixels:20_000_000}).rotate()
      .resize({width:1600,height:1600,fit:"inside",withoutEnlargement:true})
      .flatten({background:"#ffffff"}).jpeg({quality:86,mozjpeg:true}).toBuffer();
    image = "data:image/jpeg;base64," + normalized.toString("base64");
  } catch {
    return NextResponse.json({error:"The image is corrupted, too large, or unsupported."},{status:400});
  }
  const detail = String(data.detail || "").slice(0,350);
  const language = data.language === "hi" ? "Hindi" : data.language === "ur" ? "Urdu" : "English";
  const prompt = "You are a cautious visual repair assistant. Examine this photo and produce ONLY valid JSON with exactly these keys: "
    + "object, issue, cause, evidence, target, urgency (low/medium/high), dangerous (boolean), safety, confidence (integer 0-100, approximate not calibrated), estimate, "
    + "steps (array of exactly 3 objects {title, detail, tools (array of strings), minutes (number)}). "
    + "The target must be a SHORT CONCRETE NOUN PHRASE NAMING A VISIBLE OBJECT for SAM segmentation, not an abstract problem. "
    + "Distinguish visually observed facts from hypotheses. If the issue is unclear, say so. "
    + "Only suggest safe at-home non-invasive steps. For electricity, gas, fire, leaking energized equipment, structural hazards, lithium batteries, pressure systems, medication or other dangerous situations, "
    + "set dangerous=true and give three safety / professional-help steps, never invasive repair instructions. "
    + "If this is a bill or document, explain it without claiming a physical repair; never invent charges or details. "
    + "Use " + language + " for user-facing fields but keep target in English. No markdown. User note: " + (detail || "No note.");
  try {
    const vision = await postJson("/responses", key, {model:"muse-spark-1.3",input:input(image,prompt)}, 38000);
    const diagnosis = clean(extractText(vision));
    // Conservative override: do not trust a model-only safety classification for high-risk domains.
    const hazard = /\b(gas leak|gas line|sparks?|fire|flames?|smoke|burning|shock|live wire|electrocution|mains voltage|power socket|outlet|lithium battery|swollen battery|chemical spill|pressurized tank|structural collapse|load bearing)\b/i;
    if (hazard.test([diagnosis.issue,diagnosis.cause,detail].join(" "))) {
      diagnosis.dangerous = true; diagnosis.urgency = "high";
    }
    if (diagnosis.dangerous) {
      diagnosis.steps = [
        {title:"Stop and keep a safe distance",detail:"Do not open, touch, or operate potentially dangerous equipment.",tools:[],minutes:1},
        {title:"Prevent further exposure",detail:"Keep people away. Only isolate power or gas when it is safe to do so without approaching the hazard.",tools:[],minutes:2},
        {title:"Get qualified assistance",detail:"Contact an appropriate technician, utility provider, or emergency service. Do not rely on photo-only diagnosis.",tools:[],minutes:5}
      ];
      diagnosis.safety = "Potential hazard detected. Do not attempt DIY repair from an AI-generated guide.";
    }
    const grounding = await segment(image, diagnosis.target, key).catch(() => ({found:false,target:diagnosis.target,box:null}));
    let after: string | null = null;
    let afterError: string | null = null;
    const isDocument = /\b(bill|invoice|receipt|statement|document|contract|letter)\b/i.test(diagnosis.object);
    if (isDocument) {
      afterError = "After-image disabled for documents to avoid generating altered or misleading records.";
    } else if (!diagnosis.dangerous) {
      try { after = await createAfter(image, diagnosis, key); }
      catch { afterError = "After-image generation unavailable; diagnosis and guidance are still available."; }
    }
    return NextResponse.json({
      diagnosis, grounding, after, afterError,
      models: {vision:"muse-spark-1.3", segmentation:"sam-3.1", visual:"muse-image-1.0"},
      disclaimer:"AI suggestions and after-image are illustrative, not proof of fault or repair. Stop if conditions are unsafe.",
    }, {headers:{"Cache-Control":"no-store"}});
  } catch(e) {
    const message = e instanceof Error ? e.message : "The analysis could not be completed.";
    console.error("RealityLab repair error:", message.replace(/data:image\/\w+;base64,[^\s]+/g, "[image]"));
    return NextResponse.json({error:message.slice(0,280)},{status:502});
  }
}
