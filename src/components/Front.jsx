import { useEffect, useRef, useState } from 'react'
import { themeOf } from '../lib/theme.js'

// The live pressure front: two air masses whose boundary sits at the vote share.
const FRAG = `precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform float uShare;
uniform vec3 uA0, uA1, uB0, uB1, uLine, uSeam; uniform float uLineAmt;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec2 p=vec2(uv.x*uRes.x/uRes.y,uv.y)*2.2;
  float t=uTime*.05;
  vec2 q=vec2(fbm(p+t),fbm(p+vec2(5.2,1.3)-t));
  float w=fbm(p+2.2*q+vec2(t*.7,-t));
  float edge=uShare+(w-.5)*.30+sin(uv.y*5.+t*4.)*.015;
  float side=smoothstep(edge-.03,edge+.03,uv.x);
  float k=smoothstep(.25,.8,w);
  vec3 col=mix(mix(uA0,uA1,k),mix(uB0,uB1,k),side);
  float iso=abs(fract(w*10.)-.5);
  col=mix(col,uLine,smoothstep(.05,.0,iso)*uLineAmt);
  col=mix(col,uSeam,smoothstep(.012,.0,abs(uv.x-edge))*.7);
  gl_FragColor=vec4(col,1.);
}`

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Front({ share, theme = themeOf(), className = '', children }) {
  const canvas = useRef(null)
  const target = useRef(share / 100)
  const kick = useRef(null)
  const [noGL, setNoGL] = useState(false)
  target.current = share / 100
  const colors = useRef(theme.gl)
  colors.current = theme.gl

  useEffect(() => {
    const c = canvas.current
    const gl = c.getContext('webgl', { antialias: false })
    if (!gl) return setNoGL(true)
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s }
    const prog = gl.createProgram()
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}'))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    const u = (k) => gl.getUniformLocation(prog, k)
    const [uRes, uTime, uShare] = [u('uRes'), u('uTime'), u('uShare')]
    const pal = ['uA0', 'uA1', 'uB0', 'uB1', 'uLine', 'uSeam'].map(u)
    const uLineAmt = u('uLineAmt')

    const fit = () => {
      const r = 0.5 // ponytail: the fluid is soft, half-res is invisible and 4-8x cheaper
      c.width = c.clientWidth * r; c.height = c.clientHeight * r
      gl.viewport(0, 0, c.width, c.height)
    }
    const ro = new ResizeObserver(() => { fit(); draw() })
    ro.observe(c)

    const still = reduced()
    let cur = target.current, raf = 0, t0 = performance.now(), running = false
    function draw() {
      gl.uniform2f(uRes, c.width, c.height)
      gl.uniform1f(uTime, still ? 12 : (performance.now() - t0) / 1000 + 12)
      gl.uniform1f(uShare, cur)
      const g = colors.current
      ;[g.a[0], g.a[1], g.b[0], g.b[1], g.line, g.seam].forEach((c, i) => gl.uniform3fv(pal[i], c))
      gl.uniform1f(uLineAmt, g.lineAmt)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    function frame() {
      cur += (target.current - cur) * 0.035
      draw()
      // reduced motion: only animate while the front is actually moving
      if (!still || Math.abs(target.current - cur) > 0.0005) raf = requestAnimationFrame(frame)
      else running = false
    }
    kick.current = () => { if (!running) { running = true; raf = requestAnimationFrame(frame) } }
    fit(); kick.current()
    return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext() }
  }, [])

  useEffect(() => { kick.current?.() }, [share, theme])

  const fallback = noGL ? { background: `linear-gradient(90deg, var(--a) ${share - 3}%, var(--b) ${share + 3}%)` } : undefined
  return (
    <div className={`front ${theme.className} ${className}`} style={fallback}>
      {!noGL && <canvas ref={canvas} aria-hidden="true" />}
      {children}
    </div>
  )
}
