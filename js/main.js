document.addEventListener("DOMContentLoaded", function (){
    fetch("components/navbar.html")
        .then(response => response.text())
        .then(data =>{
            document.getElementById("menu-nav").innerHTML = data;
        })
        .catch(error => console.error("Error cargando el componentes:", error));
    
    fetch("components/footer.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer").innerHTML = data;
        })
        .catch(error => console.error("Error cargando el footer:", error));

    // Lógica para el modal de pedido
    let modalPedido = null;
    if (window.bootstrap) {
        modalPedido = new bootstrap.Modal(document.getElementById('modalPedido'));
    }
    let productoActual = {};

    function actualizarTarjetaPedido() {
        // Producto base
        const nombre = productoActual.nombre;
        const precioBase = Number(productoActual.precio);
        const img = productoActual.img;
        // Adicionales
        const checks = document.querySelectorAll('.adicionales-check:checked');
        let adicionales = [];
        let adicionalesTotal = 0;
        checks.forEach(chk => {
            adicionales.push(chk.value);
            adicionalesTotal += Number(chk.getAttribute('data-precio'));
        });
        // Comentarios
        const comentarios = document.getElementById('pedidoComentarios').value.trim();
        // Mostrar en tarjeta
        document.getElementById('pedidoCardImg').src = img;
        document.getElementById('pedidoCardNombre').textContent = nombre;
        document.getElementById('pedidoCardPrecio').textContent = '$' + precioBase.toLocaleString();
        // Adicionales en tarjeta
        if (adicionales.length > 0) {
            document.getElementById('pedidoCardAdicionales').classList.remove('d-none');
            document.getElementById('pedidoCardAdicionalesList').textContent = adicionales.join(', ');
        } else {
            document.getElementById('pedidoCardAdicionales').classList.add('d-none');
            document.getElementById('pedidoCardAdicionalesList').textContent = '';
        }
        // Comentarios en tarjeta
        if (comentarios) {
            document.getElementById('pedidoCardComentarios').textContent = comentarios;
            document.getElementById('pedidoCardComentarios').classList.remove('d-none');
        } else {
            document.getElementById('pedidoCardComentarios').textContent = '';
            document.getElementById('pedidoCardComentarios').classList.add('d-none');
        }
        // Precio total
        const total = precioBase + adicionalesTotal;
        document.getElementById('pedidoCardTotal').textContent = 'Total: $' + total.toLocaleString();
        // Guardar en campos ocultos
        document.getElementById('pedidoProducto').value = nombre;
        document.getElementById('pedidoPrecio').value = total;
        document.getElementById('pedidoImg').value = img;
    }

    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-pedir')) {
            const btn = e.target;
            productoActual = {
                nombre: btn.getAttribute('data-producto'),
                precio: btn.getAttribute('data-precio'),
                img: btn.getAttribute('data-img')
            };
            document.getElementById('formPedido').reset();
            document.getElementById('pedidoConfirmacion').classList.add('d-none');
            document.querySelectorAll('.adicionales-check').forEach(chk => chk.checked = false);
            document.getElementById('pedidoCard').classList.remove('d-none');
            actualizarTarjetaPedido();
            if (modalPedido) modalPedido.show();
        }
    });

    // Actualizar tarjeta al cambiar adicionales o comentarios
    document.querySelectorAll('.adicionales-check').forEach(chk => {
        chk.addEventListener('change', actualizarTarjetaPedido);
    });
    document.getElementById('pedidoComentarios').addEventListener('input', actualizarTarjetaPedido);

    document.getElementById('formPedido').addEventListener('submit', function(e) {
        e.preventDefault();
        const nombre = document.getElementById('pedidoNombre').value;
        const celular = document.getElementById('pedidoCelular').value;
        const direccion = document.getElementById('pedidoDireccion').value;
        const comentarios = document.getElementById('pedidoComentarios').value;
        const producto = document.getElementById('pedidoProducto').value;
        const precio = document.getElementById('pedidoPrecio').value;
        const img = document.getElementById('pedidoImg').value;
        // Adicionales
        const checks = document.querySelectorAll('.adicionales-check:checked');
        let adicionales = [];
        checks.forEach(chk => adicionales.push(chk.value));
        // Mensaje
        let mensaje = `¡Hola! Quiero pedir:\n\n`;
        mensaje += `*Producto:* ${producto}\n`;
        if (adicionales.length > 0) mensaje += `*Adicionales:* ${adicionales.join(', ')}\n`;
        mensaje += `*Total a pagar:* $${Number(precio).toLocaleString()}\n`;
        if (comentarios) mensaje += `*Comentarios:* ${comentarios}\n`;
        mensaje += `\n*Datos de entrega:*\n`;
        mensaje += `Nombre: ${nombre}\n`;
        mensaje += `Celular: ${celular}\n`;
        mensaje += `Dirección: ${direccion}`;
        // WhatsApp API
        const numero = '573152854277';
        const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
        // Mostrar confirmación
        const confirmacion = document.getElementById('pedidoConfirmacion');
        confirmacion.innerHTML = `<strong>¡Pedido enviado!</strong><br><img src="${img}" alt="${producto}" style="width:80px;display:block;margin:10px auto;"/><br>${producto} - $${Number(precio).toLocaleString()}<br>Gracias, ${nombre}. Nos contactaremos pronto.`;
        confirmacion.classList.remove('d-none');
        setTimeout(() => {
            if (modalPedido) modalPedido.hide();
        }, 3000);
    });
});