let nodes = [];
let selectedNode = null;
let arcos = [];

function getNodeAt(x, y, nodes) {
	for (let index = 0; index < nodes.length; index++) {
		const node = nodes[index];
		const a = x - node.x;
		const b = y - node.y;
		
		const c = Math.sqrt(a * a + b * b);
		
		if (c < 90) {
			return node;
		}
	}
	return null;
}

function drawNodes(ctx, nodes) {
	for (let index = 0; index < nodes.length; index++) {
		const node = nodes[index];
		
		if (node === selectedNode) {
			ctx.strokeStyle = "#FF0000";
		} else {
			ctx.strokeStyle = "#000000";
		}
		
		ctx.beginPath();
		ctx.lineWidth = 4;
		ctx.fillStyle = "#FFFFFF";
		ctx.arc(node.x, node.y, 40, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.fill();
		
		if (node === selectedNode) {
			ctx.fillStyle = "#FF0000";
		} else {
			ctx.fillStyle = "#000000";
		}
		
		ctx.font = "30px Arial";
		ctx.fillText(index, node.x - 5, node.y + 5);
	}
}

function drawArcos(ctx, arcos) {
	for (let index = 0; index < arcos.length; index++) {
		const arco = arcos[index];
		ctx.moveTo(arco.node1.x, arco.node1.y);
		ctx.lineTo(arco.node2.x, arco.node2.y);
		ctx.strokeStyle = "#000000";
		ctx.stroke();
	}
}


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
		let layout = document.querySelector('#layout')
		
		for (let i=0; i <20*7; i++) {
			let box = document.createElement('div')
			box.classList.add('box')
			box.setAttribute('draggable', 'true')
			box.innerHTML =  `${i}`
			layout.appendChild(box)
		}
		
	 */
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
	
	
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");
	
	canvas.addEventListener("click", (e) => {
		let x = e.clientX - canvas.offsetLeft;
		let y = e.clientY - canvas.offsetTop;
		
		let tempNode = getNodeAt(x, y, nodes);
		
		if (selectedNode !== null && tempNode === null) {
			selectedNode = tempNode;
			tempNode = null;
		}
		
		if (selectedNode === null) {
			selectedNode = tempNode;
			tempNode = null;
		}
		
		if (selectedNode === null) {
			nodes.push({ x, y });
		}
		
		context.clearRect(0, 0, canvas.width, canvas.height);
		
		if (selectedNode !== null && tempNode !== null) {
			arcos.push({ node1: selectedNode, node2: tempNode });
			selectedNode = null;
			tempNode = null;
		}
		drawArcos(context, arcos);
		drawNodes(context, nodes);
	});
});

let isSymbol = (element) =>
	/^uml-/i.test(element.id)