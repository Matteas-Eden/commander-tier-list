export async function compressToHash(obj) {
  const str = JSON.stringify(obj);
  // 1. Compress using native Deflate
  const stream = new Blob([str]).stream().pipeThrough(new CompressionStream("deflate"));
  const buffer = await new Response(stream).arrayBuffer();
  
  // 2. Convert to Base64
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  
  // 3. Make URL-friendly (remove +, /, and =)
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function decompressFromHash(hash) {
  // 1. Restore Base64 padding and characters
  const base64 = hash.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  
  // 2. Decompress
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
  const str = await new Response(stream).text();
  
  return JSON.parse(str);
}