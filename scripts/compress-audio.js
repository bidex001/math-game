const path = require("path");
const { spawnSync } = require("child_process");
const ffmpegPath = require("ffmpeg-static");

// list of audio files in assets/sound
const files = ["music1.mp3", "music2.mp3", "music3.mp3"];

files.forEach((file) => {
  const input = path.join(__dirname, "..", "assets", "sound", file);
  const output = path.join(
    __dirname,
    "..",
    "assets",
    "sound",
    `optimized-${file}`,
  );
  console.log(`Compressing ${file} -> optimized-${file}`);
  const args = ["-y", "-i", input, "-b:a", "64k", output];
  const result = spawnSync(ffmpegPath, args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`Failed to compress ${file}`);
  } else {
    const fs = require("fs");
    try {
      fs.renameSync(output, input);
      console.log(`${file} replaced with optimized version`);
    } catch (e) {
      console.error(`Error replacing ${file}:`, e);
    }
  }
});
