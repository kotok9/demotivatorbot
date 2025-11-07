const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * Get ffmpeg output format based on input file type
 */
function getOutputFormat(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  
  if (['.gif'].includes(ext)) {
    return 'gif';
  } else if (['.mp4', '.mov', '.avi', '.webm', '.mkv'].includes(ext)) {
    return 'mp4';
  } else {
    return 'png';
  }
}

/**
 * Get input dimensions using ffprobe
 */
function getVideoDimensions(inputPath) {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height',
      '-of', 'json',
      inputPath
    ]);

    let stdout = '';
    let stderr = '';

    ffprobe.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed: ${stderr}`));
        return;
      }

      try {
        const info = JSON.parse(stdout);
        const stream = info.streams[0];
        resolve({ width: stream.width, height: stream.height });
      } catch (err) {
        reject(new Error(`Failed to parse ffprobe output: ${err.message}`));
      }
    });
  });
}

/**
 * Create demotivational poster using ffmpeg
 * @param {string} inputPath - Path to input file
 * @param {string} caption - Text to display on bottom border (will be uppercased)
 * @returns {Promise<string>} - Path to output file
 */
async function createDemotivator(inputPath, caption) {
  try {
    // Get input dimensions
    const { width, height } = await getVideoDimensions(inputPath);

    // Classic demotivator style - standardized size:
    // Final dimensions with all borders should have ratio: height = 1.04 × width
    // Working backwards from desired final size
    
    const targetWidth = 600;
    const whiteBorder = 3; // Fixed 3px white border
    const blackBorderLeftRight = Math.round(targetWidth * 0.07); // 7% of width
    
    // Calculate final width first
    const finalWidth = targetWidth + (whiteBorder * 2) + (blackBorderLeftRight * 2);
    // Final height should be 1.04 × final width
    const finalHeight = Math.round(finalWidth * 1.04);
    
    // Work backwards to find target height
    // finalHeight = targetHeight + whiteBorder×2 + blackBorderTop + blackBorderBottom
    // where blackBorderTop = targetHeight × 0.04 and blackBorderBottom = targetHeight × 0.20
    // finalHeight = targetHeight + 6 + targetHeight × 0.04 + targetHeight × 0.20
    // finalHeight = targetHeight × 1.24 + 6
    // targetHeight = (finalHeight - 6) / 1.24
    const targetHeight = Math.round((finalHeight - whiteBorder * 2) / 1.24);
    
    // Now calculate borders based on target height
    const blackBorderTop = Math.round(targetHeight * 0.04);
    const blackBorderBottom = Math.round(targetHeight * 0.20);
    
    // Calculate dimensions after white border
    const widthWithWhite = targetWidth + (whiteBorder * 2);
    const heightWithWhite = targetHeight + (whiteBorder * 2);

    // Calculate text size (6% * 1.2 = 7.2% of target width for readability)
    let fontSize = Math.round(targetWidth * 0.06 * 1.2);

    // Prepare output path
    const outputFormat = getOutputFormat(inputPath);
    const outputPath = inputPath.replace(/\.[^/.]+$/, `_demotivated.${outputFormat}`);

    // Calculate available width for text (88% of final width to avoid touching borders)
    const textBoxWidth = Math.round(finalWidth * 0.88);
    
    // Estimate text width (Times New Roman: ~0.48 * fontSize per character on average)
    const avgCharWidth = fontSize * 0.48;
    const estimatedWidth = caption.length * avgCharWidth;
    
    let lines = [caption];
    
    // If text is too wide, split into 2 lines
    if (estimatedWidth > textBoxWidth) {
      const words = caption.split(' ');
      if (words.length > 1) {
        // Fit as many words as possible in first line
        let line1 = '';
        let line2 = '';
        let splitIndex = 0;
        
        for (let i = 0; i < words.length; i++) {
          const testLine = line1 + (line1 ? ' ' : '') + words[i];
          const testWidth = testLine.length * avgCharWidth;
          
          if (testWidth <= textBoxWidth) {
            line1 = testLine;
            splitIndex = i + 1;
          } else {
            break;
          }
        }
        
        // Remaining words go to second line
        line2 = words.slice(splitIndex).join(' ');
        
        // If line1 is empty (first word too long), split more evenly
        if (!line1) {
          const midPoint = Math.ceil(words.length / 2);
          line1 = words.slice(0, midPoint).join(' ');
          line2 = words.slice(midPoint).join(' ');
        }
        
        lines = [line1, line2].filter(l => l); // Remove empty lines
        
        // Check if longest line still fits
        const maxLineLength = Math.max(line1.length, line2.length);
        const maxLineWidth = maxLineLength * avgCharWidth;
        
        // If still too wide, reduce font size
        if (maxLineWidth > textBoxWidth) {
          const scaleFactor = textBoxWidth / maxLineWidth;
          fontSize = Math.round(fontSize * scaleFactor * 0.9); // 0.9 for safety margin
        }
      } else {
        // Single long word - reduce font
        fontSize = Math.round(textBoxWidth / caption.length / 0.48);
      }
    }
    
    // Build ffmpeg filter
    // 1. Scale to standard size - force exact dimensions, stretch/squash to fit
    // 2. Reset aspect ratio
    // 3. Add white border around image
    // 4. Add black border around that (4% top, 20% bottom, 7% sides)
    // 5. Draw white text centered at bottom black border
    
    let baseFilter = `scale=${targetWidth}:${targetHeight},setsar=1,pad=${widthWithWhite}:${heightWithWhite}:${whiteBorder}:${whiteBorder}:white,pad=${finalWidth}:${finalHeight}:${blackBorderLeftRight}:${blackBorderTop}:black`;
    
    // Draw each line of text separately
    
    if (lines.length === 1) {
      // Single line - center vertically in bottom border
      const escapedText = lines[0].replace(/'/g, "'\\''").replace(/:/g, '\\:');
      baseFilter += `,drawtext=text='${escapedText}':fontfile=/Windows/Fonts/times.ttf:fontsize=${fontSize}:fontcolor=white:x=(w-text_w)/2:y=h-${blackBorderBottom/2}-text_h/2`;
    } else {
      // Two lines - position them with spacing and shift down a bit
      const textOffsetDown = 8; // Shift text down a bit for two-line text
      const lineHeight = fontSize * 1.2; // Line height with spacing
      const totalTextHeight = lineHeight * 2;
      const startY = Math.round(finalHeight - blackBorderBottom/2 - totalTextHeight/2 + textOffsetDown);
      
      for (let i = 0; i < lines.length; i++) {
        const escapedLine = lines[i].replace(/'/g, "'\\''").replace(/:/g, '\\:');
        const yPos = startY + (i * lineHeight);
        baseFilter += `,drawtext=text='${escapedLine}':fontfile=/Windows/Fonts/times.ttf:fontsize=${fontSize}:fontcolor=white:x=(w-text_w)/2:y=${yPos}`;
      }
    }
    
    const filter = baseFilter;

    // ffmpeg arguments
    const args = [
      '-i', inputPath,
      '-vf', filter,
      '-y' // Overwrite output file
    ];

    // Add format-specific encoding options
    if (outputFormat === 'gif') {
      // Preserve GIF animation
      args.push('-f', 'gif');
    } else if (outputFormat === 'mp4') {
      // Re-encode video with good quality
      args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '23');
      // Copy audio if exists
      args.push('-c:a', 'copy');
    } else {
      // PNG - high quality
      args.push('-compression_level', '6');
    }

    args.push(outputPath);

    // Execute ffmpeg
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);

      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffmpeg failed with code ${code}: ${stderr}`));
        } else {
          resolve();
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`Failed to spawn ffmpeg: ${err.message}`));
      });
    });

    return outputPath;
  } catch (err) {
    throw new Error(`Failed to create demotivator: ${err.message}`);
  }
}

/**
 * Delete a file
 */
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.error(`Failed to delete file ${filePath}:`, err.message);
  }
}

module.exports = {
  createDemotivator,
  deleteFile
};

