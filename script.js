async function applyChromaticAberration() {
	let settings = await getSettings();
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

	function onEnabledChanged() {
		if(settings.enabled) {
			if(settings.wavy) {
				applyWavy();
			} else {
				applyStatic();
			}
		} else {
			removeEffect();
		}
	}

	function onWavyChanged() {
		if(!settings.enabled) return;
		if(settings.wavy) {
			applyWavy();
		} else {
			applyStatic();
		}
	}

	setEffectStrength(svg, settings.strength, 0);
	onEnabledChanged();

	let progress = {
		r: createPingPongValue(),
		g: createPingPongValue(),
		b: createPingPongValue()
	}
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

	function setEffectStrength(svg, x, y) {
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
			if(msg.setting === "strength") {
				setEffectStrength(svg, msg.value, 0);
			} else if(msg.setting === "waveSpeed") {
				settings.waveSpeed = msg.value;
			} else if(msg.setting === "enabled") {
				settings.enabled = msg.value;
				onEnabledChanged();
			} else if(msg.setting === "wavy") {
				settings.wavy = msg.value;
				onWavyChanged();
			}
		}
	});
	window.requestAnimationFrame(loop);
}

applyChromaticAberration();
// TODO: Make sure that on install some defaults get set.
function getSettings() {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(({ enabled, wavy, strength, waveSpeed }) => {
			resolve({ enabled, wavy, strength, waveSpeed });
		});
	});
}

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