import { Client } from '@stomp/stompjs'

// @stomp/stompjs (sin SockJS) necesita esquema ws:// o wss://, no http(s)://
export function createStompClient(baseUrl) {
  const wsUrl = baseUrl.replace(/\/$/, '').replace(/^http/, 'ws')
  return new Client({
    brokerURL: `${wsUrl}/ws-blueprints`,
    reconnectDelay: 1000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onStompError: (f) => console.error('STOMP error', f.headers['message']),
  })
}

export function subscribeBlueprint(client, author, name, onMsg) {
  const sub = client.subscribe(`/topic/blueprints.${author}.${name}`, (m) => {
    onMsg(JSON.parse(m.body))
  })
  return () => sub.unsubscribe()
}

export function publishDraw(client, author, name, point) {
  if (!client?.connected) return
  client.publish({ destination: '/app/draw', body: JSON.stringify({ author, name, point }) })
}
