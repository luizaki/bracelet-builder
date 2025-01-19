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