import { flash } from "./flash";
import "./flash-log";
import "./flash-progress";
import type { FlashLog } from "./flash-log";
import type { FlashProgress } from "./flash-progress";
import type { InstallButton } from "./install-button";
import { State } from "./const";

interface FlashData {
  stateListenerAdded: boolean;
  logEl: FlashLog | undefined;
  progressEl: FlashProgress | undefined;
  improvEl: HTMLElement | undefined;
}

const getData = (button: InstallButton): FlashData => {
  if (!("_flashData" in button)) {
    (button as any)._flashData = {
      stateListenerAdded: false,
      logEl: undefined,
      progressEl: undefined,
      improvEl: undefined,
    } as FlashData;
  }

  return (button as any)._flashData as FlashData;
};

const addElement = <T extends HTMLElement>(
  button: InstallButton,
  element: T
): T => {
  button.renderRoot!.append(element);
  return element;
};

export const startFlash = async (button: InstallButton) => {
  if (button.hasAttribute("active")) {
    return;
  }

  const manifest = button.manifest || button.getAttribute("manifest");
  if (!manifest) {
    alert("No manifest defined!");
    return;
  }

  const data = getData(button);

  let hasImprov = false;

  if (!data.stateListenerAdded) {
    data.stateListenerAdded = true;
    button.addEventListener("state-changed", (ev) => {
      const state = (button.state = ev.detail);
      if (state.state === State.INITIALIZING) {
        button.toggleAttribute("active", true);
      } else if (state.state === State.MANIFEST && state.build?.improv) {
        hasImprov = true;
        // @ts-ignore
        // preload improv button
        import("https://www.improv-wifi.com/sdk-js/launch-button.js");
      } else if (state.state === State.FINISHED) {
        button.toggleAttribute("active", false);
        if (hasImprov) {
          startImprov(button);
        }
      } else if (state.state === State.ERROR) {
        button.toggleAttribute("active", false);
      }
      data.progressEl?.processState(ev.detail);
      data.logEl?.processState(ev.detail);
    });
  }

  const logConsole = button.logConsole || button.hasAttribute("log-console");
  const showLog = button.showLog || button.hasAttribute("show-log");
  const showProgress =
    !showLog &&
    button.hideProgress !== true &&
    !button.hasAttribute("hide-progress");

  if (showLog && !data.logEl) {
    data.logEl = addElement<FlashLog>(
      button,
      document.createElement("esp-web-flash-log")
    );
  } else if (!showLog && data.logEl) {
    data.logEl.remove();
    data.logEl = undefined;
  }

  if (showProgress && !data.progressEl) {
    data.progressEl = addElement<FlashProgress>(
      button,
      document.createElement("esp-web-flash-progress")
    );
  } else if (!showProgress && data.progressEl) {
    data.progressEl.remove();
    data.progressEl = undefined;
  }

  data.logEl?.clear();
  data.progressEl?.clear();
  data.improvEl?.classList.toggle("hidden", true);

  flash(
    button,
    logConsole
      ? console
      : {
          log: () => {},
          error: () => {},
          debug: () => {},
        },
    manifest,
    button.eraseFirst !== undefined
      ? button.eraseFirst
      : button.hasAttribute("erase-first")
  );
};

const startImprov = async (button: InstallButton) => {
  // @ts-ignore
  await import("https://www.improv-wifi.com/sdk-js/launch-button.js");

  const improvButtonConstructor = customElements.get(
    "improv-wifi-launch-button"
  );

  if (
    !improvButtonConstructor.isSupported ||
    !improvButtonConstructor.isAllowed
  ) {
    return;
  }

  const data = getData(button);

  if (!data.improvEl) {
    data.improvEl = document.createElement("improv-wifi-launch-button");
    data.improvEl.addEventListener("state-changed", (ev: any) => {
      if (ev.detail.state === "PROVISIONED") {
        data.improvEl!.classList.toggle("hidden", true);
      }
    });
    const improvButton = document.createElement("button");
    improvButton.slot = "activate";
    improvButton.textContent = "CLICK HERE TO FINISH SETTING UP YOUR DEVICE";
    data.improvEl.appendChild(improvButton);
    addElement(button, data.improvEl);
  }
  data.improvEl.classList.toggle("hidden", false);
};
