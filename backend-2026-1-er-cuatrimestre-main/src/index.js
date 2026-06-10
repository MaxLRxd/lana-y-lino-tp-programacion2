import app from "./app";
const jwt = require("jsonwebtoken");
const {methods} = require("./controllers/producto.controller");

const main = () => {
    app.listen(app.get("port"));
    console.log(`Server on port ${app.get("port")}`);
};


main();


methods.fetchProductos()
    .then(products => {
        console.log('Products:', products);
        //process.exit(0);
    })
    .catch(error => {
        console.error('Error fetching products:', error);
        process.exit(1);
    });
