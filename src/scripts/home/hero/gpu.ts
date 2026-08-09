import type { TAtlas } from "./measure";

const PROGRAM_VS = /* glsl */ `#version 300 es
precision mediump float;
precision mediump usampler2D;

uniform uint uCellsPerDim; // Atlas columns/rows (e.g., 16)
uniform vec2 uCanvasSize;  // Canvas px (e.g., 800, 600)
uniform vec2 uCellSize;    // Cell px (e.g., 8, 12)
uniform usampler2D uLut;   // 1D LUT: Brightness -> Char Index
uniform float uTime;       // Animation time

out vec2 vTexCoord;
out float vBrightness;

float f(uint gx, uint gy) {
    // good luck deciphering this code golf
    float w1 = sin(float(gx) * 0.08 + float(gy) * 0.06 + uTime);
    float w2 = sin(float(gx) * 0.12 - float(gy) * 0.09 + uTime * 1.3);
    float w3 = cos(float(gx + gy) * 0.05 + uTime * 0.7);

    float i = (w1 + w2 + w3) / 6.0 + 0.5;

    vec2 c = vec2(uCanvasSize / uCellSize / 2.0);
    vec2 dd = (vec2(gx, gy) - c) / c;
    float d = sqrt(dd.x * dd.x + dd.y * dd.y);
    float v = min(d * 0.9, 1.0);

    return i * v;
}

void main() {
    uint instance = uint(gl_InstanceID);
    int vertex = gl_VertexID;

    // figure out which cell we're currently generating
    uint colsOnScreen = uint(uCanvasSize.x / uCellSize.x);
    uint gridX = instance % colsOnScreen;
    uint gridY = instance / colsOnScreen;

    // compute animation
    float brightness = f(gridX, gridY);
    uint charIdx = texelFetch(uLut, ivec2(int(brightness * 255.0), 0), 0).r;
    vBrightness = brightness;

    // generate triangle strip corners
    vec2 corner = vec2(float(vertex % 2), float(vertex / 2));

    // compute atlas coords
    float atlasX = float(charIdx % uCellsPerDim);
    float atlasY = float(charIdx / uCellsPerDim);

    // UV
    vTexCoord = (vec2(atlasX, atlasY) + corner) / float(uCellsPerDim);

    // pos
    vec2 pixelPos = (vec2(float(gridX), float(gridY)) + corner) * uCellSize;    
    vec2 ndc = (pixelPos / uCanvasSize) * 2.0 - 1.0;
    gl_Position = vec4(ndc.x, -ndc.y, 0.0, 1.0);
}
`;

const PROGRAM_FS = /* glsl */ `#version 300 es
precision mediump float;
precision mediump usampler2D;

uniform vec4 uColor;
uniform sampler2D uAtlas;

in vec2 vTexCoord;
in float vBrightness;

out vec4 fragColor;

void main() {
    // stupidly simple shader
    fragColor = texture(uAtlas, vTexCoord) * uColor * (vBrightness * 0.4);
}
`;

export class WebGl2HeroRenderer {
  private atlasTexture: WebGLTexture;
  private lutTexture: WebGLTexture;
  private program: WebGLProgram;

  private program_uTime: WebGLUniformLocation;
  private program_uCanvasSize: WebGLUniformLocation;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly atlas: TAtlas,
    private readonly lut: Uint16Array,
  ) {
    this.atlasTexture = WebGl2HeroRenderer.uploadAtlas(gl, atlas);
    this.lutTexture = WebGl2HeroRenderer.uploadLut(gl, lut);
    this.program = WebGl2HeroRenderer.createProgram(gl, PROGRAM_VS, PROGRAM_FS);

    // cache frequently used uniform locations
    this.program_uTime = gl.getUniformLocation(this.program, "uTime");
    this.program_uCanvasSize = gl.getUniformLocation(
      this.program,
      "uCanvasSize",
    );
  }

  public init(width: number, height: number): void {
    const uAtlas = this.gl.getUniformLocation(this.program, "uAtlas");
    const uLut = this.gl.getUniformLocation(this.program, "uLut");
    const uCellsPerDim = this.gl.getUniformLocation(
      this.program,
      "uCellsPerDim",
    );
    const uCellSize = this.gl.getUniformLocation(this.program, "uCellSize");
    const uColor = this.gl.getUniformLocation(this.program, "uColor");

    this.gl.useProgram(this.program);

    // Bind Atlas to Texture Unit 0
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.atlasTexture);
    this.gl.uniform1i(uAtlas, 0);

    // Bind LUT to Texture Unit 1
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.lutTexture);
    this.gl.uniform1i(uLut, 1);

    // Set static uniforms
    this.gl.uniform1ui(uCellsPerDim, this.atlas.cellsPerDim);
    this.gl.uniform2f(uCellSize, this.atlas.cellW, this.atlas.cellH);
    this.gl.uniform2f(this.program_uCanvasSize, width, height);
    this.gl.uniform4f(uColor, 240 / 255, 160 / 255, 0, 1);

    // init time for shits and giggles
    this.gl.uniform1f(this.program_uTime, 0);
  }

  public render(width: number, height: number, time: number): void {
    const { cellW, cellH } = this.atlas;
    const cellsX = Math.ceil(width / cellW);
    const cellsY = Math.ceil(height / cellH);
    const totalInstances = cellsX * cellsY;

    this.gl.viewport(0, 0, width, height);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.program_uCanvasSize, width, height);
    this.gl.uniform1f(this.program_uTime, time);

    this.gl.drawArraysInstanced(this.gl.TRIANGLE_STRIP, 0, 4, totalInstances);

    this.gl.flush();
  }


  // peak webgl slop below, webgpu can't come soon enough...

  private static uploadAtlas(
    gl: WebGL2RenderingContext,
    atlas: TAtlas,
  ): WebGLTexture {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texStorage2D(
      gl.TEXTURE_2D,
      1,
      gl.RGBA8,
      atlas.data.width,
      atlas.data.height,
    );

    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      atlas.data.width,
      atlas.data.height,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      atlas.data.data,
    );

    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
  }

  private static uploadLut(
    gl: WebGL2RenderingContext,
    lut: Uint16Array,
  ): WebGLTexture {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R16UI, lut.length, 1);

    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      lut.length,
      1,
      gl.RED_INTEGER,
      gl.UNSIGNED_SHORT,
      lut,
    );

    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
  }

  private static createProgram(
    gl: WebGL2RenderingContext,
    vsSource: string,
    fsSource: string,
  ): WebGLProgram {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(vs));
      gl.deleteShader(vs);
      return null;
    }

    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(fs));
      gl.deleteShader(fs);
      return null;
    }

    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(p));
      gl.deleteProgram(p);
      return null;
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    return p;
  }
}
