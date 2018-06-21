let cbEnabled = document.getElementById("enabled");
let cbWavy = document.getElementById("wavy");
let inputStrength = document.getElementById("strength");
let inputWaveSpeed = document.getElementById("waveSpeed");

chrome.storage.local.get(({ enabled, wavy, strength, waveSpeed }) => {
    cbEnabled.checked = enabled;
    cbWavy.checked = wavy;
    inputStrength.value = strength;
    inputWaveSpeed.value = waveSpeed;
});

bindInput(cbEnabled, "enabled");
bindInput(cbWavy, "wavy");
bindInput(inputStrength, "strength");
bindInput(inputWaveSpeed, "waveSpeed");

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
        chrome.storage.local.set({ [setting]: value });
        console.log(`Setting '${setting}' to ${value}.`);
        //chrome.tabs.get.sendMessage("boopy", "hello");
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            // chrome.tabs.sendMessage(tabs[0].id, "Hello!", object options, function responseCallback);
            chrome.tabs.sendMessage(tabs[0].id, { command: "settingsChanged", setting, value });
        });
    }
    element.addEventListener("input", handler);
}