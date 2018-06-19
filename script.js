async function applyChromaticAberration() {
	let response = await fetch(chrome.extension.getURL("chromatic-aberration.svg"));
	let svgFileContent = await response.text();
	let svgContainer = document.createElement("div");
	svgContainer.innerHTML = svgFileContent;
	document.body.appendChild(svgContainer);
	document.body.classList.add("chromatic-aberration");
}

applyChromaticAberration();