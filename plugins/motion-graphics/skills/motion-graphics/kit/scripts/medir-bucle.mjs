#!/usr/bin/env node
// Mide si un vídeo cierra en bucle sin corte: compara el salto del último fotograma al primero (la costura) con el
// salto normal entre fotogramas seguidos. Sin dependencias: ffmpeg decodifica a gris 160x90 y se resta aquí.
//   node medir-bucle.mjs <video> [--max 1.5]
// Sale con 0 si costura <= max x (salto mediano). Usa FFMPEG si está definida.
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const video = args.find((a) => !a.startsWith('--'));
const max = Number(args[args.indexOf('--max') + 1]) || 1.5;
if (!video) { console.error('Uso: node medir-bucle.mjs <video> [--max 1.5]'); process.exit(2); }
const FF = process.env.FFMPEG || 'ffmpeg';
const W = 160, H = 90, N = W * H;
const r = spawnSync(FF, ['-v', 'error', '-i', video, '-vf', `scale=${W}:${H}:flags=area,format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 });
if (r.status !== 0) { console.error(String(r.stderr)); process.exit(2); }
const total = Math.floor(r.stdout.length / N);
if (total < 3) { console.error('Muy pocos fotogramas'); process.exit(2); }
const cuadro = (i) => r.stdout.subarray(i * N, (i + 1) * N);
const dif = (a, b) => { let s = 0; for (let i = 0; i < N; i++) s += Math.abs(a[i] - b[i]); return s / N; };
const saltos = [];
for (let i = 1; i < total; i++) saltos.push(dif(cuadro(i - 1), cuadro(i)));
const orden = [...saltos].sort((a, b) => a - b);
const mediano = orden[Math.floor(orden.length / 2)], mayor = orden.at(-1);
const costura = dif(cuadro(total - 1), cuadro(0));
const repetidos = saltos.filter((s) => s < mediano * 0.05).length;
const bien = costura <= Math.max(mediano * max, 0.05);
console.log(JSON.stringify({ fotogramas: total, saltoMediano: +mediano.toFixed(3), saltoMayor: +mayor.toFixed(3), costura: +costura.toFixed(3), relacion: +(costura / (mediano || 1e-9)).toFixed(2), repetidos, sinCorte: bien }));
process.exit(bien ? 0 : 1);
