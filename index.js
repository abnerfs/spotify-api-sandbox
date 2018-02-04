const express = require('express');
const app = express();
const querystring = require('querystring');
const randomstring = require("randomstring");
const fetch = require('node-fetch');
const handlebars = require('express-handlebars');
const Headers = fetch.Headers;
const cookieParser = require('cookie-parser');

const stateKey = 'spotify_auth_key';
const PORT = process.env.PORT || 8082;
const client_id = process.env.SPOTIFY_ID;
const client_secret = process.env.SPOTIFY_SECRET;
const link = `http://localhost:${PORT}/`;
const redirect_uri = link + 'callback';


app.use(cookieParser());

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/node_modules'));
app.engine('hbs', handlebars( {
    defaultLayout: 'main',
    extname: '.hbs'
}));

app.set('view engine', 'hbs');

/* Authentication Flow: https://developer.spotify.com/web-api/authorization-guide/ */

app.get('/callback', (req, res) => {
    const { code, state, error } = req.query;

    if(error)
    {
        //Tratar erro aqui

        return;
    }

    const headers = new Headers();
    headers.append('Authorization', 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')));
    headers.append('Content-Type', 'application/x-www-form-urlencoded');
    
    const body = {
        grant_type: 'authorization_code',
        code,
        redirect_uri
    };
    //Depois que o código de autorização foi recebido obter o token de acesso 
    fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        body: querystring.stringify(body),
        headers
    }).then(response => response.json())
    .then(response => {
        const { 
            access_token ,
            token_type,
            scope,
            expires_in,
            refresh_token } = response;

        res.cookie('access_token', access_token);
        res.cookie('refresh_token', refresh_token);
        res.cookie('expires_in', expires_in);
        res.redirect('/');
    })
    // .then(response => {
    
    // })
    .catch(err => {
    });

})

app.get('/', (req, res) => {
    const access_token = req.cookies['access_token'];
    const refresh_token = req.cookies['refresh_token'];
    const expires_in = req.cookies['expires_in'];

    res.render('main', {
        access_token,
        refresh_token,
        expires_in
    });
});

app.get('/login', (req, res) => {
    //Gera uma string random de 32 caracteres
    const state = randomstring.generate();

    /* Os scopes são o que serã acessado, 
    * Lista de scopes: https://developer.spotify.com/web-api/using-scopes/
    */
    const scope = "user-read-recently-played user-read-playback-state user-modify-playback-state user-read-currently-playing streaming ugc-image-upload playlist-read-collaborative playlist-modify-public playlist-read-private playlist-modify-private user-follow-modify user-library-read";
    
    /*Informações vão direto na URL, preparar a URL com queryString*/
    res.redirect('https://accounts.spotify.com/authorize?' + 
        querystring.stringify({
            client_id,
            response_type: 'code',
            redirect_uri,
            scope,
            state, //è útil para correlacionar requests e responses, valor random
            show_dialog: false
        })
    )
});



app.listen(PORT, () => {
    console.log("Servidor iniciado na porta:", PORT);
});
