



async function fetchMetadata( videoUrl ) {
  // const videoUrl = 'https://youtube.com/watch?v=abc123';

  const metadataRes = await fetch(`https://billowing-bar-bb2d.steep-scene-1ace.workers.dev/metadata?url=${encodeURIComponent(videoUrl)}`);
  console.log(metadataRes)
  const metadata = await metadataRes.json();

  return metadata;
  }

  function updateProgress(loaded, total) {
    const percent = total ? Math.round((loaded / total) * 100) : null;
    console.log(`Loaded: ${loaded} bytes${total ? ` (${percent}%)` : ''}`);
  }

  async function fetchDataStream( streamUrl ){
    const audioRes = await fetch(`https://billowing-bar-bb2d.steep-scene-1ace.workers.dev${streamUrl}`);
    return audioRes;
  }

  async function processChunks(stream, audioContext) {

    const reader = stream.body.getReader();

    const contentLength = stream.headers.get('Content-Length');
    const totalBytes = contentLength ? parseInt(contentLength) : null;

    let bytesLoaded = 0; // Track total bytes loaded

    let buffer = new Uint8Array(0);
    let done = false;
  
    while (!done) {
      const { done: chunkDone, value: chunk } = await reader.read();
      done = chunkDone;
  
      if (chunk) {
        bytesLoaded += chunk.length;
        updateProgress(bytesLoaded, totalBytes);
  
        const newBuffer = new Uint8Array(buffer.length + chunk.length);
        newBuffer.set(buffer);
        newBuffer.set(chunk, buffer.length);
        buffer = newBuffer;
        
      }
      // await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log("Streaming complete");
    updateProgress(bytesLoaded, totalBytes);
    
    let decoded_Buffer;

    try {
      const bufferCopy = buffer.slice();
        decoded_Buffer = await audioContext.decodeAudioData(bufferCopy.buffer, (audioBuffer) => {
          return audioBuffer;

        }, (err) => {
          console.error("Error decoding audio chunk:", err);
        });

        
    } catch (err) {
      console.error("Decoding error:", err);
    }

    return decoded_Buffer;
  }
  





async function submitUrl() {
    const url = document.getElementById('youtubeUrl').value;
    const youtubeID = getYouTubeVideoId( url )
    if (!url) {
        alert("Please enter a YouTube URL");
        return;
    }
    if( SAMPLER.ASIDSearch[youtubeID] ) {
      alert(`Already Downloaded: ${SAMPLER.ASIDSearch[youtubeID].title}`);
      return;
    }
    
    
    const metadata = await fetchMetadata( url )
    
    modalToggle( false )
    
    console.log(lastPadSelected.domElement)

    lastPadSelected.domElement.style.backgroundImage = `url(${'loading.webp'})`;
    lastPadSelected.domElement.style.backgroundSize = '50px 50px';
    lastPadSelected.domElement.style.backgroundPosition = 'center'; // Optional: Centers the background image
    lastPadSelected.domElement.style.backgroundRepeat = 'no-repeat'; // Optional: Prevents the image from repeating

    const audioStream = await fetchDataStream( metadata.streamUrl )

    const decoded_buffer = await processChunks( audioStream, audioContext ).catch( err => console.error("Error in chunk processing:", err ));


    const newAudio = new AudioSource( youtubeID, metadata, decoded_buffer )
    SAMPLER.AudioSources.push( newAudio );
    SAMPLER.ASIDSearch[youtubeID] = newAudio;



    addNewTrigger()

  }



  function getYouTubeVideoId(url) {
    try {
      const parsedUrl = new URL(url);
  
      // Standard YouTube URL (e.g., https://www.youtube.com/watch?v=abc123)
      if (parsedUrl.hostname.includes("youtube.com")) {
        return parsedUrl.searchParams.get("v");
      }
  
      // Short YouTube URL (e.g., https://youtu.be/abc123)
      if (parsedUrl.hostname === "youtu.be") {
        return parsedUrl.pathname.slice(1);
      }
  
      return null;
    } catch (err) {
      console.error("Invalid URL:", err);
      return null;
    }
  }



//     async function fetchAndPlayAudio( Audio_url ) {

//         // const controller = new AbortController();
//         // const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout
//         const audioPlayer = document.getElementById('audioPlayer');
//         const mediaSource = new MediaSource();
//         audioPlayer.src = URL.createObjectURL(mediaSource);
        
        
//         await new Promise((resolve, reject) => {
//           mediaSource.addEventListener('sourceopen', resolve);
//           mediaSource.addEventListener('sourceerror', reject);
//         });

//         const codecs = [
//             'audio/mp4; codecs="mp4a.40.2"', // AAC-LC
//             'audio/mp4; codecs="mp4a.40.5"', // HE-AAC
//             'audio/mp4' // Fallback
//           ];

//         let sourceBuffer;

//         for (const codec of codecs) {
//             try {
//               sourceBuffer = mediaSource.addSourceBuffer(codec);
//               break; // Successfully created source buffer
//             } catch (e) {
//               console.warn(`Codec ${codec} not supported:`, e);
//             }
//           }
          

//         // const sourceBuffer = mediaSource.addSourceBuffer('audio/mp4');

//         try {

//           const response = await fetch(`https://billowing-bar-bb2d.steep-scene-1ace.workers.dev/?url=${Audio_url}`, {
//             headers: {
//               "Range": "bytes=0-",
//             },
//           });

//           const contentLength = response.headers.get('Content-Length');
//           const totalBytes = contentLength ? parseInt(contentLength) : null;

//           let bytesLoaded = 0; // Track total bytes loaded

//           const reader = response.body.getReader();
//           const audioContext = new (window.AudioContext || window.webkitAudioContext)();




//           async function processChunks(reader, audioContext) {
//             let buffer = new Uint8Array(0);
//             let done = false;
          
//             while (!done) {
//               const { done: chunkDone, value: chunk } = await reader.read();
//               done = chunkDone;
          
//               if (chunk) {
//                 bytesLoaded += chunk.length;
//                 updateProgress(bytesLoaded, totalBytes);
          
//                 const newBuffer = new Uint8Array(buffer.length + chunk.length);
//                 newBuffer.set(buffer);
//                 newBuffer.set(chunk, buffer.length);
//                 buffer = newBuffer;
                
//               }
//               // await new Promise(resolve => setTimeout(resolve, 50));
//             }
            
//             console.log("Streaming complete");
//             updateProgress(bytesLoaded, totalBytes);
            
//             let decoded_Buffer;

//             try {
//               const bufferCopy = buffer.slice();
//                 decoded_Buffer = await audioContext.decodeAudioData(bufferCopy.buffer, (audioBuffer) => {
//                   return audioBuffer;

//                 }, (err) => {
//                   console.error("Error decoding audio chunk:", err);
//                 });

                
//             } catch (err) {
//               console.error("Decoding error:", err);
//             }

//             youtubeBuffers.push( decoded_Buffer )

//             console.log( youtubeBuffers )
            
//           }
//           processChunks(reader,audioContext).catch(err => console.error("Error in chunk processing:", err));

//         } catch (error) {
//             console.error('Error fetching audio:', error);
//         } finally {
//         }
//     }
//     fetchAndPlayAudio(url)
// }