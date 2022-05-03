export async function fetchWithProgress(
  url: string,
  onProgress: (progress?: number) => void
) {
  const r = await fetch(url, {
    method: "GET",
  });
  if (r.body === null) {
    throw Error("unable to load body");
  }
  const clStr = r.headers.get("content-length");
  const contentLength = clStr === null ? undefined : parseInt(clStr, 10);
  const reader = r.body.getReader();
  let buff = contentLength ? new Uint8Array(contentLength) : new Uint8Array([]);
  let buffPos = 0;
  while (true) {
    const rx = await reader.read();
    if (rx.done) {
      break;
    }
    const chunk = await rx.value;
    // resize buffer?
    if (buffPos + chunk.length > buff.length) {
      let buffNew = new Uint8Array(buffPos + chunk.length);
      buffNew.set(buff, 0);
      buffPos = buff.length;
      buff = buffNew;
    }
    buff.set(chunk, buffPos);
    buffPos += chunk.length;
    onProgress(contentLength ? buffPos / contentLength : undefined);
  }
  return buff;
}
