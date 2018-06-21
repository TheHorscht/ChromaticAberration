async function applyChromaticAberration() {
	let loadSettings = (onChangeCallbacks) => {
		// Defaults
		let privates = {
			enabled: true,
			wavy: false,
			strength: 3,
			waveSpeed: 50
		};;
		let public = {};

		return new Promise(resolve => {
			chrome.storage.local.get(storedSettings => {
				for(let key in storedSettings) {
					if(!(key in privates)) continue;
					Object.defineProperty(public, key, {
						get: () => privates[key],
						set: value => {
							privates[key] = value;
							if(key in onChangeCallbacks) {
								onChangeCallbacks[key](value, public);
							}
							// console.log(`Setting ${key} to ${value}`);
						},
					});
					public[key] = storedSettings[key];
				}
				resolve(public);
			});
		});
	};

	let onChangeCallbacks = {
		enabled(value, settings) {
			if(value) {
				if(settings.wavy) {
					applyWavy();
				} else {
					applyStatic();
				}
			} else {
				removeEffect();
			}
		},
		wavy(value) {
			if(value) {
				applyWavy();
			} else {
				applyStatic();
			}
		},
		strength(value) {
			setEffectStrength(value, 0);
		}
	};

	let response = await fetch(chrome.extension.getURL("chromatic-aberration.svg"));
	let svgFileContent = await response.text();
	let svgContainer = document.createElement("div");
	svgContainer.innerHTML = svgFileContent;
	let svg = svgContainer.querySelector("svg");
	document.body.appendChild(svgContainer);

	function applyWavy() {
		document.body.classList.add("chromatic-aberration-wavy");
		document.body.classList.remove("chromatic-aberration");
	}
	function applyStatic() {
		document.body.classList.remove("chromatic-aberration-wavy");
		document.body.classList.add("chromatic-aberration");
	}
	function removeEffect() {
		document.body.classList.remove("chromatic-aberration-wavy");
		document.body.classList.remove("chromatic-aberration");
	}

	let progress = {};
	Array("r", "g", "b").forEach(key => progress[key] = createPingPongValue());
	let turbuR = document.getElementById("turbuR");
	let turbuG = document.getElementById("turbuG");
	let turbuB = document.getElementById("turbuB");
	function loop() {
		turbuR.setAttribute("baseFrequency", 0.005 + Math.cos(progress.r.value() * Math.PI * 2) * 0.005);
		turbuG.setAttribute("baseFrequency", 0.005 + Math.cos(progress.g.value() * Math.PI * 2) * 0.005);
		turbuB.setAttribute("baseFrequency", 0.005 + Math.cos(progress.b.value() * Math.PI * 2) * 0.005);
		progress.r.advance(0.0000152 * settings.waveSpeed);
		progress.g.advance(0.0000223 * settings.waveSpeed);
		progress.b.advance(0.0000117 * settings.waveSpeed);
		svg.setAttribute("width", "0");
		window.requestAnimationFrame(loop);
	}

	function setEffectStrength(x, y) {
		let offsetRed = document.getElementById("chromatic-aberration-offset-red");
		let offsetBlue = document.getElementById("chromatic-aberration-offset-blue");
		offsetRed.setAttribute("dx", x);
		offsetRed.setAttribute("dy", y);
		offsetBlue.setAttribute("dx", -x);
		offsetBlue.setAttribute("dy", -y);
		svg.setAttribute("width", "0");
	}

	chrome.runtime.onMessage.addListener(msg => {
		if(msg.command === "settingsChanged") {
			settings[msg.setting] = msg.value;
		}
	});
	let settings = await loadSettings(onChangeCallbacks);
	window.requestAnimationFrame(loop);
}

applyChromaticAberration();

function createPingPongValue() {
	let value = 0, dir = 1;
	return {
		value: () => value,
		advance(t) {
			value += t * dir;
			if(value > 1 || value < 0) {
				dir *= -1;
			}
		}
	};
}