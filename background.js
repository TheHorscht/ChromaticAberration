chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.local.set({
        enabled: true,
        wavy: false,
        additive: false,
        strengthX: 3,
        strengthY: 0,
        waveSpeed: 5,
        waveStrength: 5,
    });
});