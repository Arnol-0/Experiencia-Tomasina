import { useEffect, useRef } from 'react';
import { validationService } from '../services/validationService';

/**
 * ============================================================================
 * UTILIDAD: scanner.js (Soporte Robusto para Pistolas de Escáner y QR Chilenos)
 * ============================================================================
 * 
 * 📌 RESPONSABILIDAD (SRP):
 * Centraliza la captura a nivel de hardware de pistolas lectoras de códigos QR
 * y de barras (emulación de teclado USB HID), y la extracción/normalización de
 * RUTs desde códigos de cédulas de identidad chilenas (PDF417, QR del Registro
 * Civil, URLs oficiales, formato MRZ y texto directo).
 * 
 * 🛡️ PREVENCIÓN DE COLISIONES ("Se vuelve loco"):
 * Un código QR de cédula contiene entre 90 y 180 caracteres que una pistola
 * transmite en 150-300 ms. Si esos caracteres se dejan caer directamente en el
 * input de React, disparan 100+ re-renderizados por segundo, saltos de cursor y
 * textos concatenados corruptos.
 * Este módulo detecta ráfagas de hardware en < 45 ms, aisla las teclas del DOM,
 * decodifica el RUT completo y entrega un único resultado limpio.
 */

/**
 * Extrae y normaliza un RUT chileno a partir de cualquier lectura cruda de escáner.
 * 
 * Soporta:
 * 1. URLs oficiales del Registro Civil (portal.sidiv.registrocivil.cl)
 * 2. URLs corruptas por desfase de mapa de teclado (pistola US en Windows ES: _) ¡ ' / etc.)
 * 3. Parámetro explícito RUN= / RUT= / RUN:
 * 4. Formato MRZ de reverso de cédula (IDCHL / I<CHL)
 * 5. Cadenas con formato directo (12.345.678-9, 12345678-9, 12345678'9, 12345678K)
 * 6. Números directos sin guión (123456789)
 * 
 * @param {string} rawInput - Texto escaneado o ingresado
 * @returns {{ found: boolean, rut: string, formatted: string, clean: string, raw: string }}
 */
export const extractRutFromScan = (rawInput) => {
  if (!rawInput || typeof rawInput !== 'string') {
    return { found: false, rut: '', formatted: '', clean: '', raw: '' };
  }

  // 1. Limpiar caracteres de control no imprimibles (STX 0x02, ETX 0x03, NUL, saltos)
  let text = rawInput.replace(/[\x00-\x1F\x7F]/g, ' ').trim();

  try {
    text = decodeURIComponent(text);
  } catch {
    // Si no es URL-encoded válido se mantiene el texto original
  }

  // 2. Patrón RUN / RUT explícito (soporta URLs normales y corrupciones por teclado US en Windows ES)
  // Ejemplos:
  // ?RUN=12345678-9 | _RUN)12345678'9 | _RUN¡12345678'K | RUN=12345678'9 | RUN:12345678-9 | RUN12345678-9
  const runMatch = text.match(/(?:RUN|RUT)[^0-9kK]{0,4}([0-9]{1,2}(?:\.?[0-9]{3}){2}|[0-9]{7,8})[^0-9kK]?([0-9kK])(?![0-9kK])/i);
  if (runMatch && runMatch[1] && runMatch[2]) {
    const clean = validationService.cleanRut(runMatch[1] + runMatch[2]);
    if (clean.length >= 7 && clean.length <= 9) {
      const formatted = validationService.formatRut(clean);
      return {
        found: true,
        rut: formatted,
        formatted,
        clean,
        raw: text
      };
    }
  }

  // 3. Patrón MRZ de cédula chilena (IDCHL o I<CHL seguido de RUN y dígito)
  const mrzMatch = text.match(/(?:IDCHL|I<CHL|CHL)[^0-9]{0,2}([0-9]{7,8})[^0-9kK]?([0-9kK])/i);
  if (mrzMatch && mrzMatch[1] && mrzMatch[2]) {
    const clean = validationService.cleanRut(mrzMatch[1] + mrzMatch[2]);
    if (clean.length >= 7 && clean.length <= 9) {
      const formatted = validationService.formatRut(clean);
      return {
        found: true,
        rut: formatted,
        formatted,
        clean,
        raw: text
      };
    }
  }

  // 4. Patrón directo con separador guión, apóstrofe (shift de guión en teclado US), slash o punto
  // Ej: 12.345.678-9 | 12345678-9 | 12345678'9 | 12345678/9
  const dashMatch = text.match(/(?:^|[^0-9kK])([0-9]{1,2}(?:\.[0-9]{3}){2}|[0-9]{7,8})[-'\/]([0-9kK])(?![0-9kK])/i);
  if (dashMatch && dashMatch[1] && dashMatch[2]) {
    const clean = validationService.cleanRut(dashMatch[1] + dashMatch[2]);
    if (clean.length >= 7 && clean.length <= 9) {
      const formatted = validationService.formatRut(clean);
      return {
        found: true,
        rut: formatted,
        formatted,
        clean,
        raw: text
      };
    }
  }

  // 5. Patrón directo terminado en K sin guión (ej: 12345678K)
  const kMatch = text.match(/(?:^|[^0-9kK])([0-9]{7,8})([kK])(?![0-9kK])/i);
  if (kMatch && kMatch[1] && kMatch[2]) {
    const clean = validationService.cleanRut(kMatch[1] + kMatch[2]);
    if (clean.length >= 7 && clean.length <= 9) {
      const formatted = validationService.formatRut(clean);
      return {
        found: true,
        rut: formatted,
        formatted,
        clean,
        raw: text
      };
    }
  }

  // 6. Cadena limpia de solo dígitos (7 a 9 caracteres)
  const digitsMatch = text.match(/(?:^|[^0-9])([0-9]{7,9})(?:$|[^0-9])/);
  if (digitsMatch && digitsMatch[1]) {
    const clean = validationService.cleanRut(digitsMatch[1]);
    const stripped = clean.replace(/^0+/, '');
    if (stripped.length >= 7 && stripped.length <= 9) {
      const formatted = validationService.formatRut(stripped);
      return {
        found: true,
        rut: formatted,
        formatted,
        clean: stripped,
        raw: text
      };
    }
  }

  return {
    found: false,
    rut: text,
    formatted: text,
    clean: validationService.cleanRut(text),
    raw: text
  };
};

/**
 * Emite un breve tono auditivo (beep) agradable para confirmar la lectura del escáner.
 */
export const playScanBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // Silencioso si el navegador bloquea audio sin interacción previa
  }
};

/**
 * Hook personalizado para escuchar eventos de pistola de escáner (Keyboard Wedge HID).
 * 
 * 📌 MECANISMO DE CONTROL:
 * 1. Monitorea el intervalo entre pulsaciones de tecla en fase de captura (true).
 * 2. Si 2 o más teclas consecutivas llegan a < 50ms (velocidad de hardware), activa
 *    el modo de ráfaga y previene que el resto de los ~150 caracteres del QR
 *    se escriban en el input o disparen atajos del navegador.
 * 3. Finaliza la captura inmediatamente si llega Enter/Tab O si transcurren 65ms de silencio
 *    sin requerir obligatoriamente que la pistola tenga configurado sufijo Enter.
 * 4. Normaliza el RUT extraído y lo entrega a `onScan`.
 * 
 * @param {Object} options
 * @param {Function} options.onScan - Función callback al detectar un escaneo exitoso
 * @param {React.RefObject} [options.inputRef] - Referencia al input del buscador
 * @param {boolean} [options.enabled=true] - Si la escucha de escáner está activa
 * @param {number} [options.maxIntervalMs=50] - Intervalo máx entre teclas para considerarse pistola
 */
export const useBarcodeScanner = ({
  onScan,
  onBurstStart,
  inputRef,
  enabled = true,
  maxIntervalMs = 45
}) => {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const intervalsRef = useRef([]);
  const isBurstRef = useRef(false);
  const finishTimeoutRef = useRef(null);
  const preBurstValueRef = useRef('');

  useEffect(() => {
    if (!enabled) return;

    const finishScan = () => {
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
        finishTimeoutRef.current = null;
      }

      const rawBuffer = bufferRef.current.trim();
      const wasBurst = isBurstRef.current;
      const totalChars = rawBuffer.length;

      // Reseteamos el estado del búfer
      bufferRef.current = '';
      intervalsRef.current = [];
      isBurstRef.current = false;

      // Solo procesamos si hubo una ráfaga o si acumuló al menos 6 caracteres
      if (!wasBurst && totalChars < 6) {
        return;
      }

      const scanResult = extractRutFromScan(rawBuffer);

      if (typeof onScan === 'function') {
        onScan({
          ...scanResult,
          raw: rawBuffer
        });
      }

      // Si tenemos referencia al input, colocamos el RUT limpio y lo enfocamos
      if (inputRef?.current) {
        const valToSet = scanResult.found ? scanResult.formatted : rawBuffer;
        inputRef.current.value = valToSet;
        inputRef.current.focus();
      }
    };

    const handleKeyDown = (e) => {
      // Ignorar teclas modificadoras que no aportan caracteres al buffer
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
        return;
      }

      const now = Date.now();
      const interval = lastKeyTimeRef.current ? (now - lastKeyTimeRef.current) : 999;
      lastKeyTimeRef.current = now;

      // Si ha pasado más de 160ms desde la última tecla, es una pausa humana:
      // se reinicia el búfer para evitar mezclar textos
      if (interval > 160) {
        if (finishTimeoutRef.current) {
          clearTimeout(finishTimeoutRef.current);
          finishTimeoutRef.current = null;
        }
        preBurstValueRef.current = inputRef?.current ? inputRef.current.value : '';
        bufferRef.current = '';
        intervalsRef.current = [];
        isBurstRef.current = false;
      } else {
        intervalsRef.current.push(interval);

        // Si el intervalo entre teclas es ≤ maxIntervalMs (típico de pistola 5-30ms):
        // Confirmamos ráfaga de escáner inmediatamente desde la 2da tecla
        if (interval <= maxIntervalMs) {
          if (!isBurstRef.current) {
            isBurstRef.current = true;
            // Borramos inmediatamente cualquier carácter que haya entrado en la 1ra tecla (ej: 'h')
            if (inputRef?.current) {
              inputRef.current.value = preBurstValueRef.current;
            }
            if (typeof onBurstStart === 'function') {
              onBurstStart(preBurstValueRef.current);
            }
          }
        }
      }

      // Si se confirma que es una ráfaga de escáner en curso, BLOQUEAMOS el evento
      // para evitar que los 150+ caracteres del QR caigan en el input y vuelvan loca la UI
      if (isBurstRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Terminadores típicos de pistola: Enter o Tab
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (isBurstRef.current || bufferRef.current.length >= 6) {
          e.preventDefault();
          e.stopPropagation();
          finishScan();
          return;
        }
      }

      // Acumular caracteres imprimibles de longitud 1
      if (e.key && e.key.length === 1) {
        bufferRef.current += e.key;

        // Si estamos en ráfaga de escáner, programamos el cierre por silencio (debounce 65ms)
        // por si la pistola no envía Enter al final del QR
        if (isBurstRef.current) {
          if (finishTimeoutRef.current) {
            clearTimeout(finishTimeoutRef.current);
          }
          finishTimeoutRef.current = setTimeout(() => {
            finishScan();
          }, 65);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
      }
    };
  }, [enabled, onScan, inputRef, maxIntervalMs]);
};
