let clickedEl = null;

document.addEventListener("DOMContentLoaded", _ => {
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

	for (let i=0; i <100; i++) {
		let box = document.createElement('div')
		box.classList.add('box')
		box.setAttribute('draggable', 'true')
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
				clickedEl = dragSrcEl.firstChild
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
							clickedEl = this.firstChild
							deleteElement()
						}
						this.innerHTML = svgText
						this.firstChild.classList.add(tipo)
						this.firstChild.addEventListener('click', function () {
							clickedEl = this
						})
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

let isSymbol = (element) =>
	/^uml-/i.test(element.id)

function changeBg(input){
	if (clickedEl)
		clickedEl.firstChild.setAttribute('fill', input.value)
}

function changeBorder(input){
	if (clickedEl)
		clickedEl.firstChild.setAttribute('stroke', input.value)
}

function deleteElement(){
	if (clickedEl.classList.contains("start")||clickedEl.classList.contains("end")) {
		document.querySelector(`[id$=${clickedEl.classList.value}]`).classList.remove('dragged');
		document.querySelector(`[id$=${clickedEl.classList.value}]`).setAttribute('draggable', 'true');
	}
	if (clickedEl)
		clickedEl.remove()
	clickedEl = null;
}

function clearLayout() {
	for(const box of document.querySelectorAll('.box'))
		if (box.innerHTML !=='') {
			clickedEl = box.firstChild
			deleteElement()
		}
}