import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/app/viewTransition';

/* The reference's background: three layers of simplex noise mixed through four colours,
   vignetted, with a little grain, drawn at 13% over the ground and nudged by the pointer.
   Plain WebGL rather than three.js — one full-screen quad does not need a scene graph.
   Rendered at 0.75 of the viewport (0.5 below 768px), paused while the tab is hidden,
   and drawn once and left still under reduced motion. */
const VS = 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
const FS = `precision mediump float;uniform float u_time;uniform vec2 u_mouse;uniform vec3 c1;uniform vec3 c2;uniform vec3 c3;uniform vec3 c4;uniform float u_alpha;varying vec2 vUv;
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}
float snoise(vec2 v){const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);m=m*m;m=m*m;vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;m*=1.79284291400159-.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.*dot(m,g);}
void main(){vec2 st=vUv;vec2 mouse=u_mouse;float n1=snoise(st*3.+u_time*.1+mouse*.3);float n2=snoise(st*2.-u_time*.15+mouse*.2);float n3=snoise(st*4.+u_time*.08);float f=(n1+n2*.5+n3*.3)/1.8;
vec3 col=mix(c1,c2,smoothstep(-.5,.5,f+st.y*.3));col=mix(col,c3,smoothstep(.2,.8,n2+st.x*.2));col=mix(col,c4,smoothstep(.4,1.,n3)*.2);float vig=1.-length(st-.5)*.8;col*=vig;
float grain=fract(sin(dot(st*u_time*.001,vec2(12.9898,78.233)))*43758.5453)*.02;col+=grain;gl_FragColor=vec4(col,u_alpha);}`;

type Palette = readonly [number, number, number][];
const DARK: Palette = [
  [0.02, 0.02, 0.02],
  [0.08, 0.1, 0.2],
  [0.12, 0.15, 0.28],
  [0.15, 0.08, 0.25],
];
const LIGHT: Palette = [
  [0.96, 0.96, 0.96],
  [0.84, 0.87, 0.97],
  [0.8, 0.84, 0.98],
  [0.88, 0.82, 0.98],
];

export function ShaderCanvas({ light }: { light: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recolour = useRef<(light: boolean) => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false, depth: false, stencil: false });
    } catch {
      gl = null;
    }
    if (!gl) return;
    const compile = (type: number, src: string) => {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return gl!.getShaderParameter(s, gl!.COMPILE_STATUS) ? s : null;
    };
    const v = compile(gl.VERTEX_SHADER, VS);
    const f = compile(gl.FRAGMENT_SHADER, FS);
    if (!v || !f) return;
    const program = gl.createProgram()!;
    gl.attachShader(program, v);
    gl.attachShader(program, f);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const u = (name: string) => gl!.getUniformLocation(program, name);
    const U = { time: u('u_time'), mouse: u('u_mouse'), alpha: u('u_alpha'), c: [u('c1'), u('c2'), u('c3'), u('c4')] };

    let time = 0;
    const m = { x: 0.5, y: 0.5 };
    const target = { x: 0.5, y: 0.5 };
    const draw = () => {
      m.x += (target.x - m.x) * 0.02;
      m.y += (target.y - m.y) * 0.02;
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.uniform1f(U.time, time);
      gl!.uniform2f(U.mouse, m.x, m.y);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
    };
    recolour.current = (isLight: boolean) => {
      const palette = isLight ? LIGHT : DARK;
      palette.forEach((c, i) => gl!.uniform3f(U.c[i]!, c[0], c[1], c[2]));
      gl!.uniform1f(U.alpha, isLight ? 0.2 : 0.13);
      draw();
    };
    const size = () => {
      const k = window.innerWidth < 768 ? 0.5 : 0.75;
      canvas.width = Math.round(window.innerWidth * k);
      canvas.height = Math.round(window.innerHeight * k);
      gl!.viewport(0, 0, canvas.width, canvas.height);
      draw();
    };
    const pointer = (e: MouseEvent) => {
      target.x = e.clientX / window.innerWidth;
      target.y = 1 - e.clientY / window.innerHeight;
    };
    size();
    recolour.current(document.documentElement.dataset.theme === 'light');
    window.addEventListener('resize', size);
    window.addEventListener('mousemove', pointer);

    let raf = 0;
    if (prefersReducedMotion()) {
      time = 12;
      draw();
    } else {
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (document.hidden) return;
        time += 0.01;
        draw();
      };
      loop();
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
      window.removeEventListener('mousemove', pointer);
      recolour.current = () => {};
    };
  }, []);

  useEffect(() => {
    recolour.current(light);
  }, [light]);

  return <canvas className="shader" ref={canvasRef} aria-hidden="true" />;
}
