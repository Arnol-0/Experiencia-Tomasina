import { useEffect, useRef } from 'react';
import { validationService } from '../services/validationService';

/**
 * ============================================================================
 * UTILIDAD: scanner.js (Soporte para Pistola de Escáner y Cédulas Chilenas)
 * ============================================================================
 * 
 * 📌 RESPONSABILIDAD (SRP):
 * Centraliza la detección de pistolas de código de barras (emulación de teclado HID)
 * y la extracción/normalización de RUTs desde códigos de barras de cédulas de
 * identidad chilenas (PDF417, QR del Registro Civil, URLs y texto plano).
 */

/**
 * Extrae y normaliza un RUT chileno a partir de cualquier lectura cruda de escáner.
 * 
 * Soporta los siguientes formatos de cédula chilena:
 * 1. URL oficial del Registro Civil:
 *    https://portal.sidiv.registrocivil.cl/docstatus?RUN=12345678-9&type=CEDULA...
 * 2. Parámetro explícito:
 *    RUN=12345678-9 | RUN: 12.345.678-9 | RUT=12345678-9
 * 3. Formato MRZ de cédula (reverso):
 *    IDCHL12345678<9<<<<<<<< | I<CHL123456789<<<<
 * 4. Formato directo con o sin puntos/guión:
 *    12.345.678-9 | 12345678-9 | 12345678K | 123456789
 * 5. Formato con ceros iniciales (algunas configuraciones de pistola):
 *    0012345678-9 | 0123456789
 * 
 * @param {string} rawInput - Texto escaneado o ingresado
 * @returns {{ found: boolean, rut: string, formatted: string, clean: string, raw: string }}
 */
export const extractRutFromScan = (rawInput) => {
  if (!rawInput || typeof rawInput !== 'string') {
    return { found: false, rut: '', formatted: '', clean: '', raw: '' };
  }

  const text = rawInput.trim();

  // 1. Patrón URL del Registro Civil chileno (?RUN=... o &RUN=...)
  const urlMatch = text.match(/[?&]RUN=([0-9kK.-]+)/i);
  if (urlMatch && urlMatch[1]) {
    const clean = validationService.cleanRut(urlMatch[1]);
    if (clean.length >= 7 && clean.length <= 9) {
      return {
        found: true,
        rut: validationService.formatRut(clean),
        formatted: validationService.formatRut(clean),
        clean,
        raw: text
      };
    }
  }

  // 2. Parámetro explícito RUN= / RUT= / RUN:
  const runKeyMatch = text.match(/(?:RUN|RUT)[:=\s]+([0-9kK.-]+)/i);
  if (runKeyMatch && runKeyMatch[1]) {
    const clean = validationService.cleanRut(runKeyMatch[1]);
    if (clean.length >= 7 && clean.length <= 9) {
      return {
        found: true,
        rut: validationService.formatRut(clean),
        formatted: validationService.formatRut(clean),
        clean,
        raw: text
      };
    }
  }

  // 3. Patrón MRZ de cédula chilena (IDCHL / I<CHL seguido del número)
  const mrzMatch = text.match(/(?:IDCHL|I<CHL|CHL)([0-9]{7,9})/i);
  if (mrzMatch && mrzMatch[1]) {
    const clean = validationService.cleanRut(mrzMatch[1]);
    if (clean.length >= 7 && clean.length <= 9) {
      return {
        found: true,
        rut: validationService.formatRut(clean),
        formatted: validationService.formatRut(clean),
        clean,
        raw: text
      };
    }
  }

  // 4. Patrón directo con guión (ej: 12.345.678-9 o 12345678-9) dentro del texto
  const dashMatch = text.match(/([0-9]{1,2}(?:\.[0-9]{3}){2}-[0-9kK]|[0-9]{7,8}-[0-9kK])/i);
  if (dashMatch && dashMatch[1]) {
    const clean = validationService.cleanRut(dashMatch[1]);
    if (clean.length >= 7 && clean.length <= 9) {
      return {
        found: true,
        rut: validationService.formatRut(clean),
        formatted: validationService.formatRut(clean),
        clean,
        raw: text
      };
    }
  }

  // 5. Cadena limpia de solo dígitos y K (longitud típica 7 a 9 caracteres)
  const cleanOnly = validationService.cleanRut(text);
  const strippedZeros = cleanOnly.replace(/^0+/, '');
  if (strippedZeros.length >= 7 && strippedZeros.length <= 9) {
    return {
      found: true,
      rut: validationService.formatRut(strippedZeros),
      formatted: validationService.formatRut(strippedZeros),
      clean: strippedZeros,
      raw: text
    };
  }

  return { 
    found: false, 
    rut: text, 
    formatted: text, 
    clean: cleanOnly, 
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
    osc.frequency.setValueAtTime(920, ctx.currentTime); // Tono claro y agradable
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // Si el navegador tiene políticas de audio pendientes, se ignora silenciosamente
  }
};

/**
 * Hook personalizado para escuchar eventos de una pistola de escáner de código de barras.
 * 
 * 📌 CARACTERÍSTICAS:
 * - Detecta ráfagas de teclado rápidas emitidas por pistolas lectoras HID (< 60ms entre caracteres).
 * - Funciona tanto si el buscador tiene el foco como si no lo tiene.
 * - Evita colisiones cuando el usuario está escribiendo manualmente en otros campos de texto.
 * 
 * @param {Object} options
 * @param {Function} options.onScan - Función callback al detectar un escaneo exitoso
 * @param {React.RefObject} [options.inputRef] - Referencia al input del buscador para enfocarlo
 * @param {boolean} [options.enabled=true] - Si la escucha de escáner está activa
 * @param {number} [options.maxIntervalMs=65] - Tiempo máximo entre caracteres para ser considerado escáner
 */
export const useBarcodeScanner = ({
  onScan,
  inputRef,
  enabled = true,
  maxIntervalMs = 65
}) => {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const intervalsRef = useRef([]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Ignorar teclas modificadoras
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        return;
      }

      const now = Date.now();
      const interval = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Si ha pasado mucho tiempo desde la última tecla, reiniciamos el búfer
      if (interval > 250) {
        bufferRef.current = '';
        intervalsRef.current = [];
      } else {
        intervalsRef.current.push(interval);
      }

      // Al recibir Enter (cierre estándar de toda pistola de escáner)
      if (e.key === 'Enter') {
        const fullBuffer = bufferRef.current.trim();
        const intervals = intervalsRef.current;
        const avgInterval = intervals.length > 0
          ? intervals.reduce((a, b) => a + b, 0) / intervals.length
          : 999;

        // Comprobamos si el contenido analizado corresponde a una cédula o si fue una ráfaga de escáner
        const scanResult = extractRutFromScan(fullBuffer);
        const isScannerSpeed = intervals.length >= 5 && avgInterval <= maxIntervalMs;
        const isRecognizedCarnet = scanResult.found && fullBuffer.length >= 7;

        if (isScannerSpeed || isRecognizedCarnet) {
          // Es un escaneo verificado
          e.preventDefault();
          e.stopPropagation();

          if (typeof onScan === 'function') {
            onScan({
              ...scanResult,
              raw: fullBuffer,
              avgInterval
            });
          }

          // Enfocar el input si fue proporcionado
          if (inputRef?.current) {
            inputRef.current.focus();
          }

          bufferRef.current = '';
          intervalsRef.current = [];
          return;
        }

        // Si no fue escáner, reiniciamos el búfer
        bufferRef.current = '';
        intervalsRef.current = [];
        return;
      }

      // Si es un carácter imprimible (longitud 1), lo acumulamos en el búfer
      if (e.key && e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, onScan, inputRef, maxIntervalMs]);
};

