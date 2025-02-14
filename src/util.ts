import {
  CHIP_FAMILY_ESP32,
  CHIP_FAMILY_ESP32S2,
  CHIP_FAMILY_ESP8266,
  CHIP_FAMILY_ESP32C3,
  ESPLoader,
} from "esp-web-flasher";
import type { BaseFlashState } from "./const";

export const getChipFamilyName = (
  esploader: ESPLoader
): NonNullable<BaseFlashState["chipFamily"]> => {
  switch (esploader.chipFamily) {
    case CHIP_FAMILY_ESP32:
      return "ESP32";
    case CHIP_FAMILY_ESP8266:
      return "ESP8266";
    case CHIP_FAMILY_ESP32S2:
      return "ESP32-S2";
    case CHIP_FAMILY_ESP32C3:
      return "ESP32-C3";
    default:
      return "Unknown Chip";
  }
};

export const sleep = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));

export const fireEvent = <Event extends keyof HTMLElementEventMap>(
  eventTarget: EventTarget,
  type: Event,
  // @ts-ignore
  detail?: HTMLElementEventMap[Event]["detail"],
  options?: {
    bubbles?: boolean;
    cancelable?: boolean;
    composed?: boolean;
  }
): void => {
  options = options || {};
  const event = new CustomEvent(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed,
    detail,
  });
  eventTarget.dispatchEvent(event);
};
