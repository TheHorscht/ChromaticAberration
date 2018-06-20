async function applyChromaticAberration() {
	let response = await fetch(chrome.extension.getURL("chromatic-aberration.svg"));
	let svgFileContent = await response.text();
	let svgContainer = document.createElement("div");
	svgContainer.innerHTML = svgFileContent;
	document.body.appendChild(svgContainer);
	document.body.classList.add("chromatic-aberration");

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
		beepR += 0.0005 * dirR;
		beepG += 0.0008 * dirG;
		beepB += 0.00037 * dirB;
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
	window.requestAnimationFrame(loop);
}

applyChromaticAberration();

/*

How to do chromatic aberration with displacement:
Use an image as the displacement map source feImage
Offset that image to move it around
feImage displace.jpg
feOffset dx dy = mousepos, in=feImgae result=disOffset
displacementMap input=disOffset
 */