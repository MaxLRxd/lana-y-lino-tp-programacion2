import { Router } from "express";
import { methods as usuarioController} from "./../controllers/usuario.controller";


const router = Router();

router.get("/obtenerDatosUsuario/:id", usuarioController.obtenerDatosUsuario)
router.post("/modificarUsuario/:id", usuarioController.modificarUsuario)
router.post("/registrarUsuario", usuarioController.crearUsuario)


export default router;