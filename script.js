async function applyChromaticAberration() {
	let settings = (() => {
		let enabled = true;
		let wavy = false;
		let strength = 3;
		let waveSpeed = 50;
		return {
			load: () => new Promise((resolve, reject) => {
				chrome.storage.local.get(({ enabled, wavy, strength, waveSpeed }) => {
					// resolve({ enabled, wavy, strength, waveSpeed });
					this.enabled = enabled;
					this.wavy = wavy;
					this.strength = strength;
					this.waveSpeed = waveSpeed;
					resolve();
				});
			}),
			get enabled() { return enabled; },
			set enabled(newValue) {
				enabled = newValue;
				if(enabled) {
					if(wavy) {
						applyWavy();
					} else {
						applyStatic();
					}
				} else {
					removeEffect();
				}
			},
			get wavy() { return wavy; },
			set wavy(newValue) {
				wavy = newValue;
				if(!enabled) return;
				if(wavy) {
					applyWavy();
				} else {
					applyStatic();
				}
			},
			get waveSpeed() { return waveSpeed; },
			set waveSpeed(newValue) {
				waveSpeed = newValue;
			},
			get strength() { return strength; },
			set strength(newValue) {
				strength = newValue;
				setEffectStrength(svg, strength, 0);
			}
		}
	})();
	let response = await fetch(chrome.extension.getURL("chromatic-aberration.svg"));
	let svgFileContent = await response.text();
	let svgContainer = document.createElement("div");
	svgContainer.innerHTML = svgFileContent;
	let svg = svgContainer.querySelector("svg");
	document.body.appendChild(svgContainer);
	await settings.load();
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
			settings[msg.setting] = msg.value;
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