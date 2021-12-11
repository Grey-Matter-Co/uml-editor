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
		SVGs['loop']	    = await fetch(`/uml-svg/condition.svg`).then(file => file.text())
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
		popupContainer.addEventListener('click', _ => popupBtn.call(popupContainer.nextSibling) )
		popupContainer.nextSibling.firstChild.addEventListener('focusout', function() {popupBtn.call(this.parentElement)})
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
		box.addEventListener('click', _ => {if (box.querySelector('svg')===null) rmSelElem()})
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
		setSelElem(this)
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
			objCoords = getCoords(this),
			idx = findUMLElem(srcCoords)
		if (idx>=0)
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
		else {
			flow.push({
				ref: getCoords(this),
				type: umlType,
				cons: []
			})
		}
		this.innerHTML = SVGs[umlType]
		let svg = this.querySelector('svg'),
			input = this.querySelector('input')
		svg.classList.add(umlType)
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
	let endIdx = flow.findIndex(uml => uml.type==="end")
	document.querySelector('#textcode').value = CODEBLOCK.replace('/CODE/', generateCCode()+ (endIdx>0?("\n\t"+getElemDivByReference(flow[endIdx].ref.x, flow[endIdx].ref.y).uml2CCode()):" "))
	for (const divConn of document.querySelectorAll('#layout > .connection'))
		divConn.remove()

	flow.forEach( UMLBegin => {
		UMLBegin.cons.forEach((idxEnd, i) => {
			drawUMLElemCon(
				getElemSVGByReference(UMLBegin.ref.x, UMLBegin.ref.y),
				getElemSVGByReference(flow[idxEnd].ref.x, flow[idxEnd].ref.y),
				!(!i)
			)
		})
	})

	// for (const UMLBegin of flow) {
	// 	for (const idxEnd of UMLBegin.cons)
	// 		drawUMLElemCon(
	// 			getElemSVGByReference(UMLBegin.ref.x, UMLBegin.ref.y),
	// 			getElemSVGByReference(flow[idxEnd].ref.x, flow[idxEnd].ref.y)
	// 		)
	// }
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
function setSelElem (elem) {
	for (const elemModer of document.querySelectorAll('.in-mod-elem')) {
		elemModer.classList.remove('disabledbutton')
	}
	selElem = elem
}

const rmSelElem = _ => {
	rmLinkElem()
	for (const elemModer of document.querySelectorAll('.in-mod-elem'))
		elemModer.classList.add('disabledbutton')
	selElem = null;
}

/**
 * @param elem {HTMLDivElement}
 |*/
function setLinkElem (elem) {
	if (!linkElems.begin)
		if (elem.umlType() !== "end")
			linkElems.begin = elem
		else {
			alert("Operacion Inválida")
			rmLinkElem()
		}
	else if (linkElems.begin !== elem) {
		linkElems.end = elem
		if (elem.umlType() !== "start")
			linkUMLElems()
		else
			alert("Operacion Inválida")
		
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

const linkUMLElems = () => {
	let iBegin = findUMLElem(getCoords(linkElems.begin)),
		iEnd   = findUMLElem(getCoords(linkElems.end));
	
	// Adds begin element
	if (iBegin<0)
		iBegin = flow.push({
			ref: getCoords(linkElems.begin),
			type: linkElems.begin.umlType(),
			cons: []
		})-1
	// Adds end element
	if (iEnd<0)
		iEnd = flow.push({
		ref: getCoords(linkElems.end),
			type: linkElems.end.umlType(),
			cons: []
		})-1
	
	if (((flow[iBegin].type === "condition" || flow[iBegin].type === "loop") && flow[iBegin].cons.length===2) || (!(flow[iBegin].type === "condition" || flow[iBegin].type === "loop") && flow[iBegin].cons.length===1))
		alert("Operacion Inválida")
	else
		if(flow[iBegin].cons.every(conn => conn!==iEnd))
			flow[iBegin].cons.push(iEnd)
	
	

	// console.log("flow: "+JSON.stringify(flow, null, 4))
	updateUI()
}

/**
 * @param SVGBegin	{SVGElement}
 * @param SVGEnd	{SVGElement}
 * @param second {boolean}
 */

const drawUMLElemCon = (SVGBegin, SVGEnd, second) => {
	let beginCoords = SVGBegin.getBoundingClientRect(),
		endCoords   = SVGEnd.getBoundingClientRect();

	let [x1, x2, y1, y2, xFlag, yFlag] = getUMLElemConDim(beginCoords, endCoords),
		xF = xFlag?1:-1,
		yF = yFlag?1:-1,
		strk = 4,
		long = 20,
		ymid = beginCoords.height/2+10
	
	let createRow = document.createElement('div')
	createRow.classList.add('connection')
	createRow.style.position="Absolute"
	createRow.style.left=x1+"px"
	createRow.style.top=y1+"px"
	let svgW = Math.max(Math.abs(x2)+(strk+long)/2, 20),
		svgH = y2+long/2-ymid,
		yXtr = yFlag?22.5:15

	// console.log(`xFlag ${xFlag} | yFlag ${yFlag}`)
	if (!second) {
		createRow.style.left=x1+"px"
		createRow.style.top=y1+"px"
		let svgW = Math.max(Math.abs(x2)+(strk+long)/2, 20),
			svgH = y2+long/2-ymid,
			yXtr = yFlag?22.5:15
		createRow.innerHTML =
			`<svg width=${svgW} height=${svgH} style="transform: translateX(${-(svgW===20||!xFlag?long:strk)/2}px); xmlns="http://www.w3.org/2000/svg">
				<path stroke="black" fill="none"  stroke-width=${strk} d="m${xFlag?(x2?strk:long)/2:x2+long/2},${yFlag?0:svgH} v0,${yF*yXtr} h${xF*x2},0 v0,${yF*(svgH-yXtr-long)}"></path>
				<path stroke="black" fill="black" stroke-width="1.5"   d="M10,0 l${-long/2},${-long} l${long},0 z" transform="rotate(${yFlag?0:180}) translate(${yFlag?(xFlag?(x2?x2-10:0):0):-(xFlag?svgW:long)} ${yFlag?y2-ymid:-long})"></path>
			</svg>`;
	}
	else {
		createRow.style.left=x1+"px"
		createRow.style.top=(y1-(long+strk)/2)+"px"
		let svgW = Math.max(Math.abs(x2)+(strk+long)/2, 20),
			svgH = y2+long/2-ymid,
			yXtr = yFlag?22.5:15
		createRow.innerHTML =
			`<svg width=${svgW} height=${svgH} style="transform: translateX(${-(svgW===20||!xFlag?long:strk)/2}px); xmlns="http://www.w3.org/2000/svg">
				<path stroke="black" fill="none"  stroke-width=${strk} d="m${xFlag?(x2?strk:long)/2:x2+long/2},${yFlag?strk/2:svgH} h${xF*x2},0 v0,${yF*svgH},0 "></path>
				<path stroke="black" fill="black" stroke-width="1.5"   d="M10,0 l${-long/2},${-long} l${long},0 z" transform="rotate(${yFlag?0:180}) translate(${yFlag?(xFlag?(x2?x2-(long-strk)/2:0):0):-(xFlag?svgW:long)} ${yFlag?y2-ymid+long/2:-long})"></path>
			</svg>`;
	}
	layout.appendChild(createRow)
}

/**
 * 	(x1,y1)--------------
 * 	   |				|
 * 	   |				|
 * 	   |		<3		|
 * 	   |				|
 * 	   |				|
 * 	   --------------(x2,y2)
 *
 * 	   @param domRect1 {DOMRect}
 * 	   @param domRect2 {DOMRect}
 * 	   @returns {number[4]}
 */

const getUMLElemConDim = (domRect1, domRect2) => {
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
		y2  = domRect2.top + (domRect2.height/2) - y1
		yFlag = true
	}
	else {
		y1  = domRect2.top + (domRect2.height/2)
		y2  = domRect1.top + (domRect1.height/2) - y1
		yFlag = false
	}

	x1 -= offsetX
	y1 -= offsetY

	return [x1, x2, y1, y2, xFlag, yFlag]
}

/**
 * @param x: number
 * @param y: number
 * @return {SVGElement}
 */
const getElemSVGByReference = (x, y) =>
	getElemDivByReference(x, y).querySelector('svg')

/**
 * @param x: number
 * @param y: number
 * @return {HTMLDivElement}
 */
const getElemDivByReference = (x, y) =>
	document.querySelector(`#layout > div:nth-child(${x+(--y*colsN)})`)

function  encodeUML() {
	let xmlDoc = document.implementation.createDocument(null, "flow"),
		xmlFlow = xmlDoc.querySelector('flow')

	flow.forEach(umlElem => {
		let xmlElem = xmlDoc.createElement('item')
		let divElem = getElemDivByReference(umlElem.ref.x, umlElem.ref.y),
			xmlRef  = xmlDoc.createElement('ref'),
			xmlCons = xmlDoc.createElement('cons')

		xmlElem.setAttribute('type', umlElem.type)
		xmlElem.setAttribute('value', divElem.umlValue())
		xmlElem.setAttribute('fill', divElem.umlBgColor())
		xmlElem.setAttribute('stroke', divElem.umlBdrColor())
		xmlElem.setAttribute('font-size', divElem.umlFtSz())
		xmlRef.setAttribute('x', umlElem.ref.x.toString())
		xmlRef.setAttribute('y', umlElem.ref.y.toString())

		umlElem.cons.forEach(con => {
			let xmlIndex = xmlDoc.createElement('index')
			xmlIndex.setAttribute('value', con.toString())
			xmlCons.appendChild(xmlIndex)
		})
		
		xmlElem.appendChild(xmlRef)
		xmlElem.appendChild(xmlCons)
		xmlFlow.appendChild(xmlElem)
	})
	return new XMLSerializer().serializeToString(xmlDoc);
}

function decodeUML(xmlString) {
	clrLayout()
	let xmlDoc = new DOMParser().parseFromString(xmlString, "text/xml"),
		xmlFlow = xmlDoc.querySelector('flow')	// <- xml

	flow = [];

	for (const xmlItem of xmlFlow.querySelectorAll('item')) {
		let xmlRef  = xmlItem.querySelector('ref'),
			pos = {
				x: parseInt(xmlRef.getAttribute('x')),
				y: parseInt(xmlRef.getAttribute('y'))
			},
			flowIdx = flow.push({
				type: xmlItem.getAttribute('type'),
				ref: pos,
				cons: []
			})-1

		for(const xmlIndex of xmlItem.querySelectorAll('cons > index')) {
			flow[flowIdx].cons
				.push( parseInt(xmlIndex.getAttribute('value')))
		}


		let divUML = getElemDivByReference(pos.x, pos.y);
		divUML.innerHTML = SVGs[flow[flowIdx].type]
		let trazo = divUML.querySelector('svg>*'),
			svg   = divUML.querySelector('svg'),
			input = divUML.querySelector('input');

		svg.setAttribute('class',xmlItem.getAttribute('type'));
		input.style.fontSize = xmlItem.getAttribute('font-size');
		input.setAttribute('value',xmlItem.getAttribute('value'));
		trazo.setAttribute('stroke',xmlItem.getAttribute('stroke'));
		trazo.setAttribute('fill',xmlItem.getAttribute('fill'));

	}
}

/**
 * @param flowIdx {number}
 * @param lvl {number}
 * @returns {string}
 */
const generateCCode = (flowIdx = undefined, lvl = 1) => {
	let cCode = '', tabs = '',
		umlElem, requiresBlock = false

	if (flowIdx===undefined)
		flow.forEach((uml, i) => {
			if (uml.type === "start")
				flowIdx = i
		})
	
	if (flowIdx!==undefined) {
		umlElem = flow[flowIdx]
		
		requiresBlock = umlElem.type==='condition' || umlElem.type==='loop'
		
		for (let i=0; i<lvl; i++)
			tabs += '\t'
		cCode += tabs
		
		// // cuantas veces aparece en cons
		// if (flow.filter(umlE => umlE.cons.includes(flowIdx)).length>1) {
		// 	lvl--
		// 	cCode = cCode.replace(/\n$/, "")
		// }

		if (umlElem.type !== "end")
			cCode += getElemDivByReference(umlElem.ref.x, umlElem.ref.y).uml2CCode()+`${requiresBlock?' {':''}\n `
		
		umlElem.cons.forEach((cons, i) => {
			if (i===1)
				if (umlElem.type === "condition") {
					cCode = cCode.replace(new RegExp(`[\t]{${lvl+1}}$`), tabs);
					cCode += `}\n${tabs}else {\n`
				}
				else if (umlElem.type === "loop") {
					cCode += tabs+"}\n"
					--lvl
				}

			cCode += generateCCode(cons, requiresBlock?lvl+1:lvl)
		})

		if (umlElem.type === "condition") {
			cCode = cCode.replace(new RegExp(`[\t]{${lvl+1}}$`), tabs);
			cCode += "}"
		}
	}
	return cCode;
}

/**
 *	Buttons handle
 */

function popupBtn()
	{ this.classList.toggle('d-none') }

function loadLayout() {
	document.querySelector('#in-load-layout').addEventListener('input', function (ev) {
		let fr = new FileReader();
		fr.onload=function() {
			decodeUML(fr.result)
			updateUI()
		}

		fr.readAsText(this.files[0]);
	})
	document.querySelector('#in-load-layout').click()
	document.querySelector('#in-load-layout').value = ""
}
function dwlLayout() {
	let a = document.createElement('a');
	a.setAttribute('href','data:text/xml:charset=utf-8, '+encodeURIComponent(encodeUML()));
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
	document.querySelector('#textcode').value = CODEBLOCK.replace("/CODE/", '')
	flow = []
}

function changeSz() {
	if (selElem)
		selElem.querySelector('input').style.fontSize = `${this.value<1?'1':this.value}rem`
}

function changeBg() {
	if (selElem)
		selElem.querySelector('svg > *').setAttribute('fill', this.value)
}

function changeBdr() {
	if (selElem)
		selElem.querySelector('svg > *').setAttribute('stroke', this.value)
}

function deleteElement() {
	if (selElem) {
		let umlType = selElem.querySelector('svg').classList.value
		if (umlType==="start"||umlType==="end") {
			document.querySelector(`[id$=${umlType}]`).classList.remove('dragged');
			document.querySelector(`[id$=${umlType}]`).setAttribute('draggable', 'true');
		}
		
		let idx = findUMLElem(getCoords(selElem))
		flow.forEach((umlElem, i) => {
			umlElem.cons = umlElem.cons.filter(idxFlow => idxFlow!==idx)
			umlElem.cons.forEach((idxFlow, iCon) => {
				if (idxFlow>idx)
					flow[i].cons[iCon]--
			})
			flow[i].cons = umlElem.cons
		})
		flow.splice(idx, 1)
		
		selElem.querySelector('svg').remove()
		updateUI()
	}
	rmSelElem()
}

/**
 * @returns {HTMLElement}
 */
Node.prototype.nthParent = function (query) {
	let parent = this.parentElement
	while(parent.tagName !== query.toUpperCase())
		parent = parent.parentElement
	
	return parent
}

/**
 * @returns {String}
 */
HTMLDivElement.prototype.umlType = function ()
	{ return this.querySelector('svg').classList.value }

/**
 * @returns {String}
 */
HTMLDivElement.prototype.umlValue = function ()
	{ return this.querySelector('input').value }

/**
 * @returns {String}
 */
HTMLDivElement.prototype.umlBgColor = function ()
	{ return this.querySelector('svg > *').getAttribute('fill') }

/**
 * @returns {String}
 */
HTMLDivElement.prototype.umlBdrColor = function ()
	{ return this.querySelector('svg > *').getAttribute('stroke') }

/**
 * @returns {String}
 */
HTMLDivElement.prototype.umlFtSz = function ()
	{ return this.querySelector('input').style.fontSize }

/**
 * @returns {Number[]}
 */
HTMLDivElement.prototype.umlCoords = function ()
	{ return [parseInt(this.getAttribute('col')), parseInt(this.getAttribute('row'))] }

/**
 * @returns {String}
 */
HTMLDivElement.prototype.uml2CCode = function () {
	const val = this.umlValue()
	switch (this.umlType()) {
		// Next elem us only back
		case 'start':
			return `//\t${val}`
		case 'process':
			return val.length?`${val};`:""
		case 'declaration': {
			if (val.includes(":")) {
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
						defaultVal='0.0 f';
						break;
					case 'double':
						defaultVal='0.0';
						break;
					case '':
						data[1]='int';
						//don't break 'cause can execute next case
					case 'int':
						defaultVal='0';
						break;
				}
				return `${data[1]} ${data[0]} = ${defaultVal};`
			}
			else
				return val
		}
		case 'input':
			return `scanf("%d", &${val});`
		case 'output':
			return `printf("${val}");`
		case 'condition':
			return `if(${val}) `
		case 'loop':
			return `while(${val}) `
		case 'end':
			return `return 0;\n\t//\t${val}`
	}
}