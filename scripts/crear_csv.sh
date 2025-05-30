#!/bin/bash

# Configuración
OUTPUT_FILE="prueba_csv.csv"
NUM_ROWS=4000

# Encabezado del archivo CSV
echo "valor" > "$OUTPUT_FILE"

# Función para generar un valor aleatorio
generate_random_value() {
  choice=$((RANDOM % 3))
  case $choice in
    0)  # Número de 10 dígitos exactos
      printf "%010d" $(( RANDOM * RANDOM % 10000000000 )) ;;
    1)  # Número largo (12–18 dígitos)
      len=$((12 + RANDOM % 7))
      LC_ALL=C tr -dc '0-9' </dev/urandom | head -c "$len" ;;
    2)  # Cadena alfanumérica (8–16 caracteres)
      len=$((8 + RANDOM % 9))
      LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c "$len" ;;
  esac
}

# Generar filas
for ((i = 1; i <= NUM_ROWS; i++)); do
  echo "$(generate_random_value)" >> "$OUTPUT_FILE"
done

echo "✅ Archivo generado: $OUTPUT_FILE con $NUM_ROWS filas aleatorias."
