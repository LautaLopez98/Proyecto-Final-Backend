async function login(event) {
    event.preventDefault();
    const form = document.getElementById('formLogin');
    const formData = new FormData(form);
    
    try {
        const response = await fetch('/api/sessions/login', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        
        if (response.ok) {
            window.location.href = '/products';
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
    }
}



