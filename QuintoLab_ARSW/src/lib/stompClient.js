import { Client } from '@stomp/stompjs'

// @stomp/stompjs (sin SockJS) necesita esquema ws:// o wss://, no http(s)://
// onStatus recibe 'connecting' | 'connected' | 'error' para mostrar el estado en la UI.
export function createStompClient(baseUrl, { onStatus = () => {} } = {}) {
  const wsUrl = baseUrl.replace(/\/$/, '').replace(/^http/, 'ws')
  return new Client({
    brokerURL: `${wsUrl}/ws-blueprints`,
    reconnectDelay: 1000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    beforeConnect: () => onStatus('connecting'),
    onWebSocketClose: () => onStatus('connecting'),
    onWebSocketError: () => {
      console.warn('STOMP: no se pudo abrir el WebSocket, reintentando...')
      onStatus('error')
    },
    onStompError: (f) => {
      console.error('STOMP error', f.headers['message'])
      onStatus('error')
    },
  })
}

export function subscribeBlueprint(client, author, name, onMsg) {
  const sub = client.subscribe(`/topic/blueprints.${author}.${name}`, (m) => {
    onMsg(JSON.parse(m.body))
  })
  return () => sub.unsubscribe()
}

// Devuelve false si no hay conexión, para que el llamador aplique el punto localmente.
export function publishDraw(client, author, name, point) {
  if (!client?.connected) return false
  client.publish({ destination: '/app/draw', body: JSON.stringify({ author, name, point }) })
  return true
}
