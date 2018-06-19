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
		let ns = "http://www.w3.org/2000/svg";
		let filter = document.getElementById("myFilter");
		document.addEventListener("mousemove", ev => {
			let viewportMouseX = ev.clientX / window.innerWidth;
			//filter.setAttribute("dx", Math.floor(viewportMouseX * 100));

			for(let child of filter.childNodes) {
				filter.removeChild(child);
			}

			let fragment = document.createDocumentFragment();


			let offsetR = document.createElementNS(ns, "feOffset");
			offsetR.setAttribute("dx", Math.floor(viewportMouseX * 10, viewportMouseX * 10));
			offsetR.setAttribute("dy", "0");
			offsetR.setAttribute("in", "SourceGraphic");
			offsetR.setAttribute("result", "result1");
			fragment.appendChild(offsetR);

			let offsetG = document.createElementNS(ns, "feOffset");
			offsetG.setAttribute("dx", Math.floor(viewportMouseX * 5, viewportMouseX * 5));
			offsetG.setAttribute("dy", "0");
			offsetG.setAttribute("in", "SourceGraphic");
			offsetG.setAttribute("result", "result2");
			fragment.appendChild(offsetG);

			/* let blurG = document.createElementNS(ns, "feGaussianBlur");
			blurG.setAttribute("stdDeviation", "1");
			blurG.setAttribute("in", "result2");
			blurG.setAttribute("result", "result2b");
			fragment.appendChild(blurG); */

			let offsetB = document.createElementNS(ns, "feOffset");
			offsetB.setAttribute("dx", Math.floor(viewportMouseX * 2, viewportMouseX * 2));
			offsetB.setAttribute("dy", "0");
			offsetB.setAttribute("in", "SourceGraphic");
			offsetB.setAttribute("result", "result3");
			fragment.appendChild(offsetB);


			let matrixR = document.createElementNS(ns, "feColorMatrix");
			matrixR.setAttribute("values", "1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 ");
			matrixR.setAttribute("in", "result1");
			matrixR.setAttribute("result", "result4");
			fragment.appendChild(matrixR);

			let matrixG = document.createElementNS(ns, "feColorMatrix");
			matrixG.setAttribute("values", "0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0 ");
			matrixG.setAttribute("in", "result2");
			matrixG.setAttribute("result", "result5");
			fragment.appendChild(matrixG);

			let matrixB = document.createElementNS(ns, "feColorMatrix");
			matrixB.setAttribute("values", "0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0 ");
			matrixB.setAttribute("in", "result3");
			matrixB.setAttribute("result", "result6");
			fragment.appendChild(matrixB);




			let blendOne = document.createElementNS(ns, "feBlend");
			blendOne.setAttribute("mode", "screen");
			blendOne.setAttribute("in", "result4");
			blendOne.setAttribute("in2", "result5");
			blendOne.setAttribute("result", "result7");
			fragment.appendChild(blendOne);

			let blendTwo = document.createElementNS(ns, "feBlend");
			blendTwo.setAttribute("mode", "screen");
			blendTwo.setAttribute("in", "result6");
			blendTwo.setAttribute("in2", "result7");
			fragment.appendChild(blendTwo);

			filter.appendChild(fragment);
		});
	});
});