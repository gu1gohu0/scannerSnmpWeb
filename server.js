const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

const corsOptions = {
    origin: '*', 
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type'
};

app.use(cors(corsOptions)); 
app.use(express.json()); 

const port = 3001;

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "snmp_scanner"
});

connection.connect(err => {
    if (err) {
        console.error("❌ Erro ao conectar ao MySQL:", err.message);
        return;
    }
    console.log("✅ Conectado ao banco de dados MySQL!");
});

// 🔹 Rota para buscar todas as impressoras
app.get("/printers", (req, res) => {
    const getTablesQuery = "SHOW TABLES";

    connection.query(getTablesQuery, (err, tables) => {
        if (err) {
            console.error("❌ Erro ao buscar tabelas:", err);
            return res.status(500).json({ error: "Erro ao buscar tabelas" });
        }

        const tableNames = tables.map(row => Object.values(row)[0]);

        const queries = tableNames.map(table =>
            new Promise((resolve, reject) => {
                // Busca o cliente da tabela (id = 1)
                const clientQuery = `SELECT cliente FROM \`${table}\` WHERE id = 1 LIMIT 1`;

                connection.query(clientQuery, (err, clientResult) => {
                    if (err) {
                        console.error(`❌ Erro ao buscar cliente da tabela ${table}:`, err);
                        return reject(err);
                    }

                    const cliente = clientResult.length > 0 && clientResult[0].cliente ? clientResult[0].cliente : "Desconhecido";

                    // Busca o número de IPs que responderam nos últimos 2 meses
                    const ipCountQuery = `
                        SELECT COUNT(*) AS total_ips
                        FROM \`${table}\`
                        WHERE id != 1
                          AND ip IS NOT NULL
                          AND created_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH)
                    `;

                    connection.query(ipCountQuery, (err, ipCountResult) => {
                        if (err) {
                            console.error(`❌ Erro ao contar IPs da tabela ${table}:`, err);
                            return reject(err);
                        }

                        const totalIps = ipCountResult[0].total_ips;

                        // Busca todos os dados da tabela para retornar ao frontend
                        const dataQuery = `SELECT *, '${table}' AS token, ? AS cliente, ? AS total_ips FROM \`${table}\``;

                        connection.query(dataQuery, [cliente, totalIps], (err, results) => {
                            if (err) {
                                console.error(`❌ Erro ao buscar dados da tabela ${table}:`, err);
                                return reject(err);
                            }
                            resolve(results);
                        });
                    });
                });
            })
        );

        Promise.all(queries)
            .then(results => {
                const printers = results.flat();
                res.json({ printers });
            })
            .catch(error => {
                console.error("❌ Erro ao buscar impressoras:", error);
                res.status(500).json({ error: "Erro ao buscar impressoras" });
            });
    });
});

// 🔹 Rota para criar uma nova tabela
app.post("/criar-tabela", (req, res) => {
    const { token, cliente } = req.body;

    if (!token || !cliente) {
        return res.status(400).json({ success: false, message: 'Token e Cliente são obrigatórios.' });
    }

    const query = `
        CREATE TABLE IF NOT EXISTS ?? (
            id INT AUTO_INCREMENT PRIMARY KEY,
            cliente VARCHAR(255) NOT NULL,
            ip TEXT,
            serial VARCHAR(255),
            description TEXT,
            page_count INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    connection.query(query, [token], (err) => {
        if (err) {
            console.error('❌ Erro ao criar a tabela:', err);
            return res.status(500).json({ success: false, message: 'Erro ao criar a tabela.' });
        }

        const insertClientQuery = `INSERT INTO ?? (id, cliente) VALUES (1, ?) ON DUPLICATE KEY UPDATE cliente = VALUES(cliente)`;
        connection.query(insertClientQuery, [token, cliente], (err) => {
            if (err) {
                console.error('❌ Erro ao inserir cliente:', err);
                return res.status(500).json({ success: false, message: 'Erro ao inserir cliente.' });
            }

            console.log('✅ Tabela e cliente criados com sucesso');
            res.json({ success: true, message: 'Tabela criada e cliente inserido com sucesso.' });
        });
    });
});

// 🔹 Inicia o servidor
app.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});