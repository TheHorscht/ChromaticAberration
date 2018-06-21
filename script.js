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

	let beepR = 0;
	let beepG = 0;
	let beepB = 0;
	let svg = document.querySelector("svg");
	let turbuR = document.querySelector("#turbuR");
	let turbuG = document.querySelector("#turbuG");
	let turbuB = document.querySelector("#turbuB");
	let dirR = 1;
	let dirG = 1;
	let dirB = 1;
	function loop() {
		turbuR.setAttribute("baseFrequency", 0.005 + Math.cos(beepR * Math.PI * 2) * 0.005);
		turbuG.setAttribute("baseFrequency", 0.005 + Math.cos(beepG * Math.PI * 2) * 0.005);
		turbuB.setAttribute("baseFrequency", 0.005 + Math.cos(beepB * Math.PI * 2) * 0.005);
		beepR += 0.0000152 * settings.waveSpeed * dirR;
		beepG += 0.0000223 * settings.waveSpeed * dirG;
		beepB += 0.0000117 * settings.waveSpeed * dirB;
		if(beepR > 1 || beepR < 0) {
			dirR *= -1;
		}
		if(beepG > 1 || beepG < 0) {
			dirG *= -1;
		}
		if(beepB > 1 || beepB < 0) {
			dirB *= -1;
		}
		svg.setAttribute("width", "0");
		window.requestAnimationFrame(loop);
	}

	chrome.runtime.onMessage.addListener(msg => {
		if(msg.command === "settingsChanged") {
			if(msg.setting === "strength") {
				let feOffsets = document.querySelectorAll("#chromatic-aberration feOffset");
				feOffsets[0].setAttribute("dx", -msg.value);
				feOffsets[2].setAttribute("dx", msg.value);
				svgContainer.querySelector("svg").setAttribute("width", "0");
			} else if(msg.setting === "waveSpeed") {
				settings.waveSpeed = msg.value;
			} else if(msg.setting === "enabled") {
				let feOffsets = document.querySelectorAll("#chromatic-aberration feOffset");
				let svg = svgContainer.querySelector("svg");
				console.log(msg, feOffsets, svg);
				if(msg.value === true) {
					feOffsets[0].setAttribute("dx", -setting.strength);
					feOffsets[2].setAttribute("dx", setting.strength);
					svg.setAttribute("width", "0");
				} else {
					feOffsets[0].setAttribute("dx", 0);
					feOffsets[2].setAttribute("dx", 0);
					svg.setAttribute("width", "0");
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