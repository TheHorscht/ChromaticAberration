let cbEnabled = document.getElementById("enabled");
let rbStatic = document.getElementById("rbStatic");
let rbWavy = document.getElementById("rbWavy");
let rbAdditive = document.getElementById("rbAdditive");
let rbSubtractive = document.getElementById("rbSubtractive");
let inputStrengthX = document.getElementById("strengthX");
let inputStrengthY = document.getElementById("strengthY");
let inputWaveSpeed = document.getElementById("waveSpeed");
let inputWaveStrength = document.getElementById("waveStrength");

chrome.storage.local.get(({ enabled, wavy, strengthX, strengthY, waveSpeed, waveStrength, additive }) => {
    cbEnabled.checked = enabled;
    inputStrengthX.value = strengthX;
    inputStrengthY.value = strengthY;
    inputWaveSpeed.value = waveSpeed;
    inputWaveStrength.value = waveStrength;
    if(wavy) {
        rbWavy.checked = true;
        panelWavy.dataset["show"] = true;
    } else {
        rbStatic.checked = true;
        panelStatic.dataset["show"] = true;
    }
    if(additive) {
        rbAdditive.checked = true;
    } else {
        rbSubtractive.checked = true;
    }
});

let panelStatic = document.getElementById("panelStatic");
let panelWavy = document.getElementById("panelWavy");
document.getElementById("rbStatic").addEventListener("input", ev => {
    panelStatic.dataset["show"] = true;
    panelWavy.dataset["show"] = false;
    saveSetting("wavy", false);
});
document.getElementById("rbWavy").addEventListener("input", ev => {
    panelStatic.dataset["show"] = false;
    panelWavy.dataset["show"] = true;
    saveSetting("wavy", true);
});

document.getElementById("rbAdditive").addEventListener("input", ev => {
    saveSetting("additive", true);
});
document.getElementById("rbSubtractive").addEventListener("input", ev => {
    saveSetting("additive", false);
});

bindInput(cbEnabled, "enabled");
bindInput(inputStrengthX, "strengthX");
bindInput(inputStrengthY, "strengthY");
bindInput(inputWaveSpeed, "waveSpeed");
bindInput(inputWaveStrength, "waveStrength");

function bindInput(element, setting) {
    let valueProperty;
    if(element.type === "checkbox") {
        valueProperty = "checked";
    } else if(element.type === "number") {
        valueProperty = "value";
    } else if(element.type === "range") {
        valueProperty = "value";
    }
    function handler(ev) {
        let value = ev.target[valueProperty];
        saveSetting(setting, value);
    }
    element.addEventListener("input", handler);
}

function saveSetting(setting, value) {
    chrome.storage.local.set({ [setting]: value });
    console.log(chrome.runtime.lastError);
    console.log(`Setting '${setting}' to ${value}.`);
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        console.log(tabs);
        if(tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, { command: "settingsChanged", setting, value });
        }
    });
}