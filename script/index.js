document.addEventListener("DOMContentLoaded", function () {
    fetch("http://localhost:3001/printers")
        .then(response => {
            if (!response.ok) {
                throw new Error("Erro na requisição: " + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Dados recebidos:", data); 

            const tbody = document.querySelector("table tbody");
            tbody.innerHTML = ""; 

            if (Array.isArray(data) || printer.id != 1) {
                data.forEach(printer => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${printer.client_name}</td>
                        <td>${printer.ip}</td>
                        <td>${printer.serial}</td>
                        <td>${printer.description}</td>
                        <td>${new Date(printer.created_at).toLocaleDateString()}</td>
                        <td>${printer.page_count}</td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                console.error("Dados recebidos não são um array:", data);
            }
        })
        .catch(error => console.error("Erro ao buscar dados:", error));
});
