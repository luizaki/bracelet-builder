import { createClient } from '@supabase/supabase-js';

// init supabase
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

// divs for the builder
const braceletPreview = document.getElementById("bracelet-preview");
const colorContainer = document.getElementById('color-beads');
const letterContainer = document.getElementById('letter-beads');
const miscContainer = document.getElementById('misc-beads');

// divs for saving bracelets
const saveButton = document.getElementById('save-button');
const savedBracelets = document.getElementById('saved-bracelets');

// divs for submitting orders
const billing = document.getElementById('billing-details');
const orderForm = document.getElementById('order-form');
const form = document.getElementById('form');

const toggableContainer = document.getElementById('bracelet-bill-container');

// for drag/drop events
let draggedBead = null;

// tracking bracelets
let bracelets = [];

// for bead tracking
let localStock = {};

// consts
const MAX_BRACELET_SIZE = 90;
const MIN_BRACELET_SIZE = 75;
const COLOR_SIZE = 1;
const LETTER_MISC_SIZE = 3;

const pricePerPair = 60;
const pricePerSolo = 39;

// fetch beads table
async function fetchBeads() {
    const { data, error } = await supabase.from('beads').select().order('created_at', { ascending: true });
  
    if(error) {
        console.error('Error fetching beads:', error);
        return [];
    }
  
    return data;
}

async function populateBeads() {
    const beads = await fetchBeads();

    beads.forEach(bead => {
        localStock[bead.id] = bead.qty;
        const beadElement = createBeadElement(bead);

        if(bead.qty > 0){
            // add click listener to add to bracelet-preview
            beadElement.addEventListener('click', addToBraceletHandler);
        } else {
            beadElement.addEventListener('click', addToBraceletHandler);
            beadElement.classList.add("opacity-50");
            beadElement.title += ' (out of stock)';
        }

        // add hover classes for ux
        beadElement.classList.add("cursor-pointer", "hover:scale-110", "transition-transform");

        if(bead.type === 'color') {
            colorContainer.appendChild(beadElement);
        } else if(bead.type === 'letter') {
            letterContainer.appendChild(beadElement);
        } else if(bead.type === 'misc') {
            miscContainer.appendChild(beadElement);
        }
    });
}

function createBeadElement(bead) {
    const beadElement = document.createElement('div');
    beadElement.className = 'm-2 w-10 h-10 rounded-full';
    beadElement.id = `bead-${bead.id}`;
    beadElement.title = bead.proper_name;

    if(bead.type === 'color') {
        if(bead.id === 'white') {
            beadElement.classList.add("bg-white", "text-black", "border", "border-gray-400");
        } else {
            beadElement.style.backgroundColor = bead.color;
        }
    } else if(bead.type === 'letter') {
        beadElement.classList.add("bg-white", "text-black", "border", "border-gray-400", "flex", "items-center", "justify-center", "text-center", "font-bold");
        beadElement.textContent = bead.proper_name;
    } else if(bead.type === 'misc') {
        if((bead.id).includes('heart')) {
            beadElement.classList.add("bg-white", "text-black", "border", "border-gray-400", "flex", "items-center", "justify-center");

            // create heart inside div
            const heart = document.createElement('ion-icon');
            heart.setAttribute('name', 'heart');
            heart.style.fontSize = '1.25rem';
            heart.style.color = bead.color;
            heart.style.pointerEvents = 'none';

            beadElement.appendChild(heart);
        } else if((bead.id).includes('smiley')) {
            beadElement.classList.add("flex", "items-center", "justify-center", "relative");
            beadElement.style.backgroundColor = bead.color;

            const leftEye = document.createElement('div');
            leftEye.classList.add("w-2", "h-2", "bg-white", "rounded-full", "absolute", "top-3", "left-2");
            const rightEye = document.createElement('div');
            rightEye.classList.add("w-2", "h-2", "bg-white", "rounded-full", "absolute", "top-3", "right-2");
            const mouth = document.createElement('div');
            mouth.classList.add("w-6", "h-2", "rounded-b-full", "border-b-4", "border-white", "absolute", "bottom-2", "left-2");

            // create smiley inside div
            const smiley = document.createElement('div');
            smiley.appendChild(leftEye);
            smiley.appendChild(rightEye);
            smiley.appendChild(mouth);
            smiley.style.pointerEvents = 'none';

            beadElement.appendChild(smiley);
        }
    } else {
        console.warn('Unknown bead type:', bead.type);
    }

    return beadElement;
}

function addToBraceletHandler(e) {
    addToBracelet(e.target);
}

function addToBracelet(bead, deductStock = true) {
    // check if bead is out of stock
    if(bead.classList.contains('opacity-50')) {
        displayMessage(document.getElementById('preview'), 'This bead is out of stock!', 'error');
        return;
    }
    
    // check if bracelet is full
    const currentUnits = calculateTotalUnits(Array.from(braceletPreview.children));
    const beadUnit = bead.classList.contains('items-center') ? LETTER_MISC_SIZE : COLOR_SIZE;

    if(currentUnits + beadUnit <= MAX_BRACELET_SIZE) {
        const newBead = bead.cloneNode(true);
        newBead.setAttribute('draggable', 'true');

        // resize color beads
        if(!(newBead.classList.contains('items-center'))) {
            newBead.classList.remove('w-10', 'h-10');
            newBead.classList.add('w-7', 'h-7');
        }

        // change margin
        newBead.classList.remove('m-2');
        newBead.classList.add('m-1');

        // add remove listener
        newBead.addEventListener('click', () => {
            newBead.remove();
            if (localStock[(bead.id).slice(5)] <= 0) {
                bead.classList.remove('opacity-50');
                bead.title = bead.title.slice(0, -15);
                bead.addEventListener('click', addToBraceletHandler);
                updateRemainingSpace();
            }
            localStock[(bead.id).slice(5)] += 1;

            updateRemainingSpace();
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

            if(afterElement == null) {
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
        updateRemainingSpace();

        // update stock
        if(deductStock) {
            localStock[(bead.id).slice(5)] -= 1;
        }

        if(localStock[(bead.id).slice(5)] <= 0) {
            bead.classList.add('opacity-50');
            bead.title += ' (out of stock)';
            bead.removeEventListener('click', addToBraceletHandler);
        }
    } else {
        displayMessage(document.getElementById('preview'), 'Bracelet is full!', 'error');
        return;
    }
}

// get how much space is currently in the bracelet
function calculateTotalUnits(beads) {
    return beads.reduce((total, bead) => {
        if(bead.classList.contains('items-center')) {
            return total + LETTER_MISC_SIZE;
        } else {
            return total + COLOR_SIZE;
        }
    }, 0);
}

function updateRemainingSpace() {
    const currentUnits = calculateTotalUnits(Array.from(braceletPreview.children));
    const remainingUnits = MAX_BRACELET_SIZE - currentUnits;
    const remainingUnits2 = MIN_BRACELET_SIZE - currentUnits >= 0 ? MIN_BRACELET_SIZE - currentUnits : 0;

    document.getElementById('remaining-space').textContent = `Approx. remaining space: ${remainingUnits2} - ${remainingUnits} beads`;
}

// add listener for drag/drop events in bracelet-preview
braceletPreview.addEventListener('dragover', (e) => {
    e.preventDefault();

    const afterElement = getDragAfterElement(braceletPreview, e.clientX);

    if(afterElement == null) {
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
        if(offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// save bracelet to make new bracelet
saveButton.addEventListener('click', () => {
    if(braceletPreview.children.length === 0) {
        displayMessage(document.getElementById('preview'), 'Add some beads to the bracelet first!', 'error');
        return;
    } else if(calculateTotalUnits(Array.from(braceletPreview.children)) < MIN_BRACELET_SIZE) {
        displayMessage(document.getElementById('preview'), 'Bracelet is too small!', 'error');
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

    beads.forEach((bead) => {
        bead.classList.remove('cursor-pointer', 'hover:scale-110', 'transition-transform');
        braceletDisplay.appendChild(bead);
    });

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
    updateRemainingSpace();

    // update billing
    updateBilling();

    // update stock on db
    syncStock();

    displayMessage(document.getElementById('preview'), 'Bracelet saved!', 'success');
});

function editBracelet(index) {
    // retrieve beads
    const beads = bracelets[index];

    // re-add beads to preview
    beads.forEach(bead => {
        bead.classList.add('cursor-pointer', 'hover:scale-110', 'transition-transform');
        addToBracelet(bead, false);
    });

    // remove from savedBracelets
    bracelets.splice(index, 1);
    savedBracelets.children[index].remove();
}

function deleteBracelet(index) {
    // restock beads
    const beads = bracelets[index];
    beads.forEach(bead => {
        if (localStock[(bead.id).slice(5)] <= 0) {
            const beadButton = document.getElementById('bead-selector').querySelector(`#${bead.id}`);
            beadButton.classList.remove('opacity-50');
            beadButton.title = bead.title.slice(0, -15);
            beadButton.addEventListener('click', addToBraceletHandler);
        }
        
        localStock[(bead.id).slice(5)] += 1;
    });

    syncStock();

    bracelets.splice(index, 1);
    savedBracelets.children[index].remove();

    Array.from(savedBracelets.children).forEach((wrapper, newIndex) => {
        wrapper.dataset.index = newIndex;
    });
}

// track billing
function updateBilling() {
    // hide if no bracelets are made/bracelets are deleted
    if(bracelets.length === 0) {
        toggableContainer.style.display = 'none';
    } else {
        toggableContainer.style.display = 'block';

        const braceletCount = bracelets.length;

        const singleBracelets = braceletCount % 2;
        const pairBracelets = Math.floor(braceletCount / 2);

        const soloPrice = singleBracelets * pricePerSolo;
        const pairPrice = pairBracelets * pricePerPair;

        billing.innerHTML = '<p class="font-bold">Order Summary:</p>'; // reset the billing

        billing.innerHTML += `<div class="grid grid-cols-3 gap-1 mt-1">`;

        if(singleBracelets > 0) {
            billing.innerHTML += `<div class="flex justify-between"><span>Bead bracelets</span><span class="text-center">(${singleBracelets}x)</span><span class="text-right">Php ${soloPrice}</span></div>`;
        }

        if(pairBracelets > 0) {
            billing.innerHTML += `<div class="flex justify-between"><span>Bead bracelets (pair)</span><span class="text-center">(${pairBracelets}x)</span><span class="text-right">Php ${pairPrice}</span></div>`;
        }

        billing.innerHTML += `<hr class="border-t-2 m-0 border-gray-300" /><div class="flex justify-between"><span class="font-bold mt-2">Total</span><span></span><span class="text-right">Php ${soloPrice + pairPrice}</span></div></div>`;
    }
}

// update stock to db
async function syncStock() {
    const formattedStock = Object.entries(localStock).map(([id, qty]) => ({
        id,
        qty,
    }));
    
    const { error } = await supabase.from('beads').upsert(formattedStock);
}

// handling submitted orders
orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    const name = formData.get('full-name');
    const email = formData.get('email');
    const phoneNumber = formData.get('phone')
    const proofOfPayment = formData.get('proof-of-payment');
    console.log(proofOfPayment)

    try {
        if(proofOfPayment.name !== '') {
            // upload proof of payment if exists
            const file = `${formatDate(Date.now())}-${name.replaceAll(' ', '')}.${proofOfPayment.name.split('.').pop().toLowerCase()}`;
            const { data: fileData, error: fileError } = await supabase.storage.from('proof-of-payments').upload(file, proofOfPayment);

            if(fileError) {
                console.error(fileError);
                displayMessage(orderForm, 'An error occurred while uploading the file.', 'error');
                return;
            }

            const proofOfPaymentFile = proofOfPayment.name === '' ? '' : `proof-of-payments/${file}`;

            // upload order data
            const { data: orderData, error: orderError } = await supabase.from('orders').insert([
                {
                    name: name,
                    email: email,
                    phone_number: phoneNumber,
                    proof_of_payment: proofOfPaymentFile,
                }
            ]).select();

            if(orderError) {
                console.error(orderError);
                displayMessage(orderForm, 'An error occurred while submitting the order.', 'error');
                return;
            }
        }

        // upload order data
        const { data: orderData, error: orderError } = await supabase.from('orders').insert([
            {
                name: name,
                email: email,
                phone_number: phoneNumber
            }
        ]).select();

        if(orderError) {
            console.error(orderError);
            displayMessage(orderForm, 'An error occurred while submitting the order.', 'error');
            return;
        }

        // upload bracelet data
        for(const bracelet of bracelets) {
            const { error: braceletError } = await supabase.from('bracelets').insert([
                {
                    order_id: orderData[0].id,
                    beads: convertBraceletToJson(bracelet),
                }
            ]);

            if(braceletError) {
                console.error(braceletError);
                displayMessage(orderForm, 'An error occurred while submitting the bracelet.', 'success');
                return;
            }
        }

        displayMessage(orderForm, 'Order submitted successfully!', 'success');

        // reset page
        setTimeout(() => {
            location.reload();
        }, 1500);

    } catch (error) {
        console.error(error);
        displayMessage(orderForm, 'An unexpected error occurred.', 'error');
    }
});

// helper function to format date in filename
function formatDate(date) {
    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${year}${month}${day}-${hours}${minutes}`;
}

// convert bead array to json for database
function convertBraceletToJson(beads) {
    return beads.map((bead, index) => ({
        id: (bead.id).slice(5), // remove bead- prefix
        position: index
    }));
}

// helper function for success/error messages
function displayMessage(div, message, type) {
    const messageDiv = document.createElement('div');

    messageDiv.className = `text-center p-3 ${type === 'error' ? 'text-red-600' : 'text-green-600'}`;
    messageDiv.textContent = message;

    div.appendChild(messageDiv);

    setTimeout(() => {
        div.removeChild(messageDiv);
    }, 2000);
}

populateBeads();

// hide by default
toggableContainer.style.display = 'none';