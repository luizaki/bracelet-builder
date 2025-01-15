import { createClient } from '@supabase/supabase-js';

// init supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// divs
const braceletPreview = document.getElementById("bracelet-preview");
const colorContainer = document.getElementById('color-beads');
const letterContainer = document.getElementById('letter-beads');
const miscContainer = document.getElementById('misc-beads');

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
            heart.style.fontSize = '1.25rem'; // adjust size of the heart icon
            heart.style.color = bead.color;

            beadElement.appendChild(heart);

            miscContainer.appendChild(beadElement);
        } else {
            console.warn('Unknown bead type:', bead.type);
        }
    });
  }

populateBeads();