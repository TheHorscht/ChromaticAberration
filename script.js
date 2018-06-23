async function applyChromaticAberration() {
	function applyCorrectEffect(enabled, wavy, additive) {
		if(enabled) {
			if(wavy) {
				applyWavy(additive);
			} else {
				applyStatic(additive);
			}
		} else {
			removeEffect();
		}
	}
	let onChangeCallbacks = {
		enabled(value, settings) {
			applyCorrectEffect(settings.enabled, settings.wavy, settings.additive);
		},
		wavy(value, settings) {
			applyCorrectEffect(settings.enabled, settings.wavy, settings.additive);
		},
		strengthX(value, settings) {
			setEffectStrength(value, settings.strengthY);
		},
		strengthY(value, settings) {
			setEffectStrength(settings.strengthX, value);
		},
		additive(value, settings) {
			applyCorrectEffect(settings.enabled, settings.wavy, settings.additive);
		},
		waveStrength(value) {
			setWaveStrength(value);
		}
	};

	let effect = await initialize();
	let progress = {};
	Array("r", "g", "b").forEach(key => progress[key] = createPingPongValue());
	
	function loop() {
		let shit = settings.waveSpeed;
		effect.turbu.freq1 = 0.008 + Math.cos(progress.r.value() * Math.PI * 2) * 0.004;
		effect.turbu.freq2 = 0.008 + Math.cos(progress.g.value() * Math.PI * 2) * 0.004;
		effect.turbu.freq3 = 0.008 + Math.cos(progress.b.value() * Math.PI * 2) * 0.004;
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
	applyCorrectEffect(settings.enabled, settings.wavy, settings.additive);
	setWaveStrength(settings.waveStrength);
	setEffectStrength(settings.strengthX, settings.strengthY);
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
	let privates = {};
	let public = {};
	return new Promise(resolve => {
		chrome.storage.local.get(storedSettings => {
			for(let key in storedSettings) {
				Object.defineProperty(public, key, {
					get: () => privates[key],
					set: value => {
						privates[key] = value;
						if(key in onChangeCallbacks) {
							onChangeCallbacks[key](value, public);
						}
					},
				});
				privates[key] = storedSettings[key];
			}
			resolve(public);
		});
	});
};

function createPingPongValue() {
	let value = 0;
	return Object.defineProperties({}, {
		value: {
			get: () => value < 0.5
					   ? value * 2
					   : 1 - ((value - 0.5) * 2),
		},
		advance: {
			value: v => {
				value += v * 0.5;
				if(value > 1) {
					value %= 1;
				} else if (value < 0) {
					value = 1 + (value % 1);
				}
			}
		}
	});
}

async function initialize() {
	let svg = d3.select("body").append("svg")
			    .attr("xmlns", "http://www.w3.org/2000/svg")
			    .attr("width", "0")
			    .attr("height", "0")
	let defs = svg.append("defs");
	let filterStatic = defs.append("filter").attr("id", "filterStatic");
	let staticOffsets = Array(3).fill().map(() => filterStatic.append("feOffset"));
	staticOffsets.forEach((el, i) => {
		el.attr("dx", 5 * i)
		  .attr("dy", 0)
		  .attr("in", "SourceGraphic")
		  .attr("result", `offset${i}`)
	});
	let staticColorMatrices = Array(3).fill().map(() => filterStatic.append("feColorMatrix"));
	let matrices = {
		rgb: ["1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0",
			  "0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0",
			  "0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"],
		cmy: ["1 0 0 0 0 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0",
			  "0 0 0 0 1 0 1 0 0 0 0 0 0 0 1 0 0 0 1 0",
			  "0 0 0 0 1 0 0 0 0 1 0 0 1 0 0 0 0 0 1 0"]
	};
	staticColorMatrices.forEach((el, i) => {
		el.attr("values", matrices.rgb[i])
		  .attr("in", `offset${i}`)
		  .attr("result", `separated${i}`)
	});
	filterStatic.append("feBlend")
		.attr("in", "separated0")
		.attr("in2", "separated1")
		.attr("result", "blendOne");
	filterStatic.append("feBlend")
		.attr("in", "blendOne")
		.attr("in2", "separated2");

	let effect = {
		offset: {},
		turbu: { freq1: 0, freq2: 0, freq3: 0 },
		displacement: { scale1: 0, scale2: 0, scale3: 0 },
	};
	// ( ͡° ͜ʖ ͡°) Impressed?
	let attrFn = d3.select().__proto__.attr;
	let createAccessors = (el, attr) => {
		let ttr = attrFn.bind(el, attr);
		return { get: ttr, set: ttr };
	};
	Object.defineProperties(effect.offset, {
		x1: createAccessors(staticOffsets[0], "dx"),
		x2: createAccessors(staticOffsets[1], "dx"),
		x3: createAccessors(staticOffsets[2], "dx"),
		y1: createAccessors(staticOffsets[0], "dy"),
		y2: createAccessors(staticOffsets[1], "dy"),
		y3: createAccessors(staticOffsets[2], "dy"),
	});
/* 	Object.defineProperties(effect.turbu, {
		x1: createAccessors(staticOffsets[0], "baseFrequency"),
		x2: createAccessors(staticOffsets[1], "baseFrequency"),
		x3: createAccessors(staticOffsets[2], "baseFrequency"),
	}); */
	// Dont forget to set dx etc
/* 	effect.offset.c1x = 0;
	effect.offset.c1x = 0;
	effect.offset.c1x = 0; */

	return effect;
}

applyChromaticAberration();