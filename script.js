async function applyChromaticAberration() {
	let response = await fetch(chrome.extension.getURL("chromatic-aberration.svg"));
	let svgFileContent = await response.text();
	let svgContainer = document.createElement("div");
	svgContainer.innerHTML = svgFileContent;
	document.body.appendChild(svgContainer);
	document.body.classList.add("chromatic-aberration");

	let beep = 0;
	let svg = document.querySelector("svg");
	let turbulence = document.querySelector("feTurbulence");
	let dir = 1;
	function loop() {
		turbulence.setAttribute("baseFrequency", 0.005 + Math.cos(beep * Math.PI * 2) * 0.0005);
		beep += 0.005 * dir;
		if(beep > 1 || beep < 0) {
			dir *= -1;
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