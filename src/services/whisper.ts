import type { Transcript, CompressionQuality } from '../types';

// NOTE: Whisper transcription is currently not in use.
// The AssemblyAI service is the active transcription provider.
// This file is kept for potential future use but the implementation is commented out.

/**
 * Transcribe an episode audio file using OpenAI Whisper API
 * @param filename The downloaded filename (e.g., "12345.mp3")
 * @param episodeId The episode ID
 * @param apiKeyOverride Optional API key to use instead of env var
 * @param compressionQuality Bitrate for compression (0 = no compression, use original)
 */
export async function transcribeEpisode(
    _filename: string,
    _episodeId: number,
    _apiKeyOverride?: string,
    _compressionQuality: CompressionQuality = 16
): Promise<Transcript> {
    throw new Error('Whisper transcription is currently disabled. Please use AssemblyAI instead.');
}

/*
// ORIGINAL IMPLEMENTATION - COMMENTED OUT

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const API_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';

export async function transcribeEpisode(
    filename: string,
    episodeId: number,
    apiKeyOverride?: string,
    compressionQuality: CompressionQuality = 16
): Promise<Transcript> {
    const apiKey = apiKeyOverride || OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('OpenAI API key is required for Whisper transcription. Please check your settings.');
    }

    try {
        if (!window.electronAPI) {
            throw new Error('Electron API not available');
        }

        // Step 1: Prepare audio file (compress or use original based on user preference)
        let fileToUpload = filename;
        let didCompress = false;

        if (compressionQuality === 0) {
            // User selected "Original" - skip compression entirely
            console.log(`[Whisper] Using original file (no compression): ${filename}`);
        } else {
            // Compress to the specified bitrate
            console.log(`[Whisper] Compressing audio file: ${filename} to ${compressionQuality}kbps...`);
            fileToUpload = await window.electronAPI.compressAudio(filename, compressionQuality);
            didCompress = true;
            console.log(`[Whisper] Compression complete: ${fileToUpload}`);
        }

        // Step 2: Read file
        const fileBuffer = await window.electronAPI.readFile(fileToUpload);
        const blob = new Blob([fileBuffer], { type: 'audio/mpeg' });

        // Step 3: Create form data for API request
        const formData = new FormData();
        formData.append('file', blob, fileToUpload); // BUG FIX: was 'compressedFilename'
        formData.append('model', 'whisper-1');
        formData.append('response_format', 'verbose_json');
        formData.append('timestamp_granularities[]', 'word');

        console.log(`[Whisper] Sending request to OpenAI API...`);
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('[Whisper] Transcription complete');

        // Step 4: Parse response into our format
        const words: TranscriptWord[] = [];
        const segments: TranscriptSegment[] = [];
        let fullText = '';

        if (data.words) {
            data.words.forEach((w: any) => {
                words.push({
                    word: w.word,
                    startTime: w.start,
                    endTime: w.end,
                });
            });
        }

        // Group words into segments (split by sentence or every ~5 words for better granularity)
        const wordsPerSegment = 1;
        for (let i = 0; i < words.length; i += wordsPerSegment) {
            const segmentWords = words.slice(i, i + wordsPerSegment);
            if (segmentWords.length > 0) {
                const text = segmentWords.map(w => w.word).join(' ');
                fullText += text + ' ';

                segments.push({
                    id: Math.floor(i / wordsPerSegment),
                    start: segmentWords[0].startTime,
                    end: segmentWords[segmentWords.length - 1].endTime,
                    text: text.trim(),
                    words: segmentWords,
                });
            }
        }

        const transcript: Transcript = {
            episodeId,
            text: fullText.trim(),
            segments,
            language: data.language || 'en',
            duration: words.length > 0 ? words[words.length - 1].endTime : 0,
            createdAt: Date.now(),
        };

        console.log('[Whisper] Transcript processed:', transcript);

        // Cleanup: Only delete the compressed file if we created one
        if (didCompress) {
            try {
                await window.electronAPI.deleteFile(fileToUpload);
                console.log(`[Whisper] Deleted compressed file: ${fileToUpload}`);
            } catch (cleanupError) {
                console.warn(`[Whisper] Failed to delete compressed file: ${fileToUpload}`, cleanupError);
            }
        }

        return transcript;
    } catch (error) {
        console.error('[Whisper] Transcription failed:', error);
        throw error;
    }
}
*/
