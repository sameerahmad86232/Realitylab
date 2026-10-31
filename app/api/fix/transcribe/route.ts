import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const maxDuration = 35;
export async function POST(req: NextRequest) {
  const key = process.env.MODEL_API_KEY || process.env.META_API_KEY;
  if (!key) return NextResponse.json({error:"Voice transcription is not configured."},{status:503});
  try {
    const body = await req.formData();
    const file = body.get("file");
    if (!(file instanceof File) || file.size === 0 || file.size > 8_000_000 || file.type !== "audio/wav") {
      return NextResponse.json({error:"Please record a short voice note in WAV format (up to 8 MB)."},{status:400});
    }
    const form = new FormData();
    form.append("request",new Blob([JSON.stringify({model:"muse-voice-transcribe-1.0",audioEncoding:"WAV",mode:"PUSH_TO_TALK"})],{type:"application/json"}));
    form.append("audio",file,"note.wav");
    const response = await fetch("https://api.meta.ai/v1/asr/transcribe",{
      method:"POST",
      headers:{Authorization:"Bearer "+key,Accept:"application/json"},
      body:form,cache:"no-store",signal:AbortSignal.timeout(28000)
    });
    if(!response.ok)return NextResponse.json({error:"Meta voice API returned "+response.status+"."},{status:502});
    const data=await response.json() as {transcript?:string};
    return NextResponse.json({text:String(data.transcript||"").slice(0,1800)},{headers:{"Cache-Control":"no-store"}});
  }catch {return NextResponse.json({error:"Unable to transcribe this recording."},{status:502});}
}
