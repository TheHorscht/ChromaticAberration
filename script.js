async function applyChromaticAberration() {
	function applyCorrectEffect(settings) {
		if(settings.enabled) {
			if(settings.wavy) {
				applyWavy(settings.additive);
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
		},
		waveStrength(value) {
			setWaveStrength(value);
		}
	};

	let elements = await initialize();
	let progress = {};
	Array("r", "g", "b").forEach(key => progress[key] = createPingPongValue());
	
	function loop() {
		elements.turbu.r.setAttribute("baseFrequency", 0.008 + Math.cos(progress.r.value() * Math.PI * 2) * 0.004);
		elements.turbu.g.setAttribute("baseFrequency", 0.008 + Math.cos(progress.g.value() * Math.PI * 2) * 0.004);
		elements.turbu.b.setAttribute("baseFrequency", 0.008 + Math.cos(progress.b.value() * Math.PI * 2) * 0.004);
		elements.turbu.c.setAttribute("baseFrequency", 0.008 + Math.cos(progress.r.value() * Math.PI * 2) * 0.004);
		elements.turbu.m.setAttribute("baseFrequency", 0.008 + Math.cos(progress.g.value() * Math.PI * 2) * 0.004);
		elements.turbu.y.setAttribute("baseFrequency", 0.008 + Math.cos(progress.b.value() * Math.PI * 2) * 0.004);
		progress.r.advance(0.0000152 * settings.waveSpeed);
		progress.g.advance(0.0000223 * settings.waveSpeed);
		progress.b.advance(0.0000117 * settings.waveSpeed);
		elements.svg.setAttribute("width", "0");
		window.requestAnimationFrame(loop);
	}

	function setWaveStrength(value) {
		elements.displacement.r.setAttribute("scale", value * 4);
		elements.displacement.g.setAttribute("scale", value * 2);
		elements.displacement.b.setAttribute("scale", value);
		elements.displacement.c.setAttribute("scale", value * 4);
		elements.displacement.m.setAttribute("scale", value * 2);
		elements.displacement.y.setAttribute("scale", value);
	}

	function setEffectStrength(x, y) {
		elements.offset.r.setAttribute("dx", x);
		elements.offset.r.setAttribute("dy", y);
		elements.offset.b.setAttribute("dx", -x);
		elements.offset.b.setAttribute("dy", -y);

		elements.offset.c.setAttribute("dx", x);
		elements.offset.c.setAttribute("dy", y);
		elements.offset.y.setAttribute("dx", -x);
		elements.offset.y.setAttribute("dy", -y);

		elements.svg.setAttribute("width", "0");
	}

	let settings = await loadSettings(onChangeCallbacks);	
	chrome.runtime.onMessage.addListener(msg => {
		if(msg.command === "settingsChanged") {
			settings[msg.setting] = msg.value;
		}
	});
	window.requestAnimationFrame(loop);
}

function applyWavy(additive) {
	removeEffect();
	if(additive) {
		document.body.classList.add("chromatic-aberration-wavy");		
	} else {
		document.body.classList.add("chromatic-aberration-wavy-subtractive");
	}
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
	document.body.classList.remove("chromatic-aberration-wavy-subtractive");
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
		waveStrength: 5,
		additive: false
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
	let turbuC = document.getElementById("turbuC");
	let turbuM = document.getElementById("turbuM");
	let turbuY = document.getElementById("turbuY");

	let displacementR = document.getElementById("displacementR");
	let displacementG = document.getElementById("displacementG");
	let displacementB = document.getElementById("displacementB");
	let displacementC = document.getElementById("displacementC");
	let displacementM = document.getElementById("displacementM");
	let displacementY = document.getElementById("displacementY");
	
	let offsetRed = document.getElementById("chromatic-aberration-offset-red");
	let offsetGreen = document.getElementById("chromatic-aberration-offset-green");
	let offsetBlue = document.getElementById("chromatic-aberration-offset-blue");
	let offsetCyan = document.getElementById("chromatic-aberration-subtractive-offset-cyan");
	let offsetMagenta = document.getElementById("chromatic-aberration-subtractive-offset-magenta");
	let offsetYellow = document.getElementById("chromatic-aberration-subtractive-offset-yellow");
	
	return {
		svg,
		turbu: {
			r: turbuR,
			g: turbuG,
			b: turbuB,
			c: turbuC,
			m: turbuM,
			y: turbuY
		},
		displacement: {
			r: displacementR,
			g: displacementG,
			b: displacementB,
			c: displacementC,
			m: displacementM,
			y: displacementY
		},
		offset: {
			r: offsetRed,
			g: offsetGreen,
			b: offsetBlue,
			c: offsetCyan,
			m: offsetMagenta,
			y: offsetYellow
		}
	};
}

applyChromaticAberration();