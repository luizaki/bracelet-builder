import { createClient } from '@supabase/supabase-js';

// init supabase
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

// divs
const braceletPreview = document.getElementById("bracelet-preview");
const colorContainer = document.getElementById('color-beads');
const letterContainer = document.getElementById('letter-beads');
const miscContainer = document.getElementById('misc-beads');
const saveButton = document.getElementById('save-button');
const savedBracelets = document.getElementById('saved-bracelets');

// for drag/drop events
let draggedBead = null;

// tracking bracelets
let bracelets = [];

// fetch beads table
async function fetchBeads() {
    const { data, error } = await supabase.from('beads').select().order('created_at', { ascending: true });
  
    if (error) {
        console.error('Error fetching beads:', error);
        return [];
    }
  
    return data;
}

async function populateBeads() {
    const beads = await fetchBeads();

    beads.forEach(bead => {

        // create bead element
        const beadElement = document.createElement('div');
        beadElement.className = 'm-2 w-10 h-10 rounded-full cursor-pointer';
        beadElement.classList.add("cursor-pointer", "hover:scale-110", "transition-transform");
        beadElement.id = `bead-${bead.id}`;
        beadElement.title = bead.proper_name;

        if (bead.type === 'color') {
            if (bead.id === 'white') {
                beadElement.classList.add("bg-white", "text-black", "border", "border-gray-400");
            } else {
                beadElement.style.backgroundColor = bead.color;
            }

            colorContainer.appendChild(beadElement);
        } else if (bead.type === 'letter') {
            beadElement.classList.add("bg-white", "text-black", "border", "border-gray-400", "flex", "items-center", "justify-center", "text-center", "font-bold");
            beadElement.textContent = bead.proper_name;

            letterContainer.appendChild(beadElement);
        } else if (bead.type === 'misc') {
            beadElement.classList.add("bg-white", "text-black", "border", "border-gray-400", "flex", "items-center", "justify-center");

            // create heart inside div
            const heart = document.createElement('ion-icon');
            heart.setAttribute('name', 'heart');
            heart.style.fontSize = '1.25rem';
            heart.style.color = bead.color;

            beadElement.appendChild(heart);

            miscContainer.appendChild(beadElement);
        } else {
            console.warn('Unknown bead type:', bead.type);
        }

        // add click listener to add to bracelet-preview
        beadElement.addEventListener('click', () => {
            addToBracelet(beadElement);
        });
    });
  }

function addToBracelet(bead) {
    const newBead = bead.cloneNode(true);
    newBead.setAttribute('draggable', 'true');

    // resize color beads
    if (!(newBead.classList.contains('items-center'))) {
        newBead.classList.remove('w-10', 'h-10');
        newBead.classList.add('w-7', 'h-7');
    }

    // change margin
    newBead.classList.remove('m-2');
    newBead.classList.add('m-1');

    // for tracking purposes
    newBead.classList.add('bracelet-bead');

    // add remove listener
    newBead.addEventListener('click', () => {
        newBead.remove();
    });

    // add drag even listeners (desktop)
    newBead.addEventListener('dragstart', (e) => {
        draggedBead = newBead;
        newBead.classList.add('opacity-50');
    });
    
    newBead.addEventListener('dragend', () => {
        draggedBead = null;
        newBead.classList.remove('opacity-50');
    });

    // add touch event listeners (mobile)
    newBead.addEventListener('touchstart', (e) => {
        draggedBead = newBead;
        initialTouchX = e.touches[0].clientX;
        newBead.classList.add('opacity-50');
    });

    newBead.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touchX = e.touches[0].clientX;
        const afterElement = getDragAfterElement(braceletPreview, touchX);
        if (afterElement == null) {
            braceletPreview.appendChild(draggedBead);
        } else {
            braceletPreview.insertBefore(draggedBead, afterElement);
        }
    });

    newBead.addEventListener('touchend', () => {
        draggedBead = null;
        newBead.classList.remove('opacity-50');
    });

    braceletPreview.appendChild(newBead);
}

// add listener for drag/drop events in bracelet-preview
braceletPreview.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(braceletPreview, e.clientX);
    if (afterElement == null) {
        braceletPreview.appendChild(draggedBead);
    } else {
        braceletPreview.insertBefore(draggedBead, afterElement);
    }
});

// get element to insert dragged bead after for reordering
function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.opacity-50)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// save bracelet to make new bracelet
saveButton.addEventListener('click', () => {
    if (braceletPreview.children.length === 0) {
        alert('Add some beads to the bracelet first!');
        return;
    }

    // get beads from bracelet preview to save
    const beads = Array.from(braceletPreview.children).map((bead) => bead.cloneNode(true));
    bracelets.push(beads);

    const braceletWrapper = document.createElement("div");
    braceletWrapper.classList.add("flex", "flex-col", "gap-2", "items-center", "justify-between", "p-4", "bg-white", "rounded-lg", "shadow");
    braceletWrapper.dataset.index = bracelets.length - 1;

    const braceletDisplay = document.createElement("div");
    braceletDisplay.classList.add("flex", "flex-wrap", "justify-center", "items-center");

    beads.forEach((bead) => braceletDisplay.appendChild(bead));

    // edit/delete buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("flex", "gap-4", "mt-2");

    const editButton = document.createElement("button");
    const edit = document.createElement('ion-icon');
    edit.setAttribute('name', 'pencil');
    editButton.appendChild(edit);
    editButton.classList.add("bg-yellow-500", "text-white", "py-1", "px-4", "rounded", "hover:bg-yellow-600");
    editButton.onclick = () => editBracelet(braceletWrapper.dataset.index);

    const deleteButton = document.createElement("button");
    const deleteIcon = document.createElement('ion-icon');
    deleteIcon.setAttribute('name', 'trash');
    deleteButton.appendChild(deleteIcon);
    deleteButton.classList.add("bg-red-500", "text-white", "py-1", "px-4", "rounded", "hover:bg-red-600");
    deleteButton.onclick = () => deleteBracelet(braceletWrapper.dataset.index);

    // form the full bracelet div
    buttonContainer.append(editButton, deleteButton);
    braceletWrapper.append(braceletDisplay, buttonContainer);
    savedBracelets.appendChild(braceletWrapper);

    // clear bracelet preview
    braceletPreview.innerHTML = "";
    alert('Bracelet saved!');
});

function editBracelet(index) {
    // retrieve beads
    const beads = bracelets[index];

    // re-add beads to rpeview
    beads.forEach(bead => {
        addToBracelet(bead);
    });

    // remove from savedBracelets
    bracelets.splice(index, 1);
    savedBracelets.children[index].remove();
}

function deleteBracelet(index) {
    bracelets.splice(index, 1);
    savedBracelets.children[index].remove();

    Array.from(savedBracelets.children).forEach((wrapper, newIndex) => {
        wrapper.dataset.index = newIndex;
    });
}

populateBeads();