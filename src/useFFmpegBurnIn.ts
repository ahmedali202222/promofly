import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

let _ffmpeg: any;

export async function getFFmpeg() {
  if (_ffmpeg) return _ffmpeg;
  _ffmpeg = createFFmpeg({ log: true }); // set false to quiet logs
  await _ffmpeg.load();
  return _ffmpeg;
}

/**
 * Burn overlay.png (transparent) onto input video, scaled/padded to 1080x1920.
 * Returns a Blob of the final MP4.
 */
export async function burnOverlayIntoVideo(videoFile: File, overlayPng: Blob): Promise<Blob> {
  const ffmpeg = await getFFmpeg();

  // Write inputs to ffmpeg FS
  ffmpeg.FS("writeFile", "input.mp4", await fetchFile(videoFile));
  ffmpeg.FS("writeFile", "overlay.png", await fetchFile(overlayPng));

  // Scale video to fit 1080x1920 (decrease), then pad to exact canvas,
  // overlay the PNG, keep audio, faststart for web playback.
  const outName = "out.mp4";
  await ffmpeg.run(
    "-i", "input.mp4",
    "-i", "overlay.png",
    "-filter_complex",
    "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease," +
    "pad=1080:1920:(1080-iw)/2:(1920-ih)/2:color=black[v0];" +
    "[v0][1:v]overlay=0:0:format=auto",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "23",
    "-c:a", "copy",
    "-movflags", "+faststart",
    outName
  );

  const data = ffmpeg.FS("readFile", outName);
  return new Blob([data.buffer], { type: "video/mp4" });
}
1