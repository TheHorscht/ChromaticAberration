async function applyChromaticAberration() {
	let settings = await getSettings();
	if(!settings.enabled) {
		return;
	}
	let response = await fetch(chrome.extension.getURL("chromatic-aberration.svg"));
	let svgFileContent = await response.text();
	let svgContainer = document.createElement("div");
	svgContainer.innerHTML = svgFileContent;
	document.body.appendChild(svgContainer);
	if(settings.wavy) {
		document.body.style += ";filter:url(#chromatic-aberration-with-waves);";
	} else {
		let feOffsets = document.querySelectorAll("#chromatic-aberration feOffset");
		feOffsets[0].setAttribute("dx", -settings.strength);
		feOffsets[2].setAttribute("dx", settings.strength);
		
		document.body.style += ";filter:url(#chromatic-aberration);";
	}

	let progress = {
		r: createPingPongValue(),
		g: createPingPongValue(),
		b: createPingPongValue()
	}
	let svg = document.getElementById("chromatic-aberration-effects");
	let turbuR = document.querySelector("#turbuR");
	let turbuG = document.querySelector("#turbuG");
	let turbuB = document.querySelector("#turbuB");
	function createPingPongValue() {
		let value = 0;
		let dir = 1;
		return {
			value() {
				return value;
			},
			advance(t) {
				value += t * dir;
				if(value > 1 || value < 0) {
					dir *= -1;
				}
			}
		};
	}
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
		console.log(svg);
		
		let offsetRed = svg.getElementById("chromatic-aberration-offset-red");
		let offsetBlue = svg.getElementById("chromatic-aberration-offset-blue");
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
				let feOffsets = document.querySelectorAll("#chromatic-aberration feOffset");
				let svg = svgContainer.querySelector("svg");
				console.log(msg, feOffsets, svg);
				if(msg.value === true) {
					setEffectStrength(svg, settings.strength, 0);
				} else {
					setEffectStrength(svg, 0, 0);
				}
			} else if(msg.setting === "wavy") {
				settings.waveSpeed = msg.value;
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