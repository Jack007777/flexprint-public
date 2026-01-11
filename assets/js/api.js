export async function api(path, { method='GET', headers={}, body } = {}){
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data = null;
  try{ data = text ? JSON.parse(text) : null; }catch{ data = { raw: text }; }
  if(!res.ok){
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function uploadToR2(file){
  // 直接把文件 bytes POST 到后端；后端写入 R2
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'x-filename': encodeURIComponent(file.name),
      'content-type': file.type || 'application/octet-stream'
    },
    body: file
  });
  const data = await res.json();
  if(!res.ok) throw new Error(data?.error || 'Upload failed');
  return data;
}
