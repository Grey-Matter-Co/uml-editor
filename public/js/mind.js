const CODEBLOCK =
`#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
/CODE/
}`
/**
 * @type {JSON[]} :clown:
 * @field node {Node}
 * @field type {String}
 * @field connections {Number[]}
 */
let flow = []
let selElem = null;
let linkElems = {begin: null, end: null};
let rows

document.addEventListener("DOMContentLoaded", _ => {
	document.querySelector('#textcode').value = CODEBLOCK.replace("/CODE/", '')

	/**
	 * Toolbar setup
	 **/
	document.querySelector('.bi-download').addEventListener(
		"click",_=>{
			downloadLayout();
		}
	);
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

	layout.addEventListener('dragend', () => updateUI())
	layout.addEventListener('change', () => updateUI())
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
							.addEventListener('dblclick', _ => setLinkElem(svg))
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
		updateUI()
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

function updateUI(){
	generateCCode()
	for (const divConn of document.querySelectorAll('#layout > .connection'))
		divConn.remove()

	for (const UMLBegin of flow) {
		for (const idxEnd of UMLBegin.connections) {
			drawLink(UMLBegin.node, flow[idxEnd].node)
		}
	}
}

const isSymbol = element =>
	/^uml-/i.test(element.id)

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
const rmLinkElem = () => {
	linkElems = { begin: null, end: null }
}

const mkLink = () => {
	let iBegin, iEnd,
		isLinked;
	// Adds begin element
	isLinked = flow.some((UMLElem, idx) => {
		if (UMLElem.node === linkElems.begin) {
			iBegin = idx;
			return true
		} else
			return false
	})
	if (!isLinked)
		iBegin = flow.push({
			node: linkElems.begin,
			type: linkElems.begin.parentNode.elemType(),
			connections: []
		})-1
	// Adds end element
	isLinked = flow.some((UMLElem, idx) => {
		if (UMLElem.node === linkElems.end)
		{ iEnd = idx; return true }
		else
			return false
	})
	if (!isLinked)
		iEnd = flow.push({
			node: linkElems.end,
			type: linkElems.end.parentNode.elemType(),
			connections: []
		})-1

	flow[iBegin].connections.push(iEnd)
	updateUI()
	console.log("flow: "+JSON.stringify(flow, null, 4))
}

const drawLink = (UMLBegin, UMLEnd) => {
	const offsetX = document.querySelector("body > main > div").getBoundingClientRect().width
	const offsetY = document.querySelector("body > div.title").getBoundingClientRect().height

	let x1, y1, x2, y2, beginCoords, endCoords;
	beginCoords = UMLBegin.getBoundingClientRect()
	endCoords = UMLEnd.getBoundingClientRect()
	if (beginCoords.left<endCoords.left) {
		x1 = (beginCoords.left-offsetX)+(beginCoords.width/2)-10
		x2 = (endCoords.left-offsetX)+(endCoords.width/2)-10
	}
	else {
		x1 = (endCoords.left-offsetX)+(endCoords.width/2)-10
		x2 = (beginCoords.left-offsetX)+(beginCoords.width/2)-10
	}
	if (beginCoords.top<endCoords.top) {
		y1 = (beginCoords.top-offsetY)+beginCoords.height-10
		y2 = (endCoords.top-offsetY)
	}
	else {
		y1 = (endCoords.top-offsetY)+endCoords.height-10
		y2 = (beginCoords.top-offsetY)
	}



	let createRow = document.createElement('div')
	createRow.classList.add('connection')
	createRow.style.position="Absolute"
	createRow.style.left=x1+"px"
	createRow.style.top=y1+"px"

	createRow.innerHTML = '<svg width="'+(Math.abs(x2-x1)+20)+'" height="'+(Math.abs(y2-y1))+'" xmlns="http://www.w3.org/2000/svg">' +
		'<g>' +
			'<line id="svg_2" stroke="black" fill="black" stroke-width="5.5" x1="0" y1="0" x2="'+Math.abs(x2-x1)+'" y2="'+Math.abs(y2-y1)+'" stroke-linejoin="null" stroke-linecap="null"></line>' +
			'<path id="svg_9" transform="rotate(89.3603 152.594 14.6817)" fill="black" stroke-width="1.5" d="m142.14651,24.21188l10.4478,-19.06026l10.44754,19.06026l-20.89534,0z" stroke="black"></path>' +
		'</g>' +
		'</svg>';
	document.querySelector("#layout" ).appendChild(createRow)

}



const downloadLayout  = _ => {
	// generacion del xml
	let xmlLayout=document.querySelector('#layout').innerHTML;

	let a = document.createElement('a');
	a.setAttribute('href','data:text/xml:charset=utf-8, '+encodeURIComponent(xmlLayout));
	a.setAttribute('download','diagramaDeFlujo.xml');
	document.body.appendChild(a);
	a.click();
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
			return null;
	}
}

