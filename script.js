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
	let progress = [5, 7, 4].map(v => {
		let pingpong = createPingPongValue();
		return v2 => 0.008 + Math.cos(pingpong(v2 * v * 0.0005) * Math.PI * 2) * 0.004;
	});
	let lastFrameTime = Date.now();
	
	function loop() {
		let now = Date.now();
		let dt = (now - lastFrameTime ) / 1000;
		lastFrameTime = now;
		progress.forEach((func, i) => effect.turbu["freq"+(i+1)] = func(settings.waveSpeed * dt));
		effect.update();
		window.requestAnimationFrame(loop);
	}

	function setWaveStrength(value) {
		effect.displacement.scale1 = value * 4;
		effect.displacement.scale2 = value * 2;
		effect.displacement.scale3 = value;
		effect.update();
	}

	function setEffectStrength(x, y) {
		effect.offset.x1 = x;
		effect.offset.y1 = y;
		effect.offset.x3 = -x;
		effect.offset.y3 = -y;
		effect.update();
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
	return v => {
		if(typeof v === "number") {
			value += v * 0.5;
			if(value > 1) {
				value %= 1;
			} else if (value < 0) {
				value = 1 + (value % 1);
			}
		}
		return value < 0.5
		       ? value * 2
			   : 1 - ((value - 0.5) * 2);
	}	
}

async function initialize() {
	let svg = d3.select("body").append("svg")
			    .attr("xmlns", "http://www.w3.org/2000/svg")
			    .attr("width", "0")
			    .attr("height", "0")
	let defs = svg.append("defs");
	// Static Filter
	let filterStatic = defs.append("filter").attr("id", "filterStatic");
	let staticOffsets = Array(3).fill().map(() => filterStatic.append("feOffset"));
	staticOffsets.forEach((el, i) => {
		el.attr("dx", 0)
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
	// Wobbly Filter
	let filterWobbly = defs.append("filter").attr("id", "filterWobbly");
	let wobblyColorMatrices = Array(3).fill().map(() => filterWobbly.append("feColorMatrix"));
	wobblyColorMatrices.forEach((el, i) => {
		el.attr("values", matrices.rgb[i])
		  .attr("in", "SourceGraphic")
		  .attr("result", `separated${i}`)
	});
	let turbulences = Array(3).fill().map(() => filterWobbly.append("feTurbulence"));
	turbulences.forEach((el, i) => {
		el.attr("type", "fractalNoise") // turbulence or fractalNoise
		  .attr("baseFrequency", "0.008")
		  .attr("seed", i)
		  .attr("numOctaves", "4")
		  .attr("result", `turbu${i}`)
	});
	let dislpacementMaps = Array(3).fill().map(() => filterWobbly.append("feDisplacementMap"));
	dislpacementMaps.forEach((el, i) => {
		el.attr("scale", 5 + i * 5)
		.attr("xChannelSelector", "R")
		.attr("yChannelSelector", "G")
		  .attr("in", `separated${i}`)
		  .attr("in2", `turbu${i}`)
		  .attr("result", `displaced${i}`)
	});
	filterWobbly.append("feBlend")
		.attr("in", "displaced0")
		.attr("in2", "displaced1")
		.attr("result", "blendOne");
	filterWobbly.append("feBlend")
		.attr("in", "blendOne")
		.attr("in2", "displaced2");

	let effect = {
		offset: {},
		turbu: { freq1: 0, freq2: 0, freq3: 0 },
		displacement: { scale1: 0, scale2: 0, scale3: 0 },
		update: () => svg.attr("width", 0)
	};

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
	Object.defineProperties(effect.turbu, {
		freq1: createAccessors(turbulences[0], "baseFrequency"),
		freq2: createAccessors(turbulences[1], "baseFrequency"),
		freq3: createAccessors(turbulences[2], "baseFrequency"),
	});
	Object.defineProperties(effect.displacement, {
		scale1: createAccessors(dislpacementMaps[0], "scale"),
		scale2: createAccessors(dislpacementMaps[1], "scale"),
		scale3: createAccessors(dislpacementMaps[2], "scale"),
	});

	return effect;
}

applyChromaticAberration();