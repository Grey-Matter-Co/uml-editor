document.addEventListener("DOMContentLoaded", event => {
	let layout = document.querySelector('#layout')
	
	for (let i=0; i <20*7; i++) {
		let box = document.createElement('div')
		box.classList.add('box')
		box.setAttribute('draggable', 'true')
		box.innerHTML = i
		layout.appendChild(box)
	}
	
	let dragSrcEl = null;
	
	function handleDragStart(e) {
		this.style.opacity = "0.4";
		dragSrcEl = this;
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/html", this.innerHTML);
	}
	
	function handleDragOver(e) {
		if (e.preventDefault)
			e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		return false;
	}
	
	function handleDragEnter(e) {
		this.classList.add("over");
		console.log("soltado")
	}
	
	function handleDragLeave(e) {
		this.classList.remove("over");
		console.log("agarrado")
	}
	
	function handleDrop(e) {
		if (e.stopPropagation)
			e.stopPropagation(); // stops the browser from redirecting.
		console.log("hey there")
		if (dragSrcEl !== this) {   // Intercambio de elementos
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
	
	let items = document.querySelectorAll(".container .box");
	items.forEach(function (item) {
		item.addEventListener("dragstart", handleDragStart, false);
		item.addEventListener("dragenter", handleDragEnter, false);
		item.addEventListener("dragover", handleDragOver, false);
		item.addEventListener("dragleave", handleDragLeave, false);
		item.addEventListener("drop", handleDrop, false);
		item.addEventListener("dragend", handleDragEnd, false);
	})
});