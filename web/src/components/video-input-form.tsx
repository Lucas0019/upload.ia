import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { Label } from "@radix-ui/react-label";
import { Separator } from "@radix-ui/react-separator";
import { FileVideo, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { api } from "@/lib/axios";

type Status =
  | "waiting"
  | "converting"
  | "uploading"
  | "generating"
  | "success"
  | "error";

interface VideoInputFormProps {
  onVideoUploaded: (id: string) => void;
}

const statausMessages = {
  waiting: "Carregar vídeo...",
  converting: "Convertendo vídeo...",
  uploading: "Enviando vídeo...",
  generating: "Gerando transcrição...",
  success: "Vídeo carregado com sucesso!",
  error: "Erro ao carregar vídeo!",
};

export const VideoInputForm = ({ onVideoUploaded }: VideoInputFormProps) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("waiting");
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;

    if (!files) return;

    const selectedFile = files[0];

    setVideoFile(selectedFile);
  };

  const convertVideoToAudio = async (video: File) => {
    console.log("convert video to audio started");

    const ffmpeg = await getFFmpeg();

    await ffmpeg.writeFile("input.mp4", await fetchFile(video));

    // ffmpeg.on('log', (log) => {
    //   console.log(log)
    // })

    // ffmpeg.on('progress', (progress) => {
    //   console.log('Covertion progress: ' + Math.round(progress.progress * 100) + '%')
    // })

    await ffmpeg.exec([
      "-i",
      "input.mp4",
      "-map",
      "0:a",
      "-b:a",
      "20K",
      "-acodec",
      "libmp3lame",
      "output.mp3",
    ]);

    const data = await ffmpeg.readFile("output.mp3");

    const audioFileBlob = new Blob([data], { type: "audio/mp3" });
    const audioFile = new File([audioFileBlob], "output.mp3", {
      type: "audio/mp3",
    });

    console.log("convert video to audio finished");

    return audioFile;
  };

  const handleUploadVideo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const prompt = promptInputRef.current?.value;

    if (!videoFile) return;

    setStatus("converting");

    const audioFile = await convertVideoToAudio(videoFile);

    // console.log(audioFile, prompt)

    const formData = new FormData();

    formData.append("file", audioFile);

    setStatus("uploading");

    const response = await api.post("/videos", formData);

    const videoId = response.data.video.id;

    setStatus("generating");

    await api.post(`/videos/${videoId}/transcription`, {
      prompt,
    });

    setStatus("success");

    onVideoUploaded(videoId);
  };

  const previewVideo = useMemo(() => {
    if (!videoFile) return null;

    return URL.createObjectURL(videoFile);
  }, [videoFile]);

  return (
    <form onSubmit={handleUploadVideo} className="space-y-6">
      <label
        htmlFor="video"
        className="relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/10 hover:border-primary/50 transition-colors duration-200"
      >
        {previewVideo ? (
          <video
            src={previewVideo}
            controls={false}
            className="pointer-events-non absolute inset-0 h-full"
          />
        ) : (
          <>
            <FileVideo className="w-4 h-4" />
            Carregar vídeo
          </>
        )}
      </label>

      <input
        type="file"
        id="video"
        accept="video/mp4"
        className="sr-only"
        onChange={handleFileSelect}
      />

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="transcription">Prompt de transcrição</Label>
        <Textarea
          ref={promptInputRef}
          disabled={status !== "waiting"}
          id="transcription_prompt"
          className="h-20 leanding-relaxed resize-none"
          placeholder="Inclua palavras-chave mencionados no video seperadas por vírgula (,)"
        />
      </div>

      <Button
        data-success={status === "success"}
        disabled={status !== "waiting"}
        type="submit"
        className="w-full data-[success=true]:bg-emerald-400"
      >
        {status === "waiting" ? (
          <>
            Carregar vídeo
            <Upload className="w-4 h-4 ml-2" />
          </>
        ) : (
          statausMessages[status]
        )}
      </Button>
    </form>
  );
};
