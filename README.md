# Prueba Técnica Backend Node.js - Procesador CSV

Este proyecto es una prueba técnica diseñada para evaluar las habilidades de un programador backend Node.js. Consiste en un servicio API que procesa archivos CSV, interactúa con una base de datos MariaDB y presenta varios desafíos de optimización y desarrollo de nuevas funcionalidades.

## Stack Tecnológico

* **Node.js** (v20.x LTS)
* **Express.js** para el servidor API
* **MariaDB** como base de datos
* **Docker** y **Docker Compose** para el entorno de desarrollo y despliegue
* **Pino** para logging estructurado
* **dotenv** para gestión de variables de entorno

## Estructura del Proyecto

```
prueba-tecnica-nodejs/
├── .env        # Ejemplo de variables de entorno
├── .gitignore
├── Dockerfile          # Para construir la imagen de la aplicación Node.js
├── docker-compose.yml  # Para orquestar los servicios (app y mariadb)
├── index.js            # Punto de entrada de la aplicación
├── package-lock.json
├── package.json
├── README.md           # Este archivo
├── my.cnf              # Configuración personalizada para MariaDB en Docker
└── src/
    ├── components/
    │   └── csv-processor/ # Componente principal de la prueba
    │       ├── endpoints.js    # Endpoints de la API (Capa de Red)
    │       ├── src/
    │       │   └── csv-service.js # Lógica de negocio del componente
    │       ├── modules/
    │       │   ├── csv-data.js    # Acceso y manipulación de datos (Capa de Datos)
    │       │   └── interfaces/    # "Definiciones" de objetos de dominio
    │       └── bdd/
    │           └── mariadb-connector.js # Conexión y utilidades de BD
    ├── helpers/            # Utilidades reutilizables
    │   └── logger.js
```

## Instalación y Configuración

1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repositorio>
    cd prueba-tecnica-nodejs
    ```

2.  **Crear archivo `.env`:**
    Copia el contenido de `.env.example` a un nuevo archivo llamado `.env` y ajusta las variables si es necesario (aunque los valores por defecto deberían funcionar con Docker Compose).
    ```bash
    cp .env.example .env
    ```
    **Importante:** Asegúrate de que `DB_HOST` en `.env` esté configurado como `mariadb` para que la aplicación Node.js pueda encontrar el contenedor de la base de datos. Las credenciales `DB_USER`, `DB_PASSWORD`, `DB_NAME` deben coincidir entre el servicio `app` y `mariadb` en `docker-compose.yml`.

3.  **Construir e iniciar los contenedores Docker:**
    Este comando construirá la imagen de la aplicación Node.js y levantará los servicios `app` y `mariadb`.
    ```bash
    docker-compose up --build -d
    ```
    La base de datos MariaDB se inicializará y se creará la tabla `validated_numbers`. El archivo `my.cnf` se utiliza para establecer `max_connections=500` en MariaDB.

## Ejecución

Una vez que los contenedores estén en funcionamiento;

* El servicio API estará disponible en `http://localhost:3000` (o el puerto que hayas configurado en `.env`).
* Puedes ver el detalle con `docker ps -a`
* Puedes ver los logs con `docker logs -f prueba_back-app-1`
* Tomar cambios en el contenedor `docker rm -f prueba_back-app-1 && docker-compose up --build -d app`

### Scripts NPM (para desarrollo local si no se usa Docker para la app directamente)

Si deseas ejecutar la aplicación localmente fuera de Docker (requiere Node.js y MariaDB instalados y configurados en el host):

1.  **Instalar dependencias:**
    ```bash
    npm ci
    ```

2.  **Iniciar el servidor en modo desarrollo (con reinicio automático):**
    Asegúrate de que tu MariaDB local esté accesible y las variables en `.env` apunten a ella (ej. `DB_HOST=localhost`).
    ```bash
    npm run dev
    ```

3.  **Iniciar el servidor en modo producción:**
    ```bash
    npm start
    ```

## Endpoints de la API

Todos los endpoints están bajo el prefijo `/api/csv`.

* `POST /api/csv/upload-validate-save`
    * **Entrada:** `multipart/form-data` con un campo `csvfile` conteniendo un archivo CSV. El CSV debe tener una columna de números.
    * **Funcionalidad (Inicial):** Recibe el archivo, valida que cada número tenga 10 dígitos y lo inserta en la tabla `validated_numbers` en MariaDB. **Esta implementación es intencionalmente muy lenta y no cierra las conexiones a la BD.**
    * **Salida:** JSON con estadísticas del proceso.

* `POST /api/csv/check-missing`
    * **Entrada:** `multipart/form-data` con un campo `csvfile` (similar al anterior).
    * **Funcionalidad (Inicial):** Recibe el archivo, verifica para cada número si ya existe en la base de datos. **Esta implementación es intencionalmente muy lenta y no cierra las conexiones a la BD.**
    * **Salida:** Un nuevo archivo CSV (`missing_numbers.csv`) que contiene solo los números (válidos y de 10 dígitos) que NO se encontraron en la base de datos. Si todos existen o el archivo de entrada es inválido/vacío, devuelve un JSON.

* `POST /api/csv/find-add-missing`
    * **Entrada:** `multipart/form-data` con un campo `csvfile`.
    * **Funcionalidad (Inicial):** Recibe el archivo, identifica los números válidos que no existen en la base de datos y los agrega. **Esta implementación es intencionalmente muy lenta y no cierra las conexiones a la BD.**
    * **Salida:** JSON con estadísticas del proceso.

* `POST /api/csv/auth/token` (A implementar en Desafío 4)
    * **Entrada:** JSON con `username` y `password`.
    * **Funcionalidad:** Genera un token JWT.
    * **Salida:** JSON con el token.

## Desafíos para el Candidato

**Objetivo:** Evaluar tu capacidad para entender, optimizar y extender una base de código existente en Node.js, así como tus conocimientos sobre buenas prácticas de desarrollo backend.

**Instrucciones:**
Ve resolviendo de manera consecutiva. Cada uno de los retos está pensado para incrementar su dificultad. No importa si no logras completar los 4 en el tiempo límite, solo resuelve lo más que puedas y documenta tus decisiones. **Es crucial que expliques el PORQUÉ de tus cambios y optimizaciones.**

---

### ✅ Desafío 1: Optimizar WS1 (`/upload-validate-save`)

**Tarea:**
Revisa el endpoint `POST /api/csv/upload-validate-save` y su lógica asociada (`csv-service.js`, `csv-data.js`).
1.  **Identifica los cuellos de botella** que causan la lentitud y el agotamiento de conexiones.
2.  **Refactoriza el código** para mejorar significativamente el tiempo de respuesta y la gestión de conexiones a la base de datos.
3.  **Documenta** brevemente los cambios realizados y por qué mejoran el rendimiento/estabilidad.

---

### ✅ Desafío 2: Optimizar WS2 (`/check-missing`)

**Tarea:**
Revisa el endpoint `POST /api/csv/check-missing` y su lógica.
1.  **Identifica los cuellos de botella** similares o diferentes al WS1.
2.  **Refactoriza el código** para mejorar el tiempo de respuesta y la gestión de conexiones.
3.  **Documenta** los cambios.

---

### ✅ Desafío 3: Optimizar WS3 (`/find-add-missing`)

**Tarea:**
Revisa el endpoint `POST /api/csv/find-add-missing` y su lógica.
1.  Este servicio combina lógicas de los dos anteriores. **Aplica las optimizaciones** de manejo de CSV, consultas y escrituras masivas, y gestión de conexiones.
2.  Asegúrate de que el proceso sea eficiente: primero identifica todos los números válidos del CSV, luego consulta cuáles de ellos ya existen en la BD, y finalmente inserta solo los que realmente faltan, todo de la manera más óptima posible.
3.  **Documenta** los cambios.

---

### ✅ Desafío 4: Implementar Autenticación JWT y Middleware

**Tarea:**
1.  **Crea un nuevo endpoint `POST /api/csv/auth/token`:**
    * Debe aceptar `username` y `password` en el cuerpo de la solicitud (JSON).
    * Si las credenciales son válidas, genera un **token JWT** que contenga el `username` y una **expiración de 5 minutos**. Utiliza la variable `JWT_SECRET` del archivo `.env` para firmar el token.
    * Responde con el token.
2.  **Crea un middleware de autenticación:**
    * Este middleware debe verificar la presencia de un token JWT en el header `Authorization` (esquema `Bearer <token>`).
    * Debe validar el token (firma y expiración).
    * Si el token es válido, debe permitir que la solicitud continúe. Puedes agregar el payload del token decodificado (ej. `req.user`) al objeto `request` para uso posterior.
    * Si el token es inválido, está ausente o ha expirado, debe responder con un error `401 Unauthorized` o `403 Forbidden` según corresponda.
3.  **Aplica el middleware de autenticación** a los tres endpoints de procesamiento de CSV existentes (`/upload-validate-save`, `/check-missing`, `/find-add-missing`). El endpoint `/auth/token` NO debe estar protegido por este middleware.
4.  **Actualiza las pruebas** o añade nuevas para cubrir el endpoint de autenticación y el comportamiento de los endpoints protegidos.

---

**¡Mucha suerte!**