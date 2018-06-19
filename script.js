async function applyChromaticAberration() {
	let response = await fetch(chrome.extension.getURL("chromatic-aberration2.filter"));
	let svgFilter = await response.text();
	let svgNamespace = "http://www.w3.org/2000/svg";
	let svg = document.createElementNS(svgNamespace, "svg");
	let defs = document.createElementNS(svgNamespace, "defs");
	svg.appendChild(defs);
	document.body.appendChild(svg);

	let pees = document.getElementsByTagName("p");
	pees = document.querySelectorAll("p, img");
	let affectedElements = [];

	for(let i = 0; i < pees.length; i++) {
		let element = pees[i];
		let filterElement = document.createElementNS(svgNamespace, "filter");
		filterElement.id = "myFilter" + i;
		filterElement.innerHTML = svgFilter;
		element.style += "; filter: url(#myFilter" + i + ")";
		defs.appendChild(filterElement);

		let offsetR = filterElement.querySelector("#feOffsetR");
		let offsetG = filterElement.querySelector("#feOffsetG");
		let offsetB = filterElement.querySelector("#feOffsetB");
		
		affectedElements.push({ element, applyEffect(x1, y1, x2, y2, x3, y3) {
			offsetR.setAttribute("dx", x1);
			offsetR.setAttribute("dy", y1);
			offsetG.setAttribute("dx", x2);
			offsetG.setAttribute("dy", y2);
			offsetB.setAttribute("dx", x3);
			offsetB.setAttribute("dy", y3);
		}});
	}
	
	document.addEventListener("mousemove", ev => {
		let viewportMouseX = ev.clientX; // / window.innerWidth;
		let viewportMouseY = ev.clientY; // / window.innerHeight;

		console.log(viewportMouseY)

		affectedElements.forEach(element => {
			let dist = getDistanceToElement(element.element, viewportMouseX, viewportMouseY);
			element.applyEffect(dist.x * -10, dist.y * -10, 
								dist.x * -20, dist.y * -20,
								dist.x * -30, dist.y * -30);
		});

		// Necessary in Chrome to trigger redraw
		svg.setAttribute("width", "0");
	});
}

applyChromaticAberration();

function getDistanceToElement(element, x, y) {
	let rect = { top: element.offsetTop - window.scrollY,
				 left: element.offsetLeft - window.scrollX,
				 bottom: element.offsetTop + element.offsetHeight - window.scrollY,
				 right: element.offsetLeft + element.offsetWidth - window.scrollX };

	let dx = 0;
	if(x < rect.left) {
		dx = x - rect.left;
	} else if(x > rect.right) {
		dx = x - rect.right;
	}
	let dy = 0;
	if(y < rect.top) {
		dy = y - rect.top;
	} else if(y > rect.bottom) {
		dy = y - rect.bottom;
	}

	return { x: dx / window.innerWidth, y: dy / window.innerHeight };
}