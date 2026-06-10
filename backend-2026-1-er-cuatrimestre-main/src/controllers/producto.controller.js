import { getConnection } from "./../database/database";
const secret = process.env.secret;
const jwt = require ("jsonwebtoken");

const QUERY = "select p.id_producto as idProducto, p.nombre as producto, p.descripcion as descripcion, p.precio as precio, p.genero as genero, p.imagen as ulrImagen, c.id_categoria as idCategoria, c.nombre as categoria from producto p join categoria c on p.id_categoria = c.id_categoria;";

const fetchProductos = async () => {
    const connection = await getConnection();
    const response = await connection.query(QUERY);
    return response;
};


// const obtenerProductos = async (req, res) => {
//     try{
//         const connection = await getConnection();
//         const response = await connection.query("select p.id_producto as idProducto, p.nombre as producto, p.descripcion as descripcion, p.precio as precio, p.genero as genero, p.imagen as ulrImagen, c.id_categoria as idCategoria, c.nombre as categoria from producto p join categoria c on p.id_categoria = c.id_categoria;")
//         res.json({codigo: 200, mensaje: "OK", payload:  response});
//     }   
//     catch(error){
//         res.status(500);
//         res.send(error.message);
//     }
// }

const obtenerProductos = async (req, res) => {
    try {
        const productos = await fetchProductos();
        res.json({ codigo: 200, mensaje: "OK", payload: productos });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

const obtenerDatosProducto = async (req,res) => {
    try{
        const id = req.params.id
        const connection = await getConnection();
        const response = await connection.query("select p.nombre as producto, p.descripcion as descripcion, p.precio as precio, p.genero as genero, p.imagen as ulrImagen, c.id_categoria as idCategoria, c.nombre as categoria, i.talle, i.color, i.stock, i.id_inventario as idInventario from producto p join categoria c on p.id_categoria = c.id_categoria join inventario i on i.id_producto = p.id_producto where p.id_producto = ?;", [id]);
        console.log(response)
        res.json({codigo: 200, mensaje: "OK", payload:  response});
    }   
    catch(error){
        res.status(500);
        res.send(error.message);
    }
}

const cargarProducto = async (req, res) => {
    try{
        const resultadoVerificar = verificarToken(req);
        if(resultadoVerificar.estado == false){
            return res.send({codigo: -1, mensaje: resultadoVerificar.error})
        }
        const{
            nombre,
            descripcion,
            precio,
            genero,
            id_categoria,
            imagen
        } = req.body
        const producto = {
            nombre,
            descripcion,
            precio,
            genero,
            id_categoria,
            imagen
        }
        const connection = await getConnection();
        const response = await connection.query("INSERT into producto set ?", producto);
        if(response && response.affectedRows > 0){
            res.json({
                codigo: 200,
                mensaje: "Producto cargado",
                payload: [{ idProducto: response.insertId }]
            });
        }
        else{
            res.json({codigo: -1, mensaje: "Error cargando producto", payload: []});
        }
    }

   
    

    catch(error){
        res.status(500);
        res.send(error.message)
    }
}

const modificarStock = async(req, res) => {
    try{
        const resultadoVerificar = verificarToken(req);
        if(resultadoVerificar.estado == false){
            return res.send({codigo: -1, mensaje: resultadoVerificar.error})
        }
        const{
           id_inventario,
           stock
        } = req.body
        const connection = await getConnection();
        const response = await connection.query("UPDATE inventario i set i.stock = ? where id_inventario = ?", [stock, id_inventario]);
        if(response && response.affectedRows > 0){
            res.json({
                codigo: 200,
                mensaje: "Stock modificado correctamente",
                payload: []
            });
        }
        else{
            res.json({codigo: -1, mensaje: "Error modificando stock", payload: []});
        }
    }

    catch(error){
        res.status(500);
        res.send(error.message)
    }
}

const crearInventario = async (req, res) => {
    try{
        const resultadoVerificar = verificarToken(req);
        if(resultadoVerificar.estado == false){
            return res.send({codigo: -1, mensaje: resultadoVerificar.error})
        }
        const {
            talle,
            color,
            stock,
            id_producto
        } = req.body
        const inventario = {
            talle,
            color,
            stock,
            id_producto
        }
        const connection = await getConnection();
        const response = await connection.query("INSERT inventario set ?", inventario);
        if(response && response.affectedRows > 0){
            res.json({
                codigo: 200,
                mensaje: "Inventario creado exitosamente",
                payload: [{ idCategoria: response.insertId }]
            });
        }
        else{
            res.json({codigo: -1, mensaje: "Error creando inventario", payload: []});
        }
    }
    catch (error){
        res.status(500);
        res.send(error.message);
    }
}

const crearCategoria = async (req, res) => {
    try{
        const resultadoVerificar = verificarToken(req);
        if(resultadoVerificar.estado == false){
            return res.send({codigo: -1, mensaje: resultadoVerificar.error})
        }
        const {
            nombre
        } = req.body;
        const categoria = { nombre }
        const connection = await getConnection();
        const response = await connection.query("INSERT into categoria set ?", categoria);
        if(response && response.affectedRows > 0){
            res.json({
            codigo: 200,
            mensaje: "Categoría añadida",
            payload: [{ idCategoria: response.insertId }]
        });
        }
        
    }
    catch(error){
        res.status(500);
        res.send(error.message);
    }
}

const obtenerCategorias = async (req, res) => {
   try{
    const resultadoVerificar = verificarToken(req);
        if(resultadoVerificar.estado == false){
            return res.send({codigo: -1, mensaje: resultadoVerificar.error})
        }
    const connection = await getConnection();
    const response = await connection.query("SELECT * from categoria");
    res.json({codigo: 200, mensaje: "OK", payload:  response});
   }
   catch(error){
        res.status(500);
        res.send(error.message);
   }
    
    
}

const agregarFavorito = async (req, res) => {
    try {
        const resultadoVerificar = verificarToken(req);
        if (resultadoVerificar.estado == false) {
            return res.send({ codigo: -1, mensaje: resultadoVerificar.error });
        }

        const {
            id_producto,
            id_usuario
        } = req.body;

        const favorito = { id_producto, id_usuario };

        const connection = await getConnection();
        const response = await connection.query("INSERT INTO favorito SET ?", favorito);

        if (response && response.affectedRows > 0) {
            res.json({
                codigo: 200,
                mensaje: "Producto añadido a favoritos",
                payload: [{ idFavorito: response.insertId }]
            });
        }
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};


function verificarToken(req){
    const token = req.headers.authorization;
    if(!token){
        return {estado: false, error: "Token no proporcionado"}
    }
    try{
        const payload = jwt.verify(token, secret);
        if(Date.now() > payload.exp){
            return {estado: false, error: "Token expirado"}
        }
        return {estado: true};
    }
    catch(error){
        return {estado: false, error: "Token inválido"}
    }  

}

const obtenerFavoritos = async (req, res) => {
    try {
        const resultadoVerificar = verificarToken(req);
        if (resultadoVerificar.estado == false) {
            return res.send({ codigo: -1, mensaje: resultadoVerificar.error });
        }

        const id_usuario = req.params.id;

        const connection = await getConnection();
        const response = await connection.query("SELECT id_producto as idProducto FROM favorito WHERE id_usuario = ?",[id_usuario]);

        res.json({
            codigo: 200,
            mensaje: "IDs de productos favoritos obtenidos correctamente",
            payload: response
        });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

const eliminarFavorito = async (req, res) => {
    try {
        const resultadoVerificar = verificarToken(req);
        if (resultadoVerificar.estado == false) {
            return res.send({ codigo: -1, mensaje: resultadoVerificar.error });
        }

        const { id_usuario, id_producto } = req.body;

        const connection = await getConnection();
        const response = await connection.query("DELETE FROM favorito WHERE id_usuario = ? AND id_producto = ?", [id_usuario, id_producto]);

        if (response && response.affectedRows > 0) {
            res.json({ codigo: 200, mensaje: "Favorito eliminado correctamente" });
        } else {
            res.json({ codigo: 400, mensaje: "Error eliminando producto de favoritos" });
        }
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

const agregarACarrito = async (req, res) => {
    try {
        const resultadoVerificar = verificarToken(req);
        if (resultadoVerificar.estado == false) {
            return res.send({ codigo: -1, mensaje: resultadoVerificar.error });
        }

        const { id_inventario, id_usuario } = req.body;
        const carritoProducto = { id_inventario, id_usuario, };

        const connection = await getConnection();
        const response = await connection.query("INSERT INTO carrito SET ?", carritoProducto);

        if (response && response.affectedRows > 0) {
            res.json({
                codigo: 200,
                mensaje: "Producto agregado al carrito",
                payload: [{ idCarrito: response.insertId }]
            });
        }
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

const eliminarProductoCarrito = async (req, res) => {
    try {
        const resultadoVerificar = verificarToken(req);
        if (resultadoVerificar.estado == false) {
            return res.send({ codigo: -1, mensaje: resultadoVerificar.error });
        }

        const { id_usuario, id_inventario } = req.body;

        const connection = await getConnection();
        const response = await connection.query(
            "DELETE FROM carrito WHERE id_usuario = ? AND id_inventario = ?",
            [id_usuario, id_inventario]
        );

        if (response && response.affectedRows > 0) {
            res.json({ codigo: 200, mensaje: "Producto eliminado del carrito correctamente" });
        } else {
            res.json({ codigo: 400, mensaje: "Error eliminando producto del carrito" });
        }
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};

const obtenerProductosCarrito = async (req, res) => {
    try {
        const resultadoVerificar = verificarToken(req);
        if (resultadoVerificar.estado == false) {
            return res.send({ codigo: -1, mensaje: resultadoVerificar.error });
        }

        const id_usuario = req.params.id;

        const connection = await getConnection();
        const response = await connection.query("SELECT c.id_carrito as idCarrito, c.id_inventario as idInventario, p.nombre as producto, p.id_producto as idProducto, p.precio as precio, p.imagen as urlImagen, i.talle, i.color FROM carrito c JOIN inventario i ON i.id_inventario = c.id_inventario JOIN producto p ON p.id_producto = i.id_producto WHERE c.id_usuario = ?;",[id_usuario]);

        res.json({
            codigo: 200,
            mensaje: "Productos del carrito obtenidos correctamente",
            payload: response
        });
    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
};








export const methods = {
    fetchProductos,
    obtenerProductos,
    crearCategoria,
    cargarProducto,
    obtenerCategorias,
    obtenerDatosProducto,
    modificarStock,
    crearInventario,
    agregarFavorito,
    obtenerFavoritos,
    eliminarFavorito,
    agregarACarrito,
    eliminarProductoCarrito,
    obtenerProductosCarrito

    
}
