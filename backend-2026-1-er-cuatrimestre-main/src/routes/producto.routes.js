import { Router } from "express";
import { methods as productoController} from "./../controllers/producto.controller";
const router = Router();

// import { verificarToken } from "./../middlewares/auth.middleware.js";

router.get("/obtenerProductos", productoController.obtenerProductos)
router.post("/crearCategoria", productoController.crearCategoria)
router.post("/cargarProducto", productoController.cargarProducto)
router.get("/obtenerCategorias",productoController.obtenerCategorias)
router.get("/obtenerDatosProducto/:id",productoController.obtenerDatosProducto)
router.put("/modificarStock",productoController.modificarStock)
router.post("/crearInventario",productoController.crearInventario)
router.post("/agregarFavorito",productoController.agregarFavorito)
router.get("/obtenerFavoritos/:id",productoController.obtenerFavoritos);
router.delete("/eliminarFavorito",productoController.eliminarFavorito);
router.post("/agregarFavorito",productoController.agregarFavorito)
router.post("/agregarACarrito",productoController.agregarACarrito)
router.get("/obtenerFavoritos/:id",productoController.obtenerFavoritos);
router.delete("/eliminarProductoCarrito",productoController.eliminarProductoCarrito);
router.get("/obtenerProductosCarrito/:id",productoController.obtenerProductosCarrito);

export default router;