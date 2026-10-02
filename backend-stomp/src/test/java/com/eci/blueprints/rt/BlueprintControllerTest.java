package com.eci.blueprints.rt;

import com.eci.blueprints.rt.dto.DrawEvent;
import com.eci.blueprints.rt.dto.Point;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BlueprintControllerTest {

  @Test
  void aceptaUnPuntoValido() {
    assertTrue(BlueprintController.isValid(new DrawEvent("juan", "plano-1", new Point(10, 20))));
    assertTrue(BlueprintController.isValid(new DrawEvent("nikolas", "intento de corazón", new Point(0, 0))));
  }

  @Test
  void rechazaPayloadsIncompletosOInseguros() {
    assertFalse(BlueprintController.isValid(null));
    assertFalse(BlueprintController.isValid(new DrawEvent("juan", "plano-1", null)));
    assertFalse(BlueprintController.isValid(new DrawEvent(null, "plano-1", new Point(1, 1))));
    assertFalse(BlueprintController.isValid(new DrawEvent("juan", "", new Point(1, 1))));
    // Un punto en el nombre publicaría en el tópico de otro plano.
    assertFalse(BlueprintController.isValid(new DrawEvent("juan", "a.b", new Point(1, 1))));
    assertFalse(BlueprintController.isValid(new DrawEvent("juan", "plano-1", new Point(-1, 5))));
  }
}
