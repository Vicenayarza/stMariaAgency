
import { randomBytes } from "node:crypto";

import type {
  calculateInstagramEngagement,
} from "./instagram.service.js";

type CalculatorResult = Awaited<
  ReturnType<typeof calculateInstagramEngagement>
>;

interface CalculatorSession {
  result: CalculatorResult;
  expiresAt: number;
}

const SESSION_DURATION = 5 * 60 * 1000;

const calculatorSessions = new Map<
  string,
  CalculatorSession
>();

/**
 * Elimina las sesiones caducadas.
 */
function cleanExpiredSessions(): void {
  const now = Date.now();

  for (const [id, session] of calculatorSessions) {
    if (session.expiresAt <= now) {
      calculatorSessions.delete(id);
    }
  }
}

/**
 * Guarda temporalmente el resultado
 * y devuelve un identificador aleatorio.
 */
export function createCalculatorResult(
  result: CalculatorResult
): string {
  cleanExpiredSessions();

  const id = randomBytes(32).toString("hex");

  calculatorSessions.set(id, {
    result,
    expiresAt: Date.now() + SESSION_DURATION,
  });

  return id;
}

/**
 * Recupera el resultado una sola vez.
 *
 * Si ha caducado o no existe,
 * devuelve null.
 */
export function consumeCalculatorResult(
  id: string
): CalculatorResult | null {
  const session = calculatorSessions.get(id);

  if (!session) {
    return null;
  }

  calculatorSessions.delete(id);

  if (session.expiresAt <= Date.now()) {
    return null;
  }

  return session.result;
}
