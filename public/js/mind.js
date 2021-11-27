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
	
	function handleDragEnter(e) {
		this.classList.add("over");
	}
	
	function handleDragLeave(e) {
		this.classList.remove("over");
	}
	
	function handleDrop(e) {
		if (e.stopPropagation)
			e.stopPropagation(); // stops the browser from redirecting.
		if (isSymbol(dragSrcEl) && isSymbol(this))
			{}  // Do nothing if both are symbols
		else if (isSymbol(dragSrcEl) && !isSymbol(this))
			alert("Asignando a layout")
		else if (dragSrcEl !== this) {   // Intercambio de elementos
			console.log(`${dragSrcEl.innerHTML} => ${this.innerHTML}`)
			dragSrcEl.innerHTML = this.innerHTML;
			this.innerHTML = e.dataTransfer.getData("text/html");
		}
		return false;
	}
	
	function handleDragEnd(e) {
		this.style.opacity = "1";
		items.forEach(item => {
			item.classList.remove("over");
		});
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