/**		Toolbar setup
 * [] - Adds download btn listener
 * [] - Adds upload btn listener
 * [] - Adds delete diagram btn listener
 * [] - Adds delete item btn listener
 * [] - Adds custom font sz btn listener
 * [] - Adds custom SVG bg color btn listener
 * [] - Adds custom SVG brd color btn listener
 * [] - Adds popup to custom SVG btn listeners
 *
 * 		Layout setup
 * [] - Loads svg files from server
 * [] - Sets layout
 * [] - Sets layout grid's row and column number
 * [] - Render link lines (cons)
 * [] - Create Grid's div
 * [] - Sets Drag & Drop Listener for Grid's divs and Symbols
 *
 * 		Drag & Drop logic
 * 	[] - Drag starting handler
 * 	[] - Drag enter handler
 * 	[] - Drag over handler
 * 	[] - Drag leaving handler
 * 	[] - Drop handler
 * 	[] - Drop for Symbol handler
 * 	[] - Drop for UML's div handler
 * 	[] - Drag ending handler
 *
 *		UML logic
 * 	[] - updateUI
 * 	[] - isSymbol
 * 	[] - getCoords
 * 	[] - setSelElem
 * 	[] - rmSelElem
 * 	[] - setLinkElem
 * 	[] - rmLinkElem
 * 	[] - findUMLElem
 * 	[] - updUMLCoords
 * 	[] - linkUMLElems
 * 	[] - drawUMLElemCon
 * 	[] - getUMLElemConDim
 * 	[] - getElemSVGByReference
 *
 *		Btn Handles
 * 	[] - popupBtn
 * 	[] - loadLayout
 * 	[] - dwlLayout
 * 	[] - clrLayout
 * 	[] - changeSz
 * 	[] - changeBg
 * 	[] - changeBdr
 * 	[] - deleteElement
 **/

const CODEBLOCK =
`#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
/CODE/
}`

/**
 * @type {[{
 * 		type: string,
 * 		ref: {
 * 		 	x: number,
 * 		 	y: number
 * 		 },
 * 		cons: number[]
 * }]}
 */
let flow = []
let SVGs = [],
	colsN, rowsN
/**
 * @type {HTMLDivElement}
 */
let layout,
	selElem,
	dragSrcEl
/**
 * @type {{end: HTMLDivElement, begin: HTMLDivElement}}
 */
let linkElems = {begin: undefined, end: undefined}

document.addEventListener("DOMContentLoaded", _ => {
	//	Loads svg files from server
	(async _ => {
		document.querySelector('.loader').classList.remove('d-none')
		SVGs['condition']	= await fetch(`/uml-svg/condition.svg`).then(file => file.text())
		SVGs['declaration']	= await fetch(`/uml-svg/declaration.svg`).then(file => file.text())
		SVGs['end']			= await fetch(`/uml-svg/end.svg`).then(file => file.text())
		SVGs['input']		= await fetch(`/uml-svg/input.svg`).then(file => file.text())
		SVGs['output']		= await fetch(`/uml-svg/output.svg`).then(file => file.text())
		SVGs['process']		= await fetch(`/uml-svg/process.svg`).then(file => file.text())
		SVGs['start']		= await fetch(`/uml-svg/start.svg`).then(file => file.text())
		document.querySelector('.loader').classList.add('d-none')
	})();

	//	Sets layout
	layout = document.querySelector('#layout')
	//	Sets layout grid's row number
	colsN  = getComputedStyle(layout).gridTemplateColumns.split(' ').length
	rowsN  = getComputedStyle(layout).gridTemplateRows.split(' ').length
	document.querySelector('#textcode').value = CODEBLOCK.replace("/CODE/", '')
	//	Adds download btn listener
	document.querySelector('.bi-download').addEventListener("click", dwlLayout);
	//	Adds upload btn listener
	document.querySelector('.bi-upload').addEventListener("click", loadLayout);
	//	Adds delete diagram btn listener
	document.querySelector('.bi-trash').addEventListener( "click", clrLayout);
	//	Adds delete item btn listener
	document.querySelector('.bi-x-lg').addEventListener( "click", deleteElement);
	//	Adds custom font sz btn listener
	document.querySelector('#in-font-sz').addEventListener("input", changeSz);
	//	Adds custom SVG bg color btn listener
	document.querySelector('#in-color-bg').addEventListener( "input", changeBg);
	//	Adds custom SVG brd color btn listener
	document.querySelector('#in-color-bdr').addEventListener( "input", changeBdr);
	//	Adds popup to custom SVG btn listeners
	for (const popupContainer of document.querySelectorAll('.in-popup-container')) {
		popupContainer.addEventListener('click', popupBtn)
		popupContainer.nextSibling.firstChild.addEventListener('focusout', popupBtn)
	}
	//	Render UML lines (cons)
	layout.addEventListener('dragend', () => updateUI())
	layout.addEventListener('change', () => updateUI())

	//	Create Grid's div
	for (let i=0; i<rowsN*colsN; i++) {
		let box = document.createElement('div')
		box.classList.add('box')
		box.setAttribute('col', `${(i%colsN)+1}`)
		box.setAttribute('row', `${Math.floor(i/colsN)+1}`)
		box.setAttribute('draggable', 'true')
		box.addEventListener('click', _ => {if (box.innerHTML==='') rmSelElem()})
		layout.appendChild(box)
	}
	// Sets Drag & Drop Listener for Grid's divs and Symbols
	for (const item of document.querySelectorAll("#layout .box, [id^=uml-]")) {
		item.addEventListener("dragenter", 	handleDragEnter);
		item.addEventListener("dragover", 	handleDragOver);
		item.addEventListener("dragleave", 	handleDragLeave);
		item.addEventListener("drop", 		handleDrop);
		item.addEventListener("dragend", 	handleDragEnd);
		item.addEventListener("dragstart",	handleDragStart);
	}

});

/**
 * Drag & Drop
 */
//	Drag starting handler

function handleDragStart(e) {
	if (!isSymbol(this) && this.innerHTML==='')
		e.preventDefault()
	else {
		dragSrcEl = this;
		dragSrcEl.style.opacity = "0.4";
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/html", dragSrcEl.innerHTML);
	}
}

//	Drag enter handler
function handleDragEnter()
	{ this.classList.add("over"); }

//	Drag over handler
function handleDragOver(e) {
	if (e.preventDefault)
		e.preventDefault();
	e.dataTransfer.dropEffect = "move";
	return false;
}

//	Drag leaving handler
function handleDragLeave()
	{ this.classList.remove("over"); }

//	Drop handler
function handleDrop(e) {
	if (e.stopPropagation)
		e.stopPropagation()

	if (dragSrcEl !== this)
		if (isSymbol(this))
			handleDrop_Symbol.call(this, e)
		else
			handleDrop_Grid.call(this, e)

	return false;
}
//	Drop for Symbol handler
function handleDrop_Symbol() {
	// Layout's element -> Symbol === Delete Element
	if (!isSymbol(dragSrcEl)) {
		setSelElem(selElem)
		deleteElement()
	}
}
//	Drop for UML's div handler
function handleDrop_Grid(e) {
	// UML's div -> UML's div === Flip elements
	if (!isSymbol(dragSrcEl)) {
		let srcCoords = getCoords(dragSrcEl),
			objCoords = getCoords(this)
		updUMLCoords(srcCoords, objCoords)
		if (this.innerHTML!=='')
			updUMLCoords(objCoords, srcCoords)

		dragSrcEl.innerHTML = this.innerHTML;
		this.innerHTML = e.dataTransfer.getData("text/html");

	}
	// Simbolo -> UML's div === Add element
	else {
		let umlType = dragSrcEl.id.replace('uml-','');

		if (this.innerHTML!=='') {
			let idx = findUMLElem(getCoords(this))
			if (idx>=0)
				flow[idx].type = umlType

			setSelElem(this)
			deleteElement()
		}
		this.innerHTML = SVGs[umlType]
		let svg = this.querySelector('svg'),
			input = this.querySelector('input')
		svg.classList.add(umlType)
		input.addEventListener('focus', _ => setSelElem(this))
		input.addEventListener('dblclick', _ => setLinkElem(this))
		if(umlType==="start"||umlType==="end") {
			input.setAttribute('value', umlType==='start' ? 'Inicio' : 'Fin')
			dragSrcEl.classList.add('dragged');
			dragSrcEl.setAttribute('draggable', 'false')
		}

		setSelElem(this)
	}
}

//	Drag ending handler
function handleDragEnd() {
	for (const item of document.querySelectorAll("#layout .box"))
		item.classList.remove("over");

	this.style.opacity = "";
	dragSrcEl = null
	updateUI()
}

/**
 * 	UML Logic
 */
function updateUI(){
	generateCCode()
	for (const divConn of document.querySelectorAll('#layout > .connection'))
		divConn.remove()

	for (const UMLBegin of flow) {
		for (const idxEnd of UMLBegin.cons)
			drawUMLElemCon(
				getElemSVGByReference(UMLBegin.ref.x, UMLBegin.ref.y),
				getElemSVGByReference(flow[idxEnd].ref.x, flow[idxEnd].ref.y)
			)
	}
}

/**
 * @param element {HTMLElement}
 * @return {boolean}
 */
const isSymbol = element =>
	/^uml-/i.test(element.id)

/**
 * @param UMLDiv {HTMLDivElement}
 * @returns {{x: number, y: number}}
 */
function getCoords(UMLDiv) {
	return {
		x: parseInt(UMLDiv.getAttribute('col')),
		y: parseInt(UMLDiv.getAttribute('row'))
	}
}

/**
 * @param elem {HTMLDivElement}
 */
const setSelElem = elem => {
	for (const elemModer of document.querySelectorAll('.in-mod-elem'))
		elemModer.classList.remove('disabledbutton')
	selElem = elem
}

const rmSelElem = _ => {
	rmLinkElem()
	for (const elemModer of document.querySelectorAll('.in-mod-elem'))
		elemModer.classList.add('disabledbutton')

	selElem = null;
}

const setLinkElem = (elem) => {
	if (!linkElems.begin)
		linkElems.begin = elem
	else if (linkElems.begin !== elem) {
		linkElems.end = elem
		mkLink()
		rmLinkElem()
	}
}

const rmLinkElem = () =>
	{ linkElems = {begin: undefined, end: undefined} }

/**
 * @param coords {{x: number, y: number}}
 * @returns {number}
 */
const findUMLElem = (coords) => {
	let idx = -1
	flow.some((umlElem, i) => {
		if (umlElem.ref.x===coords.x && umlElem.ref.y===coords.y) {
			idx = i
			return true
		}
		else
			return false
	})
	return idx
}

/**
 * @param oldCoords {{x: number, y: number}}
 * @param newCoords {{x: number, y: number}}
 */
const updUMLCoords = (oldCoords, newCoords) =>
	{ flow[findUMLElem(oldCoords)].ref = newCoords }

const mkLink = () => {
	let iBegin, iEnd,
		isLinked;
	// Adds begin element
	if (iBegin<0)
		iBegin = flow.push({
			ref: getCoords(linkElems.begin),
			type: linkElems.begin.elemType(),
			cons: []
		})-1
	// Adds end element
	if (iEnd<0)
		iEnd = flow.push({
			ref: getCoords(linkElems.end),
			type: linkElems.end.elemType(),
			cons: []
		})-1


	if(flow[iBegin].cons.every(conn => conn!==iEnd))
		flow[iBegin].cons.push(iEnd)

	// console.log("flow: "+JSON.stringify(flow, null, 4))
	updateUI()
}

/**
 * @param SVGBegin	{SVGElement}
 * @param SVGEnd	{SVGElement}
 */
const drawUMLElemCon = (SVGBegin, SVGEnd) => {
	let beginCoords = SVGBegin.getBoundingClientRect(),
		endCoords   = SVGEnd.getBoundingClientRect();

	let [x1, x2, y1, y2, xFlag, yFlag] = getUMLElemConDim(beginCoords, endCoords),
		xF = xFlag?1:-1,
		yF = yFlag?1:-1,
		strk = 4,
		long = 20,
		ymid = endCoords.height/2


	let createRow = document.createElement('div')
	createRow.classList.add('connection')
	createRow.style.position="Absolute"
	createRow.style.left=x1+"px"
	createRow.style.top=y1+"px"

	// <path stroke="black" fill="none"  stroke-width=${strk} d="m${(xFlag?(strk/2):x2+strk)+7.25},${yFlag?0:y2+10} v${yF*y2/2},0  h${xF*Math.abs(x2)+(xFlag?0:5)},0 v${yF*y2/2},0"></path>
	// <path stroke="black" fill="black" stroke-width="1.5"   d="m0,0 l-10,-20 l20,0 z" transform="rotate(${yFlag?'0':'180 10 5'}) translate(${(xFlag?yF*x2:0)+10} ${(yFlag?y2:0)+10})"></path>
	console.log(`xFlag ${xFlag} | yFlag ${yFlag}`)
	createRow.innerHTML =
`<svg width=${(x2?x2:long/2)+long/2} height=${y2+(yFlag?0:ymid)} style="transform: translateX(${xFlag?-strk/2:-(long-strk)/2}px);" xmlns="http://www.w3.org/2000/svg">
	<!--<path stroke="black" fill="none"  stroke-width=${strk} d="m${xor?strk/2:(x2+(long-strk)/2)},${yFlag?0:ymid} v${y2/2+ymid},0 h${(xor?1:-1)*x2},0 v${y2/2},0"></path>-->
	<path stroke="black" fill="black" stroke-width="1.5"   d="m0,0 l${-long/2},${-long} l${long},0 z" transform="rotate(0) translate(${xF*(Math.abs(x2-long/2)+xFlag?0long/2)} ${y2})"></path
</svg>`;
	layout.appendChild(createRow)
}

/**
 -(* 	(x1,y1)--------------)
 * 	   |				|
 * 	   |				|
 * 	   |		<3		|
 * 	   |				|
 * 	   |				|
 * 	   --------------(x2,y2)
 * 	   @param domRect1 {DOMRect}
 * 	   @param domRect2 {DOMRect}
 * 	   @returns {number[4]}
 */
const getUMLElemConDim = (domRect1, domRect2) => () {
	let x1, x2, y1, y2, xFlag, yFlag,
		toolsDiv = document.querySelector("body > main > div").getBoundingClientRect(),
		headerDiv = document.querySelector("body > div.title").getBoundingClientRect();

	const offsetX = toolsDiv.width + toolsDiv.left,
		  offsetY = headerDiv.height + headerDiv.top;

	// X axis
	if (domRect1.left <= domRect2.left) {
		x1  = domRect1.left + (domRect1.width/2)
		x2  = domRect2.left + (domRect2.width/2) - x1
		xFlag = true
	}
	else {
		x1  = domRect2.left + (domRect2.width/2)
		x2  = domRect1.left + (domRect1.width/2) - x1
		xFlag = false
	}

	// Y axis
	if (domRect1.top <= domRect2.top) {
		y1  = domRect1.top + (domRect1.height/2)
		y2  = domRect2.top						 - y1-20
		yFlag = true
	}
	else {
		y1  = domRect2.top + (domRect2.height/2)
		y2  = domRect1.top						 - y1-20
		yFlag = false
	}

	x1 -= offsetX
	y1 -= offsetY

	console.log(`x1=${x1}, x2=${x2}, y1=${y1}, y2=${y2}`)
	return [x1, x2, y1, y2, xFlag, yFlag]
}

/**
 * @param x: number
 * @param y: number
 * @return {SVGElement}
 */
const getElemSVGByReference = (x, y) =>
	document.querySelector(`#layout > div:nth-child(${x+(--y*colsN)}) > svg`)


const downloadLayout  = _ => {
	// generacion del xml
	let xmlLayout=document.querySelector('#layout').innerHTML;

	let a = document.createElement('a');
	a.setAttribute('href','data:text/xml:charset=utf-8, '+encodeURIComponent(xmlLayout));
	a.setAttribute('download','diagramaDeFlujo.xml');
	document.body.appendChild(a);
	a.click();
}
function clrLayout() {
    for(const connDiv of document.querySelectorAll('#layout>.connection'))
        connDiv.remove()
	for(const box of document.querySelectorAll('#layout>.box'))
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
		case 'declaration': {
			// nombre : variable
			let data=val.split(":").map(txt => txt
				.replace(/^\s+/i, '')
				.replace(/\s+$/i, '')

			);
			data[1]=data[1].toLowerCase();
			let defaultVal;
			switch (data[1]) {

				case 'char':
					defaultVal='\'\'';
					break;
				case 'float':
					defaultVal='0.0f';
					break;
				case 'double':
					defaultVal='0.0';
					break;
				case 'int':
					defaultVal='0';
					break;
				case '':
					defaultVal='0';
					data[1]='int';
					break;
			}
			return `${data[1]} ${data[0]} = ${defaultVal};`
		}
		case 'input':
			return `scanf("%d", &${val});`
		case 'output':
			return `printf("${val}");`
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
				box = document.querySelector(`#layout > div:nth-child(${++x+(++y*colsN)})`)
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
			return null;
	}
}

