async function applyChromaticAberration() {
	function applyCorrectEffect(settings) {
		if(settings.enabled) {
			if(settings.wavy) {
				applyWavy();
			} else {
				applyStatic(settings.additive);
			}
		} else {
			removeEffect();
		}
	}
	let onChangeCallbacks = {
		enabled(value, settings) {
			applyCorrectEffect(settings);
		},
		wavy(value, settings) {
			applyCorrectEffect(settings);
		},
		strength(value) {
			setEffectStrength(value, 0);
		},
		additive(value, settings) {
			applyCorrectEffect(settings);
		}
	};

	let elements = await initialize();
	let progress = {};
	Array("r", "g", "b").forEach(key => progress[key] = createPingPongValue());
	
	function loop() {
		elements.turbu.r.setAttribute("baseFrequency", 0.005 + Math.cos(progress.r.value() * Math.PI * 2) * 0.005);
		elements.turbu.g.setAttribute("baseFrequency", 0.005 + Math.cos(progress.g.value() * Math.PI * 2) * 0.005);
		elements.turbu.b.setAttribute("baseFrequency", 0.005 + Math.cos(progress.b.value() * Math.PI * 2) * 0.005);
		progress.r.advance(0.0000152 * settings.waveSpeed);
		progress.g.advance(0.0000223 * settings.waveSpeed);
		progress.b.advance(0.0000117 * settings.waveSpeed);
		elements.svg.setAttribute("width", "0");
		window.requestAnimationFrame(loop);
	}

	function setEffectStrength(x, y) {
		elements.offset.r.setAttribute("dx", x);
		elements.offset.r.setAttribute("dy", y);
		elements.offset.b.setAttribute("dx", -x);
		elements.offset.b.setAttribute("dy", -y);

		elements.offset.rs.setAttribute("dx", x);
		elements.offset.rs.setAttribute("dy", y);
		elements.offset.bs.setAttribute("dx", -x);
		elements.offset.bs.setAttribute("dy", -y);

		elements.svg.setAttribute("width", "0");
	}

	let settings = await loadSettings(onChangeCallbacks);
	console.log(settings);
	
	chrome.runtime.onMessage.addListener(msg => {
		if(msg.command === "settingsChanged") {
			settings[msg.setting] = msg.value;
		}
	});
	window.requestAnimationFrame(loop);
}

function applyWavy() {
	document.body.classList.add("chromatic-aberration-wavy");
	document.body.classList.remove("chromatic-aberration");
	document.body.classList.remove("chromatic-aberration-subtractive");
}
function applyStatic(additive) {
	removeEffect();
	if(additive) {
		document.body.classList.add("chromatic-aberration");
	} else {
		document.body.classList.add("chromatic-aberration-subtractive");
	}
}
function removeEffect() {
	document.body.classList.remove("chromatic-aberration-wavy");
	document.body.classList.remove("chromatic-aberration");
	document.body.classList.remove("chromatic-aberration-subtractive");
}

function loadSettings(onChangeCallbacks) {
	// Defaults
	let privates = {
		enabled: true,
		wavy: false,
		strength: 3,
		waveSpeed: 50,
		additive: true
	};
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
					},
				});
				public[key] = storedSettings[key];
			}
			resolve(public);
		});
	});
};

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

async function initialize() {
	let response = await fetch(chrome.extension.getURL("chromatic-aberration.svg"));
	let svgFileContent = await response.text();
	let svgContainer = document.createElement("div");
	svgContainer.innerHTML = svgFileContent;
	let svg = svgContainer.querySelector("svg");
	document.body.appendChild(svgContainer);
	
	
	let turbuR = document.getElementById("turbuR");
	let turbuG = document.getElementById("turbuG");
	let turbuB = document.getElementById("turbuB");
	
	let offsetRed = document.getElementById("chromatic-aberration-offset-red");
	let offsetGreen = document.getElementById("chromatic-aberration-offset-green");
	let offsetBlue = document.getElementById("chromatic-aberration-offset-blue");

	let offsetRedSubtractive = document.getElementById("chromatic-aberration-subtractive-offset-red");
	let offsetGreenSubtractive = document.getElementById("chromatic-aberration-subtractive-offset-green");
	let offsetBlueSubtractive = document.getElementById("chromatic-aberration-subtractive-offset-blue");
	
	return {
		svg,
		turbu: {
			r: turbuR,
			g: turbuG,
			b: turbuB
		},
		offset: {
			r: offsetRed,
			g: offsetGreen,
			b: offsetBlue,
			rs: offsetRedSubtractive,
			gs: offsetGreenSubtractive,
			bs: offsetBlueSubtractive
		}
	};
}

applyChromaticAberration();