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
		strengthX(value, settings) {
			setEffectStrength(value, settings.strengthY);
		},
		strengthY(value, settings) {
			setEffectStrength(settings.strengthX, value);
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
		document.body.classList.add("chromatic-aberration-filter-wavy");		
	} else {
		document.body.classList.add("chromatic-aberration-filter-wavy-subtractive");
	}
}
function applyStatic(additive) {
	removeEffect();
	if(additive) {
		document.body.classList.add("chromatic-aberration-filter");
	} else {
		document.body.classList.add("chromatic-aberration-filter-subtractive");
	}
}
function removeEffect() {
	document.body.classList.remove("chromatic-aberration-filter-wavy");
	document.body.classList.remove("chromatic-aberration-filter-wavy-subtractive");
	document.body.classList.remove("chromatic-aberration-filter");
	document.body.classList.remove("chromatic-aberration-filter-subtractive");
}

function loadSettings(onChangeCallbacks) {
	// Defaults
	let privates = {
		enabled: true,
		wavy: false,
		additive: false,
		strengthX: 3,
		strengthY: 0,
		waveSpeed: 50,
		waveStrength: 5,
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

	return {
		svg,
		turbu: {
			r: document.getElementById("chromaticAberrationTurbuR"),
			g: document.getElementById("chromaticAberrationTurbuG"),
			b: document.getElementById("chromaticAberrationTurbuB"),
			c: document.getElementById("chromaticAberrationTurbuC"),
			m: document.getElementById("chromaticAberrationTurbuM"),
			y: document.getElementById("chromaticAberrationTurbuY")
		},
		displacement: {
			r: document.getElementById("chromaticAberrationDisplacementR"),
			g: document.getElementById("chromaticAberrationDisplacementG"),
			b: document.getElementById("chromaticAberrationDisplacementB"),
			c: document.getElementById("chromaticAberrationDisplacementC"),
			m: document.getElementById("chromaticAberrationDisplacementM"),
			y: document.getElementById("chromaticAberrationDisplacementY")
		},
		offset: {
			r: document.getElementById("chromaticAberrationOffsetRed"),
			g: document.getElementById("chromaticAberrationOffsetGreen"),
			b: document.getElementById("chromaticAberrationOffsetBlue"),
			c: document.getElementById("chromaticAberrationOffsetCyan"),
			m: document.getElementById("chromaticAberrationOffsetMagenta"),
			y: document.getElementById("chromaticAberrationOffsetYellow")
		}
	};
}

applyChromaticAberration();