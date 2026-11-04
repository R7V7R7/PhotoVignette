# 📸 PhotoVignette - Marco de Cámara Móvil para Eventos (Bodas & Fiestas)

Una aplicación web progresiva y ligera diseñada para ejecutarse directamente desde el navegador móvil al escanear un **código QR**. Permite a los invitados capturar **fotos** o grabar **videos** con un **marco decorativo personalizado sobrepuesto** (esquinas, bordes repetibles y emblema central inferior), sin necesidad de instalar ninguna app de la tienda.

---

## 🌟 Características Principales

- **Acceso Inmediato por QR:** Diseñado para abrir directamente la cámara del dispositivo móvil del invitado al escanear el código.
- **100% Compatible con iOS y Android:**
  - **Apple iOS (Safari & WebKit):** Manejo estricto de atributos de video (`playsinline`, `webkit-playsinline`, `autoplay`, `muted`) y fallback de activación por gesto.
  - **Android (Chrome & navegadores basados en Chromium):** Detección de orientación, alternancia de cámara frontal/trasera y soporte para MediaRecorder.
- **Marco Modular de Alta Fidelidad (Cero problemas de CORS):**
  - **Bordes:** 1 gráfico patrón que se repite a lo largo de los bordes superior, inferior, izquierdo y derecho.
  - **Esquinas:** 4 gráficos angulares perfectamente alineados con los bordes.
  - **Emblema Central Inferior:** Un diseño especial conmemorativo (anillos de boda, placa de honor y filigrana) que se conecta limpiamente con el borde inferior repetido.
  - **Gráficos locales:** Todos los recursos residen en el mismo origen (`assets/`), garantizando que la exportación en Canvas nunca sufra de *canvas taint* por CORS.
- **Modos Foto y Video:**
  - **Foto:** Captura en alta resolución combinando el frame de video con el marco decorativo en Canvas, listo para descargar o compartir por la hoja nativa de compartir (WhatsApp, Instagram, AirDrop).
  - **Video:** Grabación en tiempo real del flujo de video con el marco incrustado mediante `MediaRecorder` y `CanvasStream`.
- **Generador de QR Integrado:** El anfitrión puede ver o escanear el código QR directamente desde el menú de ajustes de la aplicación.

---

## 📁 Estructura del Proyecto

```text
PhotoVignette/
├── index.html              # Estructura principal y viewport móvil optimizado
├── css/
│   └── style.css           # Estilos responsivos, glassmorphism y tema oro/lujo
├── js/
│   ├── app.js              # Controlador principal y gestión de eventos UI
│   ├── camera.js           # Gestión de cámara (permisos, resolución, cambio de lente)
│   ├── frame-renderer.js   # Motor de dibujado del marco modular sobre Canvas
│   ├── recorder.js         # Captura de fotos, grabación de video y compartir
│   └── qr-generator.js     # Generador de códigos QR autónomo (sin dependencias)
├── assets/
│   ├── border-pattern.svg  # Patrón repetible para los 4 bordes
│   ├── corner.svg          # Gráfico maestro para las esquinas
│   ├── corner-tl.svg       # Esquina Superior Izquierda
│   ├── corner-tr.svg       # Esquina Superior Derecha
│   ├── corner-bl.svg       # Esquina Inferior Izquierda
│   ├── corner-br.svg       # Esquina Inferior Derecha
│   └── center-bottom.svg   # Emblema central inferior con conexión a bordes
└── README.md
```

---

## 🚀 Publicación Rápida en GitHub Pages (Gratis y con HTTPS)

Los navegadores móviles requieren **HTTPS** para acceder a la cámara (`getUserMedia`). GitHub Pages proporciona HTTPS automáticamente.

1. **Crear repositorio en GitHub:**
   - Sube todos los archivos de esta carpeta a un nuevo repositorio (por ejemplo, `PhotoVignette`).
2. **Activar GitHub Pages:**
   - En tu repositorio de GitHub, entra a **Settings** > **Pages**.
   - En **Build and deployment** > **Source**, selecciona `Deploy from a branch`.
   - Selecciona la rama `main` (o `master`) y la carpeta `/ (root)`.
   - Haz clic en **Save**.
3. **Obtener tu enlace:**
   - En unos minutos tendrás tu enlace activo:
     ```text
     https://tu-usuario.github.io/PhotoVignette/
     ```

---

## 📱 Cómo Crear y Usar el Código QR para tu Evento

1. **Desde la misma app:**
   - Abre la web desplegada en tu navegador.
   - Presiona el botón de los tres puntos (**⋮**) en la esquina superior derecha.
   - Verás el código QR generado automáticamente para esa URL exacta.
2. **Para imprimir:**
   - Puedes guardar esa imagen del QR o usar un generador de QR con la URL de tu GitHub Pages.
   - Imprime el código en:
     - Tarjetas en las mesas del banquete.
     - Cartel de bienvenida a la entrada del salón.
     - Invitaciones físicas o digitales.
3. **Experiencia del Invitado:**
   - El invitado escanea el código con la cámara nativa de su iPhone o Android.
   - Se abre el enlace en Safari o Chrome.
   - La cámara se activa con el marco de la boda sobrepuesto en tiempo real.
   - Toman la foto/video y pueden presionar **Guardar / Compartir** para enviarla a WhatsApp, Instagram Stories o guardarla en su galería.

---

## 🎨 Personalización del Marco

### 1. Cambiar el Texto o Nombres del Evento
- En la interfaz, pulsa el botón superior derecho (**⋮**) e ingresa los nombres (ej. `Sofía & Mateo` o `Mis XV Años`). Se guardará en la sesión.
- Si deseas cambiar el texto por defecto en el código, edita en `index.html` y `js/app.js`:
  ```javascript
  let customText = localStorage.getItem("photo_vignette_text") || "Nuestra Boda";
  ```

### 2. Sustituir los Gráficos del Marco
Puedes sustituir cualquiera de los archivos SVG en la carpeta `assets/` por tus propios diseños o PNGs transparentes:
- **`border-pattern.svg`**: Imagen de borde (ej. 60x30 px). Asegúrate de que los extremos izquierdo y derecho conecten sin fisuras para una repetición perfecta.
- **`corner-tl.svg`, `corner-tr.svg`, `corner-bl.svg`, `corner-br.svg`**: Las 4 esquinas (ej. 100x100 px). Sus puntos de corte deben tener el mismo grosor que el borde.
- **`center-bottom.svg`**: El elemento distintivo inferior (ej. 280x70 px). Conecta en sus extremos izquierdo y derecho a la altura exacta de la tira del borde inferior.

---

## 💻 Prueba Local

Para probar localmente en tu computadora o en la misma red Wi-Fi desde tu móvil:

```bash
# Con Node.js (npx serve)
npx serve .

# O con Python 3
python -m http.server 8080
```
> **Nota para móviles:** Si pruebas desde tu móvil conectado a la IP local de tu PC (ej. `http://192.168.1.X:8080`), algunos navegadores exigen HTTPS para la cámara. En producción (GitHub Pages), HTTPS ya viene activo de fábrica.
