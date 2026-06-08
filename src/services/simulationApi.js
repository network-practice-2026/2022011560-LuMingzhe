async function requestJson(url) {
  const response = await fetch(url)

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `请求失败：${response.status}`)
  }

  return response.json()
}

export async function fetchSimulations() {
  const data = await requestJson('/api/simulations')
  return data.simulations || []
}

export async function fetchSimulation(id) {
  const data = await requestJson(`/api/simulations/${encodeURIComponent(id)}`)
  return data.simulation
}
