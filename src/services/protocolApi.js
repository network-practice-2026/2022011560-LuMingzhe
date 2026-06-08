async function requestJson(url) {
  const response = await fetch(url)

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `请求失败：${response.status}`)
  }

  return response.json()
}

export async function fetchProtocols() {
  const data = await requestJson('/api/protocols')
  return data.protocols || []
}

export async function fetchProtocol(id) {
  const data = await requestJson(`/api/protocols/${encodeURIComponent(id)}`)
  return data.protocol
}
