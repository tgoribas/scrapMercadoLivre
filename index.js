const puppeteer = require('puppeteer');
const fs = require('fs');
const chalk = require('chalk');
const { parse } = require('csv-parse');
const slugify = require('slugify');

const log = console.log;

// Import Functions
const autoScroll = require('./src/autoScroll');
const formatPrice = require('./src/formatPrice');
const htmlGenerate = require('./src/htmlGenerate');

// Variavel para armazenar os dados DO CSV
const csvSearch=[];
// Variavel para adicionar os produtos da busca
const jsonProdutos = {} // empty Object
// Define e cria o arquivo onde o JSON vai ser salvo.
const jsonFile = "json/" + new Date().toJSON().slice(0,19).replaceAll(':','-') + ".json";

const jsonFile2 = "json/file-" + new Date().toJSON().slice(0,19).replaceAll(':','-') + ".json";
fs.writeFile(`${jsonFile2}`, '', function (err) {
    if (err) return console.log(err);
});

fs.createReadStream('produtos.csv')
    .pipe(parse({delimiter: ';'}))
    .on('data', async function(csvrow) {
        // Prepara a variavel que vai fazer a busca do produto
        csvSearch.push(slugify(csvrow[0].toString().toLowerCase()));
    })
    .on('end',function () {
        log(`Todos os produtos ${csvSearch}`);
        csvSearch.forEach(search => {
            // Evite o titulo do CSV
            
            if (search != 'name'){
                (async () => {
                    
                    // Inicia o Puppeteer
                    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
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
                    log(chalk.bgYellow(`Carregando Produto... ${search}`));

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
                        const listLink = arrayLink.map(({ href }) => ({
                            href
                        }))
                        return listLink;
                    });

                    // Variavel montar os produtos
                    const produto = [];
                    // Variavel para montar o preço

                    // Passa por todos os inidicies dos arrays dos produtos
                    for (let i = 0; i < imageList.length; i++) {
                        if(typeof listTitle[i] !== 'undefined' ){
                            try {
                                // Adiciona as infos dos produtos no array
                                produto.push({
                                    'product': listTitle[i].textContent,
                                    'price'  : formatPrice(listPrice[i].textContent),
                                    'link'   : listLink[i].href,
                                    'image'  : imageList[i].src
                                })
                            } catch (err) {
                                console.error(chalk.red(`Ops! Erro: ${err}`));
                            }
                        } else {
                            log(chalk.red(`.`))
                        }
                    }
                    // Organiza os produtos pelo menor preço
                    produto.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    
                    // Prepara a variavel para receber 'produto'
                    jsonProdutos[search] = [];
                    // Adiciona os produtos no array
                    jsonProdutos[search].push(produto);

                    fs.writeFileSync(jsonFile2,JSON.stringify(jsonProdutos, null , 2),{encoding:'utf8',flag:'w'})

                    // Encerra o Browser
                    await browser.close();
                    log(chalk.bgYellow(`Finalizando Pesquisa... ${search}`));

                    if((csvSearch.length-1) == Object.keys(jsonProdutos).length) {
                        log(chalk.bgGreen(`Gerando o arquivo de orçamento`));
                        htmlGenerate(csvSearch, jsonProdutos);
                    }

                })();
            }
        });

    }); 