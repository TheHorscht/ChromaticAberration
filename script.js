async function applyChromaticAberration() {
	let response = await fetch(chrome.extension.getURL("bop.svg"));
	let svgText = await response.text();
	let svg = document.createElement("div");
	svg.innerHTML = svgText;
	document.body.appendChild(svg);
	document.body.classList.add("chromatic-aberration");
	/* let images = document.getElementsByTagName("img");
	for(let image of images) {
		image.classList.add("chromatic-aberration");
	}; */
	let ns = "http://www.w3.org/2000/svg";
	let offsetR = document.getElementById("feOffsetR");
	let offsetG = document.getElementById("feOffsetG");
	let offsetB = document.getElementById("feOffsetB");
	let mySvg = document.getElementById("chromatic-aberration-filter-effect-svg");
	
	document.addEventListener("mousemove", ev => {
		let viewportMouseX = ev.clientX / window.innerWidth;
		let viewportMouseY = ev.clientY / window.innerHeight;
		offsetR.setAttribute("dx", Math.floor(viewportMouseX * 100));
		offsetR.setAttribute("dy", Math.floor(viewportMouseY * 100));
		offsetG.setAttribute("dx", Math.floor(viewportMouseX * 80));
		offsetG.setAttribute("dy", Math.floor(viewportMouseY * 80));
		offsetB.setAttribute("dx", Math.floor(viewportMouseX * 60));
		offsetB.setAttribute("dy", Math.floor(viewportMouseY * 60));
		// Necessary in Chrome to trigger redraw
		mySvg.setAttribute("width", "0");
	});
}

applyChromaticAberration();