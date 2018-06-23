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

	let elements = await initialize();
	let progress = {};
	Array("r", "g", "b").forEach(key => progress[key] = createPingPongValue());
	
	function loop() {
		let shit = settings.waveSpeed;
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
	let svg, defs;
	let namespace = 'http://www.w3.org/2000/svg';

	svg = d3.select('body').append('svg')
			.attr("xmlns", "namespace")
			.attr("width", "0")
			.attr("height", "0")
	defs = svg.append('defs');
	let filterStatic = u('<filter>').attr("id", "filterStatic");
	let staticOffsets = Array(3).fill().map(() => u(document.createElementNS(namespace, "feOffset")));
	staticOffsets.forEach((el, i) => el.attr({
		dx: 5* i, dy: 0,
		in: "SourceGraphic", result: `offset${i}` }));
	filterStatic.append(_ => _, staticOffsets);
	let staticColorMatrices = Array(3).fill().map(() => u(document.createElementNS(namespace, "feColorMatrix")));
	let matrices = ["1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0", "0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0", "0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"];
	staticColorMatrices.forEach((el, i) => el.attr({
		values: matrices[i],
		in: `offset${i}`, result: `separated${i}` }));
	filterStatic.append(_ => _, staticColorMatrices);
	let blendOne = u(document.createElementNS(namespace, "feBlend")).attr({
		in: "separated0", in2: "separated1",
		result: "blendOne" });
	let blendTwo = u(document.createElementNS(namespace, "feBlend")).attr({ in: "blendOne", in2: "separated2" });
	filterStatic.append(blendOne);
	filterStatic.append(blendTwo);
	defs.append(filterStatic);

	let result = {
		turbu: {},
		offset: {},
	};
	// ( ͡° ͜ʖ ͡°) Impressed?
	let proto = u().__proto__;
	let createAccessors = (el, attr) => {
		let umbrellaAttr = proto.attr.bind(el, attr);
		return { get: umbrellaAttr, set: umbrellaAttr };
	};
	Object.defineProperties(result.offset, {
		c1x: createAccessors(staticOffsets[0], "dx"),
		c2x: createAccessors(staticOffsets[1], "dx"),
		c3x: createAccessors(staticOffsets[2], "dx")
	});
	// Dont forget to set dx etc
/* 	result.offset.c1x = 0;
	result.offset.c1x = 0;
	result.offset.c1x = 0; */

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