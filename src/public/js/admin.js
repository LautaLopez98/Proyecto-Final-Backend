document.addEventListener('DOMContentLoaded', async () => {
    const userTableBody = document.getElementById('userTableBody');
    try {
        const response = await fetch('/api/users');
        const { users } = await response.json();

        users.forEach(user => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${user.fullName}</td>
                <td>${user.email}</td>
                <td>
                    <select data-user-id="${user.email}" class="role-select">
                        <option value="user" ${user.rol === 'user' ? 'selected' : ''}>User</option>
                        <option value="premium" ${user.rol === 'premium' ? 'selected' : ''}>Premium</option>
                        <option value="admin" ${user.rol === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </td>
                <td>
                    <button class="delete-user" data-user-id="${user.email}">Eliminar</button>
                </td>
            `;

            userTableBody.appendChild(row);
        });

        document.querySelectorAll('.role-select').forEach(select => {
            select.addEventListener('change', async (event) => {
                const email = event.target.getAttribute('data-user-id');
                const newRole = event.target.value;
                try {
                    const response = await fetch(`/api/users/${email}/rol`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rol: newRole })
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        alert('Rol actualizado correctamente');
                        console.log('Rol actualizado:', result.user.rol);
                        window.location.reload();
                    } else {
                        alert('Error al actualizar el rol: ' + result.error);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Ocurrió un error al intentar actualizar el rol');
                }
            });
        });

        document.querySelectorAll('.delete-user').forEach(button => {
            button.addEventListener('click', async (event) => {
                const email = event.target.getAttribute('data-user-id');
                await fetch(`/api/users/${email}`, {
                    method: 'DELETE'
                });
                alert('Usuario eliminado correctamente');
                event.target.closest('tr').remove();
            });
        });
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
    }
});

