import { FFmpeg } from "@ffmpeg/ffmpeg";

import coreURL from "../ffmpeg/ffmpeg-core.js?url";
import wasmURL from "../ffmpeg/ffmpeg-core.wasm?url";
import workerURL from "../ffmpeg/ffmpeg-worker.js?url";

let ffmpeg: FFmpeg | null;

export async function getFFmpeg() {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL,
      wasmURL,
      workerURL,
    });
  }

  return ffmpeg;
}

/** FFmpeg
 *
 * O FFmpeg é uma biblioteca de software livre que pode gravar, converter e transmitir áudio e vídeo.
 * No node, podemos usar o pacote @ffmpeg/ffmpeg para usar o FFmpeg.
 * Com vemos acima, criamos uma função que retorna uma instância do FFmpeg.
 * E como o FFmpeg é uma biblioteca pesada, só vamos carregar ela quando for necessário.
 * Sendo assim, criamos uma variável ffmpeg que vai armazenar a instância do FFmpeg.
 **/
