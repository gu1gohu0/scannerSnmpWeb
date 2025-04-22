function gerarToken() {
    const token = Math.random().toString(36).substring(2, 14).toUpperCase();
    document.getElementById("token").value = token;
}

function calcularDiferencaMeses(data) {
    const dataAtual = new Date(); 
    const dataCriacao = new Date(data); 
    const diffEmMilissegundos = dataAtual - dataCriacao;  
    const diffEmSemanas = diffEmMilissegundos / (1000 * 60 * 60 * 24 * 7); 
    const diffEmDuasSemanas = diffEmSemanas / 2;
    return diffEmDuasSemanas;
}

function ipDesatualizados(data, totalIps) {
    const meses = calcularDiferencaMeses(data);
    if (meses > 2) {
        return totalIps; 
    } else {
        return 0; 
    }
} 

function criarTabela() {
    const token = document.getElementById("token").value;
    const cliente = document.getElementById("cliente").value;

    if (!token || !cliente) {
        alert("Por favor, gere um token e preencha o nome do cliente.");
        return;
    }

    fetch('http://localhost:3001/criar-tabela', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, cliente })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Tabela criada com sucesso!');
            carregarDados(); 
        } else {
            alert('Erro ao criar a tabela: ' + data.message);
        }
    })
    .catch(error => {
        alert('Erro de conexão: ' + error);
    });
}

function carregarDados() {
    fetch("http://localhost:3001/printers")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Dados recebidos:", data); 

            const tbody = document.querySelector("table tbody");
            tbody.innerHTML = ""; 

            // Verifica se os dados contêm a propriedade 'printers' e se é um array
            if (data.printers && Array.isArray(data.printers)) {
                // Filtra os registros para REMOVER o ID = 1
                const filteredData = data.printers.filter(printer => printer.id === 1);

                // Exibe os registros filtrados
                filteredData.forEach(printer => {
                    const row = document.createElement("tr");

                    // Cria a célula com o radio button
                    const radioCell = document.createElement("td");
                    const radio = document.createElement("input");
                    radio.type = "radio";
                    radio.name = "row-selector"; // Mesmo nome para agrupar os radio buttons
                    radio.className = "row-radio"; // Adiciona uma classe para facilitar a seleção
                    radio.value = printer.id; // Usa o ID do registro como valor
                    radioCell.appendChild(radio);

                    // Adiciona a célula do radio button à linha
                    row.appendChild(radioCell);
    
                    // Calcula o número de IPs desatualizados (created_at > 2 meses)
                    const ipsDesatualizados = ipDesatualizados(printer.created_at, printer.total_ips);

                    // Adiciona as demais células
                    row.innerHTML += `
                        <td>${printer.cliente || "N/A"}</td>
                        <td>${printer.token || "N/A"}</td>
                        <td>${printer.ip || "N/A"}</td>
                        <td>${printer.total_ips || "0"}</td>
                        <td>${ipsDesatualizados}</td>
                        <td>${printer.created_at || "N/A"}</td>
                    `;

                    // Adiciona a linha à tabela
                    tbody.appendChild(row);
                });
            } else {
                console.error("Dados recebidos não contêm a propriedade 'printers' ou não são um array:", data);
                alert("Erro: Dados recebidos não são válidos.");
            }
        })
        .catch(error => {
            console.error("Erro ao buscar dados:", error);
            alert("Erro ao carregar os dados. Verifique o console para mais detalhes.");
        });
}

// Carrega os dados ao abrir a página
document.addEventListener("DOMContentLoaded", carregarDados);
