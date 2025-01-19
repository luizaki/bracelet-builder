import { createClient } from '@supabase/supabase-js';

// init supabase
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

const form = document.getElementById('login-form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    const email = formData.get('email');
    const password = formData.get('password');

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if(error) {
        const messageDiv = document.createElement('div');

        messageDiv.className = 'text-red-600 text-center';
        messageDiv.textContent = "Invalid email or password!!!";

        document.getElementById('login-form').appendChild(messageDiv);

        setTimeout(() => {
            document.getElementById('login-form').removeChild(messageDiv);
        }, 2000);
    } else {
        localStorage.setItem('loggedIn', 'true');
        window.location.href = 'admin.html';
    }
});