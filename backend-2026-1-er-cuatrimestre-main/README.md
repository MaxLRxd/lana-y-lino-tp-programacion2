Servicios
Hay varios servicios que pueden acceder sin autenticación, por ejemplo para registrar el usuario u obtener los productos
Luego para operaciones específicas como cargar un producto, crear una categoría, agregar un product al carrito, etc van a necesitar enviar en el header del servicio, un token
El token es un jwt que se debe enviar en el header como Authorization
El jwt se recibe en la respuesta del login en caso de ser exitoso y tiene un tiempo de expiración.
Los servicios que no necesitan de un token están aclarados en cada endpoint, si no dice nada es porque si es necesario enviar el token

¡ Ejecutar en la base de datos la query que se encuentra dentro del archivo scriptTablaCarrito.sql !

* Login:

    . POST - /api/login (sin token)
        body:
        {
            usuario: string,
            password: string
        }
* Productos:
    . GET - /api/obtenerProductos (sin token)

    ObtenerDatosProducto: devuelve todos los datos de un producto, categoria, inventario, color, etc
    . GET - /api/obtenerDatosProducto (tin token)
    . POST - /api/crearCategoria
        body: 
        {
            nombre: string
        }

    . POST - /api/cargarProducto
        body:
        {
            nombre: string,
            descripcion: string,
            precio: number,
            genero: string,
            id_categoria: number,
            imagen: string,

        }

    . GET - /api/obtenerCategorias
    Agregar inventario: permite crear un registro de inventario para un producto determinado
    . POST - /api/crearInventario
        body{
            talle: string,
            color: string,
            stock: number,
            id_producto: number
        }

    Modificar stock: permite modificar el stock de un producto
    . PUT - /api/modificarStock
        body:
        {
            stock: number,
            id_inventario: number
        }

    Agregar favorito: permite agregar un producto a la lista de favoritos de un usuario
    . POST - /api/agregarFavorito
        body:
        {
            id_producto: number,
            id_usuario: number
        }


    Obtener favoritos: permite obtener los productos favoritos de un usuario (solo devuelve id_producto)
    . GET - /api/obtenerFavoritos/:id_usuario
     

    Eliminar favorito: permite eliminar un producto de los favoritos de un usuario
    . DELETE - /api/eliminarFavorito
      body:
        {
            id_usuario: number,
            id_producto: number
        }

    Agregar a carrito: permite agregar un producto al carrito ( se envia el id de inventario ya que asi tiene relacionado un color y talle al producto)
    . POST - /api/agregarACarrito
        body:
        {
            id_inventario: number,
            id_usuario: number
        }


    Obtener productos del carrito: permite obtener los productos agregados al carrito (devuelve el color, talle, precio, etc)
    . GET - /api/obtenerProductosCarrito/:id_usuario
     

    Eliminar producto del carrito: permite eliminar un producto del carrito de un usuario
    . DELETE - /api/eliminarProductoCarrito
      body:
        {
            id_usuario: number,
            id_inventario: number
        }

    


* Usuarios:
    . POST - /api/registrarUsuario (sin token)
        body:
        {
            nombre: string
            apellido: string
            direccion: string
            email: string
            telefono: string
            rol: string
            password: password

        }
    . GET - /api/obtenerDatosUsuario/:id

    . POST - /api/modificarUsuario/:id
    body:
        {
            nombre: string
            apellido: string
            direccion: string
            email: string
            telefono: string
            rol: string
            password: password

        }
    

