# Usar una imagen base LTS de Node.js sobre Alpine para un tamaño reducido
FROM node:20-alpine

# Establecer el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copiar primero package.json y package-lock.json para aprovechar el caché de Docker
COPY package*.json ./

# Instalar dependencias del proyecto usando npm ci para instalaciones limpias y reproducibles
RUN npm ci --only=production

# Copiar el resto del código de la aplicación
COPY . .

# Exponer el puerto en el que la aplicación se ejecuta (definido por la variable de entorno PORT o 3000 por defecto)
EXPOSE ${PORT:-3000}

# Variable de entorno para indicar el entorno de ejecución
ENV NODE_ENV=production

# Comando para ejecutar la aplicación
CMD ["node", "index.js"]