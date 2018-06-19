fetch(chrome.extension.getURL("bop.svg")).then(response => {
	response.text().then(svgText => {
		let svg = document.createElement("div");
		svg.innerHTML = svgText;
		document.body.appendChild(svg);
		document.body.classList.add("chromatic-aberration");
		/* let images = document.getElementsByTagName("img");
		for(let image of images) {
			image.classList.add("chromatic-aberration");
		}; */
		
		let filter = document.getElementById("feOffset22");
		let body = document.getElementsByTagName("body")[0];
		document.addEventListener("mousemove", ev => {
			let viewPortMouseX = (ev.clientX / window.innerWidth);
			body.style.setProperty("--mouseX", viewPortMouseX);
			// filter.setAttribute( "dx", Math.floor(viewPortMouseX * 10));
			filter.setAttribute( "dx", (Math.floor(Math.random() * 10)).toString());
		});
	});
});