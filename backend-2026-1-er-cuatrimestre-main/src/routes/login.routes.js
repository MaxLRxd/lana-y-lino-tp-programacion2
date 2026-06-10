import { Router } from "express";
import { methods as loginController} from "./../controllers/login.controller";


const router = Router();

router.post("/login", loginController.login);


export default router;