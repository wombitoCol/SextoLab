package com.eci.blueprints.rt;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

/** Logs de conexión/suscripción para observar qué clientes están en qué plano. */
@Component
public class WebSocketEventsLogger {

  private static final Logger log = LoggerFactory.getLogger(WebSocketEventsLogger.class);

  @EventListener
  public void onConnect(SessionConnectedEvent e) {
    log.info("STOMP conectado: session={}", StompHeaderAccessor.wrap(e.getMessage()).getSessionId());
  }

  @EventListener
  public void onSubscribe(SessionSubscribeEvent e) {
    var h = StompHeaderAccessor.wrap(e.getMessage());
    log.info("STOMP suscripción: session={} destino={}", h.getSessionId(), h.getDestination());
  }

  @EventListener
  public void onDisconnect(SessionDisconnectEvent e) {
    log.info("STOMP desconectado: session={} status={}", e.getSessionId(), e.getCloseStatus());
  }
}
