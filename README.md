# 🌸 Mis XV Planner App

**Mis XV Planner** es una aplicación web *Offline-First* enfocada en ayudar tanto a futuras quinceañeras como a organizadores de eventos (Planners) a gestionar de manera integral uno de los días más importantes. Combina un diseño "Glassmorphism" moderno, control financiero (CRM) y un centro de inspiración estilo Pinterest, operando enteramente en el navegador del usuario optimizando la privacidad y portabilidad.

[![Estado](https://img.shields.io/badge/Status-Activo-success.svg)](#)
[![Tecnologías](https://img.shields.io/badge/Tech-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-blue)](#)
[![Almacenamiento](https://img.shields.io/badge/Storage-LocalStorage-orange)](#)

---

## ✨ Características Principales

### 📊 Dashboard & Seguimiento Financiero
*   **Gestión de Presupuesto:** Calcula en tiempo real el presupuesto asignado, los depósitos dados y pagos pendientes.
*   **Cuenta Regresiva Automática:** Un contador visual de días faltantes para el gran evento, calculado dinámicamente según la fecha de la fiesta configurada.

### 🎭 Gestión de Proveedores y Padrinos (CRM Integrado)
*   **Lógica Relacional:** Permite asignar contratos de vestido, iglesia, valet parking, banquete, etc., llevando un estricto control de entregables y fechas de próximos abonos.
*   **WhatsApp Automation (wa.me):** Crea enlaces directos para enviar mensajes personalizados vía WhatsApp en un click a proveedores, padrinos e incluso a la quinceañera, agilizando el flujo de trabajo y la comunicación del evento sin salir de la app.

### 🎨 Moodboard (El "Look & Feel")
Un espacio creativo integrado estilo *Pinterest / Masonry Grid* para plasmar la visión de la fiesta.
*   **Carga Nativa y por Portapapeles:** Soporte para subir imágenes directo de la galería móvil o de computadora copiando y pegando (`Ctrl+V`) capturas directamente.
*   **Compresión Dinámica:** El sistema redimensiona imágenes masivas sobre la marcha usando la API de `<canvas>` en JS para evitar saturar el *LocalStorage*.

---

## 💻 Aspectos Técnicos

Este proyecto prescinde de frameworks grandes, priorizando ser **rápido, responsivo y ligero**, valiéndose enteramente del estándar nativo de la web:

- **HTML5 & Vanilla CSS3**: Interfaces modernas aplicando diseño *Mobile-First*, efectos de vidrio biselado (Glassmorphism), fuentes importadas (Google Fonts) e implementaciones de Column-Count nativo.
- **Vanilla JavaScript (ES6)**: Dom Manipulation, promesas, FileReader API, Canvas rasterization y manejo de portapapeles (`Clipboard API`).
- **Persistencia con `localStorage`**: Todos los datos (incluyendo el "Moodboard" comprimido en formato Base64) residen exclusivamente en el teléfono/PC, permitiendo que la App funcione rápido como una herramienta privada.

---

## 🚀 Instalación y Uso (Deployment)

1. Funciona nativamente desde GitHub Pages (100% Client-Side).
2. Simplemente abre la página, ingresa los datos de registro predeterminados y empezarás a organizar tu evento.
3. Si clonas el repositorio (`git clone htps://github.com/oscarcovalin/xv-planing-app.git`), puedes abrilo localmente ejecutando el archivo `index.html` en el navegador de tu preferencia. No requiere configuraciones de Node.js, paqueterías ni bases de datos.

> Desarrollado con 💖 para profesionalizar la industria de organización de quince años.
