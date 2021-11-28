const CODEBLOCK =
`#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
/CODE/
}`
let selElem = null;
let rows

document.addEventListener("DOMContentLoaded", _ => {
	document.querySelector('#textcode').value = CODEBLOCK.replace("/CODE/", '')

	/**
	 * Toolbar setup
	 **/
	let popupContainers = document.querySelectorAll('.in-popup-container')
	for (const popupContainer of popupContainers) {

		popupContainer.addEventListener('click', function ()
			{ this.nextSibling.classList.toggle('d-none') })

		popupContainer.nextSibling.firstChild.addEventListener('focusout', function ()
			{ this.parentNode.classList.toggle('d-none') })
	}

	/**
	 * Layout setup
	 */
	let layout = document.querySelector('#layout')

	layout.addEventListener('dragend', () => generateCCode())
	layout.addEventListener('change', () => generateCCode())
	rows = getComputedStyle(layout).gridTemplateColumns.split(' ').length
	for (let i=0; i <100; i++) {
		let box = document.createElement('div')
		box.classList.add('box')
		box.setAttribute('col', `${(i%rows)}`)
		box.setAttribute('row', `${parseInt(i/rows)}`)
		box.setAttribute('draggable', 'true')
		box.addEventListener('click', _ => {if (box.innerHTML==='') rmSelElem()})
		layout.appendChild(box)
	}

	let dragSrcEl = null;

	function handleDragStart(e) {
		if (!isSymbol(this) && this.innerHTML==='')
			e.preventDefault()
		else {
			this.style.opacity = "0.4";
			dragSrcEl = this;
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/html", this.innerHTML);
		}
	}
	
	function handleDragOver(e) {
		if (e.preventDefault)
			e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		return false;
	}
	
	function handleDragEnter(e)
		{ this.classList.add("over"); 	}
	
	function handleDragLeave(e)
		{ this.classList.remove("over"); }
	
	function handleDrop(e) {
		if (e.stopPropagation)
			e.stopPropagation();

		if (dragSrcEl && dragSrcEl !== this) {
			// Layout's element -> Symbol === Nothing
			if (!isSymbol(dragSrcEl) && isSymbol(this)) {
				setSelElem(selElem)
				deleteElement()
			}
			// Simbolo -> Layout's element === Add element
			else if (isSymbol(dragSrcEl) && !isSymbol(this)) {
				let tipo=dragSrcEl.id;
				tipo=tipo.substring(4);
				fetch(`/uml-svg/${tipo}.svg`)
					.then(file => file.text())
					.then(svgText => {
						//("focusout",a => alert("lo que quieras"))
						if (this.innerHTML!=='') {
							setSelElem(this.firstChild)
							deleteElement()
						}
						this.innerHTML = svgText
						let svg = this.firstChild
						svg.classList.add(tipo)
						svg.querySelector('input')
							.addEventListener('focus', _ => setSelElem(svg))
						svg.querySelector('input')
							.addEventListener('dblclick', _ => {

							})
						setSelElem(svg)
					})
			}
			// Layout's element -> Layout's element === Flip elements
			else if (!isSymbol(dragSrcEl) && !isSymbol(this)) {
				dragSrcEl.innerHTML = this.innerHTML;
				this.innerHTML = e.dataTransfer.getData("text/html");
			}
		}
		return false;
	}
	
	function handleDragEnd(e) {
		if(dragSrcEl.id==="uml-start"||dragSrcEl.id==="uml-end") {
			dragSrcEl.classList.add('dragged');
			dragSrcEl.setAttribute('draggable', 'false')
		}
			this.style.opacity = "";

		items.forEach(item => {
			item.classList.remove("over");
		});
		dragSrcEl = null
	}


	let items = document.querySelectorAll("#layout .box, [id^=\"uml-\"]");
	items.forEach(function (item) {
		item.addEventListener("dragstart", handleDragStart, false);
		item.addEventListener("dragenter", handleDragEnter, false);
		item.addEventListener("dragover", handleDragOver, false);
		item.addEventListener("dragleave", handleDragLeave, false);
		item.addEventListener("drop", handleDrop, false);
		item.addEventListener("dragend", handleDragEnd, false);
	})
});

const isSymbol = element =>
	/^uml-/i.test(element.id)

const setSelElem = elem => {
	for (const elemModer of document.querySelectorAll('.in-mod-elem'))
		elemModer.classList.remove('disabledbutton')
	selElem = elem
}

const rmSelElem = _ => {
	for (const elemModer of document.querySelectorAll('.in-mod-elem'))
		elemModer.classList.add('disabledbutton')

	selElem = null;
}

function setLinkElem() {

}


const clearLayout = _ => {
	for(const box of document.querySelectorAll('.box>svg'))
		if (box.innerHTML !=='') {
			setSelElem(box)
			deleteElement()
		}
}

const changeFontsz = input  => selElem
	? selElem.querySelector('input').style.fontSize = `${input.value<1?'1':input.value}rem`
	: null

const changeBg = input => selElem
	? selElem.firstElementChild.setAttribute('fill', input.value)
	: null

const changeBorder = input => selElem
	? selElem.firstElementChild.setAttribute('stroke', input.value)
	: null

const deleteElement = _ => {
	if (selElem.classList.contains("start")||selElem.classList.contains("end")) {
		document.querySelector(`[id$=${selElem.classList.value}]`).classList.remove('dragged');
		document.querySelector(`[id$=${selElem.classList.value}]`).setAttribute('draggable', 'true');
	}
	selElem.remove()
	rmSelElem()
}


const generateCCode = _ => {
	let cCode = '',
		lvl = 1,
		elem = document.querySelector('svg.start').parentNode

	while (elem) {
		let tabs = ''
		for (let i=0; i++<lvl; tabs += '\t');


		cCode += tabs+elem.codeTraslation()
		elem = elem.nextElem()
		if (elem)
			cCode += '\n'
	}
	document.querySelector('#textcode').value = CODEBLOCK.replace('/CODE/', cCode)
}

/**
 * @returns {String}
 */
Node.prototype.elemType = function ()
	{ return this.querySelector('svg').classList.value }

/**
 * @returns {String}
 */
Node.prototype.elemValue = function ()
	{ return this.querySelector('input').value }

/**
 * @returns {Number[]}
 */
Node.prototype.elemCoords = function ()
	{ return [parseInt(this.getAttribute('col')), parseInt(this.getAttribute('row'))] }

/**
 * @returns {String}
 */
Node.prototype.codeTraslation = function () {
	const val = this.elemValue()
	switch (this.elemType()) {
		// Next elem us only back
		case 'start':
			return `//\t${val}`
		case 'process':
			return `${val};`
		case 'declaration':
			return `int ${val} = 0;`
		case 'input':
			return `scanf("%d", &${val});`
		case 'output':
			return `fprintf("${val}");`
		case 'condition':
			return `if("${val}") {}`
		case 'loop':
			return `while("${val}") {}`
		case 'end':
			return `return 0;\n\t//\t${val}`

	}
}

/**
 * @returns {Node | Node[]}
 */
Node.prototype.nextElem = function () {

	switch (this.elemType()) {
		// Next elem us only back
		case 'start':
		case 'process':
		case 'declaration':
		case 'input':
		case 'output': {
			let [x, y] = this.elemCoords(),
				box = document.querySelector(`#layout > div:nth-child(${++x+(++y*rows)})`)
			return box.innerHTML !== ''
				?box
				:null
		}
		case 'condition':
			alert("unhandle section")
			break;
		case 'loop':
			alert("unhandle section")
			break;
		case 'end':
			alert("unhandle section")
			return null;

	}

}