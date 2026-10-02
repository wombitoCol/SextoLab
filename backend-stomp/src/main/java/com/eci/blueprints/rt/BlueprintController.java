package com.eci.blueprints.rt;

import com.eci.blueprints.rt.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.util.List;
import java.util.regex.Pattern;

@Controller
public class BlueprintController {

  private static final Logger log = LoggerFactory.getLogger(BlueprintController.class);
  // author y name forman parte del tópico: sin puntos ni caracteres raros para no "saltar" a otro plano.
  private static final Pattern SAFE_ID = Pattern.compile("[\\p{L}\\p{N}_\\- ]{1,64}");
  private static final int MAX_COORD = 10_000;

  private final SimpMessagingTemplate template;

  public BlueprintController(SimpMessagingTemplate template) {
    this.template = template;
  }

  @MessageMapping("/draw")
  public void onDraw(DrawEvent evt) {
    if (!isValid(evt)) {
      log.warn("draw descartado (payload inválido): {}", evt);
      return;
    }
    var topic = "/topic/blueprints." + evt.author() + "." + evt.name();
    var upd = new BlueprintUpdate(evt.author(), evt.name(), List.of(evt.point()));
    log.debug("draw {} -> {}", evt.point(), topic);
    template.convertAndSend(topic, upd);
  }

  static boolean isValid(DrawEvent evt) {
    if (evt == null || evt.point() == null) return false;
    if (evt.author() == null || !SAFE_ID.matcher(evt.author()).matches()) return false;
    if (evt.name() == null || !SAFE_ID.matcher(evt.name()).matches()) return false;
    var p = evt.point();
    return p.x() >= 0 && p.y() >= 0 && p.x() <= MAX_COORD && p.y() <= MAX_COORD;
  }
}
