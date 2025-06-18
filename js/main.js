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
});