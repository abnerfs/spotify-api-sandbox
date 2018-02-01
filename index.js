const express = require('express');
const app = express();

const PORT = process.env.PORT || 8082;

app.use(express.static(__dirname + '/public'));

app.listen(PORT, () => {
    console.log("Servidor iniciado na porta:", PORT);
});