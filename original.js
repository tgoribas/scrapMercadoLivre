const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { parse } = require('csv-parse');
const slugify = require('slugify');
const log = console.log;

// Variavel para armazenar os dados DO CSV
const csvSearch=[];
// Variavel para adicionar os produtos da busca
const jsonProdutos = {} // empty Object
// Define e cria o arquivo onde o JSON vai ser salvo.
const jsonFile = "json/" + new Date().toJSON().slice(0,19).replaceAll(':','-') + ".json";
var jsonWrite = fs.createWriteStream(`${jsonFile}`, {
    //flags: 'a' // 'a' means appending (old data will be preserved)
})

const contador = 0;

fs.createReadStream('certificados.csv')
    .pipe(parse({delimiter: ';'}))
    .on('data', async function(csvrow) {
        // Prepara a variavel que vai fazer a busca do produto
        csvSearch.push(slugify(csvrow[0].toString().toLowerCase()));
        log(chalk.blue(csvSearch));
    })
    .on('end',function () {
        log(csvSearch);
        csvSearch.map((search) => {
            // Evite o titulo do CSV
            
            if (search != 'name'){
                (async () => {
                    
                    // Inicia o Puppeteer
                    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
                    const page = await browser.newPage();
                    await page.goto(`https://lista.mercadolivre.com.br/${search}`);
                    
                    await page.setViewport({
                        width: 1200,
                        height: 800
                    });
                    // Clica na Opção Full
                    await page.click('input#shipping_highlighted_fulfillment')
                    // Executa o a função autoScroll
                    await autoScroll(page);

                    // Prepara a variavel das Imagens
                    const imageList = await page.evaluate(() => {
                        const nodeImage = document.querySelectorAll('section.ui-search-results img.ui-search-result-image__element')
                        const imgArray = [...nodeImage]
                        const imagelist = imgArray.map(({ src }) => ({
                            src
                        }))
                        return imagelist;
                    });
                    
                    // Prepara a variavel dos Titulos
                    const listTitle = await page.evaluate(() => {
                        const nodeTitle = document.querySelectorAll('section.ui-search-results h2.ui-search-item__title')
                        const arrayTitle = [...nodeTitle]
                        const listTitle = arrayTitle.map(({ textContent }) => ({
                            textContent
                        }))
                        return listTitle;
                    });

                    // Prepara a variavel dos Preços
                    const listPrice = await page.evaluate(() => {
                        const nodePrice = document.querySelectorAll('div.ui-search-price--size-medium div.ui-search-price__second-line span.price-tag-text-sr-only')
                        const arrayPrice = [...nodePrice]
                        const listPrice = arrayPrice.map(({ textContent }) => ({
                            textContent
                        }))
                        return listPrice;
                    });

                    // Prepara a variavel dos Links
                    const listLink = await page.evaluate(() => {
                        const nodeLink = document.querySelectorAll('section.ui-search-results  a.ui-search-result__content')
                        const arrayLink = [...nodeLink]
                        // console.log(arrayLink);
                        const listLink = arrayLink.map(({ href }) => ({
                            href
                        }))
                        return listLink;
                    });

                    // Variavel montar os produtos
                    const produto = [];
                    // Variavel para montar o preço
                    let price = null;

                    // Passa por todos os inidicies dos arrays dos produtos
                    for (let i = 0; i < imageList.length; i++) {
                        if(typeof listTitle[i] !== 'undefined' ){
                            try {
                                // Formata o valor
                                price = formatPrice(listPrice[i].textContent);
                                // Adiciona as infos dos produtos no array
                                produto.push({
                                    'product': listTitle[i].textContent,
                                    'price'  : price,
                                    'link'   : listLink[i].href,
                                    'image'  : imageList[i].src
                                })
                            } catch (err) {
                                console.error(chalk.red(`Ops! Erro: ${err}`));
                            }
                        } else {
                            log(chalk.red(`ERROR, DADOS`))
                        }
                    }
                    // Organiza os produtos pelo menor preço
                    produto.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

                    // Prepara a variavel para receber 'produto'
                    jsonProdutos[search] = [];
                    // Adiciona os produtos no array
                    jsonProdutos[search].push(produto);

                    // Adiciona o JSON dos produos no arquivo
                    jsonWrite.write(JSON.stringify(jsonProdutos, null , 2))

                    // Encerra o Browser
                    await browser.close();

                    log(chalk.bgGreen(`Close Browser - ${search}`));

                    if(csvSearch[csvSearch.length-1] == search) {
                        log(chalk.bgGreen(`******** - ${search}`));
                        HTMLgenerate(csvSearch, jsonProdutos);
                    }


                })();
            }
        });
        saveList(`./json/`,`./json/files.json`);
    }); 

function saveList (source, file) {
    // Captura todas os pastas
    const directories = getFiles(source);

    log(chalk.magenta(directories));
    var jsonFolders = JSON.stringify(directories, null , 2);
    fs.writeFile(file, jsonFolders, err =>{
        if(err) throw new Error ('Ops error:' + err);
        log(chalk.green('Save File Json'));
    })
}

function getFiles(path) {
    return fs.readdirSync(path).filter(function (file) {
        // return fs.statSync(path+'/'+file).isDirectory();
        return file
    });
}




function HTMLgenerate(csvSearch, jsonProdutos){
    csvSearch.map((search) => {
        log(chalk.bgCyan(search))
        log(chalk.bgWhite(jsonProdutos[search]))
    })
}















function formatPrice(price) {
    if (price.includes("centavos")) {
        price = price.replace(' reais con ', ',')
        price = price.replace(' centavos ', '')
    } else {
        price = price.replace(' reais', ',00')
    }
    return price;
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}