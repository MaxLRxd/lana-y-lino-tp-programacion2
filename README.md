# 🧥 Lana & Lino — Tienda de Indumentaria Online

## 👥 Equipo de Desarrollo

- Canello Manuel -> ManuCanello
- Rojas Máximo -> MaxLRxd

---

## 📄 Descripción del Proyecto

Página web de comercio electrónico desarrollada para **Lana & Lino**, empresa dedicada a la venta de indumentaria. Permite la visualización del catálogo de productos, la gestión de usuarios, el proceso de compra online y la administración de productos desde el mismo sitio.

---

## 🛠️ Tecnologías Utilizadas

- **HTML5**
- **CSS3**
- **JavaScript** (Vanilla — sin frameworks)
- **Backend** provisto por la cátedra (sin modificaciones)

---

## ✨ Funcionalidades

### 🔝 Header (visible en todo momento)
- Nombre de la empresa centrado
- Buscador de productos por nombre (con Enter o botón Buscar)
- Acceso a sección de Favoritos
- Menú desplegable de productos por categoría
- Botón Iniciar sesión / Cerrar sesión
- Botón de Carrito
- Botón de datos del usuario

### 🛍️ Catálogo de Productos
- Visualización de todos los productos disponibles
- Filtros por **género**, **categoría** y **color**
- Por cada producto se muestra:
  - Foto
  - Descripción
  - Talles disponibles
  - Color
  - Stock disponible
  - Precio
  - Botón "Agregar al carrito" (solo si hay stock)
  - Visualizador de cuotas (1, 3, 6, 9 o 12 cuotas)

### 🛒 Carrito
- Lista de productos agregados con foto, nombre y precio
- Precio total del carrito
- Opción para eliminar productos
- Botón para ir a la pantalla de pago

### 💳 Pantalla de Pago
- Resumen de productos y precios
- Precio total
- Selector de tipo de pago: **Transferencia**, **Débito** o **Crédito**
- Formulario de tarjeta (número, vencimiento, nombre) para débito/crédito
- Botón "Pagar" habilitado solo cuando todos los campos están completos
- Confirmación de pago exitoso (sin transacción real)

### ❤️ Favoritos
- Lista de productos guardados como favoritos con foto, nombre y precio
- Opción para eliminar productos de favoritos
- Al hacer click en un producto, redirige a la página del producto

### 👤 Usuarios

#### No registrado / No logueado
- Puede registrarse completando: nombre, apellido, dirección, teléfono, email y contraseña
- Puede iniciar sesión con email y contraseña

#### Logueado
- Puede agregar productos al carrito y a favoritos
- Puede visualizar y modificar sus datos personales

#### Administrador
- Accede a la sección **Gestionar Productos** desde el header
- Puede **cargar** nuevos productos indicando: nombre, descripción, género, color, categoría, talles y precio
- Puede **buscar** productos existentes
- Puede **modificar** los datos de cualquier producto y guardar los cambios

### 🌙 Modo Claro / Oscuro
- El usuario puede alternar entre modo claro y oscuro en cualquier momento

### 📋 Footer
- Información de contacto (email, WhatsApp, teléfono)
- Redes sociales
- Créditos del equipo de desarrollo

---

## 🔐 Permisos por Tipo de Usuario

| Funcionalidad | No logueado | Logueado | Administrador |
|---|:---:|:---:|:---:|
| Ver catálogo | ✅ | ✅ | ✅ |
| Registrarse / Iniciar sesión | ✅ | — | — |
| Agregar al carrito | ❌ | ✅ | ✅ |
| Agregar a favoritos | ❌ | ✅ | ✅ |
| Modificar datos personales | ❌ | ✅ | ✅ |
| Gestionar productos | ❌ | ❌ | ✅ |

---

## 🚀 Cómo ejecutar el proyecto

1. Clonar o descomprimir los archivos del proyecto
2. Asegurarse de que el backend de la cátedra esté corriendo
3. Abrir el archivo `index.html` en un navegador web

> ⚠️ No se requiere instalación de dependencias adicionales. El proyecto utiliza únicamente HTML, CSS y JavaScript puro.

---

## Estructura del Proyecto



> La estructura puede variar según la organización interna del equipo.
