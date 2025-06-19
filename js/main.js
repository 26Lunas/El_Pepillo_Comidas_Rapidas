document.addEventListener("DOMContentLoaded", function () {

    const fetchComponent = (url, elementId) => {
        return fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`Error al cargar ${url}`);
                return response.text();
            })
            .then(data => {
                const element = document.getElementById(elementId);
                if (element) element.innerHTML = data;
            });
    };

    const isWorkingHours = () => {
        const now = new Date();
        const day = now.getDay(); // Domingo: 0, Sábado: 6
        const hour = now.getHours(); // 0-23

        // Sábado de 7:00 p.m. a 11:59 p.m.
        if (day === 6 && hour >= 19) return true;
        
        // Domingo de 12:00 a.m. a 12:59 a.m. (es decir, hora 0)
        // O Domingo de 7:00 p.m. a 11:59 p.m.
        if (day === 0 && (hour === 0 || hour >= 19)) return true;
        
        // Lunes de 12:00 a.m. a 12:59 a.m. (para cubrir el cierre del domingo)
        if (day === 1 && hour === 0) return true;

        return false;
    };

    const initModalLogic = () => {
        let modalPedido = null;
        let closedModal = null;

        if (window.bootstrap) {
            if (document.getElementById('modalPedido')) {
                modalPedido = new bootstrap.Modal(document.getElementById('modalPedido'));
            }
            if (document.getElementById('closedModal')) {
                closedModal = new bootstrap.Modal(document.getElementById('closedModal'));
            }
        }
        
        let productoActual = {};

        function actualizarTarjetaPedido() {
            const nombre = productoActual.nombre;
            const varianteSelect = document.getElementById('pedidoVariante');
            const varianteSeleccionada = varianteSelect.value ? JSON.parse(varianteSelect.value) : null;
            const precioBase = varianteSeleccionada ? varianteSeleccionada.precio : Number(productoActual.precio);
            const nombreCompleto = varianteSeleccionada ? varianteSeleccionada.nombre : nombre;
            const img = productoActual.img;
            const checks = document.querySelectorAll('.adicionales-check:checked');
            let adicionales = [];
            let adicionalesTotal = 0;
            checks.forEach(chk => {
                adicionales.push(chk.value);
                adicionalesTotal += Number(chk.getAttribute('data-precio'));
            });
            const comentarios = document.getElementById('pedidoComentarios').value.trim();
            document.getElementById('pedidoCardImg').src = img;
            document.getElementById('pedidoCardNombre').textContent = nombre;
            document.getElementById('pedidoCardPrecio').textContent = varianteSeleccionada ? '$' + precioBase.toLocaleString() : 'Selecciona una opción';
            const adicionalesEl = document.getElementById('pedidoCardAdicionales');
            if (adicionales.length > 0) {
                adicionalesEl.classList.remove('d-none');
                document.getElementById('pedidoCardAdicionalesList').textContent = adicionales.join(', ');
            } else {
                adicionalesEl.classList.add('d-none');
            }
            const comentariosEl = document.getElementById('pedidoCardComentarios');
            if (comentarios) {
                comentariosEl.textContent = comentarios;
                comentariosEl.classList.remove('d-none');
            } else {
                comentariosEl.classList.add('d-none');
            }
            const total = precioBase + adicionalesTotal;
            document.getElementById('pedidoCardTotal').textContent = varianteSeleccionada ? 'Total: $' + total.toLocaleString() : '';
            document.getElementById('pedidoProducto').value = nombreCompleto;
            document.getElementById('pedidoPrecio').value = total;
            document.getElementById('pedidoImg').value = img;
            const form = document.getElementById('formPedido');
            form.querySelectorAll('input, textarea, button, select').forEach(input => {
                input.disabled = !varianteSeleccionada;
            });
        }

        document.body.addEventListener('click', function (e) {
            if (e.target.classList.contains('btn-pedir')) {
                if (!isWorkingHours()) {
                    if (closedModal) closedModal.show();
                    return;
                }

                const btn = e.target;
                productoActual = {
                    nombre: btn.getAttribute('data-producto'),
                    precio: btn.getAttribute('data-precio'),
                    img: btn.getAttribute('data-img'),
                    variantes: JSON.parse(btn.getAttribute('data-variantes'))
                };
                const varianteSelect = document.getElementById('pedidoVariante');
                varianteSelect.innerHTML = '<option value="">Selecciona una opción</option>';
                productoActual.variantes.forEach(variante => {
                    varianteSelect.innerHTML += `<option value='${JSON.stringify(variante)}'>${variante.nombre} - $${variante.precio.toLocaleString()}</option>`;
                });
                document.getElementById('formPedido').reset();
                document.getElementById('pedidoConfirmacion').classList.add('d-none');
                document.querySelectorAll('.adicionales-check').forEach(chk => chk.checked = false);
                document.getElementById('pedidoCard').classList.remove('d-none');
                actualizarTarjetaPedido();
                if (modalPedido) modalPedido.show();
            }
        });

        document.body.addEventListener('change', e => {
            if (e.target.id === 'pedidoVariante' || e.target.classList.contains('adicionales-check')) {
                actualizarTarjetaPedido();
            }
        });

        document.body.addEventListener('input', e => {
            if (e.target.id === 'pedidoComentarios') {
                actualizarTarjetaPedido();
            }
        });

        document.body.addEventListener('submit', function (e) {
            if (e.target.id === 'formPedido') {
                e.preventDefault();
                const nombre = document.getElementById('pedidoNombre').value;
                const celular = document.getElementById('pedidoCelular').value;
                const direccion = document.getElementById('pedidoDireccion').value;
                const comentarios = document.getElementById('pedidoComentarios').value;
                const producto = document.getElementById('pedidoProducto').value;
                const precio = document.getElementById('pedidoPrecio').value;
                const checks = document.querySelectorAll('.adicionales-check:checked');
                let adicionales = [];
                checks.forEach(chk => adicionales.push(chk.value));
                let mensaje = `¡Hola! Quiero pedir:\n\n*Producto:* ${producto}\n`;
                if (adicionales.length > 0) mensaje += `*Adicionales:* ${adicionales.join(', ')}\n`;
                mensaje += `*Total a pagar:* $${Number(precio).toLocaleString()}\n`;
                if (comentarios) mensaje += `*Comentarios:* ${comentarios}\n`;
                mensaje += `\n*Datos de entrega:*\nNombre: ${nombre}\nCelular: ${celular}\nDirección: ${direccion}`;
                const numero = '573152854277';
                const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
                window.open(url, '_blank');
                const confirmacion = document.getElementById('pedidoConfirmacion');
                confirmacion.innerHTML = `<strong>¡Pedido enviado!</strong><br><img src="${productoActual.img}" alt="${producto}" style="width:80px;display:block;margin:10px auto;"/><br>${producto} - $${Number(precio).toLocaleString()}<br>Gracias, ${nombre}. Nos contactaremos pronto.`;
                confirmacion.classList.remove('d-none');
                setTimeout(() => {
                    if (modalPedido) modalPedido.hide();
                }, 3000);
            }
        });
    };

    Promise.all([
        fetchComponent('components/navbar.html', 'menu-nav'),
        fetchComponent('components/footer.html', 'footer'),
        fetchComponent('components/modal.html', 'modal-container'),
        fetchComponent('components/closed-modal.html', 'closed-modal-container')
    ])
    .then(initModalLogic)
    .catch(error => console.error("Error al inicializar la página:", error));

});