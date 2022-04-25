/**
 * Metodo responsavel por formatar o preço produto
 * @param {*} price 
 * @returns 
 */
function formatPrice(price) {
    if (price.includes("centavos")) {
        price = price.replace(' reais con ', ',')
        price = price.replace(' centavos ', '')
    } else {
        price = price.replace(' reais', ',00')
    }
    return price;
}
module.exports = formatPrice;  