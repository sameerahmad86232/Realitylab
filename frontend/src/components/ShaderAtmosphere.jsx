import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const vertexSource = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const fragmentSource = `
precision mediump float;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_time;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = (uv-.5)*vec2(aspect,1.);
  float t=u_time*.065;
  float flow=noise(p*2.+vec2(t,-t*.4));
  float fold=noise(p*3.1+flow*1.8+vec2(-t*.5,t));
  float ribbon=sin(p.x*3.5+p.y*2.4+fold*3.8+t);
  float veil=pow(max(0.,1.-abs(ribbon)),5.);
  float field=exp(-length((uv-vec2(.73,.53))*vec2(1.3,.8))*2.1);
  float cursor=exp(-length((uv-u_pointer)*vec2(aspect,1.))*5.);
  vec3 base=vec3(.041,.063,.035);
  vec3 green=vec3(.20,.32,.095)*veil*field*.44;
  vec3 gold=vec3(.24,.21,.08)*pow(fold,4.)*field*.28;
  float contour=1.-smoothstep(.0,.022,abs(fract((flow+fold*.35)*17.)-.5));
  vec3 color=base+green+gold+vec3(.055,.085,.025)*cursor;
  color+=vec3(.19,.27,.11)*contour*field*.09;
  vec2 cell=floor(uv*u_resolution/80.);
  vec2 local=fract(uv*u_resolution/80.);
  float star=(1.-smoothstep(.0,.013,length(local-.5)))*step(.85,hash(cell));
  color+=vec3(.50,.65,.30)*star*field*.35;
  float grain=(hash(gl_FragCoord.xy)-.5)*.009;
  float vignette=(1.-smoothstep(.15,1.1,length((uv-.5)*vec2(1.,.8))));
  color=(color+grain)*(.7+.3*vignette);
  gl_FragColor=vec4(color,1.);
}
`;

export default function ShaderAtmosphere() {
  const canvasRef = useRef(null);
  const [paused, setPaused] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [supported, setSupported] = useState(false);
  const pauseRef = useRef(paused);
  useEffect(() => {
    pauseRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas.closest(".hero");
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) {
      canvas.dataset.engine = "css-fallback";
      return;
    }
    const shaders = [];
    let program,
      buffer,
      frame = 0,
      visible = true,
      lost = false,
      last = 0,
      elapsed = 0,
      clock = 0;
    let width = 0,
      height = 0;
    const pointer = [0.72, 0.52],
      current = [0.72, 0.52];
    function compile(type, source) {
      const shader = gl.createShader(type);
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error("Shader compilation failed");
      return shader;
    }
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error("Shader linking failed");
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    } catch {
      shaders.forEach((s) => gl.deleteShader(s));
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      canvas.dataset.engine = "css-fallback";
      return;
    }
    const resolution = gl.getUniformLocation(program, "u_resolution");
    const time = gl.getUniformLocation(program, "u_time");
    const mouse = gl.getUniformLocation(program, "u_pointer");
    function draw() {
      if (lost || !width || !height) return;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(resolution, width, height);
      gl.uniform1f(time, elapsed);
      gl.uniform2f(mouse, ...current);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    function resize() {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      width = Math.max(1, Math.round(rect.width * dpr));
      height = Math.max(1, Math.round(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;
      draw();
    }
    function animate(now) {
      if (lost) return;
      frame = requestAnimationFrame(animate);
      const delta = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      if (!visible || document.hidden || pauseRef.current) return;
      elapsed += delta;
      if (now - clock < 1000 / 30) return;
      clock = now;
      current[0] += (pointer[0] - current[0]) * 0.045;
      current[1] += (pointer[1] - current[1]) * 0.045;
      draw();
    }
    function move(event) {
      if (event.pointerType === "touch") return;
      const rect = host.getBoundingClientRect();
      pointer[0] = (event.clientX - rect.left) / rect.width;
      pointer[1] = 1 - (event.clientY - rect.top) / rect.height;
    }
    function leave() {
      pointer[0] = 0.72;
      pointer[1] = 0.52;
    }
    function contextLost(event) {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(frame);
      setSupported(false);
      canvas.dataset.engine = "css-fallback";
    }
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    const intersection = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
    });
    intersection.observe(host);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preference = (event) => setPaused(event.matches);
    media.addEventListener("change", preference);
    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerleave", leave);
    canvas.addEventListener("webglcontextlost", contextLost);
    resize();
    frame = requestAnimationFrame(animate);
    canvas.dataset.engine = "webgl";
    setSupported(true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      media.removeEventListener("change", preference);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("webglcontextlost", contextLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      shaders.forEach((s) => gl.deleteShader(s));
    };
  }, []);

  return (
    <>
      <div className="shader-atmosphere" aria-hidden="true">
        <canvas ref={canvasRef} />
        <div className="shader-fade" />
      </div>
      {supported && (
        <button
          className="motion-control"
          aria-label={paused ? "Resume visual effects" : "Pause visual effects"}
          aria-pressed={!paused}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? <Play size={10} /> : <Pause size={10} />}
          <span>{paused ? "STILL ATMOSPHERE" : "LIVE ATMOSPHERE"}</span>
          <span className={paused ? "motion-status paused" : "motion-status"} />
        </button>
      )}
    </>
  );
}
