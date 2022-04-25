const chalk = require('chalk');
const log = console.log;
const fs = require('fs');

function htmlGenerate(csvSearch, jsonProdutos){
    let prod = ``;
    csvSearch.map((search) => {
        if(search != 'name'){
            const obj = JSON.parse(JSON.stringify(jsonProdutos[search]));
            prod += `<h2 class="text-white text-center">${search}</h2>`;
            for (let i = 0; i < 4; i++) {
                prod += `
                <div class="col-md-3 p-2 d-flex">
                    <div class="card  w-100">
                        <div class="card-header" style="display: flex;justify-content: center;">
                            <img src="${obj[0][i].image}" style="height: 115px;width: auto;" alt="">
                        </div>
                        <div class="card-body">
                            <h6 class="pt-2">${obj[0][i].product}</h6>
                            <p class="fs-5 fw-bold">R$ ${obj[0][i].price}</p>
                            <p class="mb-0"><a name="btn_mercadolivre" id="btn_mercadolivre" class="btn btn-primary" href="${obj[0][i].link}" role="button">Comprar</a></p>
                        </div>
                    </div>
                </div>
                `;
                
            }
        }
    })
    htmlSave(prod)
}


function htmlSave(produtos){

    const html = `<!doctype html>
    <html lang="en">

    <head>
        <title>Orçamento</title>
        <!-- Required meta tags -->
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

        <!-- Bootstrap CSS v5.0.2 -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css"
            integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">

    </head>

    <body class="bg-dark p-5">
        <div class="container">
            <div class="col-10 m-auto">
                <div class="row">
                    ${produtos}
                </div>
            </div>
        </div>
        <!-- Bootstrap JavaScript Libraries -->
        <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.2/dist/umd/popper.min.js"
            integrity="sha384-IQsoLXl5PILFhosVNubq5LC7Qb9DXgDA9i+tQ8Zj3iwWAwPtgFTxbJ8NT4GN1R8p"
            crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.min.js"
            integrity="sha384-cVKIPhGWiC2Al4u+LWgxfKTRIcfu0JTxR+EQDz/bgldoEyl4H0zUF0QKbrJ0EcQF"
            crossorigin="anonymous"></script>
    </body>
    <script>
        
    </script>
    </html>`;

    const htmlFile = "orcamentos/" + new Date().toJSON().slice(0,19).replaceAll(':','-') + ".html";
    fs.writeFile(`${htmlFile}`, html, function (err) {
        if (err) return console.log(chalk.red(`Error > ${htmlFile} \n ${err}`));
    });
    // fs.writeFileSync(htmlFile,html,{encoding:'utf8',flag:'w'})
}

module.exports = htmlGenerate;