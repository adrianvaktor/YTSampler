
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});


async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  switch (pathname) {
    case '/metadata':
      return handleMetadataRequest(url);
    case '/stream':
      return handleStreamRequest(url);
    default:
      return new Response('Not Found', { status: 404 });
  }
}



async function handleMetadataRequest(url) {
  const videoUrl = url.searchParams.get('url');
  if (!videoUrl) return new Response("Missing `url` parameter", { status: 400 });

  try {
    const apiRes = await fetch('https://www.clipto.com/api/youtube', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ url: videoUrl }),
    });

    const data = await apiRes.json();
    const audio = data.medias.find(res => res.extension === 'weba');

    return new Response(JSON.stringify({
      title: data.title,
      thumbnail: data.thumbnail,
      streamUrl: `/stream?src=${encodeURIComponent(audio.url)}`,
    }), {
      headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
    });

  } catch (err) {
    return new Response(`Metadata error: ${err.message}`, { status: 500 });
  }
}

async function handleStreamRequest(url) {
  const src = url.searchParams.get('src');
  if (!src) return new Response("Missing `src` parameter", { status: 400 });

  try {
    const streamRes = await fetch(src);
    return new Response(streamRes.body, {
      headers: {
        'Content-Type': streamRes.headers.get('Content-Type') || 'audio/webm',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err) {
    return new Response(`Stream error: ${err.message}`, { status: 500 });
  }
}