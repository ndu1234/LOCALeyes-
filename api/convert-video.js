// Converts a video already in Supabase storage to MP4 (H.264) using FFmpeg.
// Called from the admin panel after uploading the original file.
//
// POST /api/convert-video
//   Body: { storagePath: "video/<uuid>.mov", label: "..." }
//   Returns: { videoUrl, id }
//
// The function downloads the file from storage, converts it, uploads the
// MP4 result back, creates the content_videos row, and cleans up the
// original.

const { createClient } = require('@supabase/supabase-js');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

ffmpeg.setFfmpegPath(ffmpegStatic);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'server misconfigured' });
  }
  const sb = createClient(supabaseUrl, supabaseKey);

  try {
    const { storagePath, label } = req.body;
    if (!storagePath) return res.status(400).json({ error: 'no storagePath' });

    // Download the original file from Supabase storage
    const { data: fileData, error: dlErr } = await sb.storage
      .from('content-videos')
      .download(storagePath);
    if (dlErr) throw new Error('download failed: ' + dlErr.message);

    const ext = path.extname(storagePath).toLowerCase();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'conv-'));
    const inputPath = path.join(tmpDir, `input${ext}`);
    const outputPath = path.join(tmpDir, 'output.mp4');
    const buffer = Buffer.from(await fileData.arrayBuffer());
    fs.writeFileSync(inputPath, buffer);

    // Convert to MP4
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .audioBitrate('128k')
        .outputOptions(['-preset fast', '-crf 22', '-movflags +faststart'])
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    // Upload the MP4 result
    const mp4Data = fs.readFileSync(outputPath);
    const mp4Path = `video/${uuidv4()}.mp4`;
    const { error: upErr } = await sb.storage
      .from('content-videos')
      .upload(mp4Path, mp4Data, { contentType: 'video/mp4', upsert: false });
    if (upErr) throw new Error('upload failed: ' + upErr.message);
    const { data: urlData } = sb.storage.from('content-videos').getPublicUrl(mp4Path);

    // Create the database row
    const { data: existing } = await sb
      .from('content_videos')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);
    const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

    const { data: inserted, error: insertErr } = await sb
      .from('content_videos')
      .insert([{ label: label || null, video_url: urlData.publicUrl, display_order: nextOrder }])
      .select('id')
      .single();
    if (insertErr) throw new Error('insert failed: ' + insertErr.message);

    // Clean up the original temp file from storage
    sb.storage.from('content-videos').remove([storagePath]);

    // Cleanup local temp files
    fs.rmSync(tmpDir, { recursive: true, force: true });

    res.status(200).json({ videoUrl: urlData.publicUrl, id: inserted.id });
  } catch (err) {
    console.error('Convert error:', err);
    res.status(500).json({ error: err.message || 'conversion failed' });
  }
};
