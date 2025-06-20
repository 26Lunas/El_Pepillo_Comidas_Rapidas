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
            const modalEl = document.getElementById('modalPedido');
            if (modalEl) {
                modalPedido = new bootstrap.Modal(modalEl);
            }
            const closedModalEl = document.getElementById('closedModal');
            if (closedModalEl) {
                closedModal = new bootstrap.Modal(closedModalEl);
            }
        }
        
        let productoActual = {};

        function actualizarTarjetaPedido() {
            if (!productoActual || !document.getElementById('pedidoVariante')) {
                return;
            }

            // Producto principal y su cantidad
            const varianteSelect = document.getElementById('pedidoVariante');
            const varianteSeleccionada = varianteSelect.value ? JSON.parse(varianteSelect.value) : null;
            const cantidadInput = document.getElementById('pedidoCantidad');
            const cantidad = parseInt(cantidadInput.value, 10) || 1;
            const precioBase = varianteSeleccionada ? varianteSeleccionada.precio : 0;
            const totalProducto = precioBase * cantidad;

            // Adicionales con cantidad
            let totalAdicionales = 0;
            let adicionalesText = [];
            document.querySelectorAll('.quantity-additional').forEach(additionalGroup => {
                const input = additionalGroup.querySelector('.additional-quantity-input');
                let additionalQty = parseInt(input.value, 10);
                if (isNaN(additionalQty) || additionalQty < 0) additionalQty = 0;
                // Lógica para que los adicionales no superen la cantidad del producto
                if (additionalQty > cantidad) {
                    additionalQty = cantidad;
                    input.value = cantidad;
                }
                if (additionalQty > 0) {
                    const price = Number(additionalGroup.dataset.price);
                    const name = additionalGroup.dataset.name;
                    totalAdicionales += additionalQty * price;
                    adicionalesText.push(`${additionalQty} ${name}(s)`);
                }
            });

            // Precio total final
            const total = totalProducto + totalAdicionales;

            // Actualizar vista de la tarjeta
            document.getElementById('pedidoCardImg').src = productoActual.img;
            document.getElementById('pedidoCardNombre').textContent = productoActual.nombre;
            document.getElementById('pedidoCardPrecio').textContent = varianteSeleccionada ? '$' + precioBase.toLocaleString() : 'Selecciona una opción';
            
            const adicionalesEl = document.getElementById('pedidoCardAdicionales');
            if (adicionalesText.length > 0) {
                adicionalesEl.classList.remove('d-none');
                document.getElementById('pedidoCardAdicionalesList').textContent = adicionalesText.join(', ');
            } else {
                adicionalesEl.classList.add('d-none');
            }

            const comentariosEl = document.getElementById('pedidoCardComentarios');
            if (productoActual.comentarios) {
                comentariosEl.textContent = productoActual.comentarios;
                comentariosEl.classList.remove('d-none');
            } else {
                comentariosEl.classList.add('d-none');
            }
            
            const totalEl = document.getElementById('pedidoCardTotal');
            if (varianteSeleccionada) {
                totalEl.textContent = `Total: $${total.toLocaleString()}`;
            } else {
                totalEl.textContent = '';
            }

            // Guardar en campos ocultos
            document.getElementById('pedidoProducto').value = varianteSeleccionada ? varianteSeleccionada.nombre : productoActual.nombre;
            document.getElementById('pedidoPrecio').value = total;
            document.getElementById('pedidoImg').value = productoActual.img;
            
            const form = document.getElementById('formPedido');
            form.querySelectorAll('input, textarea, button, select').forEach(input => {
                input.disabled = !varianteSeleccionada;
            });
        }

        document.body.addEventListener('click', function (e) {
            const isMainQuantityButton = e.target.closest('.quantity-selector') && e.target.closest('.quantity-selector').querySelector('#pedidoCantidad');
            const isAdditionalQuantityButton = e.target.closest('.quantity-additional');

            // --- Controlador Unificado de Cantidad ---
            if (isMainQuantityButton || isAdditionalQuantityButton) {
                let input, currentValue, action;
                
                if (isMainQuantityButton && !isAdditionalQuantityButton) {
                    // Es el selector del producto principal
                    input = document.getElementById('pedidoCantidad');
                    action = e.target.dataset.action;
                } else if (isAdditionalQuantityButton) {
                    // Es un selector de adicional
                    const group = e.target.closest('.quantity-additional');
                    input = group.querySelector('.additional-quantity-input');
                    action = e.target.closest('.btn-quantity-additional').dataset.action;
                }

                if (input) {
                    currentValue = parseInt(input.value, 10);
                    const mainQty = parseInt(document.getElementById('pedidoCantidad').value, 10);

                    if (action === 'increase') {
                        // El principal no tiene límite, los adicionales sí
                        if (isMainQuantityButton && !isAdditionalQuantityButton) {
                            currentValue++;
                        } else if (isAdditionalQuantityButton && currentValue < mainQty) {
                            currentValue++;
                        }
                    } else if (action === 'decrease') {
                        // El principal no baja de 1, los adicionales no bajan de 0
                        const limit = (isMainQuantityButton && !isAdditionalQuantityButton) ? 1 : 0;
                        if (currentValue > limit) {
                            currentValue--;
                        }
                    }
                    input.value = currentValue;
                    actualizarTarjetaPedido();
                    return; // Importante para no interferir con otros clics
                }
            }

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
                    variantes: JSON.parse(btn.getAttribute('data-variantes')),
                    comentarios: btn.getAttribute('data-comentarios')
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
                if (modalPedido) {
                    modalPedido.show();
                    setTimeout(actualizarTarjetaPedido, 150);
                }
                document.getElementById('pedidoCantidad').value = '1'; // Resetea la cantidad
                document.getElementById('pedidoGratinadoCantidad').value = '0'; // Resetea gratinado
                document.querySelectorAll('.additional-quantity-input').forEach(input => input.value = '0'); // Resetea todos los adicionales
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
                const comentarios = document.getElementById('pedidoComentarios').value.trim();
                const producto = document.getElementById('pedidoProducto').value;
                const precioTotal = document.getElementById('pedidoPrecio').value;
                const cantidad = document.getElementById('pedidoCantidad').value;
                
                // --- Mensaje de WhatsApp Mejorado ---
                let mensaje = `¡Hola! Quiero hacer un pedido:\n\n`;
                mensaje += `*${cantidad}x ${producto}*\n\n`;

                let adicionalesMsg = [];
                document.querySelectorAll('.quantity-additional').forEach(group => {
                    const qty = parseInt(group.querySelector('.additional-quantity-input').value, 10);
                    if (qty > 0) {
                        adicionalesMsg.push(`- ${qty} ${group.dataset.name}(s)`);
                    }
                });

                if (adicionalesMsg.length > 0) {
                    mensaje += `*Adicionales:*\n${adicionalesMsg.join('\n')}\n\n`;
                }
                
                if (comentarios) {
                    mensaje += `*Comentarios:*\n${comentarios}\n\n`;
                }

                mensaje += `*Total a pagar:* $${Number(precioTotal).toLocaleString()}\n\n`;
                mensaje += `*Datos de entrega:*\n`;
                mensaje += `- Nombre: ${nombre}\n`;
                mensaje += `- Celular: ${celular}\n`;
                mensaje += `- Dirección: ${direccion}`;
                // --- Fin del Mensaje Mejorado ---
                
                const numero = '573152854277';
                const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
                window.open(url, '_blank');

                const confirmacion = document.getElementById('pedidoConfirmacion');
                confirmacion.innerHTML = `<strong>¡Pedido enviado!</strong><br><img src="${productoActual.img}" alt="${producto}" style="width:80px;display:block;margin:10px auto;"/><br>${producto} - $${Number(precioTotal).toLocaleString()}<br>Gracias, ${nombre}. Nos contactaremos pronto.`;
                confirmacion.classList.remove('d-none');
                
                if (modalPedido) {
                    setTimeout(() => {
                        modalPedido.hide();
                    }, 3000);
                }
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