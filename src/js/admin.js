import { createClient } from '@supabase/supabase-js';

// init supabase
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

supabase.auth.getSession().then(({ data, error }) => {
    if(data.session) {
        document.getElementById('content').classList = 'visible';
    } else {
        window.location.href = 'login.html';
    }
})

// main divs
const options = document.getElementById('options');
const orders = document.getElementById('orders-content');
const stock = document.getElementById('stock-content');

// rows div
const orderRows = document.getElementById('order-rows');
const stockRows = document.getElementById('beads-rows');

// popup div
const popup = document.getElementById('bracelet-popup');
const closeBtn = document.getElementById('close-button');
const popupContent = document.getElementById('bracelet-details');

// back buttons
const backButtons = document.querySelectorAll('.back-button');
backButtons.forEach((button) => {
    button.addEventListener('click', () => {
        orders.classList.add('hidden');
        stock.classList.add('hidden');
        options.classList.remove('hidden');
    });
});

// handling page changes
document.getElementById('orders-button').addEventListener('click', () => {
    options.classList.add('hidden');
    orders.classList.remove('hidden');
    loadOrders();
});

document.getElementById('stock-button').addEventListener('click', () => {
    options.classList.add('hidden');
    stock.classList.remove('hidden');
    loadStock();
});

document.getElementById('signout-button').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
});

// for managing orders
async function loadOrders() {
    const { data: orderData, error: orderError } = await supabase.from('orders').select().order('created_at', { ascending: true });

    if(orderError) {
        console.error('Error when loading orders:', error);
        return;
    }

    const { data: braceletData, error: braceletError } = await supabase.from('bracelets').select();

    if(braceletError) {
        console.error('Error when loading bracelets:', error);
        return;
    } else if (braceletData.length === 0) {
        console.error('No bracelets found.');
        return;
    }

    // reset table
    orderRows.innerHTML = '';

    orderData.forEach(order => {
        const row = document.createElement('tr');
        
        const orderDate = formatDate(order.created_at);

        let numCompleted = 0;
        let braceletCount = 0;
        braceletData.forEach(bracelet => {
            if(bracelet.order_id === order.id) {
                braceletCount++;

                if(bracelet.is_built) {
                    numCompleted++;
                }
            }
        });

        row.innerHTML = `
            <td class="border border-gray-300 p-2 text-center">${order.id}</td>
            <td class="border border-gray-300 p-2 text-center">${order.name}</td>
            <td class="border border-gray-300 p-2 text-center">${orderDate}</td>
            <td class="border border-gray-300 p-2 text-center">
                <span>${braceletCount}</span>
                <span><ion-icon name="eye-outline" id="${order.id}-btn" class="view-icon hover:text-gray-800 cursor-pointer text-lg"></ion-icon></span>
            </td>
            <td class="border border-gray-300 p-2 text-center">${numCompleted === braceletCount ? "Yes" : "No"}</td>
            <td class="border border-gray-300 p-2 text-center">
                <input type="checkbox" id="${order.id}-claimed" ${order.is_claimed ? "checked" : ''} ${numCompleted === braceletCount ? '' : "disabled"} class="claimed-check" data-order-id="${order.id}"></input>
            </td>
        `;

        orderRows.appendChild(row);
    });

    const viewIcons = document.querySelectorAll('.view-icon');
    viewIcons.forEach(icon => {
        icon.addEventListener('click', openBraceletPopup);
    });

    const claimedChecks = document.querySelectorAll('.claimed-check');
    claimedChecks.forEach(check => {
        check.addEventListener('change', async () => {
            const { error } = await supabase.from('orders').update({ is_claimed: check.checked }).eq('id', check.id.slice(0, -8));

            if (error) {
                console.error('Error updating order status:', error);
            }
        });
    });
}

function formatDate(date) {
    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${month}/${day}/${year} ${hours}:${minutes}`;
}

async function openBraceletPopup(e) {
    const orderId = e.target.id.slice(0, -4);

    popup.classList.remove('hidden');

    closeBtn.addEventListener('click', () => {
        popup.classList.add('hidden');
        popupContent.innerHTML = '';
        loadOrders();
    });

    const { data: braceletData, error: braceletError } = await supabase.from('bracelets').select().eq('order_id', orderId);

    if(braceletError) {
        console.error('Error when loading bracelets:', error);
        return;
    }

    const { data: beadData, error: beadError } = await supabase.from('beads').select().order('created_at', { ascending: true });

    if(beadError) {
        console.error('Error when loading beads:', error);
        return;
    }

    braceletData.forEach(bracelet => {
        const braceletWrapper = document.createElement("div");
        braceletWrapper.classList.add("flex", "flex-col", "gap-2", "items-center", "justify-between", "p-4", "mt-0");
        braceletWrapper.dataset.index = braceletData.length - 1;

        const braceletHeader = document.createElement('h3');
        braceletHeader.classList.add("m-0", "font-bold");
        braceletHeader.textContent = `Bracelet ${parseInt(braceletWrapper.dataset.index) + 1}`;

        braceletWrapper.appendChild(braceletHeader);

        const completeLabel = document.createElement('label');
        completeLabel.classList.add("flex", "items-center", "gap-2", "mt-1");

        const completeCheckbox = document.createElement('input');
        completeCheckbox.type = "checkbox";
        completeCheckbox.checked = bracelet.is_built || false;

        const completeText = document.createElement('span');
        completeText.textContent = "Mark as complete";

        completeLabel.appendChild(completeCheckbox);
        completeLabel.appendChild(completeText);

        completeCheckbox.addEventListener('change', async () => {
            const { error } = await supabase.from('bracelets').update({ is_built: completeCheckbox.checked }).eq('id', bracelet.id);

            if (error) {
                console.error('Error updating bracelet status:', error);
            }
        });
    
        braceletWrapper.appendChild(completeLabel);

        const braceletDiv = document.createElement('div');
        braceletDiv.classList.add("flex", "flex-wrap", "justify-center", "items-center");

        bracelet.beads.forEach(bead => {
            const beadDiv = createBeadElement(beadData.find(b => b.id === bead.id));
            braceletDiv.appendChild(beadDiv);
        });

        braceletWrapper.appendChild(braceletDiv);

        popupContent.appendChild(braceletWrapper);
    });
}

function createBeadElement(bead) {
    const beadElement = document.createElement('div');
    beadElement.className = 'm-1 rounded-full';
    beadElement.id = `bead-${bead.id}`;
    beadElement.title = bead.proper_name;

    if(bead.type === 'color') {
        beadElement.classList.add('w-5', 'h-5');
        if(bead.id === 'white') {
            beadElement.classList.add("bg-white", "text-black", "border", "border-gray-400");
        } else {
            beadElement.style.backgroundColor = bead.color;
        }
    } else if(bead.type === 'letter') {
        beadElement.classList.add("w-8", "h-8", "bg-white", "text-black", "border", "border-gray-400", "flex", "items-center", "justify-center", "text-center", "font-bold");
        beadElement.textContent = bead.proper_name;
    } else if(bead.type === 'misc') {
        if((bead.id).includes('heart')) {
            beadElement.classList.add("w-8", "h-8", "bg-white", "text-black", "border", "border-gray-400", "flex", "items-center", "justify-center");

            // create heart inside div
            const heart = document.createElement('ion-icon');
            heart.setAttribute('name', 'heart');
            heart.style.fontSize = '1.25rem';
            heart.style.color = bead.color;
            heart.style.pointerEvents = 'none';

            beadElement.appendChild(heart);
        } else if((bead.id).includes('smiley')) {
            beadElement.classList.add("w-8", "h-8", "flex", "items-center", "justify-center", "relative");
            beadElement.style.backgroundColor = bead.color;

            const leftEye = document.createElement('div');
            leftEye.classList.add("w-1", "h-1", "bg-white", "rounded-full", "absolute", "top-3", "left-2");
            const rightEye = document.createElement('div');
            rightEye.classList.add("w-1", "h-1", "bg-white", "rounded-full", "absolute", "top-3", "right-2");
            const mouth = document.createElement('div');
            mouth.classList.add("w-4", "h-2", "rounded-b-full", "border-b-4", "border-white", "absolute", "bottom-1.5", "left-2");

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

// for updating stock
async function loadStock() {
    const { data, error } = await supabase.from('beads').select().order('created_at', { ascending: true });

    if(error) {
        console.error('Error when loading beads:', error);
        return;
    }

    // reset table
    stockRows.innerHTML = '';
    
    data.forEach(bead => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td class="border border-gray-300 p-2 text-center">${bead.proper_name}</td>
            <td class="border border-gray-300 p-2 text-center">${bead.type}</td>
            <td id="${bead.id}" class="border border-gray-300 p-2 text-center">
                <span id="${bead.id}-qty">${bead.qty}</span>
                <span><ion-icon id="${bead.id}-btn" name="create-outline" class="edit-icon hover:text-gray-800 cursor-pointer text-lg"></ion-icon></span>
            </td>
        `;

        stockRows.appendChild(row);
    });

    const editIcons = document.querySelectorAll('.edit-icon');
    editIcons.forEach(icon => {
        icon.addEventListener('click', editStock);
    });
}

async function editStock(e) {
    const bead = e.target.id.slice(0, -4);
    const qty = document.getElementById(`${bead}-qty`);

    const newQty = prompt(`Enter new quantity for ${bead}:`, qty.textContent);

    if(newQty === null) {
        return;
    } else if (newQty === '' || isNaN(newQty) || newQty < 0) {
        alert('Please enter a valid quantity.');
        return;
    } else {
        const { data, error } = await supabase.from('beads').update({ qty: newQty }).eq('id', bead);

        loadStock();
    }
}